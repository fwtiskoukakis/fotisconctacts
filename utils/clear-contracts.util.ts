import * as FileSystem from 'expo-file-system/legacy';

/**
 * Utility to clear all contracts from storage
 */
export async function clearAllContracts(): Promise<void> {
  try {
    const contractsDir = `${FileSystem.documentDirectory}contracts/`;
    const dirInfo = await FileSystem.getInfoAsync(contractsDir);
    
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(contractsDir, { idempotent: true });
      console.log('All contracts cleared successfully');
    }
  } catch (error) {
    console.error('Error clearing contracts:', error);
    throw error;
  }
}
