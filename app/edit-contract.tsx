import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Contract, RenterInfo, RentalPeriod, CarInfo, DamagePoint, CarCondition } from '../models/contract.interface';
import { CarDiagram } from '../components/car-diagram';
import { PhotoCapture } from '../components/photo-capture';
import { ImageModal } from '../components/image-modal';
import { ContractStorageService } from '../services/contract-storage.service';
import { format } from 'date-fns';

type CarView = 'front' | 'rear' | 'left' | 'right';

/**
 * Screen for editing an existing rental contract
 */
export default function EditContractScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for date picker visibility
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDropoffDatePicker, setShowDropoffDatePicker] = useState(false);

  // State for image modal
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  useEffect(() => {
    loadContract();
  }, [params.contractId]);

  async function loadContract() {
    try {
      if (!params.contractId || typeof params.contractId !== 'string') {
        Alert.alert('Σφάλμα', 'Μη έγκυρο αναγνωριστικό συμβολαίου');
        router.back();
        return;
      }

      const foundContract = await ContractStorageService.getContractById(params.contractId);
      
      if (foundContract) {
        setContract(foundContract);
      } else {
        Alert.alert('Σφάλμα', 'Το συμβόλαιο δεν βρέθηκε');
        router.back();
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης συμβολαίου');
    } finally {
      setLoading(false);
    }
  }

  function handleAddDamage(x: number, y: number, view: CarView) {
    if (!contract) return;
    
    const newDamage: DamagePoint = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      view,
      description: '',
      severity: 'minor',
      timestamp: new Date(),
    };
    setContract({
      ...contract,
      damagePoints: [...contract.damagePoints, newDamage]
    });
  }

  function handlePhotoTaken(uri: string) {
    if (!contract) return;
    
    setContract({
      ...contract,
      photoUris: [...contract.photoUris, uri]
    });
  }

  function handleImagePress(imageUri: string) {
    setSelectedImageUri(imageUri);
    setIsImageModalVisible(true);
  }

  function handleCloseImageModal() {
    setIsImageModalVisible(false);
    setSelectedImageUri(null);
  }

  function validateContract(): boolean {
    if (!contract) return false;
    
    if (!contract.renterInfo.fullName.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε το ονοματεπώνυμο');
      return false;
    }
    if (!contract.renterInfo.idNumber.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον αριθμό ταυτότητας');
      return false;
    }
    if (!contract.renterInfo.taxId?.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον ΑΦΜ');
      return false;
    }
    if (!contract.renterInfo.driverLicenseNumber?.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον αριθμό διπλώματος οδήγησης');
      return false;
    }
    if (!contract.renterInfo.phoneNumber.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον αριθμό τηλεφώνου');
      return false;
    }
    if (!contract.renterInfo.address.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τη διεύθυνση');
      return false;
    }
    if (!contract.carInfo.licensePlate.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε την πινακίδα');
      return false;
    }
    if (!contract.rentalPeriod.pickupLocation.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε την τοποθεσία παραλαβής');
      return false;
    }
    if (contract.rentalPeriod.isDifferentDropoffLocation && !contract.rentalPeriod.dropoffLocation.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε την τοποθεσία επιστροφής');
      return false;
    }
    if ((contract.rentalPeriod.totalCost || 0) <= 0) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε το συνολικό κόστος');
      return false;
    }
    return true;
  }

  async function handleSaveContract() {
    if (!contract || !validateContract()) {
      return;
    }

    setIsSaving(true);

    const finalDropoffLocation = contract.rentalPeriod.isDifferentDropoffLocation
      ? contract.rentalPeriod.dropoffLocation
      : contract.rentalPeriod.pickupLocation;

    const updatedContract: Contract = {
      ...contract,
      rentalPeriod: {
        ...contract.rentalPeriod,
        dropoffLocation: finalDropoffLocation,
      },
    };

    try {
      await ContractStorageService.saveContract(updatedContract);
      Alert.alert('Επιτυχία', 'Το συμβόλαιο ενημερώθηκε επιτυχώς!');
      router.push('/');
    } catch (error) {
      console.error('Error saving contract:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης συμβολαίου.');
    } finally {
      setIsSaving(false);
    }
  }

  const onPickupDateChange = (event: any, selectedDate?: Date) => {
    setShowPickupDatePicker(Platform.OS === 'ios');
    if (selectedDate && contract) {
      setContract({
        ...contract,
        rentalPeriod: { ...contract.rentalPeriod, pickupDate: selectedDate }
      });
    }
  };

  const onDropoffDateChange = (event: any, selectedDate?: Date) => {
    setShowDropoffDatePicker(Platform.OS === 'ios');
    if (selectedDate && contract) {
      setContract({
        ...contract,
        rentalPeriod: { ...contract.rentalPeriod, dropoffDate: selectedDate }
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Φόρτωση...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Το συμβόλαιο δεν βρέθηκε</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Πίσω</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Επεξεργασία Συμβολαίου</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 1. Essential Renter Info - Compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Στοιχεία Ενοικιαστή</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Ονοματεπώνυμο *"
              value={contract.renterInfo.fullName}
              onChangeText={(text) => setContract({
                ...contract,
                renterInfo: { ...contract.renterInfo, fullName: text }
              })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="ΑΔΤ/Διαβατήριο *"
              value={contract.renterInfo.idNumber}
              onChangeText={(text) => setContract({
                ...contract,
                renterInfo: { ...contract.renterInfo, idNumber: text }
              })}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="ΑΦΜ *"
              value={contract.renterInfo.taxId || ''}
              onChangeText={(text) => setContract({
                ...contract,
                renterInfo: { ...contract.renterInfo, taxId: text }
              })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Δίπλωμα Οδήγησης *"
              value={contract.renterInfo.driverLicenseNumber || ''}
              onChangeText={(text) => setContract({
                ...contract,
                renterInfo: { ...contract.renterInfo, driverLicenseNumber: text }
              })}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Τηλέφωνο *"
              keyboardType="phone-pad"
              value={contract.renterInfo.phoneNumber}
              onChangeText={(text) => setContract({
                ...contract,
                renterInfo: { ...contract.renterInfo, phoneNumber: text }
              })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Διεύθυνση *"
              value={contract.renterInfo.address}
              onChangeText={(text) => setContract({
                ...contract,
                renterInfo: { ...contract.renterInfo, address: text }
              })}
            />
          </View>
        </View>

        {/* 2. Rental Period - Compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Περίοδος Ενοικίασης</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Παραλαβή Ημερομηνία *</Text>
              <TouchableOpacity onPress={() => setShowPickupDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonText}>
                  {format(contract.rentalPeriod.pickupDate, 'dd/MM/yyyy')}
                </Text>
              </TouchableOpacity>
              {showPickupDatePicker && (
                <DateTimePicker
                  value={contract.rentalPeriod.pickupDate}
                  mode="date"
                  display="default"
                  onChange={onPickupDateChange}
                />
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Παραλαβή Ώρα *</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. 10:00"
                value={contract.rentalPeriod.pickupTime}
                onChangeText={(text) => setContract({
                  ...contract,
                  rentalPeriod: { ...contract.rentalPeriod, pickupTime: text }
                })}
              />
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Τοποθεσία Παραλαβής *"
            value={contract.rentalPeriod.pickupLocation}
            onChangeText={(text) => setContract({
              ...contract,
              rentalPeriod: { ...contract.rentalPeriod, pickupLocation: text }
            })}
          />

          <TextInput
            style={styles.input}
            placeholder="Συνολικό Κόστος (€) *"
            keyboardType="numeric"
            value={(contract.rentalPeriod.totalCost || 0) > 0 ? (contract.rentalPeriod.totalCost || 0).toString() : ''}
            onChangeText={(text) => setContract({
              ...contract,
              rentalPeriod: { ...contract.rentalPeriod, totalCost: parseFloat(text) || 0 }
            })}
          />

          {/* Dropoff Location Toggle */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Διαφορετική τοποθεσία επιστροφής</Text>
            <Switch
              onValueChange={(value) => setContract({
                ...contract,
                rentalPeriod: { ...contract.rentalPeriod, isDifferentDropoffLocation: value }
              })}
              value={contract.rentalPeriod.isDifferentDropoffLocation}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Επιστροφή Ημερομηνία *</Text>
              <TouchableOpacity onPress={() => setShowDropoffDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonText}>
                  {format(contract.rentalPeriod.dropoffDate, 'dd/MM/yyyy')}
                </Text>
              </TouchableOpacity>
              {showDropoffDatePicker && (
                <DateTimePicker
                  value={contract.rentalPeriod.dropoffDate}
                  mode="date"
                  display="default"
                  onChange={onDropoffDateChange}
                />
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Επιστροφή Ώρα *</Text>
              <TextInput
                style={styles.input}
                placeholder="π.χ. 18:00"
                value={contract.rentalPeriod.dropoffTime}
                onChangeText={(text) => setContract({
                  ...contract,
                  rentalPeriod: { ...contract.rentalPeriod, dropoffTime: text }
                })}
              />
            </View>
          </View>

          {contract.rentalPeriod.isDifferentDropoffLocation && (
            <TextInput
              style={styles.input}
              placeholder="Τοποθεσία Επιστροφής *"
              value={contract.rentalPeriod.dropoffLocation}
              onChangeText={(text) => setContract({
                ...contract,
                rentalPeriod: { ...contract.rentalPeriod, dropoffLocation: text }
              })}
            />
          )}
        </View>

        {/* 3. Car Info & Condition - Compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Όχημα & Κατάσταση</Text>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Μάρκα & Μοντέλο"
              value={contract.carInfo.makeModel || `${contract.carInfo.make || ''} ${contract.carInfo.model || ''}`.trim()}
              onChangeText={(text) => setContract({
                ...contract,
                carInfo: { ...contract.carInfo, makeModel: text }
              })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Πινακίδα *"
              value={contract.carInfo.licensePlate}
              onChangeText={(text) => setContract({
                ...contract,
                carInfo: { ...contract.carInfo, licensePlate: text }
              })}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Καύσιμο *</Text>
              <View style={styles.fuelContainer}>
                <View style={styles.fuelBarContainer}>
                  <View style={styles.fuelBar}>
                    <View style={[
                      styles.fuelBarFill, 
                      { width: `${((contract.carCondition?.fuelLevel || 8) / 8) * 100}%` }
                    ]} />
                  </View>
                  <Text style={styles.fuelLevelText}>{contract.carCondition?.fuelLevel || 8}/8</Text>
                </View>
                <View style={styles.fuelButtons}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.fuelButton,
                        (contract.carCondition?.fuelLevel || 8) >= level && styles.fuelButtonActive,
                      ]}
                      onPress={() => setContract({
                        ...contract,
                        carCondition: { 
                          fuelLevel: level,
                          mileage: contract.carCondition?.mileage || 0,
                          insuranceType: contract.carCondition?.insuranceType || 'basic'
                        }
                      })}
                    >
                      <Text style={[
                        styles.fuelText,
                        (contract.carCondition?.fuelLevel || 8) >= level && styles.fuelTextActive,
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Χιλιόμετρα *</Text>
              <TextInput
                style={styles.input}
                placeholder="Χιλιόμετρα"
                keyboardType="numeric"
                value={(contract.carCondition?.mileage || 0).toString()}
                onChangeText={(text) => setContract({
                  ...contract,
                  carCondition: { 
                    fuelLevel: contract.carCondition?.fuelLevel || 8,
                    mileage: parseInt(text) || 0,
                    insuranceType: contract.carCondition?.insuranceType || 'basic'
                  }
                })}
              />
            </View>
          </View>

          <Text style={styles.label}>Ασφάλιση *</Text>
          <View style={styles.insuranceToggleContainer}>
            <TouchableOpacity
              style={[styles.insuranceToggleButton, (contract.carCondition?.insuranceType || 'basic') === 'basic' && styles.activeInsuranceButton]}
              onPress={() => setContract({
                ...contract,
                carCondition: { 
                  fuelLevel: contract.carCondition?.fuelLevel || 8,
                  mileage: contract.carCondition?.mileage || 0,
                  insuranceType: 'basic'
                }
              })}
            >
              <Text style={[styles.insuranceButtonText, (contract.carCondition?.insuranceType || 'basic') === 'basic' && styles.activeInsuranceButtonText]}>
                Βασική
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.insuranceToggleButton, (contract.carCondition?.insuranceType || 'basic') === 'full' && styles.activeInsuranceButton]}
              onPress={() => setContract({
                ...contract,
                carCondition: { 
                  fuelLevel: contract.carCondition?.fuelLevel || 8,
                  mileage: contract.carCondition?.mileage || 0,
                  insuranceType: 'full'
                }
              })}
            >
              <Text style={[styles.insuranceButtonText, (contract.carCondition?.insuranceType || 'basic') === 'full' && styles.activeInsuranceButtonText]}>
                Πλήρης
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Car Diagram for Damages */}
        <View style={styles.section}>
          <CarDiagram onAddDamage={handleAddDamage} damagePoints={contract.damagePoints} />
        </View>

        {/* 5. Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Φωτογραφίες</Text>
          <PhotoCapture onPhotoTaken={handlePhotoTaken} photos={contract.photoUris} />
          {contract.photoUris.length > 0 && (
            <View style={styles.photoGrid}>
              {contract.photoUris.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleImagePress(uri)}
                  style={styles.photoContainer}
                >
                  <Image source={{ uri }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Save Button (Bottom) */}
        <TouchableOpacity
          style={[styles.saveButtonBottom, isSaving && styles.saveButtonBottomDisabled]}
          onPress={handleSaveContract}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonBottomText}>{isSaving ? 'Αποθήκευση...' : 'Ενημέρωση Συμβολαίου'}</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <ImageModal
        visible={isImageModalVisible}
        imageUri={selectedImageUri}
        onClose={handleCloseImageModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    alignItems: 'flex-start',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingVertical: 5,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  fuelContainer: {
    marginTop: 5,
  },
  fuelBarContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelBar: {
    width: 60,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  fuelBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  fuelLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  fuelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  fuelButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  fuelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555',
  },
  fuelTextActive: {
    color: '#fff',
  },
  insuranceToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    marginTop: 10,
  },
  insuranceToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeInsuranceButton: {
    backgroundColor: '#007AFF',
  },
  insuranceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  activeInsuranceButtonText: {
    color: '#fff',
  },
  saveButtonBottom: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  saveButtonBottomText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButtonBottomDisabled: {
    backgroundColor: '#a0c8ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});
