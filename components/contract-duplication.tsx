import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { Contract } from '../models/contract.interface';
import { ContractDuplicationService, ContractDuplicateOptions } from '../services/contract-duplication.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface ContractDuplicationProps {
  visible: boolean;
  onClose: () => void;
  contracts: Contract[];
  onDuplicationComplete: (duplicates: Contract[]) => void;
}

export function ContractDuplication({
  visible,
  onClose,
  contracts,
  onDuplicationComplete,
}: ContractDuplicationProps) {
  const [options, setOptions] = useState<ContractDuplicateOptions>({
    includePhotos: true,
    includeSignatures: true,
    resetDates: true,
    resetStatus: true,
  });
  const [newRenterName, setNewRenterName] = useState('');
  const [newCarMake, setNewCarMake] = useState('');
  const [newCarModel, setNewCarModel] = useState('');
  const [newLicensePlate, setNewLicensePlate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  function handleOptionChange(key: keyof ContractDuplicateOptions, value: boolean) {
    setOptions(prev => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setOptions({
      includePhotos: true,
      includeSignatures: true,
      resetDates: true,
      resetStatus: true,
    });
    setNewRenterName('');
    setNewCarMake('');
    setNewCarModel('');
    setNewLicensePlate('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleDuplicate() {
    try {
      // Validate options
      const validationErrors = ContractDuplicationService.validateDuplicateOptions({
        ...options,
        newRenterName,
        newCarInfo: {
          make: newCarMake,
          model: newCarModel,
          licensePlate: newLicensePlate,
        },
      });

      if (validationErrors.length > 0) {
        Alert.alert('Σφάλμα Επικύρωσης', validationErrors.join('\n'));
        return;
      }

      setIsProcessing(true);

      // Prepare duplication options
      const duplicationOptions: ContractDuplicateOptions = {
        ...options,
        newRenterName: newRenterName.trim() || undefined,
        newCarInfo: {
          make: newCarMake.trim() || undefined,
          model: newCarModel.trim() || undefined,
          licensePlate: newLicensePlate.trim() || undefined,
        },
      };

      // Duplicate contracts
      const duplicates = await ContractDuplicationService.duplicateMultipleContracts(
        contracts,
        duplicationOptions
      );

      Alert.alert(
        'Επιτυχία',
        `${duplicates.length} συμβόλαια αντιγράφηκαν επιτυχώς`,
        [
          {
            text: 'OK',
            onPress: () => {
              onDuplicationComplete(duplicates);
              handleClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error duplicating contracts:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αντιγραφής συμβολαίων');
    } finally {
      setIsProcessing(false);
    }
  }

  function renderContractPreview() {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>
          Αντιγραφή {contracts.length} Συμβολαίων
        </Text>
        <ScrollView style={styles.contractsList} showsVerticalScrollIndicator={false}>
          {contracts.slice(0, 5).map((contract, index) => (
            <View key={contract.id} style={styles.contractPreview}>
              <Text style={styles.contractPreviewName}>
                {contract.renterInfo.fullName}
              </Text>
              <Text style={styles.contractPreviewCar}>
                {contract.carInfo.makeModel} • {contract.carInfo.licensePlate}
              </Text>
              <Text style={styles.contractPreviewStatus}>
                Κατάσταση: {contract.status}
              </Text>
            </View>
          ))}
          {contracts.length > 5 && (
            <Text style={styles.moreContractsText}>
              +{contracts.length - 5} περισσότερα συμβόλαια
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  function renderOptions() {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Επιλογές Αντιγραφής</Text>
        
        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Συμπερίληψη Φωτογραφιών</Text>
            <Text style={styles.optionDescription}>
              Αντιγραφή όλων των φωτογραφιών του συμβολαίου
            </Text>
          </View>
          <Switch
            value={options.includePhotos}
            onValueChange={(value) => handleOptionChange('includePhotos', value)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={options.includePhotos ? '#FFFFFF' : Colors.textSecondary}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Συμπερίληψη Υπογραφών</Text>
            <Text style={styles.optionDescription}>
              Αντιγραφή των υπογραφών του ενοικιαστή
            </Text>
          </View>
          <Switch
            value={options.includeSignatures}
            onValueChange={(value) => handleOptionChange('includeSignatures', value)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={options.includeSignatures ? '#FFFFFF' : Colors.textSecondary}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Επαναφορά Ημερομηνιών</Text>
            <Text style={styles.optionDescription}>
              Ορισμός νέων ημερομηνιών παράλαβης και επιστροφής
            </Text>
          </View>
          <Switch
            value={options.resetDates}
            onValueChange={(value) => handleOptionChange('resetDates', value)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={options.resetDates ? '#FFFFFF' : Colors.textSecondary}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Επαναφορά Κατάστασης</Text>
            <Text style={styles.optionDescription}>
              Ορισμός κατάστασης "Επερχόμενο" για τα νέα συμβόλαια
            </Text>
          </View>
          <Switch
            value={options.resetStatus}
            onValueChange={(value) => handleOptionChange('resetStatus', value)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={options.resetStatus ? '#FFFFFF' : Colors.textSecondary}
          />
        </View>
      </View>
    );
  }

  function renderCustomFields() {
    return (
      <View style={styles.customFieldsContainer}>
        <Text style={styles.sectionTitle}>Προσαρμογή Στοιχείων</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Νέο Όνομα Ενοικιαστή (Προαιρετικό)</Text>
          <TextInput
            style={styles.textInput}
            value={newRenterName}
            onChangeText={setNewRenterName}
            placeholder="Αφήστε κενό για διατήρηση του αρχικού ονόματος"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Νέα Μαρκα Αυτοκινήτου (Προαιρετικό)</Text>
          <TextInput
            style={styles.textInput}
            value={newCarMake}
            onChangeText={setNewCarMake}
            placeholder="π.χ. Toyota"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Νέο Μοντέλο Αυτοκινήτου (Προαιρετικό)</Text>
          <TextInput
            style={styles.textInput}
            value={newCarModel}
            onChangeText={setNewCarModel}
            placeholder="π.χ. Corolla"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Νέα Πινακίδα (Προαιρετικό)</Text>
          <TextInput
            style={styles.textInput}
            value={newLicensePlate}
            onChangeText={setNewLicensePlate}
            placeholder="π.χ. ABC-1234"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Αντιγραφή Συμβολαίων</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Contract Preview */}
          {renderContractPreview()}

          {/* Options */}
          {renderOptions()}

          {/* Custom Fields */}
          {renderCustomFields()}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>Ακύρωση</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.duplicateButton, isProcessing && styles.duplicateButtonDisabled]}
            onPress={handleDuplicate}
            disabled={isProcessing}
          >
            <Text style={styles.duplicateButtonText}>
              {isProcessing ? 'Αντιγραφή...' : 'Αντιγραφή'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
  },
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  previewContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  previewTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  contractsList: {
    maxHeight: 200,
  },
  contractPreview: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contractPreviewName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  contractPreviewCar: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  contractPreviewStatus: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  moreContractsText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  optionsContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  optionLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  customFieldsContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  duplicateButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  duplicateButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  duplicateButtonText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
