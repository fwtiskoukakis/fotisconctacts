import { supabase } from '../utils/supabase';
import { Contract, DamagePoint } from '../models/contract.interface';
import { Database } from '../models/database.types';

type ContractRow = Database['public']['Tables']['contracts']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
type DamagePointRow = Database['public']['Tables']['damage_points']['Row'];
type PhotoRow = Database['public']['Tables']['photos']['Row'];

/**
 * Service for managing contracts in Supabase
 */
export class SupabaseContractService {
  /**
   * Save a new contract to Supabase
   */
  static async saveContract(params: {
    contract: Contract;
    photoFiles?: Array<{ uri: string; fileName: string }>;
  }): Promise<{ id: string | null; error: Error | null }> {
    try {
      const { contract, photoFiles = [] } = params;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { id: null, error: new Error('User not authenticated') };
      }

      // Upload client signature if exists
      let clientSignatureUrl: string | null = null;
      if (contract.clientSignature) {
        const signatureResult = await this.uploadSignature(
          contract.clientSignature,
          `clients/${contract.id}_client_signature.png`
        );
        if (signatureResult.error) {
          console.error('Error uploading client signature:', signatureResult.error);
        } else {
          clientSignatureUrl = signatureResult.url;
        }
      }

      // Insert contract
      const contractData: ContractInsert = {
        id: contract.id,
        user_id: user.id,
        renter_full_name: contract.renterInfo.fullName,
        renter_id_number: contract.renterInfo.idNumber,
        renter_tax_id: contract.renterInfo.taxId,
        renter_driver_license_number: contract.renterInfo.driverLicenseNumber,
        renter_phone_number: contract.renterInfo.phoneNumber,
        renter_email: contract.renterInfo.email,
        renter_address: contract.renterInfo.address,
        pickup_date: contract.rentalPeriod.pickupDate.toISOString(),
        pickup_time: contract.rentalPeriod.pickupTime,
        pickup_location: contract.rentalPeriod.pickupLocation,
        dropoff_date: contract.rentalPeriod.dropoffDate.toISOString(),
        dropoff_time: contract.rentalPeriod.dropoffTime,
        dropoff_location: contract.rentalPeriod.dropoffLocation,
        is_different_dropoff_location: contract.rentalPeriod.isDifferentDropoffLocation,
        total_cost: contract.rentalPeriod.totalCost,
        car_make_model: contract.carInfo.makeModel,
        car_year: contract.carInfo.year,
        car_license_plate: contract.carInfo.licensePlate,
        car_mileage: contract.carInfo.mileage,
        fuel_level: contract.carCondition.fuelLevel,
        insurance_type: contract.carCondition.insuranceType,
        client_signature_url: clientSignatureUrl,
      };

      const { data: contractResult, error: contractError } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (contractError) {
        return { id: null, error: contractError };
      }

      // Insert damage points
      if (contract.damagePoints.length > 0) {
        const damagePointsData = contract.damagePoints.map((dp) => ({
          contract_id: contract.id,
          x_position: dp.x,
          y_position: dp.y,
          view_side: dp.view,
          description: dp.description,
          severity: dp.severity,
        }));

        const { error: damageError } = await supabase
          .from('damage_points')
          .insert(damagePointsData);

        if (damageError) {
          console.error('Error inserting damage points:', damageError);
        }
      }

      // Upload and save photos
      if (photoFiles.length > 0) {
        await this.uploadContractPhotos(contract.id, photoFiles);
      }

      return { id: contractResult.id, error: null };
    } catch (error) {
      console.error('Error saving contract:', error);
      return { id: null, error: error as Error };
    }
  }

  /**
   * Upload a signature to Supabase Storage
   */
  static async uploadSignature(
    base64Data: string,
    path: string
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('signatures')
        .upload(path, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        return { url: null, error };
      }

      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(data.path);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error as Error };
    }
  }

  /**
   * Upload contract photos to Supabase Storage
   */
  static async uploadContractPhotos(
    contractId: string,
    photoFiles: Array<{ uri: string; fileName: string }>
  ): Promise<void> {
    for (let i = 0; i < photoFiles.length; i++) {
      const { uri, fileName } = photoFiles[i];
      
      try {
        // Read file from URI
        const response = await fetch(uri);
        const blob = await response.blob();

        const storagePath = `contracts/${contractId}/${fileName}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contract-photos')
          .upload(storagePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Error uploading photo ${i}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('contract-photos')
          .getPublicUrl(uploadData.path);

        // Save photo record to database
        await supabase.from('photos').insert({
          contract_id: contractId,
          photo_url: urlData.publicUrl,
          storage_path: storagePath,
          order_index: i,
          mime_type: 'image/jpeg',
        });
      } catch (error) {
        console.error(`Error processing photo ${i}:`, error);
      }
    }
  }

  /**
   * Get all contracts for the current user
   */
  static async getAllContracts(): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*),
          photos(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        return [];
      }

      return this.mapContractsFromDatabase(data);
    } catch (error) {
      console.error('Error getting contracts:', error);
      return [];
    }
  }

  /**
   * Get a specific contract by ID
   */
  static async getContractById(contractId: string): Promise<Contract | null> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*),
          photos(*)
        `)
        .eq('id', contractId)
        .single();

      if (error) {
        console.error('Error fetching contract:', error);
        return null;
      }

      const contracts = this.mapContractsFromDatabase([data]);
      return contracts[0] || null;
    } catch (error) {
      console.error('Error getting contract:', error);
      return null;
    }
  }

  /**
   * Search contracts by renter name or license plate
   */
  static async searchContracts(query: string): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          damage_points(*),
          photos(*)
        `)
        .or(
          `renter_full_name.ilike.%${query}%,car_license_plate.ilike.%${query}%`
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching contracts:', error);
        return [];
      }

      return this.mapContractsFromDatabase(data);
    } catch (error) {
      console.error('Error searching contracts:', error);
      return [];
    }
  }

  /**
   * Delete a contract
   */
  static async deleteContract(contractId: string): Promise<{ error: Error | null }> {
    try {
      // Delete photos from storage
      const { data: photos } = await supabase
        .from('photos')
        .select('storage_path')
        .eq('contract_id', contractId);

      if (photos && photos.length > 0) {
        const paths = photos.map((p) => p.storage_path);
        await supabase.storage.from('contract-photos').remove(paths);
      }

      // Delete contract (cascade will handle damage_points and photos table)
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Map database rows to Contract objects
   */
  private static mapContractsFromDatabase(data: any[]): Contract[] {
    return data.map((row) => ({
      id: row.id,
      renterInfo: {
        fullName: row.renter_full_name,
        idNumber: row.renter_id_number,
        taxId: row.renter_tax_id,
        driverLicenseNumber: row.renter_driver_license_number,
        phoneNumber: row.renter_phone_number,
        email: row.renter_email || '',
        address: row.renter_address,
      },
      rentalPeriod: {
        pickupDate: new Date(row.pickup_date),
        pickupTime: row.pickup_time,
        pickupLocation: row.pickup_location,
        dropoffDate: new Date(row.dropoff_date),
        dropoffTime: row.dropoff_time,
        dropoffLocation: row.dropoff_location,
        isDifferentDropoffLocation: row.is_different_dropoff_location,
        totalCost: parseFloat(row.total_cost),
      },
      carInfo: {
        makeModel: row.car_make_model,
        year: row.car_year,
        licensePlate: row.car_license_plate,
        mileage: row.car_mileage,
      },
      carCondition: {
        fuelLevel: row.fuel_level,
        mileage: row.car_mileage,
        insuranceType: row.insurance_type,
      },
      damagePoints: (row.damage_points || []).map((dp: any) => ({
        id: dp.id,
        x: parseFloat(dp.x_position),
        y: parseFloat(dp.y_position),
        view: dp.view_side,
        description: dp.description,
        severity: dp.severity,
        timestamp: new Date(dp.created_at),
      })),
      photoUris: (row.photos || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((p: any) => p.photo_url),
      clientSignature: row.client_signature_url || '',
      userId: row.user_id,
      createdAt: new Date(row.created_at),
    }));
  }
}

