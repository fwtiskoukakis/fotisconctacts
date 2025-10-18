import { supabase } from '../utils/supabase';
import { Contract } from '../models/contract.interface';

export interface SupabaseContract {
  id: string;
  user_id: string;
  renter_name: string;
  renter_email?: string;
  renter_phone?: string;
  renter_address?: string;
  renter_id_number?: string;
  renter_driving_license?: string;
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_date: string;
  dropoff_time: string;
  dropoff_location?: string;
  total_cost: number;
  car_make?: string;
  car_model?: string;
  car_license_plate?: string;
  car_color?: string;
  fuel_level: number;
  mileage_start: number;
  mileage_end?: number;
  condition_notes?: string;
  aade_dcl_id?: number;
  aade_submitted_at?: string;
  aade_updated_at?: string;
  aade_invoice_mark?: string;
  aade_status: 'pending' | 'submitted' | 'completed' | 'cancelled' | 'error';
  aade_error_message?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseDamagePoint {
  id: string;
  contract_id: string;
  location: string;
  description?: string;
  severity: 'minor' | 'major' | 'critical';
  estimated_cost: number;
  photo_url?: string;
  created_at: string;
}

export interface SupabaseContractPhoto {
  id: string;
  contract_id: string;
  photo_url: string;
  photo_type: 'pickup' | 'dropoff' | 'damage' | 'general';
  description?: string;
  created_at: string;
}

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
          damage_points:damage_points(*),
          contract_photos:contract_photos(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
      }

      return contracts?.map(this.mapSupabaseToContract) || [];
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
          damage_points:damage_points(*),
          contract_photos:contract_photos(*)
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
   * Create a new contract
   */
  static async createContract(contract: Omit<Contract, 'id'>): Promise<Contract> {
    try {
      const supabaseContract = this.mapContractToSupabase(contract);
      
      const { data, error } = await supabase
        .from('contracts')
        .insert(supabaseContract)
        .select()
        .single();

      if (error) {
        console.error('Error creating contract:', error);
        throw error;
      }

      // Create damage points if any
      if (contract.damagePoints.length > 0) {
        const damagePoints = contract.damagePoints.map(dp => ({
          contract_id: data.id,
          location: dp.location,
          description: dp.description,
          severity: dp.severity,
          estimated_cost: dp.estimatedCost || 0,
          photo_url: dp.photoUrl,
        }));

        await supabase
          .from('damage_points')
          .insert(damagePoints);
      }

      // Create photos if any
      if (contract.photos && contract.photos.length > 0) {
        const photos = contract.photos.map(photo => ({
          contract_id: data.id,
          photo_url: photo.url,
          photo_type: photo.type || 'general',
          description: photo.description,
        }));

        await supabase
          .from('contract_photos')
          .insert(photos);
      }

      return this.mapSupabaseToContract(data);
    } catch (error) {
      console.error('Error in createContract:', error);
      throw error;
    }
  }

  /**
   * Update an existing contract
   */
  static async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    try {
      const supabaseUpdates = this.mapContractToSupabase(updates as Contract);
      
      const { data, error } = await supabase
        .from('contracts')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating contract:', error);
        throw error;
      }

