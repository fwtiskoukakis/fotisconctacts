import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { BulkOperations } from '../components/bulk-operations';
import { ContextAwareFab } from '../components/context-aware-fab';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { Contract } from '../models/contract.interface';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

export default function ContractsScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    try {
      setLoading(true);
      const loadedContracts = await SupabaseContractService.getAllContracts();
      setContracts(loadedContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης συμβολαίων');
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  }

  function toggleSelectionMode() {
    setIsSelectionMode(!isSelectionMode);
    setSelectedContracts(new Set());
  }

  function toggleContractSelection(contractId: string) {
    const newSelection = new Set(selectedContracts);
    if (newSelection.has(contractId)) {
      newSelection.delete(contractId);
    } else {
      newSelection.add(contractId);
    }
    setSelectedContracts(newSelection);
  }

  function selectAllContracts() {
    const allIds = new Set(contracts.map(c => c.id));
    setSelectedContracts(allIds);
  }

  function clearSelection() {
    setSelectedContracts(new Set());
  }

  function openBulkOperations() {
    if (selectedContracts.size === 0) {
      Alert.alert('Επιλογή Απαιτείται', 'Παρακαλώ επιλέξτε τουλάχιστον ένα συμβόλαιο');
      return;
    }
    setShowBulkOperations(true);
  }

  function handleBulkOperationsComplete() {
    setShowBulkOperations(false);
    setSelectedContracts(new Set());
    setIsSelectionMode(false);
    loadContracts(); // Refresh the list
  }

  function formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('el-GR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'completed':
        return Colors.textSecondary;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'active':
        return 'Ενεργό';
      case 'completed':
        return 'Ολοκληρωμένο';
      case 'cancelled':
        return 'Ακυρωμένο';
      default:
        return 'Άγνωστο';
    }
  }

  function renderContractItem({ item }: { item: Contract }) {
    const pickupDate = formatDate(item.rentalPeriod.pickupDate);
    const dropoffDate = formatDate(item.rentalPeriod.dropoffDate);
    const isSelected = selectedContracts.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.contractItem, 
          Glassmorphism.light,
          isSelected && styles.contractItemSelected
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleContractSelection(item.id);
          } else {
            router.push(`/contract-details?contractId=${item.id}`);
          }
        }}
        activeOpacity={0.7}
      >
        {isSelectionMode && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.selectionCheckbox,
              isSelected && styles.selectionCheckboxSelected
            ]}>
              {isSelected && <Text style={styles.selectionCheckmark}>✓</Text>}
            </View>
          </View>
        )}
        
        <View style={styles.contractHeader}>
          <View style={styles.contractMainInfo}>
            <Text style={styles.contractName} numberOfLines={1}>
              {item.renterInfo.fullName}
            </Text>
            <Text style={styles.contractCar} numberOfLines={1}>
              {item.carInfo.makeModel || `${item.carInfo.make || ''} ${item.carInfo.model || ''}`.trim()} • {item.carInfo.licensePlate}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'active') }]}>
              <Text style={styles.statusText}>
                {getStatusText(item.status || 'active')}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.contractDetails}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Παραλαβή:</Text>
            <Text style={styles.dateValue}>
              {pickupDate} • {item.rentalPeriod.pickupTime}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Επιστροφή:</Text>
            <Text style={styles.dateValue}>
              {dropoffDate} • {item.rentalPeriod.dropoffTime}
            </Text>
          </View>
          <View style={styles.costInfo}>
            <Text style={styles.costLabel}>Κόστος:</Text>
            <Text style={styles.costValue}>€{item.rentalPeriod.totalCost || 0}</Text>
          </View>
        </View>

        <View style={styles.contractFooter}>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {item.rentalPeriod.pickupLocation}
          </Text>
          {item.damagePoints.length > 0 && (
            <Text style={styles.damageIndicator}>
              ⚠️ {item.damagePoints.length} ζημιές
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Δεν υπάρχουν συμβόλαια</Text>
        <Text style={styles.emptySubtitle}>
          Πατήστε το κουμπί "+" για να δημιουργήσετε το πρώτο συμβόλαιο
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Συμβόλαια" showActions={true}>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={toggleSelectionMode}
        >
          <Text style={styles.headerActionText}>
            {isSelectionMode ? 'Ακύρωση' : 'Επιλογή'}
          </Text>
        </TouchableOpacity>
      </AppHeader>
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
          <Text style={styles.statValue}>{contracts.length}</Text>
          <Text style={styles.statLabel}>Συνολικά</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: Colors.success }]}>
          <Text style={styles.statValue}>{contracts.filter(c => c.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Ενεργά</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: Colors.info }]}>
          <Text style={styles.statValue}>{contracts.filter(c => c.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Ολοκληρωμένα</Text>
        </View>
      </View>

      {/* Bulk Operations Toolbar */}
      {isSelectionMode && (
        <View style={styles.bulkToolbar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {selectedContracts.size} επιλεγμένα
            </Text>
          </View>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={selectAllContracts}
            >
              <Text style={styles.bulkActionText}>Όλα</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={clearSelection}
            >
              <Text style={styles.bulkActionText}>Καθαρισμός</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkActionPrimary]}
              onPress={openBulkOperations}
            >
              <Text style={styles.bulkActionPrimaryText}>Ενέργειες</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Contracts List */}
      <FlatList
        data={contracts}
        renderItem={renderContractItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          contracts.length === 0 && styles.listContentEmpty
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Bulk Operations Modal */}
      <BulkOperations
        visible={showBulkOperations}
        onClose={() => setShowBulkOperations(false)}
        selectedContracts={contracts.filter(c => selectedContracts.has(c.id))}
        onContractsUpdated={handleBulkOperationsComplete}
      />

      {/* Context-Aware Floating Action Button */}
      <ContextAwareFab
        onNewContract={() => router.push('/new-contract')}
      />

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.textInverse,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100, // Space for tab bar
  },
  listContentEmpty: {
    flex: 1,
  },
  contractItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  contractMainInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  contractName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  contractCar: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  contractDetails: {
    marginBottom: Spacing.sm,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    width: 80,
  },
  dateValue: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '500',
  },
  costInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  costLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  costValue: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  contractFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  locationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  damageIndicator: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  fabIcon: {
    fontSize: 24,
    color: Colors.textInverse,
    fontWeight: 'bold',
  },
  headerActionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  headerActionText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bulkToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bulkActionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bulkActionText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
  },
  bulkActionPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bulkActionPrimaryText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contractItemSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    zIndex: 1,
  },
  selectionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectionCheckmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
