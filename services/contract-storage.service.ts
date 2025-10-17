import * as FileSystem from 'expo-file-system/legacy';
import { Contract } from '../models/contract.interface';
import { formatContractFileName, formatFolderName } from '../utils/file-naming.util';
import { convertContractDates, convertContractsDates } from '../utils/date-conversion.util';

/**
 * Service for managing contract storage in the file system
 */
export class ContractStorageService {
  private static readonly BASE_DIR = `${FileSystem.documentDirectory}contracts/`;

  /**
   * Initializes the storage directory if it doesn't exist
   */
  static async initializeStorage(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.BASE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.BASE_DIR, { intermediates: true });
    }
  }

  /**
   * Saves a contract and its associated photos to the file system
   * Returns the path to the contract directory
   */
  static async saveContract(contract: Contract): Promise<string> {
    await this.initializeStorage();
    
    const folderName = formatFolderName(
      contract.renterInfo.fullName,
      contract.rentalPeriod.pickupDate,
      contract.rentalPeriod.dropoffDate
    );
    
    const contractDir = `${this.BASE_DIR}${folderName}/`;
    await FileSystem.makeDirectoryAsync(contractDir, { intermediates: true });
    
    // Save contract JSON
    const contractFileName = formatContractFileName(
      contract.renterInfo.fullName,
      contract.rentalPeriod.pickupDate
    );
    const contractPath = `${contractDir}${contractFileName}.json`;
    await FileSystem.writeAsStringAsync(contractPath, JSON.stringify(contract, null, 2));
    
    // Copy photos to contract folder
    const photosDir = `${contractDir}photos/`;
    await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    
    for (let i = 0; i < contract.photoUris.length; i++) {
      const photoUri = contract.photoUris[i];
      const photoFileName = `photo_${i + 1}_${Date.now()}.jpg`;
      const photoPath = `${photosDir}${photoFileName}`;
      await FileSystem.copyAsync({ from: photoUri, to: photoPath });
    }
    
    return contractDir;
  }

  /**
   * Retrieves all contracts for a specific renter
   */
  static async getContractsByRenter(renterName: string): Promise<Contract[]> {
    await this.initializeStorage();
    
    const contracts: Contract[] = [];
    const dirs = await FileSystem.readDirectoryAsync(this.BASE_DIR);
    
    for (const dir of dirs) {
      if (dir.toLowerCase().includes(renterName.toLowerCase())) {
        const contractPath = `${this.BASE_DIR}${dir}/`;
        const files = await FileSystem.readDirectoryAsync(contractPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = await FileSystem.readAsStringAsync(`${contractPath}${file}`);
            contracts.push(JSON.parse(content));
          }
        }
      }
    }
    
    return contracts;
  }

  /**
   * Retrieves a specific contract by ID
   */
  static async getContractById(contractId: string): Promise<Contract | null> {
    const allContracts = await this.getAllContracts();
    return allContracts.find(contract => contract.id === contractId) || null;
  }

  /**
   * Retrieves all contracts from storage
   */
  static async getAllContracts(): Promise<Contract[]> {
    await this.initializeStorage();
    
    const contracts: Contract[] = [];
    
    try {
      const dirs = await FileSystem.readDirectoryAsync(this.BASE_DIR);
      
      for (const dir of dirs) {
        try {
          const contractPath = `${this.BASE_DIR}${dir}/`;
          const files = await FileSystem.readDirectoryAsync(contractPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const content = await FileSystem.readAsStringAsync(`${contractPath}${file}`);
              const contract = JSON.parse(content);
              contracts.push(convertContractDates(contract));
            }
          }
        } catch (dirError) {
          // Skip directories that can't be read (like .DS_Store on Mac or other files)
          console.log(`Skipping ${dir}:`, dirError);
        }
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
    
    return contracts;
  }

  /**
   * Deletes all contracts and clears the storage directory
   */
  static async clearAllContracts(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.BASE_DIR, { idempotent: true });
      console.log('All contracts cleared successfully');
    } catch (error) {
      console.error('Error clearing all contracts:', error);
      throw error;
    }
  }
}

