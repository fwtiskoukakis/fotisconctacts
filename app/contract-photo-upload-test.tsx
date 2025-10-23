import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PhotoStorageService } from '../services/photo-storage.service';
import { LinearGradient } from 'react-native-linear-gradient';

interface PhotoItem {
  id?: string;
  uri: string;
  isUploaded: boolean;
  uploadProgress?: number;
  url?: string;
}

const { width } = Dimensions.get('window');
const GALLERY_IMAGE_SIZE = (width - 48) / 3; // 3 columns with padding

/**
 * Test page for contract photo upload and gallery functionality
 * Demonstrates camera/gallery upload to Supabase Storage
 */
/**
 * Generate a simple UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function ContractPhotoUploadTestScreen() {
  // Get contract ID from navigation params, or use default for testing
  const params = useLocalSearchParams();
  const paramContractId = params.contractId as string | undefined;
  
  const [contractId, setContractId] = useState<string>(
    paramContractId || '601ad6bd-a803-409e-984b-997c9a6b72d8'
  );
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    requestPermissions();
    // If we have a contract ID from params, automatically load existing photos
    if (paramContractId) {
      loadGalleryPhotos();
    }
  }, [paramContractId]);

  /**
   * Request camera and media library permissions
   */
  async function requestPermissions(): Promise<void> {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!cameraPermission.granted || !mediaPermission.granted) {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are needed to use this feature.'
      );
    }
  }

  /**
   * Open camera to take a photo
   */
  async function handleOpenCamera(): Promise<void> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto: PhotoItem = {
          uri: result.assets[0].uri,
          isUploaded: false,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  }

  /**
   * Open gallery to select a photo
   */
  async function handleOpenGallery(): Promise<void> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos: PhotoItem[] = result.assets.map(asset => ({
          uri: asset.uri,
          isUploaded: false,
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  }

  /**
   * Upload all photos to Supabase Storage
   */
  async function handleUploadPhotos(): Promise<void> {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please add photos before uploading');
      return;
    }

    if (!contractId || contractId.trim() === '') {
      Alert.alert('Contract ID Required', 'Please enter a contract ID');
      return;
    }

    setIsUploading(true);

    try {
      const photoUris = photos.map(p => p.uri);
      
      console.log('Starting upload for contract:', contractId);
      console.log('Number of photos:', photoUris.length);

      // Upload all photos using the service
      const results = await PhotoStorageService.uploadContractPhotos(
        contractId.trim(),
        photoUris
      );

      console.log('Upload completed:', results);

      // Update photo states to show they're uploaded
      setPhotos(prev =>
        prev.map((photo, index) => ({
          ...photo,
          isUploaded: true,
          url: results[index]?.url || photo.url,
        }))
      );

      Alert.alert(
        '✅ Success!',
        `${results.length} photo(s) uploaded successfully!`,
        [
          {
            text: 'OK',
            onPress: () => loadGalleryPhotos(),
          },
        ]
      );
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert(
        'Upload Error',
        `Failed to upload photos: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Load photos from database for the contract
   */
  async function loadGalleryPhotos(): Promise<void> {
    if (!contractId || contractId.trim() === '') {
      Alert.alert('Contract ID Required', 'Please enter a contract ID to load photos');
      return;
    }

    setIsLoadingGallery(true);

    try {
      const photos = await PhotoStorageService.getContractPhotos(contractId.trim());
      setGalleryPhotos(photos);

      if (photos.length === 0) {
        Alert.alert('No Photos', 'No photos found for this contract');
      }
    } catch (error) {
      console.error('Error loading gallery photos:', error);
      Alert.alert('Error', 'Failed to load photos from database');
    } finally {
      setIsLoadingGallery(false);
    }
  }

  /**
   * Remove a photo from the preview list
   */
  function handleRemovePhoto(index: number): void {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotos(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  }

  /**
   * Clear all photos
   */
  function handleClearPhotos(): void {
    if (photos.length === 0) return;

    Alert.alert(
      'Clear All Photos',
      'Are you sure you want to clear all photos?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setPhotos([]),
        },
      ]
    );
  }

  /**
   * Test Supabase connection
   */
  async function handleTestConnection(): Promise<void> {
    try {
      await PhotoStorageService.testConnection();
      Alert.alert('✅ Success', 'Supabase connection test successful!');
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert('❌ Failed', 'Connection test failed. Check console for details.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Πίσω</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {paramContractId ? '📸 Φωτογραφίες Συμβολαίου' : '📸 Photo Upload Test'}
          </Text>
          <Text style={styles.subtitle}>
            {paramContractId 
              ? 'Προσθέστε φωτογραφίες στο συμβόλαιό σας' 
              : 'Contract Photo Upload & Gallery'
            }
          </Text>
        </View>

        {/* Contract ID Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {paramContractId ? 'Κωδικός Συμβολαίου' : 'Contract ID'}
          </Text>
          <TextInput
            style={[styles.input, paramContractId && styles.inputDisabled]}
            value={contractId}
            onChangeText={setContractId}
            placeholder="Enter contract ID"
            placeholderTextColor="#94a3b8"
            editable={!paramContractId}
          />
          {paramContractId ? (
            <Text style={styles.hint}>
              ✅ Αυτό είναι το συμβόλαιο που μόλις δημιουργήσατε. Προσθέστε φωτογραφίες παρακάτω!
            </Text>
          ) : (
            <>
              <Text style={styles.hint}>
                ✅ This is a real contract ID from your database. Photos will upload to storage AND save metadata to the database!
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => setContractId(generateUUID())}
                >
                  <Text style={styles.generateButtonText}>🔄 Random UUID</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => setContractId('601ad6bd-a803-409e-984b-997c9a6b72d8')}
                >
                  <Text style={styles.generateButtonText}>🔙 Reset to Real ID</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {paramContractId ? 'Προσθήκη Φωτογραφιών' : 'Add Photos'}
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cameraButton]}
              onPress={handleOpenCamera}
              disabled={isUploading}
            >
              <Text style={styles.actionButtonIcon}>📷</Text>
              <Text style={styles.actionButtonText}>
                {paramContractId ? 'Κάμερα' : 'Camera'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.galleryButton]}
              onPress={handleOpenGallery}
              disabled={isUploading}
            >
              <Text style={styles.actionButtonIcon}>🖼️</Text>
              <Text style={styles.actionButtonText}>
                {paramContractId ? 'Συλλογή' : 'Gallery'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Preview */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {paramContractId 
                  ? `Προεπισκόπηση (${photos.length} φωτογραφί${photos.length !== 1 ? 'ες' : 'α'})`
                  : `Preview (${photos.length} photo${photos.length !== 1 ? 's' : ''})`
                }
              </Text>
              <TouchableOpacity onPress={handleClearPhotos}>
                <Text style={styles.clearButton}>
                  {paramContractId ? 'Καθαρισμός' : 'Clear All'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.previewContainer}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.previewItem}>
                    <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                    {photo.isUploaded && (
                      <View style={styles.uploadedBadge}>
                        <Text style={styles.uploadedBadgeText}>✓</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.uploadButton,
                isUploading && styles.uploadButtonDisabled,
              ]}
              onPress={handleUploadPhotos}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.uploadButtonIcon}>☁️</Text>
                  <Text style={styles.uploadButtonText}>
                    {paramContractId 
                      ? 'Ανέβασμα Φωτογραφιών' 
                      : 'Upload to Supabase Storage'
                    }
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Gallery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {paramContractId
                ? `Αποθηκευμένες Φωτογραφίες (${galleryPhotos.length})`
                : `Gallery (${galleryPhotos.length} photo${galleryPhotos.length !== 1 ? 's' : ''})`
              }
            </Text>
            <TouchableOpacity
              onPress={loadGalleryPhotos}
              disabled={isLoadingGallery}
            >
              <Text style={styles.refreshButton}>
                {isLoadingGallery ? '⏳' : '🔄'} {paramContractId ? 'Ανανέωση' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingGallery ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading photos...</Text>
            </View>
          ) : galleryPhotos.length > 0 ? (
            <View style={styles.galleryGrid}>
              {galleryPhotos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id || index}
                  style={styles.galleryItem}
                  onPress={() => setSelectedImage(photo.photo_url)}
                >
                  <Image
                    source={{ uri: photo.photo_url }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.galleryImageLabel}>
                    {photo.description || `Photo ${index + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📷</Text>
              <Text style={styles.emptyStateText}>
                {paramContractId ? 'Δεν υπάρχουν φωτογραφίες ακόμα' : 'No photos yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {paramContractId 
                  ? 'Ανεβάστε φωτογραφίες και πατήστε ανανέωση για να τις δείτε εδώ'
                  : 'Upload photos and tap refresh to see them here'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Test Connection Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestConnection}
          >
            <Text style={styles.testButtonText}>🔌 Test Supabase Connection</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ How to Use</Text>
          <Text style={styles.infoText}>
            1. Enter or use the auto-generated contract ID{'\n'}
            2. Take photos with camera or select from gallery{'\n'}
            3. Preview the photos before uploading{'\n'}
            4. Click "Upload to Supabase Storage"{'\n'}
            5. Photos are stored in Supabase and metadata in database{'\n'}
            6. Click "Refresh" in Gallery section to view uploaded photos
          </Text>
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
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
              <Text style={styles.modalCloseButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  inputDisabled: {
    backgroundColor: '#1e293b',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cameraButton: {
    borderColor: '#3b82f6',
  },
  galleryButton: {
    borderColor: '#8b5cf6',
  },
  actionButtonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  previewItem: {
    position: 'relative',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  clearButton: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#475569',
  },
  uploadButtonIcon: {
    fontSize: 20,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryItem: {
    width: GALLERY_IMAGE_SIZE,
  },
  galleryImage: {
    width: GALLERY_IMAGE_SIZE,
    height: GALLERY_IMAGE_SIZE,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  galleryImageLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  generateButtonText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
});

