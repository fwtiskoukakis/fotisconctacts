import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

interface PhotoCaptureProps {
  onPhotoTaken: (uri: string) => void;
  photos?: string[];
  buttonText?: string;
  captureMode?: 'photo' | 'signature';
}

/**
 * Component for capturing and managing photos of the rental car
 */
export function PhotoCapture({ onPhotoTaken, photos = [], buttonText, captureMode = 'photo' }: PhotoCaptureProps) {
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
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

  async function handleOpenCamera() {
    const hasPermission = await requestPermissions();
    if (hasPermission) {
      setIsCameraVisible(true);
    }
  }

  async function handleTakePhoto() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        
        if (photo && photo.uri) {
          onPhotoTaken(photo.uri);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {captureMode === 'signature' ? 'Υπογραφή' : `Φωτογραφίες Οχήματος (${photos.length})`}
      </Text>
      
      <View style={styles.photoGrid}>
        {photos.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.photo} />
        ))}
      </View>

      {!isCameraVisible ? (
        <TouchableOpacity style={styles.button} onPress={handleOpenCamera}>
          <Text style={styles.buttonText}>
            {buttonText || (captureMode === 'signature' ? '✍️ Προσθήκη Υπογραφής' : '📷 Προσθήκη Φωτογραφίας')}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
              <Text style={styles.buttonText}>Λήψη</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Text style={styles.buttonText}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setIsCameraVisible(false)}
            >
              <Text style={styles.buttonText}>Ακύρωση</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    height: 400,
    marginTop: 10,
  },
  camera: {
    flex: 1,
    borderRadius: 8,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    gap: 5,
  },
  captureButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  flipButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    width: 60,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
});

