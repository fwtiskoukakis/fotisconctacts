/**
 * Vehicle Availability Utility
 * Handles updating vehicle availability based on active contracts
 * Separated to avoid circular dependencies
 */

import { supabase } from './supabase';
import { SupabaseContractService } from '../services/supabase-contract.service';

/**
 * Update vehicle availability based on active contracts
 * Cars with active contracts are marked as 'rented', others as 'available'
 */
export async function updateVehicleAvailability(): Promise<void> {
  try {
    console.log('🔄 Updating vehicle availability based on active contracts...');
    
    // Get all active contracts
    const activeContracts = await SupabaseContractService.getActiveContracts();
    const rentedPlateNumbers = activeContracts.map(contract => 
      contract.carInfo.licensePlate?.toUpperCase().trim()
    ).filter(Boolean);
    
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
    
    console.log(`🚗 Vehicle plate numbers in DB:`, vehicles.map(v => v.license_plate));
    
    // Update vehicle statuses
    const updates = vehicles.map(vehicle => {
      const normalizedVehiclePlate = vehicle.license_plate?.toUpperCase().trim();
      const isRented = rentedPlateNumbers.includes(normalizedVehiclePlate);
      const newStatus = isRented ? 'rented' : 'available';
      
      // Debug logging for BMZ1133
      if (normalizedVehiclePlate === 'BMZ1133') {
        console.log(`🔍 BMZ1133 DEBUG: normalizedPlate=${normalizedVehiclePlate}, isRented=${isRented}, currentStatus=${vehicle.status}, newStatus=${newStatus}`);
        console.log(`🔍 BMZ1133 DEBUG: rentedPlateNumbers includes BMZ1133? ${rentedPlateNumbers.includes('BMZ1133')}`);
      }
      
      // Only update if status actually changed
      if (vehicle.status !== newStatus) {
        console.log(`🔄 Updating ${vehicle.license_plate}: ${vehicle.status} → ${newStatus} (plate: ${normalizedVehiclePlate})`);
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
