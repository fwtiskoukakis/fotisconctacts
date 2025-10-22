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
import { ContractTemplateSelector } from '../components/contract-template-selector';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { AuthService } from '../services/auth.service';
import { PhotoStorageService } from '../services/photo-storage.service';
import { CarService } from '../services/car.service';
import Svg, { Path } from 'react-native-svg';
import { format } from 'date-fns/format';
import * as ImagePicker from 'expo-image-picker';

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
    phone: '', // Add missing phone property
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
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    mileage: 0,
  });

  const [carCondition, setCarCondition] = useState<CarCondition>({
    fuelLevel: 8, // Full tank by default
    mileage: 0,
    insuranceType: 'basic',
    exteriorCondition: 'Καλή',
    interiorCondition: 'Καλή',
    mechanicalCondition: 'Καλή',
  });

  const [damagePoints, setDamagePoints] = useState<DamagePoint[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [clientSignature, setClientSignature] = useState<string>('');
  const [clientSignaturePaths, setClientSignaturePaths] = useState<string[]>([]);
  const [observations, setObservations] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [previousDamages, setPreviousDamages] = useState<any[]>([]);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);

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

  /**
   * Handle license plate change and auto-populate vehicle data
   */
  async function handleLicensePlateChange(plate: string) {
    // Update the license plate
    setCarInfo(prev => ({ ...prev, licensePlate: plate }));
    
    // Only search if plate has enough characters
    if (plate.length < 3) {
      setPreviousDamages([]);
      return;
    }
    
    try {
      setIsLoadingVehicle(true);
      
      // Search for car by license plate
      const car = await CarService.getCarByPlate(plate);
      
      if (car) {
        // Auto-fill car information
        const makeModel = `${car.make} ${car.model}`;
        setCarInfo(prev => ({
          ...prev,
          makeModel,
          make: car.make,
          model: car.model,
          year: car.year || new Date().getFullYear(),
          licensePlate: plate,
          category: car.category || undefined,
          color: car.color || undefined,
        }));
        
        // TODO: Load previous damages from damage_points table by license plate
        setPreviousDamages([]);
        
        // Show alert with car info
        Alert.alert(
          'Όχημα Βρέθηκε',
          `${makeModel} (${car.year})`,
          [{ text: 'OK' }]
        );
      } else {
        // No car found - clear previous damages
        setPreviousDamages([]);
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      setPreviousDamages([]);
    } finally {
      setIsLoadingVehicle(false);
    }
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

  // Photo handling functions
  async function handleCapturePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Σφάλμα', 'Η εφαρμογή χρειάζεται άδεια πρόσβασης στην κάμερα.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setPhotos(prev => [...prev, uri]);
    }
  }

  async function handleUploadFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Σφάλμα', 'Η εφαρμογή χρειάζεται άδεια για πρόσβαση στη συλλογή.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setPhotos(prev => [...prev, uri]);
    }
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    // Also remove from uploaded URLs if they exist
    if (uploadedPhotoUrls.length > 0) {
      setUploadedPhotoUrls(prev => prev.filter((_, i) => i !== index));
    }
  }

  async function handleSavePhotosToStorage() {
    if (photos.length === 0) {
      Alert.alert('Προσοχή', 'Δεν υπάρχουν φωτογραφίες για αποθήκευση.');
      return;
    }

    setIsUploadingPhotos(true);

    try {
      // Generate a temporary contract ID for photo upload
      const tempContractId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Upload photos to Supabase
      const uploadResults = await PhotoStorageService.uploadContractPhotos(tempContractId, photos);

      if (uploadResults.length > 0) {
        // Extract URLs from upload results
        const uploadedUrls = uploadResults.map(result => result.url);
        setUploadedPhotoUrls(uploadedUrls);

        Alert.alert(
          'Επιτυχία',
          `Αποθηκεύτηκαν ${uploadedUrls.length} φωτογραφίες επιτυχώς στο Supabase!\n\nΟι φωτογραφίες θα χρησιμοποιηθούν αυτόματα όταν αποθηκεύσετε το συμβόλαιο.`
        );
      } else {
        Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αποθήκευση των φωτογραφιών.');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης φωτογραφιών στο Supabase.');
    } finally {
      setIsUploadingPhotos(false);
    }
  }

  async function uploadPhotosAfterContractSave(contractId: string) {
    if (photos.length === 0) return;

    try {
      // Upload all photos to Supabase with the new contract ID
      const uploadPromises = photos.map((photoUri, index) =>
        PhotoStorageService.uploadContractPhoto(contractId, photoUri, index)
      );

      const results = await Promise.allSettled(uploadPromises);

      // Update contract with uploaded URLs
      const uploadedUrls = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value.url);

      // Update contract with new photo URLs
      const updatedContract = await SupabaseContractService.getContractById(contractId);
      if (updatedContract) {
        await SupabaseContractService.updateContract(contractId, {
          ...updatedContract,
          photoUris: uploadedUrls
        });
      }
    } catch (error) {
      console.error('Error uploading photos after contract save:', error);
      // Continue even if photo upload fails
    }
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
        photoUris: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : photos,
        clientSignature,
        observations,
        userId: currentUser.id, // Use authenticated user's ID
        status,
        createdAt: new Date(),
      };

      await SupabaseContractService.saveContract(contract);

      // Clear uploaded photo URLs since they're now saved with the contract
      setUploadedPhotoUrls([]);
      setPhotos([]);

      Alert.alert('Επιτυχία', 'Το συμβόλαιο αποθηκεύτηκε επιτυχώς!', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/')
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
            <View style={styles.halfWidth}>
              <TextInput
                style={styles.input}
                placeholder="Πινακίδα *"
                value={carInfo.licensePlate}
                onChangeText={handleLicensePlateChange}
                autoCapitalize="characters"
              />
              {isLoadingVehicle && (
                <Text style={styles.helperText}>Αναζήτηση οχήματος...</Text>
              )}
              {previousDamages.length > 0 && !isLoadingVehicle && (
                <Text style={styles.helperTextSuccess}>
                  ✓ {previousDamages.length} προηγούμενες ζημιές
                </Text>
              )}
            </View>
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

          {/* Buttons */}
          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity style={styles.photoButton} onPress={handleCapturePhoto}>
              <Text style={styles.photoButtonText}>📸 Νέα Φωτογραφία</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoButtonSecondary} onPress={handleUploadFromGallery}>
              <Text style={styles.photoButtonText}>🖼️ Από Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.photoPreviewContainer}>
            {photos.length > 0 ? (
              photos.map((uri, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image
                    source={{ uri }}
                    style={[
                      styles.photoPreview,
                      uploadedPhotoUrls.length > 0 && uploadedPhotoUrls.length === photos.length && styles.photoPreviewUploaded
                    ]}
                  />
                  {uploadedPhotoUrls.length > 0 && uploadedPhotoUrls.length === photos.length && (
                    <View style={styles.uploadedIndicator}>
                      <Text style={styles.uploadedIndicatorText}>✓</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.photoPlaceholderText}>Δεν υπάρχουν φωτογραφίες ακόμα</Text>
            )}
          </View>

          {/* Save to Supabase Button */}
          {photos.length > 0 && uploadedPhotoUrls.length !== photos.length && (
            <TouchableOpacity
              style={[styles.photoSaveButton, isUploadingPhotos && styles.photoSaveButtonDisabled]}
              onPress={handleSavePhotosToStorage}
              disabled={isUploadingPhotos}
            >
              <Text style={styles.photoSaveButtonText}>
                {isUploadingPhotos ? 'Αποθήκευση...' : '💾 Αποθήκευση στο Supabase'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Success message when uploaded */}
          {uploadedPhotoUrls.length > 0 && uploadedPhotoUrls.length === photos.length && (
            <View style={styles.uploadSuccessContainer}>
              <Text style={styles.uploadSuccessText}>
                ✓ Όλες οι φωτογραφίες αποθηκεύτηκαν επιτυχώς στο Supabase!
              </Text>
            </View>
          )}
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

        {/* 7. Observations / Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Παρατηρήσεις / Σημειώσεις</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Παρατηρήσεις</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={observations}
              onChangeText={setObservations}
              placeholder="Προσθέστε τυχόν παρατηρήσεις ή σημειώσεις για το συμβόλαιο..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
  helperText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  helperTextSuccess: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputGroup: {
    marginBottom: 15,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    marginRight: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  photoButtonSecondary: {
    flex: 1,
    backgroundColor: '#555',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoPreview: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  photoPreviewUploaded: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  uploadedIndicator: {
    position: 'absolute',
    top: -8,
    right: 25,
    backgroundColor: '#28a745',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadedIndicatorText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  photoSaveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  photoSaveButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  photoSaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadSuccessContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  uploadSuccessText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});