/**
 * Fleet Management Service
 * Handles vehicle management, maintenance, accessories, and performance tracking
 */

import { supabase } from '../utils/supabase';
import { VehicleAccessory, VehicleAccessoryAssignment, MaintenanceRecord, Expense } from '../models/multi-tenant.types';

export interface Vehicle {
  id: string;
  organization_id: string;
  branch_id?: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  category: 'car' | 'atv' | 'scooter' | 'motorcycle' | 'van' | 'truck';
  color?: string;
  vin?: string;
  mileage: number;
  fuel_level: number;
  insurance_type: 'basic' | 'full';
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  purchase_price?: number;
  purchase_date?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  kteo_expiry?: string;
  road_tax_expiry?: string;
  total_rentals: number;
  total_revenue: number;
  average_rating: number;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  created_at: string;
  updated_at: string;
  // Relations
  branch?: any;
  accessories?: VehicleAccessoryAssignment[];
  maintenance_records?: MaintenanceRecord[];
  recent_contracts?: any[];
}

export interface FleetStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  retiredVehicles: number;
  totalFleetValue: number;
  averageUtilizationRate: number;
  topPerformingVehicles: Array<{
    id: string;
    makeModel: string;
    revenue: number;
    rentals: number;
    utilizationRate: number;
  }>;
  maintenanceAlerts: Array<{
    vehicleId: string;
    makeModel: string;
    alertType: 'service_due' | 'insurance_expiry' | 'kteo_expiry' | 'road_tax_expiry';
    dueDate: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export class FleetService {
  /**
   * Get all vehicles for organization
   */
  static async getVehicles(organizationId: string, filters?: {
    status?: string;
    category?: string;
    branchId?: string;
  }): Promise<Vehicle[]> {
    try {
      let query = supabase
        .from('cars')
        .select(`
          *,
          branch:branches(*),
          accessories:vehicle_accessory_assignments(
            *,
            accessory:vehicle_accessories(*)
          ),
          maintenance_records:maintenance_records(*)
        `)
        .eq('organization_id', organizationId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting vehicles:', error);
      throw error;
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          branch:branches(*),
          accessories:vehicle_accessory_assignments(
            *,
            accessory:vehicle_accessories(*)
          ),
          maintenance_records:maintenance_records(*)
        `)
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting vehicle:', error);
      throw error;
    }
  }

  /**
   * Create new vehicle
   */
  static async createVehicle(organizationId: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const { data, error } = await supabase
        .from('cars')
        .insert({
          organization_id: organizationId,
          ...vehicleData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  /**
   * Update vehicle
   */
  static async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const { data, error } = await supabase
        .from('cars')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  /**
   * Delete vehicle (soft delete)
   */
  static async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          status: 'retired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  /**
   * Get vehicle accessories
   */
  static async getVehicleAccessories(organizationId: string): Promise<VehicleAccessory[]> {
    try {
      const { data, error } = await supabase
        .from('vehicle_accessories')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting vehicle accessories:', error);
      throw error;
    }
  }

  /**
   * Create vehicle accessory
   */
  static async createVehicleAccessory(organizationId: string, accessoryData: Partial<VehicleAccessory>): Promise<VehicleAccessory> {
    try {
      const { data, error } = await supabase
        .from('vehicle_accessories')
        .insert({
          organization_id: organizationId,
          ...accessoryData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vehicle accessory:', error);
      throw error;
    }
  }

  /**
   * Assign accessory to vehicle
   */
  static async assignAccessoryToVehicle(organizationId: string, vehicleId: string, accessoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicle_accessory_assignments')
        .insert({
          organization_id: organizationId,
          car_id: vehicleId,
          accessory_id: accessoryId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning accessory to vehicle:', error);
      throw error;
    }
  }

  /**
   * Remove accessory from vehicle
   */
  static async removeAccessoryFromVehicle(vehicleId: string, accessoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicle_accessory_assignments')
        .update({
          is_active: false,
          unassigned_at: new Date().toISOString(),
        })
        .eq('car_id', vehicleId)
        .eq('accessory_id', accessoryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing accessory from vehicle:', error);
      throw error;
    }
  }

  /**
   * Get maintenance records for vehicle
   */
  static async getMaintenanceRecords(vehicleId: string): Promise<MaintenanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('car_id', vehicleId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting maintenance records:', error);
      throw error;
    }
  }

  /**
   * Create maintenance record
   */
  static async createMaintenanceRecord(organizationId: string, vehicleId: string, maintenanceData: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert({
          organization_id: organizationId,
          car_id: vehicleId,
          ...maintenanceData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  }

  /**
   * Get fleet statistics
   */
  static async getFleetStats(organizationId: string): Promise<FleetStats> {
    try {
      const vehicles = await this.getVehicles(organizationId);
      
      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter(v => v.status === 'available').length;
      const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;
      const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
      const retiredVehicles = vehicles.filter(v => v.status === 'retired').length;

      const totalFleetValue = vehicles.reduce((sum, v) => sum + (v.purchase_price || 0), 0);
      
      const averageUtilizationRate = vehicles.length > 0 
        ? vehicles.reduce((sum, v) => sum + (v.total_rentals || 0), 0) / vehicles.length
        : 0;

      // Top performing vehicles (by revenue)
      const topPerformingVehicles = vehicles
        .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
        .slice(0, 5)
        .map(v => ({
          id: v.id,
          makeModel: `${v.make} ${v.model}`,
          revenue: v.total_revenue || 0,
          rentals: v.total_rentals || 0,
          utilizationRate: v.total_rentals || 0,
        }));

      // Maintenance alerts
      const maintenanceAlerts = [];
      const now = new Date();
      
      for (const vehicle of vehicles) {
        const vehicleName = `${vehicle.make} ${vehicle.model}`;
        
        // Check insurance expiry
        if (vehicle.insurance_expiry) {
          const expiryDate = new Date(vehicle.insurance_expiry);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 30) {
            maintenanceAlerts.push({
              vehicleId: vehicle.id,
              makeModel: vehicleName,
              alertType: 'insurance_expiry' as const,
              dueDate: vehicle.insurance_expiry,
              severity: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low',
            });
          }
        }

        // Check KTEO expiry
        if (vehicle.kteo_expiry) {
          const expiryDate = new Date(vehicle.kteo_expiry);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 30) {
            maintenanceAlerts.push({
              vehicleId: vehicle.id,
              makeModel: vehicleName,
              alertType: 'kteo_expiry' as const,
              dueDate: vehicle.kteo_expiry,
              severity: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low',
            });
          }
        }

        // Check road tax expiry
        if (vehicle.road_tax_expiry) {
          const expiryDate = new Date(vehicle.road_tax_expiry);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 30) {
            maintenanceAlerts.push({
              vehicleId: vehicle.id,
              makeModel: vehicleName,
              alertType: 'road_tax_expiry' as const,
              dueDate: vehicle.road_tax_expiry,
              severity: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low',
            });
          }
        }

        // Check service due (based on mileage or time)
        const maintenanceRecords = await this.getMaintenanceRecords(vehicle.id);
        if (maintenanceRecords.length > 0) {
          const lastService = maintenanceRecords[0];
          const serviceInterval = 10000; // 10,000 km or 6 months
          const nextServiceMileage = (lastService.mileage || 0) + serviceInterval;
          const nextServiceDate = new Date(lastService.performed_at);
          nextServiceDate.setMonth(nextServiceDate.getMonth() + 6);
          
          if (vehicle.mileage >= nextServiceMileage || now >= nextServiceDate) {
            maintenanceAlerts.push({
              vehicleId: vehicle.id,
              makeModel: vehicleName,
              alertType: 'service_due' as const,
              dueDate: nextServiceDate.toISOString().split('T')[0],
              severity: vehicle.mileage >= nextServiceMileage + 5000 ? 'high' : 'medium',
            });
          }
        }
      }

      return {
        totalVehicles,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
        retiredVehicles,
        totalFleetValue,
        averageUtilizationRate,
        topPerformingVehicles,
        maintenanceAlerts,
      };
    } catch (error) {
      console.error('Error getting fleet stats:', error);
      throw error;
    }
  }

  /**
   * Update vehicle status
   */
  static async updateVehicleStatus(vehicleId: string, status: 'available' | 'rented' | 'maintenance' | 'retired'): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  }

  /**
   * Update vehicle mileage
   */
  static async updateVehicleMileage(vehicleId: string, mileage: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          mileage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating vehicle mileage:', error);
      throw error;
    }
  }

  /**
   * Get vehicle performance metrics
   */
  static async getVehiclePerformance(vehicleId: string, dateRange?: { start: string; end: string }): Promise<{
    totalRevenue: number;
    totalRentals: number;
    averageRentalDuration: number;
    utilizationRate: number;
    maintenanceCosts: number;
    profitMargin: number;
  }> {
    try {
      // Get vehicle details
      const vehicle = await this.getVehicle(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');

      // Get contracts for this vehicle
      let contractsQuery = supabase
        .from('contracts')
        .select('*')
        .eq('car_license_plate', vehicle.license_plate);

      if (dateRange) {
        contractsQuery = contractsQuery
          .gte('pickup_date', dateRange.start)
          .lte('pickup_date', dateRange.end);
      }

      const { data: contracts } = await contractsQuery;

      // Calculate metrics
      const totalRevenue = contracts?.reduce((sum, c) => sum + c.total_cost, 0) || 0;
      const totalRentals = contracts?.length || 0;
      
      const averageRentalDuration = totalRentals > 0 
        ? contracts?.reduce((sum, c) => {
            const pickup = new Date(c.pickup_date);
            const dropoff = new Date(c.dropoff_date);
            return sum + (dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / totalRentals || 0
        : 0;

      // Get maintenance costs
      const maintenanceRecords = await this.getMaintenanceRecords(vehicleId);
      const maintenanceCosts = maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

      // Calculate profit margin
      const totalCosts = (vehicle.purchase_price || 0) + maintenanceCosts;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

      // Calculate utilization rate (simplified)
      const utilizationRate = totalRentals > 0 ? Math.min(totalRentals * 2, 100) : 0; // Simplified calculation

      return {
        totalRevenue,
        totalRentals,
        averageRentalDuration,
        utilizationRate,
        maintenanceCosts,
        profitMargin,
      };
    } catch (error) {
      console.error('Error getting vehicle performance:', error);
      throw error;
    }
  }

  /**
   * Search vehicles
   */
  static async searchVehicles(organizationId: string, searchTerm: string): Promise<Vehicle[]> {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          branch:branches(*)
        `)
        .eq('organization_id', organizationId)
        .or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }

  /**
   * Bulk update vehicle prices
   */
  static async bulkUpdatePrices(vehicleIds: string[], priceUpdates: {
    dailyRate?: number;
    weeklyRate?: number;
    monthlyRate?: number;
  }): Promise<void> {
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (priceUpdates.dailyRate !== undefined) updates.daily_rate = priceUpdates.dailyRate;
      if (priceUpdates.weeklyRate !== undefined) updates.weekly_rate = priceUpdates.weeklyRate;
      if (priceUpdates.monthlyRate !== undefined) updates.monthly_rate = priceUpdates.monthlyRate;

      const { error } = await supabase
        .from('cars')
        .update(updates)
        .in('id', vehicleIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk updating prices:', error);
      throw error;
    }
  }

  /**
   * Get vehicles by category
   */
  static async getVehiclesByCategory(organizationId: string, category: string): Promise<Vehicle[]> {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          branch:branches(*)
        `)
        .eq('organization_id', organizationId)
        .eq('category', category)
        .eq('status', 'available')
        .order('make');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting vehicles by category:', error);
      throw error;
    }
  }
}
