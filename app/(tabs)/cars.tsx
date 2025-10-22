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
const NUM_COLUMNS = 2;
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

      <ScrollView style={s.list} contentContainerStyle={s.listContent} {...smoothScrollConfig} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.map(c => (
          <TouchableOpacity key={c.id} style={s.card} onPress={() => router.push(`/car-details?carId=${c.id}`)}>
            <View style={s.row}>
              <View style={s.left}>
                <Text style={s.name} numberOfLines={1}>{c.make} {c.model}</Text>
                <Text style={s.detail}>{c.licensePlate} • {c.year}</Text>
                {c.color && <Text style={s.detail}>Χρώμα: {c.color}</Text>}
                {c.category && <Text style={s.detail}>Κατηγορία: {c.category}</Text>}
              </View>
              <View style={s.right}>
                <View style={[s.badge, { backgroundColor: c.status === 'available' ? Colors.success + '15' : Colors.error + '15' }]}>
                  <Text style={[s.badgeText, { color: c.status === 'available' ? Colors.success : Colors.error }]}>
                    {c.status === 'available' ? 'Διαθέσιμο' : c.status === 'rented' ? 'Ενοικιασμένο' : 'Συντήρηση'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteVehicle(c);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="car-outline" size={48} color={Colors.textSecondary} />
            <Text style={s.emptyText}>Δεν βρέθηκαν αυτοκίνητα</Text>
          </View>
        )}
      </ScrollView>
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
  list: { flex: 1, padding: 8 },
  listContent: { paddingBottom: 100, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, ...Shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  detail: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  price: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  deleteButton: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
});
