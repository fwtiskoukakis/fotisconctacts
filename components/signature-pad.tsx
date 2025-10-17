import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';

interface SignaturePadProps {
  onSignatureSave: (uri: string) => void;
  initialSignature?: string;
  isModal?: boolean;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Touch-based signature drawing component
 */
export function SignaturePad({ onSignatureSave, initialSignature, isModal = false }: SignaturePadProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [showModal, setShowModal] = useState(false);
  const svgRef = useRef<any>(null);

  const { width, height } = Dimensions.get('window');
  const signatureWidth = isModal ? width - 40 : 300;
  const signatureHeight = isModal ? height * 0.6 : 200;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      // Direct mapping: use locationX and locationY directly as SVG coordinates
      // since the SVG fills the entire signature area with viewBox="0 0 300 200"
      const point = { 
        x: Math.max(0, Math.min(300, locationX)), 
        y: Math.max(0, Math.min(200, locationY)) 
      };
      
      setIsDrawing(true);
      setLastPoint(point);
      setCurrentPath(`M${point.x},${point.y}`);
    },
    onPanResponderMove: (evt) => {
      if (!isDrawing) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      // Direct mapping: use locationX and locationY directly as SVG coordinates
      const point = { 
        x: Math.max(0, Math.min(300, locationX)), 
        y: Math.max(0, Math.min(200, locationY)) 
      };
      
      if (lastPoint) {
        // Only update if the point has moved significantly to reduce lag
        const distance = Math.sqrt(Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2));
        if (distance > 0.5) {
          const newPath = `${currentPath} L${point.x},${point.y}`;
          setCurrentPath(newPath);
          setLastPoint(point);
        }
      }
    },
    onPanResponderRelease: () => {
      if (isDrawing) {
        setPaths(prev => [...prev, currentPath]);
        setCurrentPath('');
        setIsDrawing(false);
        setLastPoint(null);
      }
    },
  });

  function clearSignature() {
    setPaths([]);
    setCurrentPath('');
    setIsDrawing(false);
    setLastPoint(null);
  }

  async function saveSignature() {
    if (paths.length === 0 && currentPath === '') {
      Alert.alert('Σφάλμα', 'Παρακαλώ κάντε μια υπογραφή πρώτα');
      return;
    }

    try {
      // Create SVG content with consistent viewBox
      const allPaths = [...paths, currentPath].filter(path => path !== '');
      const svgContent = `
        <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          ${allPaths.map(path => `<path d="${path}" stroke="black" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
        </svg>
      `;

      // Save to file
      const fileName = `signature_${Date.now()}.svg`;
      const fileUri = `${FileSystem.documentDirectory}signatures/${fileName}`;
      
      // Ensure directory exists
      const signaturesDir = FileSystem.documentDirectory + 'signatures/';
      const dirInfo = await FileSystem.getInfoAsync(signaturesDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(signaturesDir, { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(fileUri, svgContent);
      onSignatureSave(fileUri);
      
      // Don't close modal here when isModal is true - let parent handle it
      if (!isModal) {
        setShowModal(false);
      }
      
      Alert.alert('Επιτυχία', 'Η υπογραφή αποθηκεύτηκε επιτυχώς');
    } catch (error) {
      console.error('Error saving signature:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης υπογραφής');
    }
  }

  function renderSignature() {
    const allPaths = [...paths, currentPath].filter(path => path !== '');
    
    return (
      <Svg width={signatureWidth} height={signatureHeight} style={styles.svg} viewBox="0 0 300 200">
        {allPaths.map((path, index) => (
          <Path
            key={index}
            d={path}
            stroke="black"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    );
  }

  // If isModal is true, render the signature area directly without the wrapper modal
  if (isModal) {
    return (
      <View style={styles.modalContent}>
        <View style={styles.modalSignatureArea}>
          <View 
            style={styles.fullScreenSignatureArea}
            {...panResponder.panHandlers}
          >
            {renderSignature()}
          </View>
        </View>
        
        <View style={styles.modalControls}>
          <TouchableOpacity style={styles.clearButton} onPress={clearSignature}>
            <Text style={styles.buttonText}>🗑️ Διαγραφή</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveSignature}>
            <Text style={styles.buttonText}>Αποθήκευση</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Υπογραφή</Text>
      <Text style={styles.subtitle}>Σχεδιάστε την υπογραφή σας παρακάτω</Text>
      
      <TouchableOpacity 
        style={styles.openModalButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.openModalButtonText}>📝 Ανοίξτε για Υπογραφή</Text>
      </TouchableOpacity>

      {/* Full-screen modal for better signature experience */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Υπογραφή</Text>
            <TouchableOpacity
              onPress={saveSignature}
              style={styles.saveButton}
            >
              <Text style={styles.buttonText}>Αποθήκευση</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.modalSignatureArea}>
              <View 
                style={styles.fullScreenSignatureArea}
                {...panResponder.panHandlers}
              >
                {renderSignature()}
              </View>
            </View>
            
            <View style={styles.modalControls}>
              <TouchableOpacity style={styles.clearButton} onPress={clearSignature}>
                <Text style={styles.buttonText}>🗑️ Διαγραφή</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  signatureContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  signatureArea: {
    width: '100%',
    height: 200,
    backgroundColor: '#fafafa',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSignatureArea: {
    width: 300,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  fullScreenSignatureArea: {
    width: 300,
    height: 200,
    backgroundColor: '#fafafa',
  },
  modalControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  openModalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  openModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
