import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PhotoStorageService } from '../services/photo-storage.service';

interface ContractPhotoUploaderProps {
  contractId: string | null;
  onPhotosChanged?: (photoCount: number) => void;
}

interface PhotoItem {
  id?: string;
  photo_url: string;
  photo_type?: string;
  description?: string;
  created_at?: string;
}

const { width } = Dimensions.get('window');
const GALLERY_IMAGE_SIZE = (width - 48) / 3;

/**
 * Clean photo uploader component for contracts
 * Similar UI to test page but production-ready
 */
export function ContractPhotoUploader({
  contractId,
  onPhotosChanged,
}: ContractPhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      loadPhotos();
    }
  }, [contractId]);

  /**
   * Load photos from database
   */
  async function loadPhotos(): Promise<void> {
    if (!contractId) return;

    setIsLoading(true);
    try {
      const loadedPhotos = await PhotoStorageService.getContractPhotos(contractId);
      setPhotos(loadedPhotos);
      onPhotosChanged?.(loadedPhotos.length);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Request permissions
   */
  async function requestPermissions(): Promise<boolean> {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!cameraPermission.granted || !mediaPermission.granted) {
      Alert.alert(
        'Άδεια απαιτείται',
        'Χρειαζόμαστε πρόσβαση στην κάμερα και τη βιβλιοθήκη φωτογραφιών'
      );
      return false;
    }
    return true;
  }

  /**
   * Take photo with camera
   */
  async function handleTakePhoto(): Promise<void> {
    if (!contractId) {
      Alert.alert('Σφάλμα', 'Αποθηκεύστε πρώτα το συμβόλαιο για να προσθέσετε φωτογραφίες');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS === 'ios', // Disable editing on Android due to crop issues
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία λήψης φωτογραφίας');
    }
  }

  /**
   * Pick photo from gallery
   */
  async function handlePickFromGallery(): Promise<void> {
    if (!contractId) {
      Alert.alert('Σφάλμα', 'Αποθηκεύστε πρώτα το συμβόλαιο για να προσθέσετε φωτογραφίες');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS === 'ios', // Disable editing on Android due to crop issues
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία επιλογής φωτογραφίας');
    }
  }

  /**
   * Upload photo to Supabase
   */
  async function uploadPhoto(uri: string): Promise<void> {
    if (!contractId) return;

    setIsUploading(true);
    try {
      const uploadResult = await PhotoStorageService.uploadContractPhoto(
        contractId,
        uri,
        photos.length
      );

      await PhotoStorageService.savePhotoMetadata(
        contractId,
        uploadResult.url,
        uploadResult.path,
        uploadResult.size,
        photos.length
      );

      Alert.alert('✅ Επιτυχία', 'Η φωτογραφία αποθηκεύτηκε επιτυχώς');
      await loadPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποστολής φωτογραφίας');
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Render empty state
   */
  function renderEmptyState() {
    if (!contractId) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💾</Text>
          <Text style={styles.emptyStateText}>Αποθηκεύστε πρώτα το συμβόλαιο</Text>
          <Text style={styles.emptyStateSubtext}>
            Μετά μπορείτε να προσθέσετε φωτογραφίες
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Δεν υπάρχουν φωτογραφίες ακόμα</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.sectionTitle}>5. Φωτογραφίες</Text>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton, (!contractId || isUploading) && styles.buttonDisabled]}
          onPress={handleTakePhoto}
          disabled={!contractId || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>📸 Νέα Φωτογραφία</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton, (!contractId || isUploading) && styles.buttonDisabled]}
          onPress={handlePickFromGallery}
          disabled={!contractId || isUploading}
        >
          <Text style={styles.buttonText}>🖼️ Από Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Gallery */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : photos.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.gallery}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id || index}
                style={[styles.photoItem, { width: GALLERY_IMAGE_SIZE, height: GALLERY_IMAGE_SIZE }]}
                onPress={() => setSelectedImage(photo.photo_url)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: photo.photo_url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Full Screen Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => setSelectedImage(null)}
          >
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.modalCloseButtonText}>✕ Κλείσιμο</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#555',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalCloseArea: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: width,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

