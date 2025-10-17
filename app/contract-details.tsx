import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Contract, DamagePoint, User } from '../models/contract.interface';
import { ContractStorageService } from '../services/contract-storage.service';
import { UserStorageService } from '../services/user-storage.service';
import { PDFGenerationService } from '../services/pdf-generation.service';
import { ImageModal } from '../components/image-modal';
import { format } from 'date-fns';

/**
 * Screen for viewing contract details with photos
 */
export default function ContractDetailsScreen() {
  const router = useRouter();
  const { contractId } = useLocalSearchParams();
  const [contract, setContract] = React.useState<Contract | null>(null);
  const [selectedImageUri, setSelectedImageUri] = React.useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  React.useEffect(() => {
    async function loadContract() {
      if (typeof contractId === 'string') {
        const loadedContract = await ContractStorageService.getContractById(contractId);
        if (loadedContract) {
          setContract(loadedContract);
          // Load user who created the contract
          const contractUser = await UserStorageService.getUserById(loadedContract.userId || 'default-user');
          setUser(contractUser);
        } else {
          Alert.alert('Σφάλμα', 'Το συμβόλαιο δεν βρέθηκε.');
          router.back();
        }
      }
    }
    loadContract();
  }, [contractId]);

  function handleImagePress(imageUri: string) {
    setSelectedImageUri(imageUri);
    setIsImageModalVisible(true);
  }

  function handleCloseImageModal() {
    setIsImageModalVisible(false);
    setSelectedImageUri(null);
  }

  async function handleGeneratePDF() {
    if (!contract || !user) {
      Alert.alert('Σφάλμα', 'Δεν είναι δυνατή η δημιουργία PDF');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const pdfUri = await PDFGenerationService.generateContractPDF(contract, user);
      await PDFGenerationService.sharePDF(pdfUri);
      Alert.alert('Επιτυχία', 'Το PDF δημιουργήθηκε και μοιράστηκε επιτυχώς!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία δημιουργίας PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  async function handleDeleteContract() {

    Alert.alert(
      'Διαγραφή Συμβολαίου',
      'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το συμβόλαιο;',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            await ContractStorageService.deleteContract(contract.id);
            router.back();
          },
        },
      ]
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Φόρτωση συμβολαίου...</Text>
      </SafeAreaView>
    );
  }

  const damagePointsByView = contract.damagePoints.reduce((acc, damage) => {
    (acc[damage.view] = acc[damage.view] || []).push(damage);
    return acc;
  }, {} as Record<DamagePoint['view'], DamagePoint[]>);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Πίσω</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Λεπτομέρειες Συμβολαίου</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity onPress={() => router.push(`/edit-contract?contractId=${contract.id}`)} style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️ Επεξεργασία</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleGeneratePDF} 
            style={[styles.pdfButton, isGeneratingPDF && styles.pdfButtonDisabled]}
            disabled={isGeneratingPDF}
          >
            <Text style={styles.pdfButtonText}>
              {isGeneratingPDF ? 'Δημιουργία...' : '📄 PDF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteContract} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>🗑️ Διαγραφή</Text>
          </TouchableOpacity>
        </View>

        {/* Renter Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Στοιχεία Ενοικιαστή</Text>
          <Text style={styles.detailText}>Ονοματεπώνυμο: {contract.renterInfo.fullName}</Text>
          <Text style={styles.detailText}>ΑΔΤ/Διαβατήριο: {contract.renterInfo.idNumber}</Text>
          <Text style={styles.detailText}>ΑΦΜ: {contract.renterInfo.taxId || 'N/A'}</Text>
          <Text style={styles.detailText}>Δίπλωμα Οδήγησης: {contract.renterInfo.driverLicenseNumber || 'N/A'}</Text>
          <Text style={styles.detailText}>Τηλέφωνο: {contract.renterInfo.phoneNumber}</Text>
          <Text style={styles.detailText}>Email: {contract.renterInfo.email}</Text>
          <Text style={styles.detailText}>Διεύθυνση: {contract.renterInfo.address}</Text>
        </View>

        {/* Rental Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Περίοδος Ενοικίασης</Text>
          <Text style={styles.detailText}>Παραλαβή: {contract.rentalPeriod.pickupDate ? format(new Date(contract.rentalPeriod.pickupDate), 'dd/MM/yyyy') : 'N/A'} {contract.rentalPeriod.pickupTime} @ {contract.rentalPeriod.pickupLocation}</Text>
          <Text style={styles.detailText}>Επιστροφή: {contract.rentalPeriod.dropoffDate ? format(new Date(contract.rentalPeriod.dropoffDate), 'dd/MM/yyyy') : 'N/A'} {contract.rentalPeriod.dropoffTime} @ {contract.rentalPeriod.dropoffLocation}</Text>
          <Text style={styles.detailText}>Συνολικό Κόστος: €{contract.rentalPeriod.totalCost || 0}</Text>
        </View>

        {/* Car Info & Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Στοιχεία Οχήματος & Κατάσταση</Text>
          <Text style={styles.detailText}>Μάρκα & Μοντέλο: {contract.carInfo.makeModel || `${contract.carInfo.make || ''} ${contract.carInfo.model || ''}`.trim()}</Text>
          <Text style={styles.detailText}>Έτος: {contract.carInfo.year}</Text>
          <Text style={styles.detailText}>Πινακίδα: {contract.carInfo.licensePlate}</Text>
          <Text style={styles.detailText}>Καύσιμο: {contract.carCondition?.fuelLevel || 'N/A'}/8</Text>
          <Text style={styles.detailText}>Χιλιόμετρα: {contract.carCondition?.mileage || contract.carInfo.mileage || 'N/A'}</Text>
          <Text style={styles.detailText}>Ασφάλεια: {contract.carCondition?.insuranceType === 'basic' ? 'Βασική' : contract.carCondition?.insuranceType === 'full' ? 'Πλήρης' : 'N/A'}</Text>
        </View>

        {/* Damage Points */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Καταγεγραμμένες Ζημιές</Text>
          {Object.keys(damagePointsByView).length === 0 ? (
            <Text style={styles.noDataText}>Δεν έχουν καταγραφεί ζημιές.</Text>
          ) : (
            Object.entries(damagePointsByView).map(([view, damages]) => (
              <View key={view} style={styles.damageViewSection}>
                <Text style={styles.damageViewTitle}>
                  {view === 'front' ? 'Μπροστινή' : 
                   view === 'rear' ? 'Πίσω' : 
                   view === 'left' ? 'Αριστερή' : 'Δεξιά'} Όψη:
                </Text>
                {damages.map((damage, index) => (
                  <Text key={damage.id} style={styles.damageText}>
                    {index + 1}. Θέση: ({damage.x.toFixed(1)}%, {damage.y.toFixed(1)}%), Σοβαρότητα: {damage.severity}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Φωτογραφίες</Text>
          {contract.photoUris.length === 0 ? (
            <Text style={styles.noDataText}>Δεν υπάρχουν φωτογραφίες.</Text>
          ) : (
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
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
    minHeight: 50,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    numberOfLines: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pdfButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  pdfButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginBottom: 10,
    color: '#555',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  damageViewSection: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#007AFF',
    marginBottom: 10,
  },
  damageViewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#007AFF',
  },
  damageText: {
    fontSize: 14,
    marginBottom: 3,
    color: '#333',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});