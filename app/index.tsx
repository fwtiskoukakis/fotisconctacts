import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Contract, User } from '../models/contract.interface';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { supabase } from '../utils/supabase';
import { AppHeader } from '../components/app-header';
import { DashboardAnalytics } from '../components/dashboard-analytics';
import { AdvancedSearch } from '../components/advanced-search';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { ContextAwareFab } from '../components/context-aware-fab';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

const { width } = Dimensions.get('window');

/**
 * Home screen showing list of contracts
 */
export default function HomeScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'pickupDate' | 'totalCost' | 'renterName'>('pickupDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('default-user');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'active' | 'completed' | 'upcoming',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month',
    priceRange: 'all' as 'all' | 'low' | 'medium' | 'high',
    fuelLevel: 'all' as 'all' | 'high' | 'medium' | 'low',
  });
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    activeRentals: 0,
    upcomingReturns: 0,
    revenueThisMonth: 0,
    totalContracts: 0,
    averageRentalDuration: 0,
  });

  useEffect(() => {
    loadContracts();
    loadUsers();
  }, []);

  useEffect(() => {
    if (contracts.length > 0) {
      const sorted = sortContracts(contracts, sortBy, sortOrder);
      setContracts(sorted);
      calculateAnalytics(sorted);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchQuery, filters]);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const loadedUsers: User[] = data?.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        signature: u.signature_url || '',
        signatureUrl: u.signature_url,
        createdAt: new Date(u.created_at),
        updatedAt: u.updated_at ? new Date(u.updated_at) : undefined,
      })) || [];
      
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadContracts() {
    try {
      const loadedContracts = await SupabaseContractService.getAllContracts();
      const sorted = sortContracts(loadedContracts, sortBy, sortOrder);
      setContracts(sorted);
      calculateAnalytics(sorted);
    } catch (error) {
      console.error('Error loading contracts:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης συμβολαίων');
    }
  }

  function calculateAnalytics(contracts: Contract[]) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const totalRevenue = contracts.reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0);
    
    const activeRentals = contracts.filter(c => {
      const pickup = new Date(c.rentalPeriod.pickupDate);
      const dropoff = new Date(c.rentalPeriod.dropoffDate);
      return pickup <= now && now <= dropoff;
    }).length;
    
    const upcomingReturns = contracts.filter(c => {
      const dropoff = new Date(c.rentalPeriod.dropoffDate);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return dropoff >= now && dropoff <= tomorrow;
    }).length;
    
    const revenueThisMonth = contracts
      .filter(c => {
        const pickup = new Date(c.rentalPeriod.pickupDate);
        return pickup.getMonth() === thisMonth && pickup.getFullYear() === thisYear;
      })
      .reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0);
    
    const totalContracts = contracts.length;
    
    const averageRentalDuration = activeRentals > 0 
      ? contracts
          .filter(c => {
            const pickup = new Date(c.rentalPeriod.pickupDate);
            const dropoff = new Date(c.rentalPeriod.dropoffDate);
            return pickup <= now && now <= dropoff;
          })
          .reduce((sum, c) => {
            const pickup = new Date(c.rentalPeriod.pickupDate);
            const dropoff = new Date(c.rentalPeriod.dropoffDate);
            return sum + Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / activeRentals
      : 0;
    
    setAnalytics({ 
      totalRevenue, 
      activeRentals, 
      upcomingReturns, 
      revenueThisMonth, 
      totalContracts,
      averageRentalDuration: Math.round(averageRentalDuration)
    });
  }

  function filterContracts() {
    let filtered = contracts;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contract => {
        return (
          contract.renterInfo.fullName.toLowerCase().includes(query) ||
          contract.carInfo.licensePlate.toLowerCase().includes(query) ||
          contract.carInfo.make?.toLowerCase().includes(query) ||
          contract.carInfo.model?.toLowerCase().includes(query) ||
          contract.carInfo.makeModel?.toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      const now = new Date();
      filtered = filtered.filter(contract => {
        const pickup = new Date(contract.rentalPeriod.pickupDate);
        const dropoff = new Date(contract.rentalPeriod.dropoffDate);
        
        switch (filters.status) {
          case 'active':
            return pickup <= now && now <= dropoff;
          case 'completed':
            return dropoff < now;
          case 'upcoming':
            return pickup > now;
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(contract => {
        const pickup = new Date(contract.rentalPeriod.pickupDate);
        
        switch (filters.dateRange) {
          case 'today':
            return pickup.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return pickup >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return pickup >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(contract => {
        const cost = contract.rentalPeriod.totalCost || 0;
        
        switch (filters.priceRange) {
          case 'low':
            return cost <= 50;
          case 'medium':
            return cost > 50 && cost <= 150;
          case 'high':
            return cost > 150;
          default:
            return true;
        }
      });
    }

    // Fuel level filter
    if (filters.fuelLevel !== 'all') {
      filtered = filtered.filter(contract => {
        const fuelLevel = contract.carCondition?.fuelLevel || 8;
        
        switch (filters.fuelLevel) {
          case 'high':
            return fuelLevel >= 6;
          case 'medium':
            return fuelLevel >= 3 && fuelLevel < 6;
          case 'low':
            return fuelLevel < 3;
          default:
            return true;
        }
      });
    }
    
    setFilteredContracts(filtered);
  }

  function clearFilters() {
    setFilters({
      status: 'all',
      dateRange: 'all',
      priceRange: 'all',
      fuelLevel: 'all',
    });
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
              // Delete all contracts from Supabase
              const { error } = await supabase
                .from('contracts')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition)
              
              if (error) throw error;
              
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
      <AppHeader showActions={true} />
      
      {/* Search Bar - Moved to top */}
      <View style={styles.searchContainer}>
        <AdvancedSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dashboard Analytics */}
        <DashboardAnalytics 
          analytics={analytics} 
          onStatPress={(statType) => {
            console.log('Stat pressed:', statType);
          }}
        />

        {/* Quick Stats Cards */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatsRow}>
            <View style={[styles.quickStatCard, { backgroundColor: Colors.primary }]}>
              <Text style={styles.quickStatValue}>{contracts.length}</Text>
              <Text style={styles.quickStatLabel}>Συνολικά</Text>
            </View>
            <View style={[styles.quickStatCard, { backgroundColor: Colors.success }]}>
              <Text style={styles.quickStatValue}>{contracts.filter(c => c.status === 'active').length}</Text>
              <Text style={styles.quickStatLabel}>Ενεργά</Text>
            </View>
            <View style={[styles.quickStatCard, { backgroundColor: Colors.info }]}>
              <Text style={styles.quickStatValue}>{contracts.filter(c => c.status === 'completed').length}</Text>
              <Text style={styles.quickStatLabel}>Ολοκληρωμένα</Text>
            </View>
          </View>
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
        {filteredContracts.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.contractsContainer}>
            {filteredContracts.map((contract, index) => (
              <View key={`${contract.id}-${index}`}>
                {renderContractItem({ item: contract })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
        {/* Floating Action Button */}
        <ContextAwareFab
          onNewContract={() => router.push('/new-contract')}
          onNewDamage={() => router.push('/damage-report')}
          onNewUser={() => router.push('/user-management')}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB and bottom tab
  },
  searchContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  quickStatsContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  quickStatValue: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickStatLabel: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
  },
  contractsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    marginRight: Spacing.xs,
    ...Shadows.sm,
  },
  userButtonIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  userButtonText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginLeft: Spacing.xs,
    ...Shadows.sm,
  },
  newButtonIcon: {
    fontSize: 18,
    color: Colors.textInverse,
    fontWeight: 'bold',
    marginRight: Spacing.xs,
  },
  newButtonText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontWeight: '600',
    flex: 1,
  },
  sortContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sortLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  sortButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sortButtonTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  contractItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Glassmorphism.light,
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
  fuelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warning,
    minWidth: 60,
    alignItems: 'center',
  },
  fuelBarContainer: {
    alignItems: 'center',
  },
  fuelBar: {
    width: 40,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
    overflow: 'hidden',
  },
  fuelBarFill: {
    height: '100%',
    backgroundColor: Colors.textInverse,
    borderRadius: BorderRadius.sm,
  },
  fuelBadgeText: {
    color: Colors.textInverse,
    ...Typography.caption,
    fontWeight: 'bold',
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
});
