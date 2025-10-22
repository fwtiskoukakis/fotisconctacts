/**
 * Photo Storage Service
 * Handles uploading and managing photos in Supabase Storage
 */

import { supabase } from '../utils/supabase';
import * as FileSystem from 'expo-file-system/legacy';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

export class PhotoStorageService {
  // Storage bucket names
  private static readonly BUCKET_CONTRACT_PHOTOS = 'contract-photos';
  private static readonly BUCKET_CAR_PHOTOS = 'car-photos';
  private static readonly BUCKET_SIGNATURES = 'signatures';

  /**
   * Upload a contract photo
   * @param contractId Contract ID
   * @param photoUri Local URI of the photo
   * @param index Photo index/order
   * @returns Upload result with public URL
   */
  static async uploadContractPhoto(
    contractId: string,
    photoUri: string,
    index: number
  ): Promise<UploadResult> {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64',
      });

      // Convert base64 to Blob using fetch API (React Native compatible)
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${contractId}/photo_${index}_${timestamp}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CONTRACT_PHOTOS)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading contract photo:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_CONTRACT_PHOTOS)
        .getPublicUrl(fileName);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;

      return {
        url: publicUrl,
        path: fileName,
        size,
      };
    } catch (error) {
      console.error('Error in uploadContractPhoto:', error);
      throw error;
    }
  }

  /**
   * Upload a car/vehicle photo
   * @param vehicleId Vehicle ID or license plate
   * @param photoUri Local URI of the photo
   * @param photoType Type of photo (exterior, interior, damage, etc)
   * @returns Upload result with public URL
   */
  static async uploadCarPhoto(
    vehicleId: string,
    photoUri: string,
    photoType: string = 'general'
  ): Promise<UploadResult> {
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64',
      });

      // Convert base64 to Blob using fetch API (React Native compatible)
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const fileName = `${vehicleId}/${photoType}_${timestamp}.jpg`;
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CAR_PHOTOS)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading car photo:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_CAR_PHOTOS)
        .getPublicUrl(fileName);

      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;

      return {
        url: publicUrl,
        path: fileName,
        size,
      };
    } catch (error) {
      console.error('Error in uploadCarPhoto:', error);
      throw error;
    }
  }

  /**
   * Upload a damage photo (stores in car-photos bucket with damage prefix)
   * @param vehicleId Vehicle ID or license plate
   * @param damageId Damage point ID
   * @param photoUri Local URI of the photo
   * @returns Upload result with public URL
   */
  static async uploadDamagePhoto(
    vehicleId: string,
    damageId: string,
    photoUri: string
  ): Promise<UploadResult> {
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64',
      });

      // Convert base64 to Blob using fetch API (React Native compatible)
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const fileName = `${vehicleId}/damage_${damageId}_${timestamp}.jpg`;
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CAR_PHOTOS)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading damage photo:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_CAR_PHOTOS)
        .getPublicUrl(fileName);

      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;

      return {
        url: publicUrl,
        path: fileName,
        size,
      };
    } catch (error) {
      console.error('Error in uploadDamagePhoto:', error);
      throw error;
    }
  }

  /**
   * Upload a signature
   * @param userId User ID
   * @param signatureUri Local URI of the signature image
   * @param signatureType Type of signature (user, client, etc)
   * @returns Upload result with public URL
   */
  static async uploadSignature(
    userId: string,
    signatureUri: string,
    signatureType: 'user' | 'client' = 'client'
  ): Promise<UploadResult> {
    try {
      const base64 = await FileSystem.readAsStringAsync(signatureUri, {
        encoding: 'base64',
      });

      // Convert base64 to Blob using fetch API (React Native compatible)
      const dataUrl = `data:image/png;base64,${base64}`;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const fileName = `${userId}/${signatureType}_signature_${timestamp}.png`;
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_SIGNATURES)
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading signature:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_SIGNATURES)
        .getPublicUrl(fileName);

      const fileInfo = await FileSystem.getInfoAsync(signatureUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;

      return {
        url: publicUrl,
        path: fileName,
        size,
      };
    } catch (error) {
      console.error('Error in uploadSignature:', error);
      throw error;
    }
  }

  /**
   * Delete a photo from storage
   * @param bucket Bucket name
   * @param path File path in bucket
   */
  static async deletePhoto(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

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
   * Delete multiple photos from storage
   * @param bucket Bucket name
   * @param paths Array of file paths
   */
  static async deletePhotos(bucket: string, paths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

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
   * List all photos in a folder
   * @param bucket Bucket name
   * @param folder Folder path
   * @returns Array of file objects
   */
  static async listPhotos(bucket: string, folder: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder);

      if (error) {
        console.error('Error listing photos:', error);
        throw new Error(`List failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in listPhotos:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a stored photo
   * @param bucket Bucket name
   * @param path File path
   * @returns Public URL
   */
  static getPublicUrl(bucket: string, path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  }

  /**
   * Save photo metadata to database
   * @param contractId Contract ID
   * @param photoUrl Public URL of the photo
   * @param storagePath Storage path
   * @param fileSize File size in bytes
   * @param orderIndex Order index
   */
  static async savePhotoMetadata(
    contractId: string,
    photoUrl: string,
    storagePath: string,
    fileSize: number,
    orderIndex: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('photos')
        .insert({
          contract_id: contractId,
          photo_url: photoUrl,
          storage_path: storagePath,
          file_size: fileSize,
          mime_type: 'image/jpeg',
          order_index: orderIndex,
        });

      if (error) {
        console.error('Error saving photo metadata:', error);
        throw new Error(`Failed to save metadata: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in savePhotoMetadata:', error);
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
        .from('photos')
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
   * Delete contract photos (both from storage and database)
   * @param contractId Contract ID
   */
  static async deleteContractPhotos(contractId: string): Promise<void> {
    try {
      // Get all photos for this contract
      const photos = await this.getContractPhotos(contractId);
      
      if (photos.length > 0) {
        // Delete from storage
        const paths = photos.map(p => p.storage_path);
        await this.deletePhotos(this.BUCKET_CONTRACT_PHOTOS, paths);
        
        // Delete from database
        const { error } = await supabase
          .from('photos')
          .delete()
          .eq('contract_id', contractId);

        if (error) {
          console.error('Error deleting photo metadata:', error);
          throw new Error(`Failed to delete metadata: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error in deleteContractPhotos:', error);
      throw error;
    }
  }

  /**
   * Upload multiple photos for a contract
   * @param contractId Contract ID
   * @param photoUris Array of local photo URIs
   * @returns Array of upload results
   */
  static async uploadContractPhotos(
    contractId: string,
    photoUris: string[]
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < photoUris.length; i++) {
      try {
        const result = await this.uploadContractPhoto(contractId, photoUris[i], i);
        results.push(result);
        
        // Save metadata to database
        await this.savePhotoMetadata(
          contractId,
          result.url,
          result.path,
          result.size,
          i
        );
      } catch (error) {
        console.error(`Error uploading photo ${i}:`, error);
        // Continue with other photos even if one fails
      }
    }
    
    return results;
  }
}

