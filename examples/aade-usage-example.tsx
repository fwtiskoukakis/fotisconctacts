/**
 * EXAMPLE: How to integrate AADE in your contract screens
 * This is a reference implementation - adapt it to your actual screens
 */

import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Contract } from '../models/contract.interface';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { createContractWithAADE, validateGreekVAT } from '../utils/aade-contract-helper';
import { AADEStatusBadge } from '../components/aade-status-badge';
import { VATInput } from '../components/vat-input';

/**
 * Example: New Contract Screen with AADE Integration
 */
export function NewContractExample() {
  const [contract, setContract] = useState<Partial<Contract>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerVat, setCustomerVat] = useState('');

  async function handleSaveContract() {
    // 1. Validate customer VAT
    const vatValidation = validateGreekVAT(customerVat);
    if (!vatValidation.isValid) {
      Alert.alert('Σφάλμα', vatValidation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Create contract object
      const newContract: Contract = {
        ...contract as Contract,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        renterInfo: {
          ...contract.renterInfo!,
          taxId: customerVat,
        },
        createdAt: new Date(),
      };

      // 3. Save to Supabase
      const { id, error: saveError } = await SupabaseContractService.saveContract({
        contract: newContract,
        photoFiles: [],
      });

      if (saveError) {
        throw new Error('Failed to save contract');
      }

      // 4. Submit to AADE
      const aadeResult = await createContractWithAADE(newContract, id!);

      if (aadeResult.success) {
        Alert.alert(
          'Επιτυχία',
          `Το συμβόλαιο δημιουργήθηκε και καταχωρήθηκε στο AADE.\nDCL ID: ${aadeResult.aadeDclId}`,
          [{ text: 'OK', onPress: () => navigateToContractDetails(id!) }]
        );
      } else {
        Alert.alert(
          'Προειδοποίηση',
          `Το συμβόλαιο δημιουργήθηκε αλλά δεν καταχωρήθηκε στο AADE:\n${aadeResult.error}\n\nΜπορείτε να επανυποβάλετε αργότερα.`,
          [{ text: 'OK', onPress: () => navigateToContractDetails(id!) }]
        );
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία δημιουργίας συμβολαίου');
    } finally {
      setIsSubmitting(false);
    }
  }

  function navigateToContractDetails(contractId: string) {
    // Navigate to contract details screen
    console.log('Navigate to:', contractId);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Νέο Συμβόλαιο</Text>

      {/* VAT Input with Validation */}
      <VATInput
        value={customerVat}
        onChangeText={setCustomerVat}
        label="ΑΦΜ Πελάτη *"
        placeholder="Εισάγετε 9ψήφιο ΑΦΜ"
      />

      {/* Other form fields... */}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        onPress={handleSaveContract}
        disabled={isSubmitting}
      >
        <Text style={styles.saveButtonText}>
          {isSubmitting ? 'Αποθήκευση...' : 'Δημιουργία Συμβολαίου'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Example: Contract Details Screen with AADE Status
 */
export function ContractDetailsExample({ contractData }: { contractData: any }) {
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetryAADE() {
    setIsRetrying(true);

    try {
      // Map database contract to Contract interface
      const contract: Contract = mapDatabaseToContract(contractData);

      const result = await createContractWithAADE(contract, contractData.id);

      if (result.success) {
        Alert.alert('Επιτυχία', 'Το συμβόλαιο καταχωρήθηκε επιτυχώς στο AADE');
        // Reload contract data
      } else {
        Alert.alert('Σφάλμα', result.error || 'Αποτυχία επανυποβολής');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία επανυποβολής');
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Λεπτομέρειες Συμβολαίου</Text>

      {/* AADE Status Badge */}
      <AADEStatusBadge
        status={contractData.aade_status}
        dclId={contractData.aade_dcl_id}
        errorMessage={contractData.aade_error_message}
        onRetry={handleRetryAADE}
      />

      {/* Contract details... */}

      {/* Actions based on AADE status */}
      {contractData.aade_status === 'submitted' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteRental}
        >
          <Text style={styles.completeButtonText}>Ολοκλήρωση Ενοικίασης</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  async function handleCompleteRental() {
    // Implementation for completing rental
    Alert.alert('Info', 'Complete rental implementation');
  }
}

/**
 * Example: AADE Dashboard / Statistics
 */
export function AADEDashboardExample() {
  const [stats, setStats] = useState({
    submitted: 0,
    completed: 0,
    errors: 0,
    pending: 0,
  });

  // Load statistics from database
  // useEffect(() => { ... }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AADE Κατάσταση</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statSubmitted]}>
          <Text style={styles.statNumber}>{stats.submitted}</Text>
          <Text style={styles.statLabel}>Καταχωρημένα</Text>
        </View>

        <View style={[styles.statCard, styles.statCompleted]}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Ολοκληρωμένα</Text>
        </View>

        <View style={[styles.statCard, styles.statPending]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Εκκρεμή</Text>
        </View>

        <View style={[styles.statCard, styles.statError]}>
          <Text style={styles.statNumber}>{stats.errors}</Text>
          <Text style={styles.statLabel}>Σφάλματα</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Helper: Map database contract to Contract interface
 */
function mapDatabaseToContract(dbContract: any): Contract {
  return {
    id: dbContract.id,
    renterInfo: {
      fullName: dbContract.renter_full_name,
      idNumber: dbContract.renter_id_number,
      taxId: dbContract.renter_tax_id,
      driverLicenseNumber: dbContract.renter_driver_license_number,
      phoneNumber: dbContract.renter_phone_number,
      email: dbContract.renter_email || '',
      address: dbContract.renter_address,
    },
    rentalPeriod: {
      pickupDate: new Date(dbContract.pickup_date),
      pickupTime: dbContract.pickup_time,
      pickupLocation: dbContract.pickup_location,
      dropoffDate: new Date(dbContract.dropoff_date),
      dropoffTime: dbContract.dropoff_time,
      dropoffLocation: dbContract.dropoff_location,
      isDifferentDropoffLocation: dbContract.is_different_dropoff_location,
      totalCost: parseFloat(dbContract.total_cost),
    },
    carInfo: {
      makeModel: dbContract.car_make_model,
      year: dbContract.car_year,
      licensePlate: dbContract.car_license_plate,
      mileage: dbContract.car_mileage,
    },
    carCondition: {
      fuelLevel: dbContract.fuel_level,
      mileage: dbContract.car_mileage,
      insuranceType: dbContract.insurance_type,
    },
    damagePoints: [],
    photoUris: [],
    clientSignature: dbContract.client_signature_url || '',
    userId: dbContract.user_id,
    createdAt: new Date(dbContract.created_at),
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statSubmitted: {
    backgroundColor: '#28a745',
  },
  statCompleted: {
    backgroundColor: '#007AFF',
  },
  statPending: {
    backgroundColor: '#ffc107',
  },
  statError: {
    backgroundColor: '#dc3545',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});

