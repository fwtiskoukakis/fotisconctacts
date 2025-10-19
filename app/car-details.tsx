import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { supabase } from '../utils/supabase';

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

interface CarStats {
  totalContracts: number;
  totalRevenue: number;
  totalDamages: number;
}

export default function CarDetailsScreen() {
  const router = useRouter();
  const { carId } = useLocalSearchParams();
  const [car, setCar] = useState<Car | null>(null);
  const [stats, setStats] = useState<CarStats>({ totalContracts: 0, totalRevenue: 0, totalDamages: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCar();
  }, [carId]);

  async function loadCar() {
    if (typeof carId !== 'string') return;
    try {
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      if (carError || !carData) {
        Alert.alert('Σφάλμα', 'Το αυτοκίνητο δεν βρέθηκε');
        router.back();
        return;
      }

      setCar({
        id: carData.id,
        makeModel: carData.make_model,
        licensePlate: carData.license_plate,
        year: carData.year,
        fuelType: carData.fuel_type,
        transmission: carData.transmission,
        seats: carData.seats,
        dailyRate: carData.daily_rate,
        isAvailable: carData.is_available,
      });

      const { data: contracts } = await supabase.from('contracts').select('total_cost').eq('car_license_plate', carData.license_plate);
      const { data: damages } = await supabase.from('damage_points').select('id').eq('contract_id', carId);

      setStats({
        totalContracts: contracts?.length || 0,
        totalRevenue: contracts?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0,
        totalDamages: damages?.length || 0,
      });
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης');
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCar();
    setRefreshing(false);
  };

  function handleEdit() {
    // TODO: Create edit-car page or modal
    Alert.alert('Επεξεργασία', 'Η λειτουργία επεξεργασίας αυτοκινήτου θα είναι σύντομα διαθέσιμη.');
  }

  if (!car) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <AppHeader title="Λεπτομέρειες" showBack={true} showActions={true} />
        <View style={s.loading}>
          <Text style={s.loadingText}>Φόρτωση...</Text>
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  const InfoRow = ({ icon, label, value }: any) => (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={s.infoLabel}>{label}:</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <AppHeader title="Λεπτομέρειες Αυτοκινήτου" showBack={true} showActions={true} />

      <View style={s.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={s.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={s.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <TouchableOpacity onPress={() => router.push('/cars')} style={s.breadcrumbItem}>
          <Text style={s.breadcrumbText}>Αυτοκίνητα</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={s.breadcrumbCurrent}>{car.licensePlate}</Text>
      </View>

      <ScrollView style={s.content} {...smoothScrollConfig} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.statusCard}>
          <View style={[s.statusDot, { backgroundColor: car.isAvailable ? Colors.success : Colors.error }]} />
          <Text style={s.statusText}>{car.isAvailable ? 'Διαθέσιμο' : 'Μη Διαθέσιμο'}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Πληροφορίες</Text>
          <View style={s.card}>
            <InfoRow icon="car" label="Όχημα" value={car.makeModel} />
            <InfoRow icon="pricetag" label="Πινακίδα" value={car.licensePlate} />
            <InfoRow icon="calendar" label="Έτος" value={car.year.toString()} />
            <InfoRow icon="flash" label="Καύσιμο" value={car.fuelType} />
            <InfoRow icon="settings" label="Κιβώτιο" value={car.transmission} />
            <InfoRow icon="people" label="Θέσεις" value={car.seats.toString()} />
            <InfoRow icon="cash" label="Ημερήσια Τιμή" value={`€${car.dailyRate}`} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Στατιστικά</Text>
          <View style={s.statsGrid}>
            <View style={[s.statCard, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="documents" size={24} color={Colors.primary} />
              <Text style={[s.statValue, { color: Colors.primary }]}>{stats.totalContracts}</Text>
              <Text style={s.statLabel}>Συμβόλαια</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: Colors.success + '15' }]}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <Text style={[s.statValue, { color: Colors.success }]}>€{stats.totalRevenue}</Text>
              <Text style={s.statLabel}>Έσοδα</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: Colors.error + '15' }]}>
              <Ionicons name="warning" size={24} color={Colors.error} />
              <Text style={[s.statValue, { color: Colors.error }]}>{stats.totalDamages}</Text>
              <Text style={s.statLabel}>Ζημιές</Text>
            </View>
          </View>
          
          {/* Edit Button */}
          <TouchableOpacity
            style={s.editButton}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={s.editButtonText}>Επεξεργασία</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 6 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breadcrumbText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  breadcrumbCurrent: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  content: { flex: 1, padding: 8 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, ...Shadows.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, marginLeft: 4, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, ...Shadows.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', minWidth: 100 },
  infoValue: { fontSize: 13, color: Colors.text, flex: 1, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, ...Shadows.sm },
  statValue: { fontSize: 18, fontWeight: '700', marginVertical: 4 },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    ...Shadows.md,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
