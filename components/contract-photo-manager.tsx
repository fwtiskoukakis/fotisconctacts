import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Alert, Modal, Platform, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PhotoStorageService } from '../services/photo-storage.service';
import { Colors, Typography, Shadows } from '../utils/design-system';

interface ContractPhotoManagerProps {
  contractId: string;
  onPhotosUpdated?: (photos: string[]) => void;
  existingPhotos?: string[];
  buttonText?: string;
}

interface PhotoItem {
  id: string;
  uri: string;
  isUploaded: boolean;
  uploadUrl?: string;
}

/**
 * Component for managing contract photos with Supabase upload
 */
export function ContractPhotoManager({ 
  contractId, 
  onPhotosUpdated, 
  existingPhotos = [], 
  buttonText 
}: ContractPhotoManagerProps) {
  const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>(() => 
    existingPhotos.map((uri, index) => ({
      id: `existing_${index}`,
      uri,
      isUploaded: true,
      uploadUrl: uri
    }))
  );
  const cameraRef = useRef<any>(null);

  async function requestPermissions() {
    const cameraResult = await requestCameraPermission();
    const mediaResult = await requestMediaPermission();

    if (!cameraResult?.granted || !mediaResult?.granted) {
      Alert.alert('Άδεια απαιτείται', 'Χρειαζόμαστε πρόσβαση στην κάμερα και τη βιβλιοθήκη φωτογραφιών');
      return false;
    }
    return true;
  }

  async function handleOpenSourceModal() {
    const hasPermission = await requestPermissions();
    if (hasPermission) {
      setIsSourceModalVisible(true);
    }
  }

  async function handleOpenCamera() {
    setIsSourceModalVisible(false);
    setIsCameraVisible(true);
  }

  async function handleOpenGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos: PhotoItem[] = result.assets.map((asset, index) => ({
          id: `new_${Date.now()}_${index}`,
          uri: asset.uri,
          isUploaded: false
        }));
        
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία επιλογής εικόνων');
    } finally {
      setIsSourceModalVisible(false);
    }
  }

  async function handleTakePhoto() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo && photo.uri) {
          const newPhoto: PhotoItem = {
            id: `camera_${Date.now()}`,
            uri: photo.uri,
            isUploaded: false
          };
          
          setPhotos(prev => [...prev, newPhoto]);
          setIsCameraVisible(false);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Σφάλμα', 'Αποτυχία λήψης φωτογραφίας');
      }
    }
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function removePhoto(photoId: string) {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  }

  async function handleSaveToSupabase() {
    const newPhotos = photos.filter(photo => !photo.isUploaded);
    
    if (newPhotos.length === 0) {
      Alert.alert('Ειδοποίηση', 'Δεν υπάρχουν νέες φωτογραφίες για αποθήκευση');
      return;
    }

    setUploading(true);
    try {
      console.log('Starting upload for contract:', contractId);
      console.log('New photos to upload:', newPhotos.length);
      
      // Test Supabase connection first
      await PhotoStorageService.testConnection();
      
      const photoUris = newPhotos.map(photo => photo.uri);
      console.log('Photo URIs to upload:', photoUris);
      
      const uploadResults = await PhotoStorageService.uploadContractPhotos(contractId, photoUris);
      
      console.log('Upload results:', uploadResults);
      
      if (uploadResults.length === 0) {
        throw new Error('No photos were uploaded successfully');
      }
      
      // Update photos with upload URLs
      const updatedPhotos = photos.map(photo => {
        if (!photo.isUploaded) {
          const newPhotoIndex = newPhotos.findIndex(p => p.id === photo.id);
          const uploadResult = uploadResults[newPhotoIndex];
          return {
            ...photo,
            isUploaded: true,
            uploadUrl: uploadResult?.url || photo.uri
          };
        }
        return photo;
      });
      
      setPhotos(updatedPhotos);
      
      // Notify parent component
      const allUrls = updatedPhotos.map(photo => photo.uploadUrl || photo.uri);
      onPhotosUpdated?.(allUrls);
      
      Alert.alert('✅ Επιτυχία!', `${uploadResults.length} φωτογραφίες αποθηκεύτηκαν επιτυχώς στο Supabase!`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Σφάλμα', `Αποτυχία αποστολής φωτογραφιών στο Supabase: ${error.message || error}`);
    } finally {
      setUploading(false);
    }
  }

  const hasNewPhotos = photos.some(photo => !photo.isUploaded);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Φωτογραφίες Συμβολαίου ({photos.length})</Text>

      {/* Photo Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGrid}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.photoContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <View style={styles.photoOverlay}>
              {photo.isUploaded ? (
                <View style={styles.uploadedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Ionicons name="time" size={16} color={Colors.warning} />
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removePhoto(photo.id)}
              >
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={handleOpenSourceModal}
          disabled={uploading}
        >
          <Ionicons name="camera" size={18} color="#fff" />
          <Text style={styles.buttonText}>📸 Νέα Φωτογραφία</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={handleOpenGallery}
          disabled={uploading}
        >
          <Ionicons name="images" size={18} color="#fff" />
          <Text style={styles.buttonText}>🖼️ Από Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      {hasNewPhotos && (
        <TouchableOpacity
          style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
          onPress={handleSaveToSupabase}
          disabled={uploading}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {uploading ? 'Αποθήκευση...' : '💾 Αποθήκευση στο Supabase'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Source Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSourceModalVisible}
        onRequestClose={() => setIsSourceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Επιλέξτε πηγή</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#007AFF' }]}
                onPress={handleOpenCamera}
              >
                <Text style={styles.modalButtonText}>📷 Κάμερα</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#34C759' }]}
                onPress={handleOpenGallery}
              >
                <Text style={styles.modalButtonText}>🖼️ Βιβλιοθήκη</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => setIsSourceModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Ακύρωση</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
      {isCameraVisible && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isCameraVisible}
          onRequestClose={() => setIsCameraVisible(false)}
        >
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsCameraVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    ...Shadows.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  photoGrid: {
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  photoOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  uploadedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    ...Shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  captureButton: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
