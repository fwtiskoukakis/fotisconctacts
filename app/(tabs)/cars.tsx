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
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../../components/glass-card';
import { Colors, Typography, Shadows, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { VehicleService } from '../../services/vehicle.service';
import { Vehicle, VehicleStatus } from '../../models/vehicle.interface';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const NUM_COLUMNS = 5;
const CARD_WIDTH = (width - (CARD_MARGIN * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

export default function CarsScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filtered, setFiltered] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [vehicles, search, filter]);

  async function loadCars() {
    try {
      const data = await VehicleService.getAllVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης οχημάτων');
    }
  }

  async function deleteVehicle(vehicle: Vehicle) {
    Alert.alert(
      'Επιβεβαίωση Διαγραφής',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε το όχημα "${vehicle.make} ${vehicle.model}" (${vehicle.licensePlate});`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await VehicleService.deleteVehicle(vehicle.id);
              Alert.alert('Επιτυχία', 'Το όχημα διαγράφηκε επιτυχώς.');
              loadCars();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής οχήματος.');
            }
          }
        }
      ]
    );
  }

  function filterCars() {
    let result = vehicles;
    if (filter === 'available') result = result.filter(v => v.status === 'available');
    if (filter === 'rented') result = result.filter(v => v.status === 'rented');
    if (filter === 'maintenance') result = result.filter(v => v.status === 'maintenance');
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.licensePlate.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCars();
    setRefreshing(false);
  };

  return (
    <View style={s.container}>
      <View style={s.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={s.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={s.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={s.breadcrumbCurrent}>Αυτοκίνητα</Text>
      </View>

      <View style={s.topBar}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput style={s.searchInput} placeholder="Αναζήτηση..." value={search} onChangeText={setSearch} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>
          {([['all', 'Όλα'], ['available', 'Διαθέσιμα'], ['rented', 'Ενοικιασμένα'], ['maintenance', 'Συντήρηση']] as const).map(([f, label]) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {label} ({f === 'all' ? vehicles.length : vehicles.filter(c => c.status === f).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id}
        style={s.list}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: vehicle }) => (
          <TouchableOpacity 
            style={[s.card, { width: CARD_WIDTH }]} 
            onPress={() => router.push(`/car-details?carId=${vehicle.id}`)}
            activeOpacity={0.7}
          >
            <View style={s.cardContent}>
              <View style={s.cardHeader}>
                <View style={[s.statusDot, { backgroundColor: vehicle.status === 'available' ? Colors.success : Colors.error }]} />
                <TouchableOpacity
                  style={s.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteVehicle(vehicle);
                  }}
                >
                  <Ionicons name="trash-outline" size={12} color={Colors.error} />
                </TouchableOpacity>
              </View>
              <View style={s.cardBody}>
                <Text style={s.makeModel} numberOfLines={2}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <Text style={s.plateNumber} numberOfLines={1}>
                  {vehicle.licensePlate}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Ionicons name="car-outline" size={48} color={Colors.textSecondary} />
            <Text style={s.emptyText}>Δεν βρέθηκαν αυτοκίνητα</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 6 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breadcrumbText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  breadcrumbCurrent: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  topBar: { backgroundColor: '#fff', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 8, height: 36, marginBottom: 8, gap: 6 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filters: { flexDirection: 'row', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 6 },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { flex: 1, padding: CARD_MARGIN },
  listContent: { paddingBottom: 100 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    margin: CARD_MARGIN / 2,
    ...Shadows.sm 
  },
  cardContent: {
    padding: 8,
    height: 80,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  makeModel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: Colors.text, 
    textAlign: 'center',
    lineHeight: 14,
  },
  plateNumber: { 
    fontSize: 10, 
    color: Colors.textSecondary, 
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  deleteButton: { 
    padding: 2,
  },
  empty: { 
    alignItems: 'center', 
    paddingVertical: 48,
    width: '100%',
  },
  emptyText: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
    marginTop: 12 
  },
});
