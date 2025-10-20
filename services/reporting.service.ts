import { supabase } from '../utils/supabase';
import { Report, ReportTemplate, DashboardWidget, KPI } from '../models/multi-tenant.types';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  branchId?: string;
  vehicleId?: string;
  customerId?: string;
  category?: string;
  status?: string;
}

export interface ReportData {
  id: string;
  title: string;
  type: string;
  data: any;
  generatedAt: string;
  filters: ReportFilters;
}

export interface DashboardData {
  widgets: DashboardWidget[];
  kpis: KPI[];
  lastUpdated: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

export class ReportingService {
  /**
   * Generate a comprehensive business report
   */
  static async generateBusinessReport(
    organizationId: string,
    reportType: string,
    filters: ReportFilters
  ): Promise<ReportData> {
    try {
      let reportData: any = {};

      switch (reportType) {
        case 'revenue':
          reportData = await this.generateRevenueReport(organizationId, filters);
          break;
        case 'expenses':
          reportData = await this.generateExpensesReport(organizationId, filters);
          break;
        case 'fleet':
          reportData = await this.generateFleetReport(organizationId, filters);
          break;
        case 'customer':
          reportData = await this.generateCustomerReport(organizationId, filters);
          break;
        case 'contracts':
          reportData = await this.generateContractsReport(organizationId, filters);
          break;
        case 'damage':
          reportData = await this.generateDamageReport(organizationId, filters);
          break;
        case 'financial':
          reportData = await this.generateFinancialReport(organizationId, filters);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Save report to database
      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert({
          organization_id: organizationId,
          title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
          type: reportType,
          data: reportData,
          filters,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: savedReport.id,
        title: savedReport.title,
        type: reportType,
        data: reportData,
        generatedAt: savedReport.generated_at,
        filters,
      };
    } catch (error) {
      console.error('Error generating business report:', error);
      throw error;
    }
  }

  /**
   * Generate revenue report
   */
  static async generateRevenueReport(organizationId: string, filters: ReportFilters): Promise<any> {
    try {
      let query = supabase
        .from('revenues')
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            customer:customers(full_name)
          )
        `)
        .eq('organization_id', organizationId);

      if (filters.startDate) {
        query = query.gte('revenue_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('revenue_date', filters.endDate);
      }
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }

      const { data: revenues, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
      const revenueCount = revenues.length;
      const averageRevenue = revenueCount > 0 ? totalRevenue / revenueCount : 0;

      // Group by source
      const revenueBySource = revenues.reduce((acc, r) => {
        const source = r.source || 'Άλλο';
        acc[source] = (acc[source] || 0) + (r.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      // Group by payment method
      const revenueByPaymentMethod = revenues.reduce((acc, r) => {
        const method = r.payment_method || 'Άλλο';
        acc[method] = (acc[method] || 0) + (r.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      // Monthly breakdown
      const monthlyRevenue = revenues.reduce((acc, r) => {
        const month = new Date(r.revenue_date).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + (r.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        summary: {
          totalRevenue,
          revenueCount,
          averageRevenue,
        },
        bySource: Object.entries(revenueBySource).map(([source, amount]) => ({
          source,
          amount,
          percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
        })),
        byPaymentMethod: Object.entries(revenueByPaymentMethod).map(([method, amount]) => ({
          method,
          amount,
          percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
        })),
        monthlyBreakdown: Object.entries(monthlyRevenue).map(([month, amount]) => ({
          month,
          amount,
        })),
        details: revenues,
      };
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw error;
    }
  }

  /**
   * Generate expenses report
   */
  static async generateExpensesReport(organizationId: string, filters: ReportFilters): Promise<any> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data: expenses, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const expenseCount = expenses.length;
      const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
      const approvedExpenses = expenses.filter(e => e.approved);
      const pendingExpenses = expenses.filter(e => !e.approved);

      // Group by category
      const expensesByCategory = expenses.reduce((acc, e) => {
        const category = e.category || 'Άλλο';
        acc[category] = (acc[category] || 0) + (e.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      // Monthly breakdown
      const monthlyExpenses = expenses.reduce((acc, e) => {
        const month = new Date(e.expense_date).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + (e.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        summary: {
          totalExpenses,
          expenseCount,
          averageExpense,
          approvedExpenses: approvedExpenses.length,
          pendingExpenses: pendingExpenses.length,
          approvedAmount: approvedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
          pendingAmount: pendingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        },
        byCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        })),
        monthlyBreakdown: Object.entries(monthlyExpenses).map(([month, amount]) => ({
          month,
          amount,
        })),
        details: expenses,
      };
    } catch (error) {
      console.error('Error generating expenses report:', error);
      throw error;
    }
  }

  /**
   * Generate fleet report
   */
  static async generateFleetReport(organizationId: string, filters: ReportFilters): Promise<any> {
    try {
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          contracts:contracts(
            id,
            rental_start_date,
            rental_end_date,
            total_cost,
            status
          ),
          maintenance:vehicle_maintenance(
            id,
            maintenance_type,
            cost,
            maintenance_date,
            description
          )
        `)
        .eq('organization_id', organizationId);

      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters.vehicleId) {
        query = query.eq('id', filters.vehicleId);
      }

      const { data: vehicles, error } = await query;
      if (error) throw error;

      // Calculate fleet metrics
      const totalVehicles = vehicles.length;
      const activeVehicles = vehicles.filter(v => v.status === 'active').length;
      const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
      const totalMaintenanceCost = vehicles.reduce((sum, v) => 
        sum + v.maintenance.reduce((mSum, m) => mSum + (m.cost || 0), 0), 0
      );

      // Utilization by vehicle
      const vehicleUtilization = vehicles.map(vehicle => {
        const totalDays = vehicle.contracts.length;
        const totalRevenue = vehicle.contracts.reduce((sum, c) => sum + (c.total_cost || 0), 0);
        const avgRevenuePerDay = totalDays > 0 ? totalRevenue / totalDays : 0;
        
        return {
          vehicleId: vehicle.id,
          licensePlate: vehicle.license_plate,
          make: vehicle.make,
          model: vehicle.model,
          totalContracts: totalDays,
          totalRevenue,
          avgRevenuePerDay,
          status: vehicle.status,
        };
      });

      // Maintenance by type
      const maintenanceByType = vehicles.reduce((acc, v) => {
        v.maintenance.forEach(m => {
          const type = m.maintenance_type || 'Άλλο';
          acc[type] = (acc[type] || 0) + (m.cost || 0);
        });
        return acc;
      }, {} as Record<string, number>);

      return {
        summary: {
          totalVehicles,
          activeVehicles,
          maintenanceVehicles,
          totalMaintenanceCost,
        },
        vehicleUtilization,
        maintenanceByType: Object.entries(maintenanceByType).map(([type, cost]) => ({
          type,
          cost,
        })),
        details: vehicles,
      };
    } catch (error) {
      console.error('Error generating fleet report:', error);
      throw error;
    }
  }

