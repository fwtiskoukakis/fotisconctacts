import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { ContractPhotoModal } from './contract-photo-modal';
import { PhotoStorageService } from '../services/photo-storage.service';
import { Colors, Shadows } from '../utils/design-system';

interface ContractPhotoButtonProps {
  contractId: string;
  onPhotosUpdated?: (photoCount: number) => void;
}

/**
 * Simple button component that opens photo management modal
 * Shows photo count and thumbnails
 */
export function ContractPhotoButton({
  contractId,
  onPhotosUpdated,
}: ContractPhotoButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    loadPhotos();
  }, [contractId]);

  async function loadPhotos() {
    try {
      const loadedPhotos = await PhotoStorageService.getContractPhotos(contractId);
      setPhotos(loadedPhotos);
      setPhotoCount(loadedPhotos.length);
      onPhotosUpdated?.(loadedPhotos.length);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  }

  function handleModalClose() {
    setModalVisible(false);
    loadPhotos(); // Refresh photos when modal closes
  }

  function handlePhotosUpdated(count: number) {
    setPhotoCount(count);
    onPhotosUpdated?.(count);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Φωτογραφίες Συμβολαίου ({photoCount})
        </Text>
      </View>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewScroll}
          contentContainerStyle={styles.previewContent}
        >
          {photos.slice(0, 5).map((photo, index) => (
            <View key={photo.id || index} style={styles.previewItem}>
              <Image
                source={{ uri: photo.photo_url }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
          ))}
          {photos.length > 5 && (
            <View style={[styles.previewItem, styles.moreItem]}>
              <Text style={styles.moreText}>+{photos.length - 5}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Photos Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>📸</Text>
        <Text style={styles.buttonText}>
          {photos.length === 0 ? 'Προσθήκη Φωτογραφιών' : 'Διαχείριση Φωτογραφιών'}
        </Text>
      </TouchableOpacity>

      {/* Photo Modal */}
      <ContractPhotoModal
        visible={modalVisible}
        contractId={contractId}
        onClose={handleModalClose}
        onPhotosUpdated={handlePhotosUpdated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewScroll: {
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  moreItem: {
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

