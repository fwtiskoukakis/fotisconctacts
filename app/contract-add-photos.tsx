import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PhotoStorageService } from '../services/photo-storage.service';
import { SupabaseContractService } from '../services/supabase-contract.service';

interface PhotoItem {
  uri: string;
  isUploaded: boolean;
}

/**
 * Dedicated page for adding photos to a newly created contract
 * After photos are saved, redirects to contract details
 */
export default function ContractAddPhotosScreen() {
  const params = useLocalSearchParams();
  const contractId = params.contractId as string;
  
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Open camera to take a photo
   */
  async function handleOpenCamera(): Promise<void> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Άδεια Απαιτείται', 'Χρειάζεται άδεια χρήσης κάμερας για να τραβήξετε φωτογραφίες.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
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
      Alert.alert('Σφάλμα', 'Αποτυχία ανοίγματος κάμερας');
    }
  }

  /**
   * Open gallery to select photos
   */
  async function handleOpenGallery(): Promise<void> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Άδεια Απαιτείται', 'Χρειάζεται άδεια πρόσβασης στη συλλογή για να επιλέξετε φωτογραφίες.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
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
      Alert.alert('Σφάλμα', 'Αποτυχία ανοίγματος συλλογής');
    }
  }

  /**
   * Remove a photo from the list
   */
  function handleRemovePhoto(index: number): void {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  /**
   * Save photos to Supabase and update contract, then navigate to contract details
   */
  async function handleSaveAndContinue(): Promise<void> {
    if (photos.length === 0) {
      // No photos to save, just navigate to contract details
      Alert.alert(
        'Χωρίς Φωτογραφίες',
        'Δεν προσθέσατε φωτογραφίες. Θέλετε να συνεχίσετε χωρίς φωτογραφίες;',
        [
          { text: 'Προσθήκη Φωτογραφιών', style: 'cancel' },
          {
            text: 'Συνέχεια',
            onPress: () => {
              router.replace({
                pathname: '/contract-details',
                params: { contractId }
              });
            }
          }
        ]
      );
      return;
    }

    setIsSaving(true);

    try {
      // Upload all photos to Supabase
      const photoUris = photos.map(p => p.uri);
      const uploadResults = await PhotoStorageService.uploadContractPhotos(
        contractId,
        photoUris
      );

      // Get uploaded URLs
      const uploadedUrls = uploadResults.map(result => result.url);

      // Update contract with photo URLs
      const contract = await SupabaseContractService.getContractById(contractId);
      if (contract) {
        // Merge with existing photos if any
        const allPhotoUrls = [...(contract.photoUris || []), ...uploadedUrls];
        
        await SupabaseContractService.updateContract(contractId, {
          ...contract,
          photoUris: allPhotoUrls
        });

        Alert.alert(
          'Επιτυχία!',
          `${uploadResults.length} φωτογραφί${uploadResults.length !== 1 ? 'ες' : 'α'} αποθηκεύτηκ${uploadResults.length !== 1 ? 'αν' : 'ε'} επιτυχώς!`,
          [
            {
              text: 'Προβολή Συμβολαίου',
              onPress: () => {
                router.replace({
                  pathname: '/contract-details',
                  params: { contractId }
                });
              }
            }
          ]
        );
      } else {
        throw new Error('Το συμβόλαιο δεν βρέθηκε');
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      Alert.alert(
        'Σφάλμα',
        `Αποτυχία αποθήκευσης φωτογραφιών: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`
      );
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Skip photo upload and go directly to contract details
   */
  function handleSkip(): void {
    Alert.alert(
      'Παράλειψη Φωτογραφιών',
      'Είστε βέβαιοι ότι θέλετε να παραλείψετε την προσθήκη φωτογραφιών; Μπορείτε να προσθέσετε φωτογραφίες αργότερα από την επεξεργασία του συμβολαίου.',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Παράλειψη',
          style: 'destructive',
          onPress: () => {
            router.replace({
              pathname: '/contract-details',
              params: { contractId }
            });
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📸 Φωτογραφίες Συμβολαίου</Text>
          <Text style={styles.subtitle}>
            Προσθέστε φωτογραφίες του οχήματος και του συμβολαίου
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraButton]}
            onPress={handleOpenCamera}
            disabled={isSaving}
          >
            <Text style={styles.actionButtonIcon}>📷</Text>
            <Text style={styles.actionButtonText}>Τράβηξε Φωτογραφία</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={handleOpenGallery}
            disabled={isSaving}
          >
            <Text style={styles.actionButtonIcon}>🖼️</Text>
            <Text style={styles.actionButtonText}>Επιλογή από Συλλογή</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Preview */}
        {photos.length > 0 ? (
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                Φωτογραφίες ({photos.length})
              </Text>
              <TouchableOpacity onPress={() => setPhotos([])}>
                <Text style={styles.clearText}>Καθαρισμός Όλων</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>Δεν έχετε προσθέσει φωτογραφίες ακόμα</Text>
            <Text style={styles.emptySubtext}>
              Χρησιμοποιήστε την κάμερα ή επιλέξτε από τη συλλογή σας
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Συνιστάται να τραβήξετε φωτογραφίες του οχήματος από όλες τις πλευρές, 
            καθώς και λεπτομέρειες τυχόν ζημιών.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isSaving}
        >
          <Text style={styles.skipButtonText}>Παράλειψη</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveAndContinue}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>
                {photos.length > 0 ? 'Αποθήκευση & Συνέχεια' : 'Συνέχεια'}
              </Text>
              <Text style={styles.saveButtonIcon}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  galleryButton: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  actionButtonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  previewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#B3D9F2',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0066CC',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0C8FF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButtonIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

