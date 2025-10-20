/**
 * Customer Management Service
 * Handles customer profiles, history, communication, and relationship management
 */

import { supabase } from '../utils/supabase';
import { CustomerProfile, CommunicationLog } from '../models/multi-tenant.types';

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  vipCustomers: number;
  blacklistedCustomers: number;
  averageRating: number;
  totalRevenue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    totalRentals: number;
    lastRental: string;
  }>;
}

export interface CustomerHistory {
  rentals: Array<{
    id: string;
    date: string;
    vehicle: string;
    duration: number;
    cost: number;
    status: string;
    rating?: number;
  }>;
  communications: CommunicationLog[];
  documents: Array<{
    type: 'id' | 'license' | 'insurance';
    name: string;
    uploadDate: string;
    expiryDate?: string;
    status: 'valid' | 'expired' | 'expiring';
  }>;
  preferences: {
    preferredVehicleTypes: string[];
    preferredPickupTimes: string[];
    specialRequests: string[];
  };
}

export class CustomerService {
  /**
   * Get all customers for organization
   */
  static async getCustomers(organizationId: string, filters?: {
    search?: string;
    vipStatus?: boolean;
    blacklistStatus?: boolean;
    hasExpiredDocuments?: boolean;
  }): Promise<CustomerProfile[]> {
    try {
      let query = supabase
        .from('customer_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone_primary.ilike.%${filters.search}%,id_number.ilike.%${filters.search}%`);
      }

      if (filters?.vipStatus !== undefined) {
        query = query.eq('vip_status', filters.vipStatus);
      }

      if (filters?.blacklistStatus !== undefined) {
        query = query.eq('blacklist_status', filters.blacklistStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter for expired documents if requested
      if (filters?.hasExpiredDocuments) {
        return data?.filter(customer => this.hasExpiredDocuments(customer)) || [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<CustomerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }

  /**
   * Create new customer
   */
  static async createCustomer(organizationId: string, customerData: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .insert({
          organization_id: organizationId,
          ...customerData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(customerId: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete by blacklisting)
   */
  static async deleteCustomer(customerId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          blacklist_status: true,
          blacklist_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Get customer history
   */
  static async getCustomerHistory(customerId: string): Promise<CustomerHistory> {
    try {
      // Get rental history
      const { data: rentals } = await supabase
        .from('contracts')
        .select(`
          id,
          pickup_date,
          dropoff_date,
          total_cost,
          status,
          car_info->makeModel,
          renter_info->fullName
        `)
        .eq('customer_id', customerId)
        .order('pickup_date', { ascending: false });

      // Get communication history
      const { data: communications } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Get customer document info
      const customer = await this.getCustomer(customerId);
      
      const rentalsHistory = rentals?.map(rental => {
        const pickupDate = new Date(rental.pickup_date);
        const dropoffDate = new Date(rental.dropoff_date);
        const duration = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: rental.id,
          date: rental.pickup_date,
          vehicle: rental.car_info?.makeModel || 'Unknown Vehicle',
          duration,
          cost: rental.total_cost,
          status: rental.status,
        };
      }) || [];

      const documents = [];
      if (customer?.id_document_url) {
        documents.push({
          type: 'id' as const,
          name: 'Ταυτότητα/Διαβατήριο',
          uploadDate: customer.created_at,
          status: 'valid' as const,
        });
      }
      if (customer?.license_document_url) {
        documents.push({
          type: 'license' as const,
          name: 'Δίπλωμα Οδήγησης',
          uploadDate: customer.created_at,
          expiryDate: customer.driver_license_expiry,
          status: this.getDocumentStatus(customer.driver_license_expiry),
        });
      }
      if (customer?.insurance_document_url) {
        documents.push({
          type: 'insurance' as const,
          name: 'Ασφάλιση',
          uploadDate: customer.created_at,
          status: 'valid' as const,
        });
      }

      return {
        rentals: rentalsHistory,
        communications: communications || [],
        documents,
        preferences: {
          preferredVehicleTypes: [],
          preferredPickupTimes: [],
          specialRequests: [],
        },
      };
    } catch (error) {
      console.error('Error getting customer history:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(organizationId: string): Promise<CustomerStats> {
    try {
      const customers = await this.getCustomers(organizationId);
      
      const totalCustomers = customers.length;
      const newCustomersThisMonth = customers.filter(customer => {
        const customerDate = new Date(customer.created_at);
        const now = new Date();
        return customerDate.getMonth() === now.getMonth() && 
               customerDate.getFullYear() === now.getFullYear();
      }).length;
      
      const vipCustomers = customers.filter(c => c.vip_status).length;
      const blacklistedCustomers = customers.filter(c => c.blacklist_status).length;
      
      const customersWithRatings = customers.filter(c => c.customer_rating);
      const averageRating = customersWithRatings.length > 0
        ? customersWithRatings.reduce((sum, c) => sum + (c.customer_rating || 0), 0) / customersWithRatings.length
        : 0;

      const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);

      // Get top customers
      const topCustomers = customers
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5)
        .map(customer => ({
          id: customer.id,
          name: customer.full_name,
          totalSpent: customer.total_spent,
          totalRentals: customer.total_rentals,
          lastRental: customer.created_at, // Simplified - would need to get actual last rental date
        }));

      return {
        totalCustomers,
        newCustomersThisMonth,
        vipCustomers,
        blacklistedCustomers,
        averageRating,
        totalRevenue,
        topCustomers,
      };
    } catch (error) {
      console.error('Error getting customer stats:', error);
      throw error;
    }
  }

  /**
   * Add communication log
   */
  static async addCommunicationLog(
    organizationId: string,
    customerId: string,
    communicationData: Partial<CommunicationLog>
  ): Promise<CommunicationLog> {
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          ...communicationData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding communication log:', error);
      throw error;
    }
  }

  /**
   * Get communication logs for customer
   */
  static async getCommunicationLogs(customerId: string): Promise<CommunicationLog[]> {
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting communication logs:', error);
      throw error;
    }
  }

  /**
   * Update customer rating
   */
  static async updateCustomerRating(customerId: string, rating: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          customer_rating: rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating customer rating:', error);
      throw error;
    }
  }

  /**
   * Toggle VIP status
   */
  static async toggleVipStatus(customerId: string): Promise<void> {
    try {
      const customer = await this.getCustomer(customerId);
      if (!customer) throw new Error('Customer not found');

      const { error } = await supabase
        .from('customer_profiles')
        .update({
          vip_status: !customer.vip_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling VIP status:', error);
      throw error;
    }
  }

  /**
   * Search customers
   */
  static async searchCustomers(organizationId: string, searchTerm: string): Promise<CustomerProfile[]> {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_primary.ilike.%${searchTerm}%,id_number.ilike.%${searchTerm}%,driver_license_number.ilike.%${searchTerm}%`)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Get customers with expired documents
   */
  static async getCustomersWithExpiredDocuments(organizationId: string): Promise<CustomerProfile[]> {
    try {
      const customers = await this.getCustomers(organizationId);
      return customers.filter(customer => this.hasExpiredDocuments(customer));
    } catch (error) {
      console.error('Error getting customers with expired documents:', error);
      throw error;
    }
  }

  /**
   * Get customers due for license renewal
   */
  static async getCustomersDueForLicenseRenewal(organizationId: string, daysAhead: number = 30): Promise<CustomerProfile[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .not('driver_license_expiry', 'is', null)
        .lte('driver_license_expiry', cutoffDate.toISOString().split('T')[0]);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting customers due for license renewal:', error);
      throw error;
    }
  }

  /**
   * Bulk update customer data
   */
  static async bulkUpdateCustomers(customerIds: string[], updates: Partial<CustomerProfile>): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in('id', customerIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk updating customers:', error);
      throw error;
    }
  }

  /**
   * Import customers from CSV/Excel
   */
  static async importCustomers(organizationId: string, customersData: Partial<CustomerProfile>[]): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    try {
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const customerData of customersData) {
        try {
          await this.createCustomer(organizationId, customerData);
          imported++;
        } catch (error) {
          failed++;
          errors.push(`Failed to import ${customerData.full_name}: ${error}`);
        }
      }

      return { imported, failed, errors };
    } catch (error) {
      console.error('Error importing customers:', error);
      throw error;
    }
  }

  /**
   * Export customers to CSV
   */
  static async exportCustomers(organizationId: string): Promise<string> {
    try {
      const customers = await this.getCustomers(organizationId);
      
      // Create CSV header
      const headers = [
        'Full Name',
        'Email',
        'Phone',
        'ID Number',
        'Date of Birth',
        'Driver License',
        'License Expiry',
        'Total Rentals',
        'Total Spent',
        'VIP Status',
        'Rating',
        'Created Date'
      ];

      // Create CSV rows
      const rows = customers.map(customer => [
        customer.full_name,
        customer.email || '',
        customer.phone_primary || '',
        customer.id_number || '',
        customer.date_of_birth || '',
        customer.persistent_driver_license_number || '',
        customer.driver_license_expiry || '',
        customer.total_rentals.toString(),
        customer.total_spent.toString(),
        customer.vip_status ? 'Yes' : 'No',
        customer.customer_rating?.toString() || '',
        customer.created_at
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private static hasExpiredDocuments(customer: CustomerProfile): boolean {
    if (!customer.driver_license_expiry) return false;
    
    const expiryDate = new Date(customer.driver_license_expiry);
    const now = new Date();
    
    return expiryDate < now;
  }

  private static getDocumentStatus(expiryDate?: string): 'valid' | 'expired' | 'expiring' {
    if (!expiryDate) return 'valid';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    if (expiry < now) return 'expired';
    if (expiry <= thirtyDaysFromNow) return 'expiring';
    return 'valid';
  }

  /**
   * Validate customer data
   */
  static validateCustomerData(customerData: Partial<CustomerProfile>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!customerData.full_name) {
      errors.push('Full name is required');
    }

    if (customerData.email && !this.isValidEmail(customerData.email)) {
      errors.push('Invalid email format');
    }

    if (customerData.phone_primary && !this.isValidPhone(customerData.phone_primary)) {
      errors.push('Invalid phone number format');
    }

    if (customerData.id_number && !this.isValidIdNumber(customerData.id_number)) {
      errors.push('Invalid ID number format');
    }

    if (customerData.driver_license_expiry && !this.isValidDate(customerData.driver_license_expiry)) {
      errors.push('Invalid license expiry date');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  private static isValidIdNumber(idNumber: string): boolean {
    // Basic validation - can be enhanced based on country requirements
    return idNumber.length >= 5 && idNumber.length <= 20;
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
