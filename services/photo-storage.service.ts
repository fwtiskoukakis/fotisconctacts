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
      console.log('Starting upload for contract:', contractId, 'photo:', photoUri, 'index:', index);

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${contractId}/photo_${index}_${timestamp}.jpg`;

      console.log('Generated filename:', fileName);

      // Create FormData for file upload (React Native compatible)
      const formData = new FormData();
      
      // Add the file with proper structure for React Native
      formData.append('file', {
        uri: photoUri,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      console.log('FormData created for upload');

      // Upload to Supabase Storage using FormData
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CONTRACT_PHOTOS)
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading to storage:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Storage upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_CONTRACT_PHOTOS)
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      const size = fileInfo.exists ? (fileInfo.size || 0) : 0;

      console.log('File info:', fileInfo);

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
      const timestamp = Date.now();
      const fileName = `${vehicleId}/${photoType}_${timestamp}.jpg`;
      
      // Create FormData for file upload (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CAR_PHOTOS)
        .upload(fileName, formData, {
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
      const timestamp = Date.now();
      const fileName = `${vehicleId}/damage_${damageId}_${timestamp}.jpg`;
      
      // Create FormData for file upload (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CAR_PHOTOS)
        .upload(fileName, formData, {
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
      const timestamp = Date.now();
      const fileName = `${userId}/${signatureType}_signature_${timestamp}.png`;
      
      // Create FormData for file upload (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri: signatureUri,
        name: fileName,
        type: 'image/png',
      } as any);
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_SIGNATURES)
        .upload(fileName, formData, {
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
      console.log('Saving photo metadata to database:', {
        contract_id: contractId,
        photo_url: photoUrl,
        photo_type: 'general',
        description: `Photo ${orderIndex + 1}`
      });

      const { error } = await supabase
        .from('contract_photos')
        .insert({
          contract_id: contractId,
          photo_url: photoUrl,
          photo_type: 'general',
          description: `Photo ${orderIndex + 1}`,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving photo metadata:', error);
        throw new Error(`Failed to save metadata: ${error.message}`);
      }

      console.log('Photo metadata saved successfully');
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
        .from('contract_photos')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

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
        // Extract storage paths from photo URLs
        const storagePaths = photos.map(p => {
          const url = p.photo_url;
          if (url) {
            // Extract the path after the bucket name in the URL
            const pathMatch = url.match(/\/contract-photos\/(.+)/);
            return pathMatch ? pathMatch[1] : '';
          }
          return '';
        }).filter(path => path !== '');

        if (storagePaths.length > 0) {
          await this.deletePhotos(this.BUCKET_CONTRACT_PHOTOS, storagePaths);
        }

        // Delete from database
        const { error } = await supabase
          .from('contract_photos')
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
    console.log('Starting batch upload for contract:', contractId, 'Photos:', photoUris.length);

    const results: UploadResult[] = [];
    
    for (let i = 0; i < photoUris.length; i++) {
      try {
        console.log('Uploading photo', i + 1, 'of', photoUris.length);
        const result = await this.uploadContractPhoto(contractId, photoUris[i], i);
        results.push(result);
        
        console.log('Photo', i + 1, 'uploaded successfully:', result.url);

        // Save metadata to database
        await this.savePhotoMetadata(
          contractId,
          result.url,
          result.path,
          result.size,
          i
        );

        console.log('Photo', i + 1, 'metadata saved successfully');
      } catch (error) {
        console.error(`Error uploading photo ${i}:`, error);
        // Continue with other photos even if one fails
      }
    }

    console.log('Batch upload completed. Results:', results.length);
    return results;
  }

  /**
   * Upload multiple photos for a contract with photo type support
   * @param contractId Contract ID
   * @param photoUris Array of local photo URIs
   * @param photoType Photo type (pickup, dropoff, damage, general)
   * @returns Array of upload results
   */
  static async uploadContractPhotosWithType(
    contractId: string,
    photoUris: string[],
    photoType: 'pickup' | 'dropoff' | 'damage' | 'general' = 'general'
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < photoUris.length; i++) {
      try {
        const result = await this.uploadContractPhoto(contractId, photoUris[i], i);
        results.push(result);

        // Save metadata to database with photo type
        await this.savePhotoMetadataWithType(
          contractId,
          result.url,
          result.path,
          result.size,
          i,
          photoType
        );
      } catch (error) {
        console.error(`Error uploading photo ${i}:`, error);
        // Continue with other photos even if one fails
      }
    }

    return results;
  }

  /**
   * Save photo metadata with photo type to database
   */
  static async savePhotoMetadataWithType(
    contractId: string,
    photoUrl: string,
    storagePath: string,
    fileSize: number,
    orderIndex: number,
    photoType: 'pickup' | 'dropoff' | 'damage' | 'general'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('contract_photos')
        .insert({
          contract_id: contractId,
          photo_url: photoUrl,
          photo_type: photoType,
          description: `${photoType.charAt(0).toUpperCase() + photoType.slice(1)} photo ${orderIndex + 1}`,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving photo metadata:', error);
        throw new Error(`Failed to save metadata: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in savePhotoMetadataWithType:', error);
      throw error;
    }
  }

  /**
   * Test Supabase connection and permissions
   */
  static async testConnection(): Promise<void> {
    try {
      console.log('Testing Supabase connection...');

      // Test database connection
      const { data: dbData, error: dbError } = await supabase
        .from('contracts')
        .select('id')
        .limit(1);

      if (dbError) {
        console.error('Database connection error:', dbError);
      } else {
        console.log('Database connection successful');
      }

      // Test storage connection
      const { data: storageData, error: storageError } = await supabase.storage
        .from(this.BUCKET_CONTRACT_PHOTOS)
        .list('', { limit: 1 });

      if (storageError) {
        console.error('Storage connection error:', storageError);
      } else {
        console.log('Storage connection successful');
      }

      console.log('Connection test completed');
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  }
}