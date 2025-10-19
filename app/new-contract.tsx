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
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Contract, RenterInfo, RentalPeriod, CarInfo, CarCondition, DamagePoint, DamageMarkerType, User } from '../models/contract.interface';
import { ContractTemplate } from '../models/contract-template.interface';
import { SignaturePad } from '../components/signature-pad';
import { CarDiagram } from '../components/car-diagram';
import { PhotoCapture } from '../components/photo-capture';
import { ContractTemplateSelector } from '../components/contract-template-selector';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { AuthService } from '../services/auth.service';
import { ContractTemplateService } from '../services/contract-template.service';
import { format } from 'date-fns';
import Svg, { Path } from 'react-native-svg';

type CarView = 'front' | 'rear' | 'left' | 'right';

/**
 * Compact contract creation screen optimized for mobile use
 */
export default function NewContractScreen() {
  const router = useRouter();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  
  // Essential fields only
  const [renterInfo, setRenterInfo] = useState<RenterInfo>({
    fullName: '',
    idNumber: '',
    taxId: '',
    driverLicenseNumber: '',
    phoneNumber: '',
    email: '',
    address: '',
  });

  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>({
    pickupDate: new Date(),
    pickupTime: format(new Date(), 'HH:mm'),
    pickupLocation: '',
    dropoffDate: new Date(),
    dropoffTime: format(new Date(), 'HH:mm'),
    dropoffLocation: '',
    isDifferentDropoffLocation: false,
    totalCost: 0,
  });

  const [carInfo, setCarInfo] = useState<CarInfo>({
    makeModel: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    mileage: 0,
  });

  const [carCondition, setCarCondition] = useState<CarCondition>({
    fuelLevel: 8, // Full tank by default
    mileage: 0,
    insuranceType: 'basic',
  });

  const [damagePoints, setDamagePoints] = useState<DamagePoint[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [clientSignature, setClientSignature] = useState<string>('');
  const [clientSignaturePaths, setClientSignaturePaths] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Date picker states
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDropoffDatePicker, setShowDropoffDatePicker] = useState(false);

  function handleSelectTemplate(template: ContractTemplate) {
    setSelectedTemplate(template);
    applyTemplateData(template);
  }

  function applyTemplateData(template: ContractTemplate) {
    const templateData = template.templateData;
    
    // Apply template defaults
    setRentalPeriod(prev => ({
      ...prev,
      pickupTime: templateData.defaultPickupTime,
      dropoffTime: templateData.defaultDropoffTime,
      pickupLocation: templateData.defaultPickupLocation,
      dropoffLocation: templateData.defaultDropoffLocation,
      depositAmount: templateData.depositAmount,
      insuranceCost: templateData.insuranceCost,
    }));

    // Set car condition defaults
    setCarCondition(prev => ({
      ...prev,
      fuelLevel: templateData.minimumFuelLevel,
    }));

    Alert.alert(
      'Πρότυπο Εφαρμόστηκε',
      `Το πρότυπο "${template.name}" εφαρμόστηκε επιτυχώς. Μπορείτε να τροποποιήσετε τα στοιχεία αν χρειάζεται.`
    );
  }

  function handleCreateCustom() {
    setShowTemplateSelector(false);
    // Continue with manual contract creation
  }

  function handleSignatureSave(uri: string) {
    setClientSignature(uri);
    
    try {
      // Decode base64 data URI to get SVG content
      // URI format: data:image/svg+xml;base64,XXX
      if (uri.startsWith('data:image/svg+xml;base64,')) {
        const base64Data = uri.split(',')[1];
        const svgContent = decodeURIComponent(escape(atob(base64Data)));
        
        // Extract paths from SVG content
        const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
        if (pathMatches) {
          const paths = pathMatches.map(match => {
            const dMatch = match.match(/d="([^"]*)"/);
            return dMatch ? dMatch[1] : '';
          }).filter(path => path !== '');
          setClientSignaturePaths(paths);
          console.log('Extracted signature paths:', paths);
        }
      }
    } catch (error) {
      console.error('Error parsing signature data:', error);
    }
  }

  function handleAddDamage(x: number, y: number, view: CarView, markerType: DamageMarkerType) {
    // Generate a simple unique ID for damage points (not UUID required)
    const newDamage: DamagePoint = {
      id: `damage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      view,
      description: '',
      severity: 'minor',
      markerType,
      timestamp: new Date(),
    };
    setDamagePoints([...damagePoints, newDamage]);
  }

  function handleRemoveLastDamage() {
    if (damagePoints.length > 0) {
      setDamagePoints(damagePoints.slice(0, -1));
    }
  }

  function handlePhotoTaken(uri: string) {
    setPhotos([...photos, uri]);
  }

  function validateContract(): boolean {
    // Only essential fields are mandatory
    if (!renterInfo.fullName.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε το ονοματεπώνυμο');
      return false;
    }
    if (!renterInfo.idNumber.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον αριθμό ταυτότητας');
      return false;
    }
    if (!renterInfo.taxId.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον ΑΦΜ');
      return false;
    }
    if (!renterInfo.driverLicenseNumber.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον αριθμό διπλώματος οδήγησης');
      return false;
    }
    if (!renterInfo.phoneNumber.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον αριθμό τηλεφώνου');
      return false;
    }
    if (!renterInfo.address.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τη διεύθυνση');
      return false;
    }
    if (!carInfo.licensePlate.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε την πινακίδα');
      return false;
    }
    if (!rentalPeriod.pickupLocation.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε την τοποθεσία παραλαβής');
      return false;
    }
    if (rentalPeriod.isDifferentDropoffLocation && !rentalPeriod.dropoffLocation.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε την τοποθεσία επιστροφής');
      return false;
    }
    if (rentalPeriod.totalCost <= 0) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε το συνολικό κόστος');
      return false;
    }
    if (!clientSignature.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ προσθέστε την υπογραφή του ενοικιαστή');
      return false;
    }
    return true;
  }

  async function handleSaveContract() {
    if (!validateContract()) {
      return;
    }

    setIsSaving(true);

    try {
      // Get the current authenticated user
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Σφάλμα', 'Δεν είστε συνδεδεμένος. Παρακαλώ συνδεθείτε πρώτα.');
        setIsSaving(false);
        return;
      }

      const finalDropoffLocation = rentalPeriod.isDifferentDropoffLocation
        ? rentalPeriod.dropoffLocation
        : rentalPeriod.pickupLocation;

      // Determine contract status based on dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pickupDate = new Date(rentalPeriod.pickupDate);
      pickupDate.setHours(0, 0, 0, 0);
      const dropoffDate = new Date(rentalPeriod.dropoffDate);
      dropoffDate.setHours(0, 0, 0, 0);

      let status: 'active' | 'completed' | 'upcoming';
      if (today < pickupDate) {
        status = 'upcoming';
      } else if (today > dropoffDate) {
        status = 'completed';
      } else {
        status = 'active';
      }

      // Generate a proper UUID v4
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const contract: Contract = {
        id: generateUUID(),
        renterInfo,
        rentalPeriod: {
          ...rentalPeriod,
          dropoffLocation: finalDropoffLocation,
        },
        carInfo,
        carCondition,
        damagePoints,
        photoUris: photos,
        clientSignature,
        userId: currentUser.id, // Use authenticated user's ID
        status,
        createdAt: new Date(),
      };

      await SupabaseContractService.saveContract(contract);
      Alert.alert('Επιτυχία', 'Το συμβόλαιο αποθηκεύτηκε επιτυχώς!', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/contracts')
        }
      ]);
    } catch (error) {
      console.error('Error saving contract:', error);
      Alert.alert('Σφάλμα', `Αποτυχία αποθήκευσης συμβολαίου: ${error}`);
    } finally {
      setIsSaving(false);
    }
  }

  const onPickupDateChange = (event: any, selectedDate?: Date) => {
    setShowPickupDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setRentalPeriod((prev) => ({ ...prev, pickupDate: selectedDate }));
    }
  };

  const onDropoffDateChange = (event: any, selectedDate?: Date) => {
    setShowDropoffDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setRentalPeriod((prev) => ({ ...prev, dropoffDate: selectedDate }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Πίσω</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Νέο Συμβόλαιο Ενοικίασης</Text>
        </View>

        {/* Template Selection */}
        <View style={styles.section}>
          <View style={styles.templateHeader}>
            <Text style={styles.sectionTitle}>📋 Πρότυπο Συμβολαίου</Text>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={() => setShowTemplateSelector(true)}
            >
              <Text style={styles.templateButtonText}>
                {selectedTemplate ? 'Αλλαγή Προτύπου' : 'Επιλογή Προτύπου'}
              </Text>
            </TouchableOpacity>
          </View>
          {selectedTemplate && (
            <View style={styles.selectedTemplate}>
              <Text style={styles.selectedTemplateName}>{selectedTemplate.name}</Text>
              <Text style={styles.selectedTemplateDescription}>{selectedTemplate.description}</Text>
              <View style={styles.templateDetails}>
                <Text style={styles.templateDetail}>Κατηγορία: {selectedTemplate.category}</Text>
                <Text style={styles.templateDetail}>Κόστος: €{selectedTemplate.templateData.baseDailyRate}/ημέρα</Text>
              </View>
            </View>
          )}
        </View>

        {/* 1. Essential Renter Info - Compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Στοιχεία Ενοικιαστή</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Ονοματεπώνυμο *"
              value={renterInfo.fullName}
              onChangeText={(text) => setRenterInfo({ ...renterInfo, fullName: text })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="ΑΔΤ/Διαβατήριο *"
              value={renterInfo.idNumber}
              onChangeText={(text) => setRenterInfo({ ...renterInfo, idNumber: text })}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="ΑΦΜ *"
              value={renterInfo.taxId}
              onChangeText={(text) => setRenterInfo({ ...renterInfo, taxId: text })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Δίπλωμα Οδήγησης *"
              value={renterInfo.driverLicenseNumber}
              onChangeText={(text) => setRenterInfo({ ...renterInfo, driverLicenseNumber: text })}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Τηλέφωνο *"
              keyboardType="phone-pad"
              value={renterInfo.phoneNumber}
              onChangeText={(text) => setRenterInfo({ ...renterInfo, phoneNumber: text })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Διεύθυνση *"
              value={renterInfo.address}
              onChangeText={(text) => setRenterInfo({ ...renterInfo, address: text })}
            />
          </View>
        </View>

        {/* 2. Rental Period - Compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Περίοδος Ενοικίασης</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Παραλαβή *</Text>
              <TouchableOpacity onPress={() => setShowPickupDatePicker(true)} style={styles.dateButton}>
                <Text style={styles.dateText}>{format(rentalPeriod.pickupDate, 'dd/MM')}</Text>
              </TouchableOpacity>
              {showPickupDatePicker && (
                <DateTimePicker
                  value={rentalPeriod.pickupDate}
                  mode="date"
                  display="default"
                  onChange={onPickupDateChange}
                />
              )}
              <TextInput
                style={styles.timeInput}
                placeholder="10:00"
                value={rentalPeriod.pickupTime}
                onChangeText={(text) => setRentalPeriod({ ...rentalPeriod, pickupTime: text })}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Επιστροφή *</Text>
              <TouchableOpacity onPress={() => setShowDropoffDatePicker(true)} style={styles.dateButton}>
                <Text style={styles.dateText}>{format(rentalPeriod.dropoffDate, 'dd/MM')}</Text>
              </TouchableOpacity>
              {showDropoffDatePicker && (
                <DateTimePicker
                  value={rentalPeriod.dropoffDate}
                  mode="date"
                  display="default"
                  onChange={onDropoffDateChange}
                />
              )}
              <TextInput
                style={styles.timeInput}
                placeholder="18:00"
                value={rentalPeriod.dropoffTime}
                onChangeText={(text) => setRentalPeriod({ ...rentalPeriod, dropoffTime: text })}
              />
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Τοποθεσία παραλαβής *"
            value={rentalPeriod.pickupLocation}
            onChangeText={(text) => setRentalPeriod({ ...rentalPeriod, pickupLocation: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Συνολικό Κόστος (€) *"
            keyboardType="numeric"
            value={rentalPeriod.totalCost > 0 ? rentalPeriod.totalCost.toString() : ''}
            onChangeText={(text) => setRentalPeriod({ ...rentalPeriod, totalCost: parseFloat(text) || 0 })}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Διαφορετική τοποθεσία επιστροφής</Text>
            <Switch
              onValueChange={(value) => setRentalPeriod({ ...rentalPeriod, isDifferentDropoffLocation: value })}
              value={rentalPeriod.isDifferentDropoffLocation}
            />
          </View>

          {rentalPeriod.isDifferentDropoffLocation && (
            <TextInput
              style={styles.input}
              placeholder="Τοποθεσία επιστροφής *"
              value={rentalPeriod.dropoffLocation}
              onChangeText={(text) => setRentalPeriod({ ...rentalPeriod, dropoffLocation: text })}
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
              value={carInfo.makeModel}
              onChangeText={(text) => setCarInfo({ ...carInfo, makeModel: text })}
            />
            <TextInput
              style={[styles.input, styles.halfWidth]}
              placeholder="Πινακίδα *"
              value={carInfo.licensePlate}
              onChangeText={(text) => setCarInfo({ ...carInfo, licensePlate: text })}
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
                      { width: `${(carCondition.fuelLevel / 8) * 100}%` }
                    ]} />
                  </View>
                  <Text style={styles.fuelLevelText}>{carCondition.fuelLevel}/8</Text>
                </View>
                <View style={styles.fuelButtons}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.fuelButton,
                        carCondition.fuelLevel >= level && styles.fuelButtonActive
                      ]}
                      onPress={() => setCarCondition({ ...carCondition, fuelLevel: level })}
                    >
                      <Text style={[
                        styles.fuelText,
                        carCondition.fuelLevel >= level && styles.fuelTextActive
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
                placeholder="50000"
                keyboardType="numeric"
                value={carCondition.mileage.toString()}
                onChangeText={(text) => setCarCondition({ ...carCondition, mileage: parseInt(text) || 0 })}
              />
            </View>
          </View>

          <View style={styles.insuranceContainer}>
            <Text style={styles.label}>Ασφάλεια *</Text>
            <View style={styles.insuranceButtons}>
              <TouchableOpacity
                style={[
                  styles.insuranceButton,
                  carCondition.insuranceType === 'basic' && styles.insuranceButtonActive
                ]}
                onPress={() => setCarCondition({ ...carCondition, insuranceType: 'basic' })}
              >
                <Text style={[
                  styles.insuranceText,
                  carCondition.insuranceType === 'basic' && styles.insuranceTextActive
                ]}>
                  Βασική
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.insuranceButton,
                  carCondition.insuranceType === 'full' && styles.insuranceButtonActive
                ]}
                onPress={() => setCarCondition({ ...carCondition, insuranceType: 'full' })}
              >
                <Text style={[
                  styles.insuranceText,
                  carCondition.insuranceType === 'full' && styles.insuranceTextActive
                ]}>
                  Πλήρης
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. Car Diagram - Compact */}
        <View style={styles.section}>
          <CarDiagram 
            onAddDamage={handleAddDamage} 
            onRemoveLastDamage={handleRemoveLastDamage}
            damagePoints={damagePoints} 
          />
        </View>

        {/* 5. Photos - Compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Φωτογραφίες</Text>
          <PhotoCapture onPhotoTaken={handlePhotoTaken} photos={photos} />
        </View>

        {/* 6. Client Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Υπογραφή Ενοικιαστή</Text>
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureLabel}>Υπογραφή Ενοικιαστή *</Text>
            <View style={styles.signatureBox}>
              {clientSignaturePaths.length > 0 ? (
                <View style={styles.signaturePreview}>
                  <Svg width="100%" height="100%" style={styles.signatureSvg} viewBox="0 0 300 200">
                    {clientSignaturePaths.map((path, index) => (
                      <Path
                        key={index}
                        d={path}
                        stroke="black"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </Svg>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => {
                      setClientSignature('');
                      setClientSignaturePaths([]);
                    }}
                  >
                    <Text style={styles.retakeButtonText}>Αλλαγή Υπογραφής</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.signatureCapture}>
                  <SignaturePad
                    onSignatureSave={handleSignatureSave}
                    initialSignature={clientSignature}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveContract}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Αποθήκευση...' : 'Αποθήκευση Συμβολαίου'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Template Selector Modal */}
      <ContractTemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateCustom={handleCreateCustom}
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
    padding: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  userButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  templateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedTemplate: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  selectedTemplateName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  selectedTemplateDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  templateDetail: {
    fontSize: 11,
    color: '#666',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    marginTop: 5,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
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
    color: '#666',
    fontWeight: 'bold',
  },
  fuelTextActive: {
    color: '#fff',
  },
  insuranceContainer: {
    marginTop: 10,
  },
  insuranceButtons: {
    flexDirection: 'row',
    marginTop: 5,
  },
  insuranceButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  insuranceButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  insuranceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  insuranceTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#a0c8ff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signatureContainer: {
    marginTop: 10,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  signatureBox: {
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  signaturePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  signatureCapture: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signatureSvg: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
  },
  signaturePlaceholder: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});