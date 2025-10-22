/**
 * Vehicle Service
 * Handles all vehicle-related database operations with Supabase
 */

import { supabase } from '../utils/supabase';
import {  Vehicle, VehicleDamageHistoryItem, VehicleSummary } from '../models/vehicle.interface';
import { SupabaseContractService } from './supabase-contract.service';

/**
 * Converts a database row to a Vehicle object
 */
function convertRowToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    licensePlate: row.license_plate,
    make: row.make,
    model: row.model,
    year: row.year,
    color: row.color,
    category: row.category,
    currentMileage: row.current_mileage,
    status: row.status,
    kteoLastDate: row.kteo_last_date ? new Date(row.kteo_last_date) : null,
    kteoExpiryDate: row.kteo_expiry_date ? new Date(row.kteo_expiry_date) : null,
    insuranceType: row.insurance_type,
    insuranceExpiryDate: row.insurance_expiry_date ? new Date(row.insurance_expiry_date) : null,
    insuranceCompany: row.insurance_company,
    insurancePolicyNumber: row.insurance_policy_number,
    tiresFrontDate: row.tires_front_date ? new Date(row.tires_front_date) : null,
    tiresFrontBrand: row.tires_front_brand,
    tiresRearDate: row.tires_rear_date ? new Date(row.tires_rear_date) : null,
    tiresRearBrand: row.tires_rear_brand,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Converts a Vehicle object to database insert format
 */
function convertVehicleToInsert(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): any {
  return {
    user_id: vehicle.userId,
    license_plate: vehicle.licensePlate,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    category: vehicle.category,
    current_mileage: vehicle.currentMileage,
    status: vehicle.status,
    kteo_last_date: vehicle.kteoLastDate ? vehicle.kteoLastDate.toISOString().split('T')[0] : null,
    kteo_expiry_date: vehicle.kteoExpiryDate ? vehicle.kteoExpiryDate.toISOString().split('T')[0] : null,
    insurance_type: vehicle.insuranceType,
    insurance_expiry_date: vehicle.insuranceExpiryDate ? vehicle.insuranceExpiryDate.toISOString().split('T')[0] : null,
    insurance_company: vehicle.insuranceCompany,
    insurance_policy_number: vehicle.insurancePolicyNumber,
    tires_front_date: vehicle.tiresFrontDate ? vehicle.tiresFrontDate.toISOString().split('T')[0] : null,
    tires_front_brand: vehicle.tiresFrontBrand,
    tires_rear_date: vehicle.tiresRearDate ? vehicle.tiresRearDate.toISOString().split('T')[0] : null,
    tires_rear_brand: vehicle.tiresRearBrand,
    notes: vehicle.notes,
  };
}

export class VehicleService {
  /**
   * Get all vehicles for the current user
   */
  static async getAllVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('license_plate', { ascending: true });

    if (error) {
      console.error('Error fetching vehicles:', error);
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }

