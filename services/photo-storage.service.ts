/**
 * Photo Storage Service
 * Handles storing photos as base64 strings in Supabase Database
 */

import { supabase } from '../utils/supabase';
import * as FileSystem from 'expo-file-system';

export interface PhotoResult {
  id: string;
  photoData: string;
  size: number;
  orderIndex: number;
}

export class PhotoStorageService {
  /**
   * Save a contract photo as base64
   * @param contractId Contract ID
   * @param photoUri Local URI of the photo
   * @param index Photo index/order
   * @returns Photo result with base64 data
   */
  static async saveContractPhoto(
    contractId: string,
    photoUri: string,
    index: number
  ): Promise<PhotoResult> {
    try {
      console.log(`📸 Saving contract photo ${index} for contract ${contractId}`);
      
      // Read photo as base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;
      
      // Store in database
      const { data, error } = await supabase
        .from('contract_photos')
        .insert({
          contract_id: contractId,
          photo_data: base64,
          order_index: index,
          file_size: size,
          mime_type: 'image/jpeg',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving contract photo:', error);
        throw new Error(`Save failed: ${error.message}`);
      }

      console.log(`✅ Contract photo ${index} saved successfully`);

      return {
        id: data.id,
        photoData: `data:image/jpeg;base64,${base64}`,
        size,
        orderIndex: index,
      };
    } catch (error) {
      console.error('Error in saveContractPhoto:', error);
      throw error;
    }
  }

  /**
   * Save a car/vehicle photo as base64
   * @param vehicleId Vehicle ID or license plate
   * @param photoUri Local URI of the photo
   * @param photoType Type of photo (exterior, interior, damage, etc)
   * @returns Photo result with base64 data
   */
  static async saveCarPhoto(
    vehicleId: string,
    photoUri: string,
    photoType: string = 'general'
  ): Promise<PhotoResult> {
    try {
      console.log(`🚗 Saving car photo (${photoType}) for vehicle ${vehicleId}`);
      
      // Read photo as base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;
      
      // Store in database
      const { data, error } = await supabase
        .from('car_photos')
        .insert({
          vehicle_id: vehicleId,
          photo_data: base64,
          photo_type: photoType,
          file_size: size,
          mime_type: 'image/jpeg',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving car photo:', error);
        throw new Error(`Save failed: ${error.message}`);
      }

      console.log(`✅ Car photo (${photoType}) saved successfully`);

      return {
        id: data.id,
        photoData: `data:image/jpeg;base64,${base64}`,
        size,
        orderIndex: 0,
      };
    } catch (error) {
      console.error('Error in saveCarPhoto:', error);
      throw error;
    }
  }

  /**
   * Save a damage photo as base64
   * @param vehicleId Vehicle ID or license plate
   * @param damageId Damage point ID
   * @param photoUri Local URI of the photo
   * @returns Photo result with base64 data
   */
  static async saveDamagePhoto(
    vehicleId: string,
    damageId: string,
    photoUri: string
  ): Promise<PhotoResult> {
    try {
      console.log(`🔧 Saving damage photo for vehicle ${vehicleId}, damage ${damageId}`);
      
      // Read photo as base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;
      
      // Store in database
      const { data, error } = await supabase
        .from('damage_photos')
        .insert({
          vehicle_id: vehicleId,
          damage_id: damageId,
          photo_data: base64,
          file_size: size,
          mime_type: 'image/jpeg',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving damage photo:', error);
        throw new Error(`Save failed: ${error.message}`);
      }

      console.log(`✅ Damage photo saved successfully`);

      return {
        id: data.id,
        photoData: `data:image/jpeg;base64,${base64}`,
        size,
        orderIndex: 0,
      };
    } catch (error) {
      console.error('Error in saveDamagePhoto:', error);
      throw error;
    }
  }

  /**
   * Save a signature as base64
   * @param userId User ID
   * @param signatureUri Local URI of the signature image
   * @param signatureType Type of signature (user, client, etc)
   * @returns Photo result with base64 data
   */
  static async saveSignature(
    userId: string,
    signatureUri: string,
    signatureType: 'user' | 'client' = 'client'
  ): Promise<PhotoResult> {
    try {
      console.log(`✍️ Saving ${signatureType} signature for user ${userId}`);
      
      // Read signature as base64
      const base64 = await FileSystem.readAsStringAsync(signatureUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(signatureUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;
      
      // Store in database
      const { data, error } = await supabase
        .from('signatures')
        .insert({
          user_id: userId,
          signature_data: base64,
          signature_type: signatureType,
          file_size: size,
          mime_type: 'image/png',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving signature:', error);
        throw new Error(`Save failed: ${error.message}`);
      }

      console.log(`✅ ${signatureType} signature saved successfully`);

      return {
        id: data.id,
        photoData: `data:image/png;base64,${base64}`,
        size,
        orderIndex: 0,
      };
    } catch (error) {
      console.error('Error in saveSignature:', error);
      throw error;
    }
  }

  /**
   * Delete a photo from database
   * @param photoId Photo ID
   */
  static async deletePhoto(photoId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contract_photos')
        .delete()
        .eq('id', photoId);

      if (error) {
        console.error('Error deleting photo:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deletePhoto:', error);
      throw error;
    }
  }

  /**
   * Delete multiple photos from database
   * @param photoIds Array of photo IDs
   */
  static async deletePhotos(photoIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('contract_photos')
        .delete()
        .in('id', photoIds);

      if (error) {
        console.error('Error deleting photos:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deletePhotos:', error);
      throw error;
    }
  }

  /**
   * Get all photos for a contract
   * @param contractId Contract ID
   * @returns Array of photo records
   */
  static async getContractPhotos(contractId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('contract_photos')
        .select('*')
        .eq('contract_id', contractId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching contract photos:', error);
        throw new Error(`Failed to fetch photos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getContractPhotos:', error);
      throw error;
    }
  }

  /**
   * Delete contract photos from database
   * @param contractId Contract ID
   */
  static async deleteContractPhotos(contractId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contract_photos')
        .delete()
        .eq('contract_id', contractId);

      if (error) {
        console.error('Error deleting contract photos:', error);
        throw new Error(`Failed to delete photos: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteContractPhotos:', error);
      throw error;
    }
  }

  /**
   * Save multiple photos for a contract
   * @param contractId Contract ID
   * @param photoUris Array of local photo URIs
   * @returns Array of save results
   */
  static async saveContractPhotos(
    contractId: string,
    photoUris: string[]
  ): Promise<PhotoResult[]> {
    const results: PhotoResult[] = [];
    
    for (let i = 0; i < photoUris.length; i++) {
      try {
        const result = await this.saveContractPhoto(contractId, photoUris[i], i);
        results.push(result);
      } catch (error) {
        console.error(`Error saving photo ${i}:`, error);
        // Continue with other photos even if one fails
      }
    }
    
    return results;
  }
}

