/**
 * Organization Management Service
 * Handles multi-tenant organization operations
 */

import { supabase } from '../utils/supabase';
import { Organization, Branch, OrganizationSettings, TeamMember, Integration } from '../models/multi-tenant.types';

export class OrganizationService {
  /**
   * Get current user's organization
   */
  static async getCurrentOrganization(): Promise<Organization | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.user.id)
        .single();

      if (error || !data?.organization_id) return null;

      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', data.organization_id)
        .single();

      if (orgError) throw orgError;
      return organization;
    } catch (error) {
      console.error('Error getting current organization:', error);
      throw error;
    }
  }

  /**
   * Create new organization
   */
  static async createOrganization(organizationData: Partial<Organization>): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  static async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization settings
   */
  static async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting organization settings:', error);
      throw error;
    }
  }

  /**
   * Update organization settings
   */
  static async updateOrganizationSettings(organizationId: string, settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .upsert({
          organization_id: organizationId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating organization settings:', error);
      throw error;
    }
  }

  /**
   * Get organization branches
   */
  static async getBranches(organizationId: string): Promise<Branch[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting branches:', error);
      throw error;
    }
  }

  /**
   * Create new branch
   */
  static async createBranch(organizationId: string, branchData: Partial<Branch>): Promise<Branch> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .insert({
          organization_id: organizationId,
          ...branchData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  /**
   * Update branch
   */
  static async updateBranch(branchId: string, updates: Partial<Branch>): Promise<Branch> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', branchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  /**
   * Delete branch
   */
  static async deleteBranch(branchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', branchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }

  /**
   * Get team members
   */
  static async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*),
          branch:branches(*)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  }

  /**
   * Invite team member
   */
  static async inviteTeamMember(organizationId: string, memberData: {
    email: string;
    role: 'admin' | 'manager' | 'agent' | 'viewer';
    branchId?: string;
  }): Promise<void> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', memberData.email)
        .single();

      if (existingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            organization_id: organizationId,
            role: memberData.role,
            branch_id: memberData.branchId,
            is_active: true,
          })
          .eq('id', existingUser.id);

        if (error) throw error;
      } else {
        // Create invitation (would need to implement invitation system)
        // For now, we'll just create a placeholder user
        const { error } = await supabase
          .from('users')
          .insert({
            email: memberData.email,
            organization_id: organizationId,
            role: memberData.role,
            branch_id: memberData.branchId,
            name: memberData.email, // Temporary name
            is_active: false, // Will be activated when they accept invitation
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
      throw error;
    }
  }

  /**
   * Update team member role
   */
  static async updateTeamMemberRole(userId: string, role: 'admin' | 'manager' | 'agent' | 'viewer'): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  }

  /**
   * Remove team member
   */
  static async removeTeamMember(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          organization_id: null,
          role: null,
          branch_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  /**
   * Get organization integrations
   */
  static async getIntegrations(organizationId: string): Promise<Integration[]> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting integrations:', error);
      throw error;
    }
  }

  /**
   * Create integration
   */
  static async createIntegration(organizationId: string, integrationData: Partial<Integration>): Promise<Integration> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          organization_id: organizationId,
          ...integrationData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  /**
   * Update integration
   */
  static async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(integrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }

  /**
   * Test integration connection
   */
  static async testIntegration(integrationId: string): Promise<boolean> {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (!integration) throw new Error('Integration not found');

      // Test connection based on integration type
      switch (integration.integration_type) {
        case 'wordpress':
          return await this.testWordPressConnection(integration);
        case 'woocommerce':
          return await this.testWooCommerceConnection(integration);
        case 'wheelsys':
          return await this.testWheelsysConnection(integration);
        case 'xml_feed':
          return await this.testXMLFeedConnection(integration);
        default:
          throw new Error('Unsupported integration type');
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      return false;
    }
  }

  /**
   * Test WordPress connection
   */
  private static async testWordPressConnection(integration: Integration): Promise<boolean> {
    try {
      const config = integration.config;
      const url = `${config.url}/wp-json/wp/v2/users/me`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }

  /**
   * Test WooCommerce connection
   */
  private static async testWooCommerceConnection(integration: Integration): Promise<boolean> {
    try {
      const config = integration.config;
      const url = `${config.url}/wp-json/wc/v3/products`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${btoa(`${config.consumer_key}:${config.consumer_secret}`)}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('WooCommerce connection test failed:', error);
      return false;
    }
  }

  /**
   * Test Wheelsys connection
   */
  private static async testWheelsysConnection(integration: Integration): Promise<boolean> {
    try {
      const config = integration.config;
      const url = `${config.api_url}/api/vehicles`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Wheelsys connection test failed:', error);
      return false;
    }
  }

  /**
   * Test XML feed connection
   */
  private static async testXMLFeedConnection(integration: Integration): Promise<boolean> {
    try {
      const config = integration.config;
      const response = await fetch(config.url, {
        method: 'HEAD',
      });

      return response.ok;
    } catch (error) {
      console.error('XML feed connection test failed:', error);
      return false;
    }
  }

  /**
   * Get organization dashboard stats
   */
  static async getDashboardStats(organizationId: string): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    activeRentals: number;
    totalVehicles: number;
    availableVehicles: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
  }> {
    try {
      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get contracts for revenue calculation
      const { data: contracts } = await supabase
        .from('contracts')
        .select('total_cost, created_at')
        .eq('organization_id', organizationId);

      // Get vehicles count
      const { data: vehicles } = await supabase
        .from('cars')
        .select('id, status')
        .eq('organization_id', organizationId);

      // Get customers count
      const { data: customers } = await supabase
        .from('customer_profiles')
        .select('id, created_at')
        .eq('organization_id', organizationId);

      // Calculate stats
      const totalRevenue = contracts?.reduce((sum, contract) => sum + contract.total_cost, 0) || 0;
      const monthlyRevenue = contracts?.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate >= startOfMonth && contractDate <= endOfMonth;
      }).reduce((sum, contract) => sum + contract.total_cost, 0) || 0;

      const activeRentals = contracts?.filter(contract => {
        const pickupDate = new Date(contract.pickup_date);
        const dropoffDate = new Date(contract.dropoff_date);
        const now = new Date();
        return pickupDate <= now && dropoffDate >= now;
      }).length || 0;

      const totalVehicles = vehicles?.length || 0;
      const availableVehicles = vehicles?.filter(vehicle => vehicle.status === 'available').length || 0;
      const totalCustomers = customers?.length || 0;
      const newCustomersThisMonth = customers?.filter(customer => {
        const customerDate = new Date(customer.created_at);
        return customerDate >= startOfMonth && customerDate <= endOfMonth;
      }).length || 0;

      return {
        totalRevenue,
        monthlyRevenue,
        activeRentals,
        totalVehicles,
        availableVehicles,
        totalCustomers,
        newCustomersThisMonth,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission for action
   */
  static async checkPermission(userId: string, action: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!user) return false;

      const permissions = {
        owner: ['all'],
        admin: ['manage_users', 'manage_settings', 'manage_integrations', 'view_reports', 'manage_cars', 'manage_contracts'],
        manager: ['view_reports', 'manage_cars', 'manage_contracts'],
        agent: ['manage_contracts'],
        viewer: ['view_only'],
      };

      const userPermissions = permissions[user.role as keyof typeof permissions] || [];
      return userPermissions.includes('all') || userPermissions.includes(action);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Generate organization slug
   */
  static generateSlug(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Validate VAT number (Greek format)
   */
  static validateVATNumber(vatNumber: string): boolean {
    // Greek VAT number validation (9 digits)
    const greekVATRegex = /^\d{9}$/;
    return greekVATRegex.test(vatNumber);
  }

  /**
   * Get organization by slug
   */
  static async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting organization by slug:', error);
      throw error;
    }
  }
}


