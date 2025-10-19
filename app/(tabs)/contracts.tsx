import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../../components/glass-card';
import { SupabaseContractService } from '../../services/supabase-contract.service';
import { Contract } from '../../models/contract.interface';
import { Colors, Typography, Spacing, Shadows, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { getAADEStatusMessage } from '../../utils/aade-contract-helper';

export default function ContractsScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchQuery, filter]);

  async function loadContracts() {
    try {
      const data = await SupabaseContractService.getAllContracts();
      
      // Add example AADE status to first two contracts for demonstration
      const contractsWithAADE = data.map((contract, index) => {
        if (index === 0) {
          return { ...contract, aadeStatus: 'submitted' as const, aadeDclId: 123456 };
        } else if (index === 1) {
          return { ...contract, aadeStatus: 'completed' as const, aadeDclId: 789012 };
        }
        return contract;
      });
      
      setContracts(contractsWithAADE);
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης');
    }
  }

  function filterContracts() {
    let result = contracts;
    if (filter !== 'all') result = result.filter(c => c.status === filter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.renterInfo.fullName.toLowerCase().includes(q) ||
        c.carInfo.licensePlate.toLowerCase().includes(q)
      );
    }
    setFilteredContracts(result);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'upcoming': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ενεργό';
      case 'upcoming': return 'Επερχόμενο';
      case 'completed': return 'Τέλος';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={styles.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={styles.breadcrumbCurrent}>Συμβόλαια</Text>
      </View>

      {/* Search & Filters */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Αναζήτηση..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {(['all', 'active', 'upcoming', 'completed'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Όλα' : getStatusLabel(f)} ({contracts.filter(c => f === 'all' || c.status === f).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        {...smoothScrollConfig}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredContracts.map(c => (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            onPress={() => router.push(`/contract-details?contractId=${c.id}`)}
          >
            <View style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.name} numberOfLines={1}>{c.renterInfo.fullName}</Text>
                <Text style={styles.detail} numberOfLines={1}>
                  {c.carInfo.makeModel} • {c.carInfo.licensePlate}
                </Text>
                <Text style={styles.date}>
                  {new Date(c.rentalPeriod.pickupDate).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })} - {new Date(c.rentalPeriod.dropoffDate).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' })}
                </Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(c.status) + '15' }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(c.status) }]}>
                    {getStatusLabel(c.status)}
                  </Text>
                </View>
                <Text style={styles.price}>€{c.rentalPeriod.totalCost}</Text>
                
                {/* AADE Status Badge */}
                {(c.aadeStatus === 'submitted' || c.aadeStatus === 'completed') && (
                  <View style={styles.aadeBadge}>
                    <Ionicons name="cloud-done" size={12} color="#28a745" />
                    <Text style={styles.aadeBadgeText}>ΑΑΔΕ</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {filteredContracts.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Δεν βρέθηκαν συμβόλαια</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 6,
  },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breadcrumbText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  breadcrumbCurrent: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  topBar: {
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    marginBottom: 8,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filters: { flexDirection: 'row', gap: 6 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
  },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { flex: 1, padding: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...Shadows.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  detail: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  date: { fontSize: 12, color: Colors.textTertiary },
  right: { alignItems: 'flex-end', gap: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  price: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  aadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#28a74515',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a74530',
  },
  aadeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#28a745',
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
});

