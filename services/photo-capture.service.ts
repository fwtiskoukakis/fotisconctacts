import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface PhotoCaptureOptions {
  allowsEditing?: boolean;
  quality?: number;
  aspect?: [number, number];
  mediaTypes?: ImagePicker.MediaTypeOptions;
}

export class PhotoCaptureService {
  /**
   * Request camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Δεν υπάρχει άδεια κάμερας',
            'Παρακαλώ δώστε άδεια πρόσβασης στην κάμερα για να μπορέσετε να τραβήξετε φωτογραφίες.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Δεν υπάρχει άδεια βιβλιοθήκης',
            'Παρακαλώ δώστε άδεια πρόσβασης στη βιβλιοθήκη φωτογραφιών για να μπορέσετε να επιλέξετε φωτογραφίες.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Take a photo with camera
   */
  static async takePhoto(options: PhotoCaptureOptions = {}): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία λήψης φωτογραφίας');
      return null;
    }
  }

  /**
   * Pick photo from library
   */
  static async pickPhoto(options: PhotoCaptureOptions = {}): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία επιλογής φωτογραφίας');
      return null;
    }
  }

  /**
   * Show photo picker options (camera or library)
   */
  static async showPhotoPickerOptions(options: PhotoCaptureOptions = {}): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Επιλογή Φωτογραφίας',
        'Πώς θέλετε να προσθέσετε φωτογραφία;',
        [
          {
            text: 'Κάμερα',
            onPress: async () => {
              const photo = await this.takePhoto(options);
              resolve(photo);
            },
          },
          {
            text: 'Βιβλιοθήκη',
            onPress: async () => {
              const photo = await this.pickPhoto(options);
              resolve(photo);
            },
          },
          {
            text: 'Ακύρωση',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }

  /**
   * Quick photo capture for damage reports
   */
  static async quickDamagePhoto(): Promise<string | null> {
    return this.takePhoto({
      allowsEditing: true,
      quality: 0.9,
      aspect: [1, 1], // Square aspect for damage photos
    });
  }

  /**
   * Quick photo capture for contracts
   */
  static async quickContractPhoto(): Promise<string | null> {
    return this.takePhoto({
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });
  }
}
