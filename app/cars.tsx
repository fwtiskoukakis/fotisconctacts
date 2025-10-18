import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { ContextAwareFab } from '../components/context-aware-fab';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';
import { supabase } from '../utils/supabase';

interface Car {
  id: string;
  make: string;
  model: string;
  makeModel: string;
  year?: number;
  licensePlate: string;
  color?: string;
  fuelType: string;
  transmission: string;
  seats: number;
  dailyRate: number;
  isAvailable: boolean;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CarsScreen() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCars();
  }, []);

  async function loadCars() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cars:', error);
        Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης αυτοκινήτων');
        return;
      }

      const mappedCars = data?.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        makeModel: car.make_model,
        year: car.year,
        licensePlate: car.license_plate,
        color: car.color,
        fuelType: car.fuel_type,
        transmission: car.transmission,
        seats: car.seats,
        dailyRate: car.daily_rate,
        isAvailable: car.is_available,
        photoUrl: car.photo_url,
        createdAt: car.created_at,
        updatedAt: car.updated_at,
      })) || [];

      setCars(mappedCars);
    } catch (error) {
      console.error('Error loading cars:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης αυτοκινήτων');
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadCars();
    setRefreshing(false);
  }

  async function toggleCarAvailability(carId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ is_available: !currentStatus })
        .eq('id', carId);

      if (error) {
        console.error('Error updating car availability:', error);
        Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης κατάστασης');
        return;
      }

      // Update local state
      setCars(cars.map(car => 
        car.id === carId 
          ? { ...car, isAvailable: !currentStatus }
          : car
      ));
    } catch (error) {
      console.error('Error updating car availability:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης κατάστασης');
    }
  }

  function renderCarItem({ item }: { item: Car }) {
    return (
      <TouchableOpacity
        style={[styles.carItem, Glassmorphism.light]}
        onPress={() => router.push(`/car-details?carId=${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.carHeader}>
          <View style={styles.carImageContainer}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.carImage} />
            ) : (
              <View style={styles.carImagePlaceholder}>
                <Text style={styles.carImageIcon}>🚗</Text>
              </View>
            )}
          </View>
          
          <View style={styles.carInfo}>
            <Text style={styles.carName} numberOfLines={1}>
              {item.makeModel}
            </Text>
            <Text style={styles.carDetails} numberOfLines={1}>
              {item.year} • {item.color} • {item.licensePlate}
            </Text>
            <Text style={styles.carSpecs}>
              {item.fuelType} • {item.transmission} • {item.seats} θέσεις
            </Text>
          </View>

          <View style={styles.carActions}>
            <TouchableOpacity
              style={[
                styles.availabilityButton,
                item.isAvailable ? styles.availableButton : styles.unavailableButton
              ]}
              onPress={() => toggleCarAvailability(item.id, item.isAvailable)}
            >
              <Text style={[
                styles.availabilityText,
                item.isAvailable ? styles.availableText : styles.unavailableText
              ]}>
                {item.isAvailable ? 'Διαθέσιμο' : 'Μη Διαθέσιμο'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.dailyRate}>€{item.dailyRate}/ημέρα</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🚗</Text>
        <Text style={styles.emptyTitle}>Δεν υπάρχουν αυτοκίνητα</Text>
        <Text style={styles.emptySubtitle}>
          Πατήστε το κουμπί "+" για να προσθέσετε το πρώτο αυτοκίνητο
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Αυτοκίνητα" showActions={true} />
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
          <Text style={styles.statValue}>{cars.length}</Text>
          <Text style={styles.statLabel}>Συνολικά</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: Colors.success }]}>
          <Text style={styles.statValue}>{cars.filter(c => c.isAvailable).length}</Text>
          <Text style={styles.statLabel}>Διαθέσιμα</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: Colors.warning }]}>
          <Text style={styles.statValue}>{cars.filter(c => !c.isAvailable).length}</Text>
          <Text style={styles.statLabel}>Ενοικιασμένα</Text>
        </View>
      </View>

      {/* Cars List */}
      <FlatList
        data={cars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          cars.length === 0 && styles.listContentEmpty
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Context-Aware Floating Action Button */}
      <ContextAwareFab
        onNewCar={() => router.push('/add-car')}
        onCarMaintenance={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία συντήρησης αυτοκινήτων θα προστεθεί σύντομα');
        }}
        onCarInspection={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία επιθεώρησης αυτοκινήτων θα προστεθεί σύντομα');
        }}
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
  carItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  carHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carImageContainer: {
    marginRight: Spacing.md,
  },
  carImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  carImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carImageIcon: {
    fontSize: 24,
  },
  carInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  carName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  carDetails: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  carSpecs: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  carActions: {
    alignItems: 'flex-end',
  },
  availabilityButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  availableButton: {
    backgroundColor: Colors.success,
  },
  unavailableButton: {
    backgroundColor: Colors.error,
  },
  availabilityText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  availableText: {
    color: Colors.textInverse,
  },
  unavailableText: {
    color: Colors.textInverse,
  },
  dailyRate: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: 'bold',
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