  /**
   * Generate customer report
   */
  static async generateCustomerReport(organizationId: string, filters: ReportFilters): Promise<any> {
    try {
      let query = supabase
        .from('customers')
        .select(`
          *,
          contracts:contracts(
            id,
            rental_start_date,
            rental_end_date,
            total_cost,
            status
          )
        `)
        .eq('organization_id', organizationId);

      if (filters.customerId) {
        query = query.eq('id', filters.customerId);
      }

      const { data: customers, error } = await query;
      if (error) throw error;

      // Calculate customer metrics
      const totalCustomers = customers.length;
      const vipCustomers = customers.filter(c => c.vip_status).length;
      const blacklistedCustomers = customers.filter(c => c.blacklist_status).length;
      const activeCustomers = customers.filter(c => c.contracts.length > 0).length;

      // Customer segments by spending
      const customerSegments = customers.map(customer => {
        const totalSpent = customer.contracts.reduce((sum, c) => sum + (c.total_cost || 0), 0);
        const contractCount = customer.contracts.length;
        const avgSpending = contractCount > 0 ? totalSpent / contractCount : 0;
        
        let segment = 'Low';
        if (totalSpent >= 5000) segment = 'High';
        else if (totalSpent >= 2000) segment = 'Medium';
        
        return {
          customerId: customer.id,
          fullName: customer.full_name,
          email: customer.email,
          totalSpent,
          contractCount,
          avgSpending,
          segment,
          vipStatus: customer.vip_status,
          blacklistStatus: customer.blacklist_status,
          lastRental: customer.contracts.length > 0 
            ? Math.max(...customer.contracts.map(c => new Date(c.rental_end_date).getTime()))
            : null,
        };
      });

      // Segment distribution
      const segmentDistribution = customerSegments.reduce((acc, c) => {
        acc[c.segment] = (acc[c.segment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        summary: {
          totalCustomers,
          vipCustomers,
          blacklistedCustomers,
          activeCustomers,
        },
        customerSegments,
        segmentDistribution: Object.entries(segmentDistribution).map(([segment, count]) => ({
          segment,
          count,
          percentage: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0,
        })),
        details: customers,
      };
    } catch (error) {
      console.error('Error generating customer report:', error);
      throw error;
    }
  }

  /**
   * Generate contracts report
   */
  static async generateContractsReport(organizationId: string, filters: ReportFilters): Promise<any> {
    try {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          customer:customers(full_name, email),
          vehicle:vehicles(license_plate, make, model)
        `)
        .eq('organization_id', organizationId);

      if (filters.startDate) {
        query = query.gte('rental_start_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('rental_end_date', filters.endDate);
      }
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data: contracts, error } = await query;
      if (error) throw error;

      // Calculate contract metrics
      const totalContracts = contracts.length;
      const totalRevenue = contracts.reduce((sum, c) => sum + (c.total_cost || 0), 0);
      const avgContractValue = totalContracts > 0 ? totalRevenue / totalContracts : 0;
      
      // Status distribution
      const statusDistribution = contracts.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Monthly breakdown
      const monthlyContracts = contracts.reduce((acc, c) => {
        const month = new Date(c.rental_start_date).toISOString().substring(0, 7);
        if (!acc[month]) acc[month] = { count: 0, revenue: 0 };
        acc[month].count += 1;
        acc[month].revenue += c.total_cost || 0;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      return {
        summary: {
          totalContracts,
          totalRevenue,
          avgContractValue,
        },
        statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
          status,
          count,
          percentage: totalContracts > 0 ? (count / totalContracts) * 100 : 0,
        })),
        monthlyBreakdown: Object.entries(monthlyContracts).map(([month, data]) => ({
          month,
          count: data.count,
          revenue: data.revenue,
        })),
        details: contracts,
      };
    } catch (error) {
      console.error('Error generating contracts report:', error);
      throw error;
    }
  }

  /**
   * Generate damage report
   */
  static async generateDamageReport(organizationId: string, filters: ReportFilters): Promise<any> {
    try {
      let query = supabase
        .from('damage_points')
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            customer:customers(full_name),
            vehicle:vehicles(license_plate, make, model)
          )
        `)
        .eq('organization_id', organizationId);

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }

      const { data: damages, error } = await query;
      if (error) throw error;

      // Calculate damage metrics
      const totalDamages = damages.length;
      const totalCost = damages.reduce((sum, d) => sum + (d.repair_cost || 0), 0);
      const avgDamageCost = totalDamages > 0 ? totalCost / totalDamages : 0;

      // Severity distribution
      const severityDistribution = damages.reduce((acc, d) => {
        const severity = d.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Damage by vehicle part
      const damageByPart = damages.reduce((acc, d) => {
        const part = d.damage_location || 'Άλλο';
        acc[part] = (acc[part] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        summary: {
          totalDamages,
          totalCost,
          avgDamageCost,
        },
        severityDistribution: Object.entries(severityDistribution).map(([severity, count]) => ({
          severity,
          count,
          percentage: totalDamages > 0 ? (count / totalDamages) * 100 : 0,
        })),
        damageByPart: Object.entries(damageByPart).map(([part, count]) => ({
          part,
          count,
          percentage: totalDamages > 0 ? (count / totalDamages) * 100 : 0,
        })),
        details: damages,
      };
    } catch (error) {
      console.error('Error generating damage report:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive financial report
   */
  static async generateFinancialReport(organizationId: string, filters: ReportFilters): Promise<any> {
    try {
      const [revenueReport, expenseReport] = await Promise.all([
        this.generateRevenueReport(organizationId, filters),
        this.generateExpensesReport(organizationId, filters),
      ]);

      const netProfit = revenueReport.summary.totalRevenue - expenseReport.summary.totalExpenses;
      const profitMargin = revenueReport.summary.totalRevenue > 0 
        ? (netProfit / revenueReport.summary.totalRevenue) * 100 
        : 0;

      return {
        summary: {
          totalRevenue: revenueReport.summary.totalRevenue,
          totalExpenses: expenseReport.summary.totalExpenses,
          netProfit,
          profitMargin,
        },
        revenue: revenueReport,
        expenses: expenseReport,
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  /**
   * Get dashboard data with widgets and KPIs
   */
  static async getDashboardData(organizationId: string): Promise<DashboardData> {
    try {
      // Get KPIs
      const kpis = await this.getKPIs(organizationId);
      
      // Get widgets
      const widgets = await this.getDashboardWidgets(organizationId);

      return {
        widgets,
        kpis,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get key performance indicators
   */
  static async getKPIs(organizationId: string): Promise<KPI[]> {
    try {
      const [
        revenueResult,
        expenseResult,
        contractResult,
        customerResult,
      ] = await Promise.all([
        supabase
          .from('revenues')
          .select('amount, revenue_date')
          .eq('organization_id', organizationId)
          .gte('revenue_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('expenses')
          .select('amount, expense_date')
          .eq('organization_id', organizationId)
          .gte('expense_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('contracts')
          .select('total_cost, rental_start_date')
          .eq('organization_id', organizationId)
          .gte('rental_start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('customers')
          .select('created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      if (revenueResult.error) throw revenueResult.error;
      if (expenseResult.error) throw expenseResult.error;
      if (contractResult.error) throw contractResult.error;
      if (customerResult.error) throw customerResult.error;

      const monthlyRevenue = revenueResult.data.reduce((sum, r) => sum + (r.amount || 0), 0);
      const monthlyExpenses = expenseResult.data.reduce((sum, e) => sum + (e.amount || 0), 0);
      const monthlyContracts = contractResult.data.length;
      const monthlyCustomers = customerResult.data.length;

      return [
        {
          id: 'monthly-revenue',
          title: 'Μηνιαία Έσοδα',
          value: monthlyRevenue,
          unit: '€',
          trend: '+12%',
          color: Colors.success,
        },
        {
          id: 'monthly-expenses',
          title: 'Μηνιαία Έξοδα',
          value: monthlyExpenses,
          unit: '€',
          trend: '+8%',
          color: Colors.error,
        },
        {
          id: 'monthly-contracts',
          title: 'Μηνιαία Συμβόλαια',
          value: monthlyContracts,
          unit: '',
          trend: '+15%',
          color: Colors.primary,
        },
        {
          id: 'monthly-customers',
          title: 'Νέοι Πελάτες',
          value: monthlyCustomers,
          unit: '',
          trend: '+5%',
          color: Colors.warning,
        },
      ];
    } catch (error) {
      console.error('Error getting KPIs:', error);
      throw error;
    }
  }

  /**
   * Get dashboard widgets
   */
  static async getDashboardWidgets(organizationId: string): Promise<DashboardWidget[]> {
    try {
      // This would typically fetch from database, but for now return default widgets
      return [
        {
          id: 'revenue-chart',
          type: 'line-chart',
          title: 'Έσοδα ανά Μήνα',
          data: await this.getRevenueChartData(organizationId),
          position: { x: 0, y: 0, width: 6, height: 4 },
        },
        {
          id: 'expense-pie',
          type: 'pie-chart',
          title: 'Έξοδα ανά Κατηγορία',
          data: await this.getExpensePieData(organizationId),
          position: { x: 6, y: 0, width: 4, height: 4 },
        },
        {
          id: 'contract-status',
          type: 'bar-chart',
          title: 'Συμβόλαια ανά Κατάσταση',
          data: await this.getContractStatusData(organizationId),
          position: { x: 0, y: 4, width: 5, height: 4 },
        },
        {
          id: 'fleet-utilization',
          type: 'gauge',
          title: 'Αξιοποίηση Στόλου',
          data: await this.getFleetUtilizationData(organizationId),
          position: { x: 5, y: 4, width: 5, height: 4 },
        },
      ];
    } catch (error) {
      console.error('Error getting dashboard widgets:', error);
      throw error;
    }
  }

  /**
   * Get revenue chart data
   */
  static async getRevenueChartData(organizationId: string): Promise<ChartData> {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .select('amount, revenue_date')
        .eq('organization_id', organizationId)
        .gte('revenue_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('revenue_date');

      if (error) throw error;

      // Group by month
      const monthlyData = data.reduce((acc, r) => {
        const month = new Date(r.revenue_date).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + (r.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        labels: Object.keys(monthlyData),
        datasets: [{
          label: 'Έσοδα',
          data: Object.values(monthlyData),
          color: Colors.primary,
        }],
      };
    } catch (error) {
      console.error('Error getting revenue chart data:', error);
      throw error;
    }
  }

  /**
   * Get expense pie chart data
   */
  static async getExpensePieData(organizationId: string): Promise<ChartData> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('organization_id', organizationId)
        .gte('expense_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Group by category
      const categoryData = data.reduce((acc, e) => {
        const category = e.category || 'Άλλο';
        acc[category] = (acc[category] || 0) + (e.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        labels: Object.keys(categoryData),
        datasets: [{
          label: 'Έξοδα',
          data: Object.values(categoryData),
          color: Colors.error,
        }],
      };
    } catch (error) {
      console.error('Error getting expense pie data:', error);
      throw error;
    }
  }

  /**
   * Get contract status data
   */
  static async getContractStatusData(organizationId: string): Promise<ChartData> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('status')
        .eq('organization_id', organizationId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Count by status
      const statusData = data.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        labels: Object.keys(statusData),
        datasets: [{
          label: 'Συμβόλαια',
          data: Object.values(statusData),
          color: Colors.info,
        }],
      };
    } catch (error) {
      console.error('Error getting contract status data:', error);
      throw error;
    }
  }

  /**
   * Get fleet utilization data
   */
  static async getFleetUtilizationData(organizationId: string): Promise<ChartData> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          status,
          contracts:contracts(id)
        `)
        .eq('organization_id', organizationId);

      if (error) throw error;

      const totalVehicles = data.length;
      const activeVehicles = data.filter(v => v.status === 'active').length;
      const utilizedVehicles = data.filter(v => v.contracts.length > 0).length;
      const utilizationRate = totalVehicles > 0 ? (utilizedVehicles / totalVehicles) * 100 : 0;

      return {
        labels: ['Αξιοποιημένα', 'Διαθέσιμα'],
        datasets: [{
          label: 'Αξιοποίηση',
          data: [utilizationRate, 100 - utilizationRate],
          color: Colors.warning,
        }],
      };
    } catch (error) {
      console.error('Error getting fleet utilization data:', error);
      throw error;
    }
  }

  /**
   * Get saved reports
   */
  static async getSavedReports(organizationId: string): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('organization_id', organizationId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting saved reports:', error);
      throw error;
    }
  }

  /**
   * Get report templates
   */
  static async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting report templates:', error);
      throw error;
    }
  }

  /**
   * Save a custom report template
   */
  static async saveReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving report template:', error);
      throw error;
    }
  }
}
