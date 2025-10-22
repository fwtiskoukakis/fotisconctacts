import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Contract } from '../../models/contract.interface';
import { SupabaseContractService } from '../../services/supabase-contract.service';
import { supabase } from '../../utils/supabase';
import { ContextAwareFab } from '../../components/context-aware-fab';
import { SimpleGlassCard } from '../../components/glass-card';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { getAADEStatusMessage } from '../../utils/aade-contract-helper';
import { FleetOSIcon } from '../../components/fleetos-logo';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  upcomingContracts: number;
  totalRevenue: number;
  revenueThisMonth: number;
  avgRentalDays: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeContracts: 0,
    completedContracts: 0,
    upcomingContracts: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    avgRentalDays: 0,
  });

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchQuery, activeFilter]);

  async function loadContracts() {
    try {
      const loadedContracts = await SupabaseContractService.getAllContracts();
      
      // Add example AADE status to first two contracts for demonstration
      const contractsWithAADE = loadedContracts.map((contract, index) => {
        if (index === 0) {
          return { ...contract, aadeStatus: 'submitted' as const, aadeDclId: 123456 };
        } else if (index === 1) {
          return { ...contract, aadeStatus: 'completed' as const, aadeDclId: 789012 };
        }
        return contract;
      });
      
      setContracts(contractsWithAADE);
      calculateStats(contractsWithAADE);
    } catch (error) {
      console.error('Error loading contracts:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης συμβολαίων');
    }
  }

  function calculateStats(contracts: Contract[]) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const active = contracts.filter(c => getActualContractStatus(c) === 'active').length;
    const completed = contracts.filter(c => getActualContractStatus(c) === 'completed').length;
    const upcoming = contracts.filter(c => getActualContractStatus(c) === 'upcoming').length;

    const totalRevenue = contracts.reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0);
    
    const revenueThisMonth = contracts
      .filter(c => {
        const pickup = new Date(c.rentalPeriod.pickupDate);
        return pickup.getMonth() === thisMonth && pickup.getFullYear() === thisYear;
      })
      .reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0);

    const activeContracts = contracts.filter(c => c.status === 'active');
    const avgRentalDays = activeContracts.length > 0
      ? activeContracts.reduce((sum, c) => {
          const pickup = new Date(c.rentalPeriod.pickupDate);
          const dropoff = new Date(c.rentalPeriod.dropoffDate);
          return sum + Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / activeContracts.length
      : 0;

    setStats({
      totalContracts: contracts.length,
      activeContracts: active,
      completedContracts: completed,
      upcomingContracts: upcoming,
      totalRevenue,
      revenueThisMonth,
      avgRentalDays: Math.round(avgRentalDays),
    });
  }

  function filterContracts() {
    let filtered = contracts;

    // Filter by status using actual calculated status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(c => getActualContractStatus(c) === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contract => {
        return (
          contract.renterInfo.fullName.toLowerCase().includes(query) ||
          contract.carInfo.licensePlate.toLowerCase().includes(query) ||
          contract.carInfo.makeModel?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredContracts(filtered);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function getActualContractStatus(contract: Contract): 'active' | 'completed' | 'upcoming' {
    try {
      const now = new Date();
      
      // Validate and parse pickup datetime
      const pickupDate = new Date(contract.rentalPeriod.pickupDate);
      if (isNaN(pickupDate.getTime())) {
        console.warn('Invalid pickup date for contract:', contract.id);
        return contract.status; // Fallback to stored status
      }
      
      const pickupTimeParts = contract.rentalPeriod.pickupTime?.split(':') || ['00', '00'];
      const pickupHours = parseInt(pickupTimeParts[0]) || 0;
      const pickupMinutes = parseInt(pickupTimeParts[1]) || 0;
      pickupDate.setHours(pickupHours, pickupMinutes, 0, 0);
      
      // Validate and parse dropoff datetime
      const dropoffDate = new Date(contract.rentalPeriod.dropoffDate);
      if (isNaN(dropoffDate.getTime())) {
        console.warn('Invalid dropoff date for contract:', contract.id);
        return contract.status; // Fallback to stored status
      }
      
      const dropoffTimeParts = contract.rentalPeriod.dropoffTime?.split(':') || ['23', '59'];
      const dropoffHours = parseInt(dropoffTimeParts[0]) || 23;
      const dropoffMinutes = parseInt(dropoffTimeParts[1]) || 59;
      dropoffDate.setHours(dropoffHours, dropoffMinutes, 0, 0);
      
      // Check if dates are valid after setting time
      if (isNaN(pickupDate.getTime()) || isNaN(dropoffDate.getTime())) {
        console.warn('Invalid dates after time parsing for contract:', contract.id);
        return contract.status;
      }
      
      // Determine actual status based on current time
      if (now < pickupDate) {
        return 'upcoming';
      } else if (now >= pickupDate && now <= dropoffDate) {
        return 'active';
      } else {
        return 'completed';
      }
    } catch (error) {
      console.error('Error calculating contract status:', error);
      return contract.status; // Fallback to stored status on error
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return Colors.success;
      case 'completed': return Colors.textSecondary;
      case 'upcoming': return Colors.info;
      default: return Colors.textSecondary;
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Ενεργό';
      case 'completed': return 'Ολοκληρωμένο';
      case 'upcoming': return 'Επερχόμενο';
      default: return status;
    }
  }

  function handlePhoneCall(phoneNumber: string, e: any) {
    e.stopPropagation();
    const phone = phoneNumber.replace(/\s/g, ''); // Remove spaces
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Σφάλμα', 'Δεν είναι δυνατή η κλήση');
    });
  }

  function renderStatsCard(icon: any, label: string, value: string | number, color: string, onPress?: () => void) {
    return (
      <TouchableOpacity
        style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderFilterButton(filter: typeof activeFilter, label: string, icon: any) {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setActiveFilter(filter)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isActive ? '#FFFFFF' : Colors.textSecondary}
        />
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderContractCard(contract: Contract) {
    const actualStatus = getActualContractStatus(contract);
    
    return (
      <TouchableOpacity
        key={contract.id}
        style={styles.contractCard}
        onPress={() => router.push(`/contract-details?contractId=${contract.id}`)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.contractHeader}>
          <View style={styles.contractHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(actualStatus) }]} />
            <View style={styles.contractHeaderInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.contractName} numberOfLines={1}>
                  {contract.renterInfo.fullName}
                </Text>
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={(e) => handlePhoneCall(contract.renterInfo.phoneNumber || contract.renterInfo.phone, e)}
                >
                  <Ionicons name="call" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.contractCar} numberOfLines={1}>
                {contract.carInfo.makeModel} • {contract.carInfo.licensePlate}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(actualStatus) + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(actualStatus) }]}>
              {getStatusLabel(actualStatus)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.contractDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Παραλαβή:</Text>
            <Text style={styles.detailValue}>
              {formatDate(contract.rentalPeriod.pickupDate)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Επιστροφή:</Text>
            <Text style={styles.detailValue}>
              {formatDate(contract.rentalPeriod.dropoffDate)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Τοποθεσία:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {contract.rentalPeriod.pickupLocation}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.contractFooter}>
          <View style={styles.priceContainer}>
            <Ionicons name="cash-outline" size={18} color={Colors.primary} />
            <Text style={styles.priceValue}>€{contract.rentalPeriod.totalCost || 0}</Text>
          </View>
          <View style={styles.footerIcons}>
            {contract.damagePoints && contract.damagePoints.length > 0 && (
              <View style={styles.footerIconBadge}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={styles.footerIconBadgeText}>{contract.damagePoints.length}</Text>
              </View>
            )}
            {(contract.aadeStatus === 'submitted' || contract.aadeStatus === 'completed') && (
              <View style={styles.aadeBadgeHome}>
                <Ionicons name="cloud-done" size={14} color="#28a745" />
                <Text style={styles.aadeBadgeTextHome}>ΑΑΔΕ</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="document-text-outline" size={64} color={Colors.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>Δεν υπάρχουν συμβόλαια</Text>
        <Text style={styles.emptySubtitle}>
          {activeFilter === 'all'
            ? 'Δημιουργήστε το πρώτο σας συμβόλαιο πατώντας το κουμπί +'
            : `Δεν υπάρχουν ${getStatusLabel(activeFilter).toLowerCase()} συμβόλαια`}
        </Text>
        {activeFilter === 'all' && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/new-contract')}
            activeOpacity={0.8}
          >
            <FleetOSIcon variant="icon" size={24} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Νέο Συμβόλαιο</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        {...smoothScrollConfig}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dashboard Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Επισκόπηση</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard('documents', 'Συνολικά', stats.totalContracts, Colors.primary, () => setActiveFilter('all'))}
            {renderStatsCard('checkmark-circle', 'Ενεργά', stats.activeContracts, Colors.success, () => setActiveFilter('active'))}
            {renderStatsCard('time', 'Επερχόμενα', stats.upcomingContracts, Colors.info, () => setActiveFilter('upcoming'))}
            {renderStatsCard('checkmark-done', 'Ολοκληρωμένα', stats.completedContracts, Colors.textSecondary, () => setActiveFilter('completed'))}
          </View>
        </View>

        {/* Revenue Stats */}
        <View style={styles.revenueSection}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueCardLeft}>
              <View style={[styles.revenueIcon, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="trending-up" size={28} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.revenueLabel}>Συνολικά Έσοδα</Text>
                <Text style={styles.revenueValue}>€{stats.totalRevenue.toLocaleString()}</Text>
              </View>
            </View>
          </View>
          <View style={styles.revenueCard}>
            <View style={styles.revenueCardLeft}>
              <View style={[styles.revenueIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="calendar" size={28} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.revenueLabel}>Αυτόν τον Μήνα</Text>
                <Text style={styles.revenueValue}>€{stats.revenueThisMonth.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Αναζήτηση συμβολαίων..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {renderFilterButton('all', 'Όλα', 'grid-outline')}
            {renderFilterButton('active', 'Ενεργά', 'checkmark-circle-outline')}
            {renderFilterButton('upcoming', 'Επερχόμενα', 'time-outline')}
            {renderFilterButton('completed', 'Ολοκληρωμένα', 'checkmark-done-outline')}
          </ScrollView>
        </View>

        {/* Contracts List */}
        <View style={styles.contractsSection}>
          <View style={styles.contractsHeader}>
            <Text style={styles.sectionTitle}>
              Συμβόλαια ({filteredContracts.length})
            </Text>
          </View>

          {filteredContracts.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.contractsList}>
              {filteredContracts.map(contract => renderContractCard(contract))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <ContextAwareFab
        onNewContract={() => router.push('/new-contract')}
        onNewDamage={() => router.push('/damage-report')}
        onNewUser={() => router.push('/user-management')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // iOS #F2F2F7
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
    flexGrow: 1,
  },
  // Stats Section
  statsSection: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Revenue Section
  revenueSection: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 6,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    ...Shadows.sm,
  },
  revenueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revenueIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  // Search Section
  searchSection: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  // Filters Section
  filtersSection: {
    paddingBottom: 6,
  },
  filtersScroll: {
    paddingHorizontal: 8,
    gap: 6,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  // Contracts Section
  contractsSection: {
    paddingHorizontal: 8,
  },
  contractsHeader: {
    marginBottom: 8,
  },
  contractsList: {
    gap: 6,
  },
  // Contract Card
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    ...Shadows.sm,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contractHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  contractHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  contractName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  phoneButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractCar: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contractDetails: {
    marginBottom: 8,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    width: 70,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  contractFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  footerIconBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
  },
  aadeBadgeHome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#28a74515',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a74530',
  },
  aadeBadgeTextHome: {
    fontSize: 10,
    fontWeight: '700',
    color: '#28a745',
    letterSpacing: 0.5,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    ...Shadows.sm,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