      return this.mapSupabaseToContract(data);
    } catch (error) {
      console.error('Error in updateContract:', error);
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
   * Search contracts
   */
  static async searchContracts(query: string): Promise<Contract[]> {
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points:damage_points(*),
          contract_photos:contract_photos(*)
        `)
        .or(`renter_name.ilike.%${query}%,car_license_plate.ilike.%${query}%,car_make.ilike.%${query}%,car_model.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching contracts:', error);
        throw error;
      }

      return contracts?.map(this.mapSupabaseToContract) || [];
    } catch (error) {
      console.error('Error in searchContracts:', error);
      throw error;
    }
  }

  /**
   * Get contracts by status
   */
  static async getContractsByStatus(status: 'active' | 'completed' | 'cancelled'): Promise<Contract[]> {
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points:damage_points(*),
          contract_photos:contract_photos(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts by status:', error);
        throw error;
      }

      return contracts?.map(this.mapSupabaseToContract) || [];
    } catch (error) {
      console.error('Error in getContractsByStatus:', error);
      throw error;
    }
  }

  /**
   * Map Supabase contract to our Contract interface
   */
  private static mapSupabaseToContract(data: any): Contract {
    return {
      id: data.id,
      renterInfo: {
        fullName: data.renter_name,
        email: data.renter_email || '',
        phone: data.renter_phone || '',
        address: data.renter_address || '',
        idNumber: data.renter_id_number || '',
        drivingLicense: data.renter_driving_license || '',
      },
      rentalPeriod: {
        pickupDate: new Date(data.pickup_date),
        pickupTime: data.pickup_time,
        pickupLocation: data.pickup_location,
        dropoffDate: new Date(data.dropoff_date),
        dropoffTime: data.dropoff_time,
        dropoffLocation: data.dropoff_location || '',
        totalCost: data.total_cost || 0,
      },
      carInfo: {
        make: data.car_make || '',
        model: data.car_model || '',
        makeModel: data.car_make && data.car_model ? `${data.car_make} ${data.car_model}` : '',
        licensePlate: data.car_license_plate || '',
        color: data.car_color || '',
      },
      carCondition: {
        fuelLevel: data.fuel_level || 8,
        mileageStart: data.mileage_start || 0,
        mileageEnd: data.mileage_end,
        conditionNotes: data.condition_notes || '',
      },
      damagePoints: data.damage_points?.map((dp: any) => ({
        id: dp.id,
        location: dp.location,
        description: dp.description || '',
        severity: dp.severity,
        estimatedCost: dp.estimated_cost || 0,
        photoUrl: dp.photo_url || '',
      })) || [],
      photos: data.contract_photos?.map((photo: any) => ({
        id: photo.id,
        url: photo.photo_url,
        type: photo.photo_type,
        description: photo.description || '',
      })) || [],
      aade: {
        dclId: data.aade_dcl_id,
        submittedAt: data.aade_submitted_at ? new Date(data.aade_submitted_at) : undefined,
        updatedAt: data.aade_updated_at ? new Date(data.aade_updated_at) : undefined,
        invoiceMark: data.aade_invoice_mark,
        status: data.aade_status,
        errorMessage: data.aade_error_message,
      },
      status: data.status,
      notes: data.notes || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Map our Contract interface to Supabase format
   */
  private static mapContractToSupabase(contract: Contract): Partial<SupabaseContract> {
    return {
      renter_name: contract.renterInfo.fullName,
      renter_email: contract.renterInfo.email,
      renter_phone: contract.renterInfo.phone,
      renter_address: contract.renterInfo.address,
      renter_id_number: contract.renterInfo.idNumber,
      renter_driving_license: contract.renterInfo.drivingLicense,
      pickup_date: contract.rentalPeriod.pickupDate.toISOString().split('T')[0],
      pickup_time: contract.rentalPeriod.pickupTime,
      pickup_location: contract.rentalPeriod.pickupLocation,
      dropoff_date: contract.rentalPeriod.dropoffDate.toISOString().split('T')[0],
      dropoff_time: contract.rentalPeriod.dropoffTime,
      dropoff_location: contract.rentalPeriod.dropoffLocation,
      total_cost: contract.rentalPeriod.totalCost || 0,
      car_make: contract.carInfo.make,
      car_model: contract.carInfo.model,
      car_license_plate: contract.carInfo.licensePlate,
      car_color: contract.carInfo.color,
      fuel_level: contract.carCondition?.fuelLevel || 8,
      mileage_start: contract.carCondition?.mileageStart || 0,
      mileage_end: contract.carCondition?.mileageEnd,
      condition_notes: contract.carCondition?.conditionNotes,
      aade_dcl_id: contract.aade?.dclId,
      aade_submitted_at: contract.aade?.submittedAt?.toISOString(),
      aade_updated_at: contract.aade?.updatedAt?.toISOString(),
      aade_invoice_mark: contract.aade?.invoiceMark,
      aade_status: contract.aade?.status || 'pending',
      aade_error_message: contract.aade?.errorMessage,
      status: contract.status || 'active',
      notes: contract.notes,
    };
  }

  /**
   * Update contract status
   */
  static async updateContractStatus(id: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating contract status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateContractStatus:', error);
      throw error;
    }
  }
}