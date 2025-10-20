import { supabase } from '../utils/supabase';
import { FinancialTransaction, Invoice, Expense, Revenue, FinancialReport, PaymentMethod, TaxRate } from '../models/multi-tenant.types';

export interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  topRevenueSources: Array<{ source: string; amount: number; percentage: number }>;
  expenseCategories: Array<{ category: string; amount: number; percentage: number }>;
}

export interface InvoiceFilters {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  customerId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  approved?: boolean;
}

export interface RevenueFilters {
  source?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
}

export class FinancialService {
  /**
   * Get comprehensive financial statistics for an organization
   */
  static async getFinancialStats(organizationId: string): Promise<FinancialStats> {
    try {
      const [
        revenueResult,
        expenseResult,
        monthlyRevenueResult,
        monthlyExpenseResult,
        invoiceResult,
        overdueInvoiceResult,
        topRevenueResult,
        expenseCategoriesResult,
      ] = await Promise.all([
        // Total revenue
        supabase
          .from('revenues')
          .select('amount')
          .eq('organization_id', organizationId),

        // Total expenses
        supabase
          .from('expenses')
          .select('amount')
          .eq('organization_id', organizationId),

        // Monthly revenue (current month)
        supabase
          .from('revenues')
          .select('amount')
          .eq('organization_id', organizationId)
          .gte('revenue_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lt('revenue_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()),

        // Monthly expenses (current month)
        supabase
          .from('expenses')
          .select('amount')
          .eq('organization_id', organizationId)
          .gte('expense_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lt('expense_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()),

        // Outstanding invoices
        supabase
          .from('invoices')
          .select('amount')
          .eq('organization_id', organizationId)
          .eq('status', 'sent'),

        // Overdue invoices
        supabase
          .from('invoices')
          .select('amount')
          .eq('organization_id', organizationId)
          .eq('status', 'overdue'),

        // Top revenue sources
        supabase
          .from('revenues')
          .select('source, amount')
          .eq('organization_id', organizationId),

        // Expense categories
        supabase
          .from('expenses')
          .select('category, amount')
          .eq('organization_id', organizationId),
      ]);

      if (revenueResult.error) throw revenueResult.error;
      if (expenseResult.error) throw expenseResult.error;
      if (monthlyRevenueResult.error) throw monthlyRevenueResult.error;
      if (monthlyExpenseResult.error) throw monthlyExpenseResult.error;
      if (invoiceResult.error) throw invoiceResult.error;
      if (overdueInvoiceResult.error) throw overdueInvoiceResult.error;
      if (topRevenueResult.error) throw topRevenueResult.error;
      if (expenseCategoriesResult.error) throw expenseCategoriesResult.error;

      const totalRevenue = revenueResult.data.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalExpenses = expenseResult.data.reduce((sum, e) => sum + (e.amount || 0), 0);
      const monthlyRevenue = monthlyRevenueResult.data.reduce((sum, r) => sum + (r.amount || 0), 0);
      const monthlyExpenses = monthlyExpenseResult.data.reduce((sum, e) => sum + (e.amount || 0), 0);
      const outstandingInvoices = invoiceResult.data.reduce((sum, i) => sum + (i.amount || 0), 0);
      const overdueInvoices = overdueInvoiceResult.data.reduce((sum, i) => sum + (i.amount || 0), 0);

      // Calculate top revenue sources
      const revenueBySource = topRevenueResult.data.reduce((acc, r) => {
        const source = r.source || 'Άλλο';
        acc[source] = (acc[source] || 0) + (r.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      const topRevenueSources = Object.entries(revenueBySource)
        .map(([source, amount]) => ({
          source,
          amount,
          percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate expense categories
      const expensesByCategory = expenseCategoriesResult.data.reduce((acc, e) => {
        const category = e.category || 'Άλλο';
        acc[category] = (acc[category] || 0) + (e.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      const expenseCategories = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfit: monthlyRevenue - monthlyExpenses,
        outstandingInvoices,
        overdueInvoices,
        topRevenueSources,
        expenseCategories,
      };
    } catch (error) {
      console.error('Error getting financial stats:', error);
      throw error;
    }
  }

  /**
   * Get all invoices with filtering options
   */
  static async getInvoices(organizationId: string, filters?: InvoiceFilters): Promise<Invoice[]> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, full_name, email)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.startDate) {
        query = query.gte('invoice_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('invoice_date', filters.endDate);
      }
      if (filters?.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters?.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  }

  /**
   * Get all expenses with filtering options
   */
  static async getExpenses(organizationId: string, filters?: ExpenseFilters): Promise<Expense[]> {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          approved_by:users(id, full_name)
        `)
        .eq('organization_id', organizationId)
        .order('expense_date', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }
      if (filters?.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters?.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }
      if (filters?.approved !== undefined) {
        query = query.eq('approved', filters.approved);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Get all revenues with filtering options
   */
  static async getRevenues(organizationId: string, filters?: RevenueFilters): Promise<Revenue[]> {
    try {
      let query = supabase
        .from('revenues')
        .select(`
          *,
          contract:contracts(id, contract_number)
        `)
        .eq('organization_id', organizationId)
        .order('revenue_date', { ascending: false });

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.startDate) {
        query = query.gte('revenue_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('revenue_date', filters.endDate);
      }
      if (filters?.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters?.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }
      if (filters?.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting revenues:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(organizationId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          organization_id: organizationId,
          status: 'draft',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Update an existing invoice
   */
  static async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Create a new expense
   */
  static async createExpense(organizationId: string, expenseData: Partial<Expense>): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Update an existing expense
   */
  static async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Create a new revenue record
   */
  static async createRevenue(organizationId: string, revenueData: Partial<Revenue>): Promise<Revenue> {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .insert({
          ...revenueData,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating revenue:', error);
      throw error;
    }
  }

  /**
   * Record a payment for an invoice
   */
  static async recordPayment(invoiceId: string, paymentData: {
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }): Promise<FinancialTransaction> {
    try {
      // Create the payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          invoice_id: invoiceId,
          type: 'payment',
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          transaction_date: paymentData.paymentDate,
          reference: paymentData.reference,
          description: paymentData.notes,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update invoice status
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('amount')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const newStatus = paymentData.amount >= invoice.amount ? 'paid' : 'sent';
      await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      return transaction;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Approve or reject an expense
   */
  static async approveExpense(expenseId: string, approved: boolean, approvedBy: string, notes?: string): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          approved,
          approved_by: approved ? approvedBy : null,
          approval_notes: notes,
          approved_at: approved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error approving expense:', error);
      throw error;
    }
  }

  /**
   * Generate financial report for a date range
   */
  static async generateFinancialReport(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<FinancialReport> {
    try {
      const [revenues, expenses, invoices] = await Promise.all([
        supabase
          .from('revenues')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('revenue_date', startDate)
          .lte('revenue_date', endDate),
        supabase
          .from('expenses')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate),
        supabase
          .from('invoices')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate),
      ]);

      if (revenues.error) throw revenues.error;
      if (expenses.error) throw expenses.error;
      if (invoices.error) throw invoices.error;

      const totalRevenue = revenues.data.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalExpenses = expenses.data.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalInvoiced = invoices.data.reduce((sum, i) => sum + (i.amount || 0), 0);
      const paidInvoices = invoices.data.filter(i => i.status === 'paid');
      const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

      return {
        organizationId,
        startDate,
        endDate,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalInvoiced,
        totalPaid,
        paidPercentage: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
        revenueCount: revenues.data.length,
        expenseCount: expenses.data.length,
        invoiceCount: invoices.data.length,
        paidInvoiceCount: paidInvoices.length,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  /**
   * Get payment methods configured for the organization
   */
  static async getPaymentMethods(organizationId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Get tax rates configured for the organization
   */
  static async getTaxRates(organizationId: string): Promise<TaxRate[]> {
    try {
      const { data, error } = await supabase
        .from('tax_rates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('rate');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tax rates:', error);
      throw error;
    }
  }

  /**
   * Calculate tax amount for a given amount and tax rate
   */
  static calculateTax(amount: number, taxRate: number): { taxAmount: number; totalWithTax: number } {
    const taxAmount = amount * (taxRate / 100);
    const totalWithTax = amount + taxAmount;
    return { taxAmount, totalWithTax };
  }

  /**
   * Validate invoice data before saving
   */
  static validateInvoiceData(invoiceData: Partial<Invoice>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!invoiceData.customer_id) {
      errors.push('Πελάτης είναι υποχρεωτικός');
    }
    if (!invoiceData.amount || invoiceData.amount <= 0) {
      errors.push('Ποσό πρέπει να είναι μεγαλύτερο από 0');
    }
    if (!invoiceData.invoice_date) {
      errors.push('Ημερομηνία τιμολόγησης είναι υποχρεωτική');
    }
    if (!invoiceData.due_date) {
      errors.push('Ημερομηνία λήξης είναι υποχρεωτική');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate expense data before saving
   */
  static validateExpenseData(expenseData: Partial<Expense>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!expenseData.description) {
      errors.push('Περιγραφή είναι υποχρεωτική');
    }
    if (!expenseData.amount || expenseData.amount <= 0) {
      errors.push('Ποσό πρέπει να είναι μεγαλύτερο από 0');
    }
    if (!expenseData.category) {
      errors.push('Κατηγορία είναι υποχρεωτική');
    }
    if (!expenseData.expense_date) {
      errors.push('Ημερομηνία είναι υποχρεωτική');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate revenue data before saving
   */
  static validateRevenueData(revenueData: Partial<Revenue>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!revenueData.source) {
      errors.push('Πηγή εσόδων είναι υποχρεωτική');
    }
    if (!revenueData.amount || revenueData.amount <= 0) {
      errors.push('Ποσό πρέπει να είναι μεγαλύτερο από 0');
    }
    if (!revenueData.revenue_date) {
      errors.push('Ημερομηνία είναι υποχρεωτική');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
