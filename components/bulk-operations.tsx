import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  Switch,
} from 'react-native';
import { Contract } from '../models/contract.interface';
import { ContractDuplication } from './contract-duplication';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { PDFExportService } from '../services/pdf-export.service';
import { EmailService } from '../services/email.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresConfirmation: boolean;
  action: (contracts: Contract[]) => Promise<void>;
}

interface BulkOperationsProps {
  visible: boolean;
  onClose: () => void;
  selectedContracts: Contract[];
  onContractsUpdated: () => void;
}

export function BulkOperations({
  visible,
  onClose,
  selectedContracts,
  onContractsUpdated,
}: BulkOperationsProps) {
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationSettings, setOperationSettings] = useState<Record<string, any>>({});
  const [showDuplication, setShowDuplication] = useState(false);

  const bulkOperations: BulkOperation[] = [
    {
      id: 'delete',
      name: 'Διαγραφή Συμβολαίων',
      description: 'Διαγραφή των επιλεγμένων συμβολαίων',
      icon: '🗑️',
      color: Colors.error,
      requiresConfirmation: true,
      action: async (contracts) => {
        // TODO: Implement bulk delete
        console.log('Bulk delete contracts:', contracts.map(c => c.id));
        Alert.alert('Επιτυχία', `${contracts.length} συμβόλαια διαγράφηκαν`);
      },
    },
    {
      id: 'status_change',
      name: 'Αλλαγή Κατάστασης',
      description: 'Αλλαγή κατάστασης των επιλεγμένων συμβολαίων',
      icon: '🔄',
      color: Colors.warning,
      requiresConfirmation: false,
      action: async (contracts) => {
        // TODO: Implement status change
        console.log('Bulk status change contracts:', contracts.map(c => c.id));
        Alert.alert('Επιτυχία', `Η κατάσταση ${contracts.length} συμβολαίων ενημερώθηκε`);
      },
    },
    {
      id: 'export',
      name: 'Εξαγωγή Δεδομένων',
      description: 'Εξαγωγή των επιλεγμένων συμβολαίων σε PDF',
      icon: '📤',
      color: Colors.info,
      requiresConfirmation: false,
      action: async (contracts) => {
        setIsProcessing(true);
        try {
          const fileUri = await PDFExportService.exportMultipleContractsToPDF(contracts);
          if (fileUri) {
            await PDFExportService.shareExportedFile(fileUri);
            Alert.alert('Επιτυχία', `${contracts.length} συμβόλαια εξήχθησαν επιτυχώς`);
          }
        } catch (error) {
          console.error('Error exporting contracts:', error);
          Alert.alert('Σφάλμα', 'Αποτυχία εξαγωγής συμβολαίων');
        } finally {
          setIsProcessing(false);
        }
      },
    },
    {
      id: 'email_notification',
      name: 'Email Ειδοποίηση',
      description: 'Αποστολή email ειδοποίησης στους ενοικιαστές',
      icon: '📧',
      color: Colors.primary,
      requiresConfirmation: false,
      action: async (contracts) => {
        setIsProcessing(true);
        try {
          const template = EmailService.getContractEmailTemplate('contract_confirmation');
          const success = await EmailService.sendBulkEmail(contracts, template);
          if (success) {
            Alert.alert('Επιτυχία', `Email εστάλη σε ${contracts.length} ενοικιαστές`);
          }
        } catch (error) {
          console.error('Error sending bulk email:', error);
          Alert.alert('Σφάλμα', 'Αποτυχία αποστολής email');
        } finally {
          setIsProcessing(false);
        }
      },
    },
    {
      id: 'archive',
      name: 'Αρχειοθέτηση',
      description: 'Αρχειοθέτηση των επιλεγμένων συμβολαίων',
      icon: '📁',
      color: Colors.secondary,
      requiresConfirmation: true,
      action: async (contracts) => {
        // TODO: Implement bulk archive
        console.log('Bulk archive contracts:', contracts.map(c => c.id));
        Alert.alert('Επιτυχία', `${contracts.length} συμβόλαια αρχειοθετήθηκαν`);
      },
    },
    {
      id: 'duplicate',
      name: 'Αντιγραφή Συμβολαίων',
      description: 'Δημιουργία αντιγράφων των επιλεγμένων συμβολαίων',
      icon: '📋',
      color: Colors.success,
      requiresConfirmation: false,
      action: async (contracts) => {
        // Open duplication modal instead of direct action
        setShowDuplication(true);
      },
    },
  ];

  function handleSelectOperation(operation: BulkOperation) {
    setSelectedOperation(operation);
    
    if (operation.requiresConfirmation) {
      setShowConfirmation(true);
    } else {
      executeOperation(operation);
    }
  }

  async function executeOperation(operation: BulkOperation) {
    try {
      setIsProcessing(true);
      await operation.action(selectedContracts);
      onContractsUpdated();
      onClose();
    } catch (error) {
      console.error('Error executing bulk operation:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία εκτέλεσης λειτουργίας');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleConfirmOperation() {
    if (selectedOperation) {
      executeOperation(selectedOperation);
      setShowConfirmation(false);
      setSelectedOperation(null);
    }
  }

  function renderOperationItem({ item }: { item: BulkOperation }) {
    return (
      <TouchableOpacity
        style={[styles.operationCard, Glassmorphism.light]}
        onPress={() => handleSelectOperation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.operationHeader}>
          <View style={[styles.operationIcon, { backgroundColor: item.color }]}>
            <Text style={styles.operationIconText}>{item.icon}</Text>
          </View>
          <View style={styles.operationInfo}>
            <Text style={styles.operationName}>{item.name}</Text>
            <Text style={styles.operationDescription}>{item.description}</Text>
          </View>
          {item.requiresConfirmation && (
            <View style={styles.confirmationBadge}>
              <Text style={styles.confirmationBadgeText}>!</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderContractPreview() {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Επιλεγμένα Συμβόλαια ({selectedContracts.length})</Text>
        <FlatList
          data={selectedContracts.slice(0, 5)} // Show first 5
          renderItem={({ item }) => (
            <View style={styles.contractPreview}>
              <Text style={styles.contractPreviewName}>{item.renterInfo.fullName}</Text>
              <Text style={styles.contractPreviewCar}>
                {item.carInfo.makeModel} • {item.carInfo.licensePlate}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
        {selectedContracts.length > 5 && (
          <Text style={styles.moreContractsText}>
            +{selectedContracts.length - 5} περισσότερα συμβόλαια
          </Text>
        )}
      </View>
    );
  }

  function renderStatusChangeSettings() {
    if (selectedOperation?.id !== 'status_change') return null;

    const statusOptions = [
      { value: 'upcoming', label: 'Επερχόμενο', color: Colors.info },
      { value: 'active', label: 'Ενεργό', color: Colors.success },
      { value: 'completed', label: 'Ολοκληρωμένο', color: Colors.secondary },
      { value: 'cancelled', label: 'Ακυρωμένο', color: Colors.error },
    ];

    return (
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Νέα Κατάσταση</Text>
        <View style={styles.statusOptions}>
          {statusOptions.map(status => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusOption,
                operationSettings.newStatus === status.value && styles.statusOptionActive,
                { borderColor: status.color }
              ]}
              onPress={() => setOperationSettings(prev => ({ ...prev, newStatus: status.value }))}
            >
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={styles.statusOptionText}>{status.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderEmailSettings() {
    if (selectedOperation?.id !== 'email_notification') return null;

    return (
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Ρυθμίσεις Email</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Θέμα:</Text>
          <Text style={styles.settingValue}>Ενημέρωση Συμβολαίου</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Περιεχόμενο:</Text>
          <Text style={styles.settingValue}>Στάνταρ μήνυμα ενημέρωσης</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Αποστολή σε:</Text>
          <Text style={styles.settingValue}>
            {selectedContracts.filter(c => c.renterInfo.email).length} ενοικιαστές
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Μαζικές Ενέργειες</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Contract Preview */}
        {renderContractPreview()}

        {/* Operations List */}
        <View style={styles.operationsContainer}>
          <Text style={styles.operationsTitle}>Διαθέσιμες Ενέργειες</Text>
          <FlatList
            data={bulkOperations}
            renderItem={renderOperationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.operationsList}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Operation Settings */}
        {selectedOperation && (
          <View style={styles.settingsSection}>
            {renderStatusChangeSettings()}
            {renderEmailSettings()}
          </View>
        )}

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmation}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmation(false)}
        >
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationModal}>
              <Text style={styles.confirmationTitle}>Επιβεβαίωση</Text>
              <Text style={styles.confirmationMessage}>
                Είστε σίγουροι ότι θέλετε να εκτελέσετε την ενέργεια "{selectedOperation?.name}" 
                σε {selectedContracts.length} συμβόλαια;
              </Text>
              <View style={styles.confirmationActions}>
                <TouchableOpacity
                  style={styles.confirmationCancel}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={styles.confirmationCancelText}>Ακύρωση</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationConfirm, { backgroundColor: selectedOperation?.color }]}
                  onPress={handleConfirmOperation}
                  disabled={isProcessing}
                >
                  <Text style={styles.confirmationConfirmText}>
                    {isProcessing ? 'Εκτέλεση...' : 'Επιβεβαίωση'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Contract Duplication Modal */}
        <ContractDuplication
          visible={showDuplication}
          onClose={() => setShowDuplication(false)}
          contracts={selectedContracts}
          onDuplicationComplete={(duplicates) => {
            setShowDuplication(false);
            onContractsUpdated();
            Alert.alert('Επιτυχία', `${duplicates.length} συμβόλαια αντιγράφηκαν`);
          }}
        />
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
  previewContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
  },
  moreContractsText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  operationsContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  operationsTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  operationsList: {
    paddingBottom: Spacing.lg,
  },
  operationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  operationIconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  operationInfo: {
    flex: 1,
  },
  operationName: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  operationDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  confirmationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  settingsSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  settingsContainer: {
    marginBottom: Spacing.md,
  },
  settingsTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusOptionText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  settingLabel: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  settingValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '90%',
    maxWidth: 400,
    ...Shadows.lg,
  },
  confirmationTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  confirmationMessage: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  confirmationCancel: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  confirmationCancelText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  confirmationConfirm: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmationConfirmText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
