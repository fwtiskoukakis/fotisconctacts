import { Contract } from '../models/contract.interface';
import { SupabaseContractService } from './supabase-contract.service';

export interface ContractDuplicateOptions {
  includePhotos: boolean;
  includeSignatures: boolean;
  resetDates: boolean;
  resetStatus: boolean;
  newRenterName?: string;
  newCarInfo?: {
    make?: string;
    model?: string;
    licensePlate?: string;
  };
}

export class ContractDuplicationService {
  static async duplicateContract(
    originalContract: Contract,
    options: ContractDuplicateOptions = {
      includePhotos: true,
      includeSignatures: true,
      resetDates: true,
      resetStatus: true,
    }
  ): Promise<Contract> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      const dayAfterTomorrow = new Date(tomorrow.getTime() + (24 * 60 * 60 * 1000));

      // Create duplicate contract
      const duplicateContract: Contract = {
        ...originalContract,
        id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now.toISOString(),
        status: options.resetStatus ? 'upcoming' : originalContract.status,
        
        // Update renter info if provided
        renterInfo: {
          ...originalContract.renterInfo,
          fullName: options.newRenterName || originalContract.renterInfo.fullName,
        },

        // Update car info if provided
        carInfo: {
          ...originalContract.carInfo,
          make: options.newCarInfo?.make || originalContract.carInfo.make,
          model: options.newCarInfo?.model || originalContract.carInfo.model,
          licensePlate: options.newCarInfo?.licensePlate || originalContract.carInfo.licensePlate,
          makeModel: options.newCarInfo?.make && options.newCarInfo?.model 
            ? `${options.newCarInfo.make} ${options.newCarInfo.model}`
            : originalContract.carInfo.makeModel,
        },

        // Reset dates if requested
        rentalPeriod: {
          ...originalContract.rentalPeriod,
          pickupDate: options.resetDates ? tomorrow.toISOString() : originalContract.rentalPeriod.pickupDate,
          dropoffDate: options.resetDates ? dayAfterTomorrow.toISOString() : originalContract.rentalPeriod.dropoffDate,
        },

        // Reset car condition if dates are reset
        carCondition: options.resetDates ? {
          ...originalContract.carCondition,
          fuelLevel: 6, // Default fuel level
          mileage: 0, // Reset mileage
          exteriorCondition: 'excellent',
          interiorCondition: 'excellent',
          mechanicalCondition: 'excellent',
          notes: '',
        } : originalContract.carCondition,

        // Reset damage points if dates are reset
        damagePoints: options.resetDates ? [] : originalContract.damagePoints,

        // Handle photos and signatures based on options
        photos: options.includePhotos ? originalContract.photos : [],
        clientSignature: options.includeSignatures ? originalContract.clientSignature : undefined,
        clientSignaturePaths: options.includeSignatures ? originalContract.clientSignaturePaths : [],
      };

      // Save the duplicate contract
      const savedContract = await SupabaseContractService.saveContract(duplicateContract);
      
      return savedContract;
    } catch (error) {
      console.error('Error duplicating contract:', error);
      throw error;
    }
  }

  static async duplicateMultipleContracts(
    contracts: Contract[],
    options: ContractDuplicateOptions
  ): Promise<Contract[]> {
    try {
      const duplicates: Contract[] = [];
      
      for (const contract of contracts) {
        try {
          const duplicate = await this.duplicateContract(contract, options);
          duplicates.push(duplicate);
        } catch (error) {
          console.error(`Error duplicating contract ${contract.id}:`, error);
          // Continue with other contracts even if one fails
        }
      }

      return duplicates;
    } catch (error) {
      console.error('Error duplicating multiple contracts:', error);
      throw error;
    }
  }

  static async archiveContract(contractId: string): Promise<void> {
    try {
      // Update contract status to archived
      await SupabaseContractService.updateContractStatus(contractId, 'archived');
    } catch (error) {
      console.error('Error archiving contract:', error);
      throw error;
    }
  }

  static async archiveMultipleContracts(contractIds: string[]): Promise<void> {
    try {
      for (const contractId of contractIds) {
        await this.archiveContract(contractId);
      }
    } catch (error) {
      console.error('Error archiving multiple contracts:', error);
      throw error;
    }
  }

  static async restoreContract(contractId: string): Promise<void> {
    try {
      // Update contract status back to completed
      await SupabaseContractService.updateContractStatus(contractId, 'completed');
    } catch (error) {
      console.error('Error restoring contract:', error);
      throw error;
    }
  }

  static async restoreMultipleContracts(contractIds: string[]): Promise<void> {
    try {
      for (const contractId of contractIds) {
        await this.restoreContract(contractId);
      }
    } catch (error) {
      console.error('Error restoring multiple contracts:', error);
      throw error;
    }
  }

  static generateDuplicateName(originalName: string, existingNames: string[]): string {
    const baseName = originalName.replace(/\s*\(.*?\)\s*$/, ''); // Remove existing (copy) suffix
    let counter = 1;
    let newName = `${baseName} (Αντίγραφο)`;
    
    while (existingNames.includes(newName)) {
      counter++;
      newName = `${baseName} (Αντίγραφο ${counter})`;
    }
    
    return newName;
  }

  static validateDuplicateOptions(options: ContractDuplicateOptions): string[] {
    const errors: string[] = [];
    
    if (options.newRenterName && options.newRenterName.trim().length === 0) {
      errors.push('Το όνομα ενοικιαστή δεν μπορεί να είναι κενό');
    }
    
    if (options.newCarInfo?.licensePlate && options.newCarInfo.licensePlate.trim().length === 0) {
      errors.push('Η πινακίδα αυτοκινήτου δεν μπορεί να είναι κενή');
    }
    
    return errors;
  }
}