    return data ? data.map(convertRowToVehicle) : [];
  }

  /**
   * Get a vehicle by ID
   */
  static async getVehicleById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching vehicle:', error);
      throw new Error(`Failed to fetch vehicle: ${error.message}`);
    }

    return data ? convertRowToVehicle(data) : null;
  }

  /**
   * Get a vehicle by license plate
   */
  static async getVehicleByPlate(licensePlate: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('license_plate', licensePlate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching vehicle:', error);
      throw new Error(`Failed to fetch vehicle: ${error.message}`);
    }

    return data ? convertRowToVehicle(data) : null;
  }

  /**
   * Create a new vehicle
   */
  static async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const insertData = convertVehicleToInsert(vehicle);

    const { data, error } = await supabase
      .from('cars')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      throw new Error(`Failed to create vehicle: ${error.message}`);
    }

    return convertRowToVehicle(data);
  }

  /**
   * Update a vehicle
   */
  static async updateVehicle(id: string, updates: Partial<Omit<Vehicle, 'id' | 'userId' | 'createdAt'>>): Promise<Vehicle> {
    const updateData: any = {
      ...(updates.licensePlate && { license_plate: updates.licensePlate }),
      ...(updates.make && { make: updates.make }),
      ...(updates.model && { model: updates.model }),
      ...(updates.year && { year: updates.year }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.currentMileage !== undefined && { current_mileage: updates.currentMileage }),
      ...(updates.status && { status: updates.status }),
      ...(updates.kteoLastDate !== undefined && { kteo_last_date: updates.kteoLastDate ? updates.kteoLastDate.toISOString().split('T')[0] : null }),
      ...(updates.kteoExpiryDate !== undefined && { kteo_expiry_date: updates.kteoExpiryDate ? updates.kteoExpiryDate.toISOString().split('T')[0] : null }),
      ...(updates.insuranceType !== undefined && { insurance_type: updates.insuranceType }),
      ...(updates.insuranceExpiryDate !== undefined && { insurance_expiry_date: updates.insuranceExpiryDate ? updates.insuranceExpiryDate.toISOString().split('T')[0] : null }),
      ...(updates.insuranceCompany !== undefined && { insurance_company: updates.insuranceCompany }),
      ...(updates.insurancePolicyNumber !== undefined && { insurance_policy_number: updates.insurancePolicyNumber }),
      ...(updates.tiresFrontDate !== undefined && { tires_front_date: updates.tiresFrontDate ? updates.tiresFrontDate.toISOString().split('T')[0] : null }),
      ...(updates.tiresFrontBrand !== undefined && { tires_front_brand: updates.tiresFrontBrand }),
      ...(updates.tiresRearDate !== undefined && { tires_rear_date: updates.tiresRearDate ? updates.tiresRearDate.toISOString().split('T')[0] : null }),
      ...(updates.tiresRearBrand !== undefined && { tires_rear_brand: updates.tiresRearBrand }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
    };

    const { data, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      throw new Error(`Failed to update vehicle: ${error.message}`);
    }

    return convertRowToVehicle(data);
  }

  /**
   * Delete a vehicle
   */
  static async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error(`Failed to delete vehicle: ${error.message}`);
    }
  }

  /**
   * Get vehicle damage history
   */
  static async getVehicleDamageHistory(licensePlate: string, limit: number = 10): Promise<VehicleDamageHistoryItem[]> {
    const { data, error } = await supabase
      .rpc('get_vehicle_last_damages', {
        p_license_plate: licensePlate,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching vehicle damage history:', error);
      throw new Error(`Failed to fetch damage history: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((item: any) => ({
      damageId: item.damage_id,
      contractId: item.contract_id,
      contractDate: new Date(item.contract_date),
      renterName: item.renter_name,
      xPosition: item.x_position,
      yPosition: item.y_position,
      viewSide: item.view_side,
      description: item.description,
      severity: item.severity,
      damageReportedAt: new Date(item.damage_reported_at),
    }));
  }

  /**
   * Get vehicle summary (includes vehicle info, contracts, and damages)
   */
  static async getVehicleSummary(licensePlate: string): Promise<VehicleSummary> {
    const { data, error } = await supabase
      .rpc('get_vehicle_summary', {
        p_license_plate: licensePlate
      });

    if (error) {
      console.error('Error fetching vehicle summary:', error);
      throw new Error(`Failed to fetch vehicle summary: ${error.message}`);
    }

    if (!data) {
      return {
        vehicle: null,
        lastContract: null,
        totalContracts: 0,
        totalDamages: 0,
        recentDamages: [],
      };
    }

    const summary = data as any;
    
    return {
      vehicle: summary.vehicle ? convertRowToVehicle(summary.vehicle) : null,
      lastContract: summary.last_contract,
      totalContracts: summary.total_contracts || 0,
      totalDamages: summary.total_damages || 0,
      recentDamages: summary.recent_damages || [],
    };
  }

  /**
   * Get vehicles with expiring documents
   */
  static async getVehiclesWithExpiringDocuments(daysAhead: number = 30): Promise<Vehicle[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .or(`kteo_expiry_date.lte.${futureDateStr},insurance_expiry_date.lte.${futureDateStr}`)
      .order('kteo_expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching vehicles with expiring documents:', error);
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }

    return data ? data.map(convertRowToVehicle) : [];
  }

  /**
   * Search vehicles by text
   */
  static async searchVehicles(query: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .or(`license_plate.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`)
      .order('license_plate', { ascending: true });

    if (error) {
      console.error('Error searching vehicles:', error);
      throw new Error(`Failed to search vehicles: ${error.message}`);
    }

    return data ? data.map(convertRowToVehicle) : [];
  }

  /**
   * Update vehicle availability based on active contracts
   * Cars with active contracts are marked as 'rented', others as 'available'
   */
  static async updateVehicleAvailability(): Promise<void> {
    try {
      console.log('🔄 Updating vehicle availability based on active contracts...');
      
      // Get all active contracts
      const activeContracts = await SupabaseContractService.getActiveContracts();
      const rentedPlateNumbers = activeContracts.map(contract => contract.carInfo.licensePlate);
      
      console.log(`📋 Found ${activeContracts.length} active contracts`);
      console.log(`🚗 Rented plate numbers:`, rentedPlateNumbers);
      
      // Get all vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('cars')
        .select('id, license_plate, status');
      
      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`);
      }
      
      if (!vehicles) {
        console.log('No vehicles found');
        return;
      }
      
      // Update vehicle statuses
      const updates = vehicles.map(vehicle => {
        const isRented = rentedPlateNumbers.includes(vehicle.license_plate);
        const newStatus = isRented ? 'rented' : 'available';
        
        // Only update if status actually changed
        if (vehicle.status !== newStatus) {
          console.log(`🔄 Updating ${vehicle.license_plate}: ${vehicle.status} → ${newStatus}`);
          return supabase
            .from('cars')
            .update({ status: newStatus })
            .eq('id', vehicle.id);
        }
        return null;
      }).filter(Boolean);
      
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`✅ Updated ${updates.length} vehicle statuses`);
      } else {
        console.log('✅ All vehicle statuses are already up to date');
      }
      
    } catch (error) {
      console.error('Error updating vehicle availability:', error);
      throw error;
    }
  }

  /**
   * Get vehicles with updated availability status
   * This method automatically updates availability before returning vehicles
   */
  static async getAllVehiclesWithUpdatedAvailability(): Promise<Vehicle[]> {
    try {
      // First update availability based on active contracts
      await this.updateVehicleAvailability();
      
      // Then return all vehicles with updated status
      return await this.getAllVehicles();
    } catch (error) {
      console.error('Error getting vehicles with updated availability:', error);
      throw error;
    }
  }
}

