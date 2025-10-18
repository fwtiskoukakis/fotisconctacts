import { supabase } from '../utils/supabase';
import { Contract } from '../models/contract.interface';

/**
 * Supabase Contract Service
 * Handles all contract-related database operations with correct schema mappings
 */
export class SupabaseContractService {
  /**
   * Get all contracts for the current user
   */
  static async getAllContracts(): Promise<Contract[]> {
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
      }

      return contracts?.map((c) => this.mapSupabaseToContract(c)) || [];
    } catch (error) {
      console.error('Error in getAllContracts:', error);
      throw error;
    }
  }

  /**
   * Get a single contract by ID
   */
  static async getContractById(id: string): Promise<Contract | null> {
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching contract:', error);
        return null;
      }

      return this.mapSupabaseToContract(contract);
    } catch (error) {
      console.error('Error in getContractById:', error);
      return null;
    }
  }

  /**
   * Search contracts using full-text search
   */
  static async searchContracts(query: string): Promise<Contract[]> {
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'greek'
        })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching contracts:', error);
        throw error;
      }

      return contracts?.map((c) => this.mapSupabaseToContract(c)) || [];
    } catch (error) {
      console.error('Error in searchContracts:', error);
      throw error;
    }
  }

  /**
   * Get contracts by date range
   */
  static async getContractsByDateRange(startDate: Date, endDate: Date): Promise<Contract[]> {
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .gte('pickup_date', startDate.toISOString())
        .lte('dropoff_date', endDate.toISOString())
        .order('pickup_date', { ascending: false });

      if (error) {
        console.error('Error fetching contracts by date range:', error);
        throw error;
      }

      return contracts?.map((c) => this.mapSupabaseToContract(c)) || [];
    } catch (error) {
      console.error('Error in getContractsByDateRange:', error);
      throw error;
    }
  }

  /**
   * Calculate contract status based on dates
   */
  private static calculateStatus(pickupDate: string, dropoffDate: string): 'active' | 'completed' | 'upcoming' {
    const now = new Date();
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);

    if (now < pickup) {
      return 'upcoming';
    } else if (now >= pickup && now <= dropoff) {
      return 'active';
    } else {
      return 'completed';
    }
  }

  /**
   * Map Supabase contract to our Contract interface
   * Uses CORRECT schema field names
   */
  private static mapSupabaseToContract(data: any): Contract {
    // Calculate status from dates (no status field in database)
    const status = this.calculateStatus(data.pickup_date, data.dropoff_date);

    return {
      id: data.id,
      userId: data.user_id,
      
      renterInfo: {
        fullName: data.renter_full_name,
        idNumber: data.renter_id_number,
        taxId: data.renter_tax_id,
        driverLicenseNumber: data.renter_driver_license_number,
        phoneNumber: data.renter_phone_number,
        email: data.renter_email || '',
        address: data.renter_address,
      },
      
      rentalPeriod: {
        pickupDate: new Date(data.pickup_date),
        pickupTime: data.pickup_time,
        pickupLocation: data.pickup_location,
        dropoffDate: new Date(data.dropoff_date),
        dropoffTime: data.dropoff_time,
        dropoffLocation: data.dropoff_location,
        isDifferentDropoffLocation: data.is_different_dropoff_location || false,
        totalCost: parseFloat(data.total_cost) || 0,
      },
      
      carInfo: {
        makeModel: data.car_make_model,
        year: data.car_year,
        licensePlate: data.car_license_plate,
        mileage: data.car_mileage,
      },
      
      carCondition: {
        fuelLevel: data.fuel_level,
        mileage: data.car_mileage,
        insuranceType: data.insurance_type,
      },
      
      damagePoints: data.damage_points?.map((dp: any) => ({
        id: dp.id,
        x: dp.x_position,
        y: dp.y_position,
        view: dp.view_side,
        description: dp.description,
        severity: dp.severity,
        timestamp: new Date(dp.created_at),
      })) || [],
      
      photoUris: [], // Photos stored separately in storage
      clientSignature: data.client_signature_url || '',
      
      status,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get active contracts (currently ongoing)
   */
  static async getActiveContracts(): Promise<Contract[]> {
    try {
      const now = new Date().toISOString();
      
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .lte('pickup_date', now)
        .gte('dropoff_date', now)
        .order('pickup_date', { ascending: false });

      if (error) {
        console.error('Error fetching active contracts:', error);
        throw error;
      }

      return contracts?.map((c) => this.mapSupabaseToContract(c)) || [];
    } catch (error) {
      console.error('Error in getActiveContracts:', error);
      throw error;
    }
  }

  /**
   * Get completed contracts
   */
  static async getCompletedContracts(): Promise<Contract[]> {
    try {
      const now = new Date().toISOString();
      
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .lt('dropoff_date', now)
        .order('dropoff_date', { ascending: false });

      if (error) {
        console.error('Error fetching completed contracts:', error);
        throw error;
      }

      return contracts?.map((c) => this.mapSupabaseToContract(c)) || [];
    } catch (error) {
      console.error('Error in getCompletedContracts:', error);
      throw error;
    }
  }

  /**
   * Get upcoming contracts
   */
  static async getUpcomingContracts(): Promise<Contract[]> {
    try {
      const now = new Date().toISOString();
      
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .gt('pickup_date', now)
        .order('pickup_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming contracts:', error);
        throw error;
      }

      return contracts?.map((c) => this.mapSupabaseToContract(c)) || [];
    } catch (error) {
      console.error('Error in getUpcomingContracts:', error);
      throw error;
    }
  }

  /**
   * Get contracts by car license plate
   */
  static async getContractsByCarLicensePlate(licensePlate: string): Promise<Contract[]> {
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*)
        `)
        .eq('car_license_plate', licensePlate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts by car:', error);
        throw error;
      }

      return contracts?.map((c) => this.mapSupabaseToContract(c)) || [];
    } catch (error) {
      console.error('Error in getContractsByCarLicensePlate:', error);
      throw error;
    }
  }

  /**
   * Delete a contract
   */
  static async deleteContract(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting contract:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteContract:', error);
      throw error;
    }
  }

  /**
   * Bulk delete contracts
   */
  static async bulkDeleteContracts(ids: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error bulk deleting contracts:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in bulkDeleteContracts:', error);
      throw error;
    }
  }
}
