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
import { Colors, Typography, Shadows, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { supabase } from '../../utils/supabase';

interface Car {
  id: string;
  makeModel: string;
  licensePlate: string;
  year: number;
  fuelType: string;
  transmission: string;
  seats: number;
  dailyRate: number;
  isAvailable: boolean;
}

export default function CarsScreen() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [filtered, setFiltered] = useState<Car[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [cars, search, filter]);

  async function loadCars() {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id,make_model,license_plate,year,fuel_type,transmission,seats,daily_rate,is_available')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = data?.map(d => ({
        id: d.id,
        makeModel: d.make_model,
        licensePlate: d.license_plate,
        year: d.year,
        fuelType: d.fuel_type,
        transmission: d.transmission,
        seats: d.seats,
        dailyRate: d.daily_rate,
        isAvailable: d.is_available,
      })) || [];

      setCars(mapped);
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης');
    }
  }

  function filterCars() {
    let result = cars;
    if (filter === 'available') result = result.filter(c => c.isAvailable);
    if (filter === 'unavailable') result = result.filter(c => !c.isAvailable);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.makeModel.toLowerCase().includes(q) ||
        c.licensePlate.toLowerCase().includes(q)
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
          {([['all', 'Όλα'], ['available', 'Διαθέσιμα'], ['unavailable', 'Μη Διαθέσιμα']] as const).map(([f, label]) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {label} ({cars.filter(c => f === 'all' || (f === 'available' ? c.isAvailable : !c.isAvailable)).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={s.list} {...smoothScrollConfig} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.map(c => (
          <TouchableOpacity key={c.id} style={s.card} onPress={() => router.push(`/car-details?carId=${c.id}`)}>
            <View style={s.row}>
              <View style={s.left}>
                <Text style={s.name} numberOfLines={1}>{c.makeModel}</Text>
                <Text style={s.detail}>{c.licensePlate} • {c.year}</Text>
                <Text style={s.detail}>{c.fuelType} • {c.transmission} • {c.seats} θέσεις</Text>
              </View>
              <View style={s.right}>
                <View style={[s.badge, { backgroundColor: c.isAvailable ? Colors.success + '15' : Colors.error + '15' }]}>
                  <Text style={[s.badgeText, { color: c.isAvailable ? Colors.success : Colors.error }]}>
                    {c.isAvailable ? 'Διαθέσιμο' : 'Μη Διαθέσιμο'}
                  </Text>
                </View>
                <Text style={s.price}>€{c.dailyRate}/ημ</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, ...Shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  detail: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  price: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
});
