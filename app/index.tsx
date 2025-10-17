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
import { Contract, User } from '../models/contract.interface';
import { ContractStorageService } from '../services/contract-storage.service';
import { UserStorageService } from '../services/user-storage.service';

/**
 * Home screen showing list of contracts
 */
export default function HomeScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'pickupDate' | 'totalCost' | 'renterName'>('pickupDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('default-user');

  useEffect(() => {
    loadContracts();
    loadUsers();
  }, []);

  useEffect(() => {
    if (contracts.length > 0) {
      const sorted = sortContracts(contracts, sortBy, sortOrder);
      setContracts(sorted);
    }
  }, [sortBy, sortOrder]);

  async function loadUsers() {
    try {
      const loadedUsers = await UserStorageService.getAllUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadContracts() {
    try {
      const loadedContracts = await ContractStorageService.getAllContracts();
      const sorted = sortContracts(loadedContracts, sortBy, sortOrder);
      setContracts(sorted);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  }

  function sortContracts(contracts: Contract[], sortBy: string, sortOrder: string): Contract[] {
    return contracts.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'pickupDate':
          const dateA = new Date(a.rentalPeriod.pickupDate).getTime();
          const dateB = new Date(b.rentalPeriod.pickupDate).getTime();
          comparison = dateA - dateB;
          break;
        case 'totalCost':
          comparison = (a.rentalPeriod.totalCost || 0) - (b.rentalPeriod.totalCost || 0);
          break;
        case 'renterName':
          comparison = a.renterInfo.fullName.localeCompare(b.renterInfo.fullName);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  function handleSortChange(newSortBy: 'pickupDate' | 'totalCost' | 'renterName') {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  }

  async function clearAllContracts() {
    Alert.alert(
      'Διαγραφή Όλων των Συμβολαίων',
      'Είστε σίγουροι ότι θέλετε να διαγράψετε όλα τα συμβόλαια; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή Όλων',
          style: 'destructive',
          onPress: async () => {
            try {
              await ContractStorageService.clearAllContracts();
              await loadContracts();
              Alert.alert('Επιτυχία', 'Όλα τα συμβόλαια διαγράφηκαν επιτυχώς');
            } catch (error) {
              console.error('Error clearing contracts:', error);
              Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής συμβολαίων');
            }
          },
        },
      ]
    );
  }

  function formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('el-GR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  function renderContractItem({ item }: { item: Contract }) {
    const pickupDate = formatDate(item.rentalPeriod.pickupDate);
    const dropoffDate = formatDate(item.rentalPeriod.dropoffDate);
    
    return (
      <TouchableOpacity
        style={styles.contractItem}
        onPress={() => router.push(`/contract-details?contractId=${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.contractHeader}>
          <View style={styles.contractMainInfo}>
            <Text style={styles.contractName} numberOfLines={1}>
              {item.renterInfo.fullName}
            </Text>
            <Text style={styles.contractCar} numberOfLines={1}>
              {item.carInfo.makeModel || `${item.carInfo.make || ''} ${item.carInfo.model || ''}`.trim()} • {item.carInfo.licensePlate}
            </Text>
          </View>
          <View style={styles.fuelBadge}>
            <View style={styles.fuelBarContainer}>
              <View style={styles.fuelBar}>
                <View style={[
                  styles.fuelBarFill, 
                  { width: `${((item.carCondition?.fuelLevel || 8) / 8) * 100}%` }
                ]} />
              </View>
              <Text style={styles.fuelBadgeText}>
                {item.carCondition?.fuelLevel || 'N/A'}/8
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
          Πατήστε το κουμπί "Νέο Συμβόλαιο" για να δημιουργήσετε το πρώτο σας
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <TouchableOpacity
            onLongPress={contracts.length > 0 ? clearAllContracts : undefined}
            activeOpacity={contracts.length > 0 ? 0.7 : 1}
          >
            <Text style={styles.headerTitle}>Ενοικιάσεις</Text>
            <Text style={styles.headerSubtitle}>
              {contracts.length} {contracts.length === 1 ? 'συμβόλαιο' : 'συμβόλαια'}
              {contracts.length > 0 && (
                <Text style={styles.clearHint}> • Κρατήστε πατημένο για διαγραφή όλων</Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.userButton}
          onPress={() => router.push('/user-management')}
        >
          <Text style={styles.userButtonText}>
            👤 {users.find(u => u.id === selectedUserId)?.name || 'Χρήστης'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/new-contract')}
        >
          <Text style={styles.newButtonText}>+ Νέο Συμβόλαιο</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ταξινόμηση:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'pickupDate' && styles.sortButtonActive]}
            onPress={() => handleSortChange('pickupDate')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'pickupDate' && styles.sortButtonTextActive]}>
              Ημερομηνία {sortBy === 'pickupDate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'totalCost' && styles.sortButtonActive]}
            onPress={() => handleSortChange('totalCost')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'totalCost' && styles.sortButtonTextActive]}>
              Κόστος {sortBy === 'totalCost' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'renterName' && styles.sortButtonActive]}
            onPress={() => handleSortChange('renterName')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'renterName' && styles.sortButtonTextActive]}>
              Όνομα {sortBy === 'renterName' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contract List */}
      <FlatList
        data={contracts}
        renderItem={renderContractItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={[
          styles.listContent,
          contracts.length === 0 && styles.listContentEmpty
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 8,
  },
  userButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  newButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sortContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  listContentEmpty: {
    flex: 1,
  },
  contractItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  contractMainInfo: {
    flex: 1,
    marginRight: 10,
  },
  contractName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contractCar: {
    fontSize: 14,
    color: '#666',
  },
  fuelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FF9500',
    minWidth: 60,
  },
  fuelBarContainer: {
    alignItems: 'center',
  },
  fuelBar: {
    width: 40,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 2,
    overflow: 'hidden',
  },
  fuelBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  fuelBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contractDetails: {
    marginBottom: 10,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 13,
    color: '#888',
    width: 80,
  },
  dateValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  costInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  costValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  contractFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    marginRight: 10,
  },
  damageIndicator: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
