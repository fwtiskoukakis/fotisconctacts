import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Breadcrumb } from '../../components/breadcrumb';
import { Colors, Typography, Shadows } from '../../utils/design-system';
import { VehicleService } from '../../services/vehicle.service';
import { Vehicle } from '../../models/vehicle.interface';
import { calculateExpiryUrgency, calculateServiceUrgency, UrgencyResult } from '../../utils/maintenance-urgency';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

type SortOption = 'kteo' | 'tires' | 'insurance' | 'service';

interface VehicleMaintenanceInfo {
  vehicle: Vehicle;
  kteoUrgency: UrgencyResult;
  tiresUrgency: UrgencyResult;
  insuranceUrgency: UrgencyResult;
  serviceUrgency: UrgencyResult;
  mostUrgent: UrgencyResult;
}

export default function MaintenanceScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceInfo, setMaintenanceInfo] = useState<VehicleMaintenanceInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('kteo');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    calculateMaintenanceInfo();
  }, [vehicles, sortBy]);

  async function loadVehicles() {
    try {
      const data = await VehicleService.getAllVehiclesWithUpdatedAvailability();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης οχημάτων');
    }
  }

  function calculateMaintenanceInfo() {
    const info: VehicleMaintenanceInfo[] = vehicles.map(vehicle => {
      const kteoUrgency = calculateExpiryUrgency(vehicle.kteoExpiryDate);
      const tiresUrgency = calculateExpiryUrgency(vehicle.tiresNextChangeDate);
      const insuranceUrgency = calculateExpiryUrgency(vehicle.insuranceExpiryDate);
      const serviceUrgency = calculateServiceUrgency(vehicle.currentMileage, vehicle.nextServiceMileage);

      // Get most urgent item
      const urgencies = [kteoUrgency, tiresUrgency, insuranceUrgency, serviceUrgency];
      const mostUrgent = urgencies.reduce((most, current) => {
        const priorityMap = { expired: 0, critical: 1, warning: 2, soon: 3, ok: 4 };
        if (priorityMap[current.level] < priorityMap[most.level]) {
          return current;
        }
        if (priorityMap[current.level] === priorityMap[most.level] && 
            current.daysRemaining < most.daysRemaining) {
          return current;
        }
        return most;
      });

      return {
        vehicle,
        kteoUrgency,
        tiresUrgency,
        insuranceUrgency,
        serviceUrgency,
        mostUrgent,
      };
    });

    // Sort based on selected option
    const sorted = [...info].sort((a, b) => {
      let urgencyA: UrgencyResult;
      let urgencyB: UrgencyResult;

      switch (sortBy) {
        case 'kteo':
          urgencyA = a.kteoUrgency;
          urgencyB = b.kteoUrgency;
          break;
        case 'tires':
          urgencyA = a.tiresUrgency;
          urgencyB = b.tiresUrgency;
          break;
        case 'insurance':
          urgencyA = a.insuranceUrgency;
          urgencyB = b.insuranceUrgency;
          break;
        case 'service':
          urgencyA = a.serviceUrgency;
          urgencyB = b.serviceUrgency;
          break;
        default:
          urgencyA = a.kteoUrgency;
          urgencyB = b.kteoUrgency;
      }

      // Sort by urgency level first
      const priorityMap = { expired: 0, critical: 1, warning: 2, soon: 3, ok: 4 };
      if (priorityMap[urgencyA.level] !== priorityMap[urgencyB.level]) {
        return priorityMap[urgencyA.level] - priorityMap[urgencyB.level];
      }

      // Then by days/km remaining
      return urgencyA.daysRemaining - urgencyB.daysRemaining;
    });

    setMaintenanceInfo(sorted);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  function getSortLabel(option: SortOption): string {
    switch (option) {
      case 'kteo':
        return 'KTEO Λήξη';
      case 'tires':
        return 'Αλλαγή Λάστιχα';
      case 'insurance':
        return 'Ασφάλεια Λήξη';
      case 'service':
        return 'Σέρβις';
      default:
        return '';
    }
  }

  function formatDate(date: Date | null | undefined): string {
    if (!date) return '-';
    return format(date, 'd MMM yyyy', { locale: el });
  }

  function renderMaintenanceCard(item: VehicleMaintenanceInfo) {
    const { vehicle, kteoUrgency, tiresUrgency, insuranceUrgency, serviceUrgency, mostUrgent } = item;

    return (
      <TouchableOpacity
        key={vehicle.id}
        style={[s.card, { borderLeftColor: mostUrgent.color, borderLeftWidth: 4 }]}
        onPress={() => router.push(`/car-details?carId=${vehicle.id}`)}
        activeOpacity={0.7}
      >
        <View style={s.cardHeader}>
          <View style={s.cardHeaderLeft}>
            <Text style={s.licensePlate}>{vehicle.licensePlate}</Text>
            <Text style={s.vehicleInfo}>{vehicle.make} {vehicle.model}</Text>
          </View>
          <View style={[s.urgencyBadge, { backgroundColor: mostUrgent.color + '15' }]}>
            <Text style={[s.urgencyBadgeText, { color: mostUrgent.color }]}>
              {mostUrgent.level === 'expired' ? 'ΕΛΗΞΕ' : 
               mostUrgent.level === 'critical' ? 'ΕΠΕΙΓΟΝ' :
               mostUrgent.level === 'warning' ? 'ΠΡΟΣΟΧΗ' : 
               mostUrgent.level === 'soon' ? 'ΣΥΝΤΟΜΑ' : 'ΟΚ'}
            </Text>
          </View>
        </View>

        <View style={s.cardBody}>
          {/* KTEO */}
          <View style={s.maintenanceRow}>
            <View style={s.maintenanceIcon}>
              <Ionicons name="checkmark-circle-outline" size={16} color={kteoUrgency.color} />
            </View>
            <View style={s.maintenanceContent}>
              <Text style={s.maintenanceLabel}>KTEO</Text>
              <Text style={s.maintenanceDate}>{formatDate(vehicle.kteoExpiryDate)}</Text>
            </View>
            <View style={s.maintenanceStatus}>
              <Text style={[s.maintenanceStatusText, { color: kteoUrgency.color }]}>
                {kteoUrgency.label}
              </Text>
            </View>
          </View>

          {/* Tires */}
          <View style={s.maintenanceRow}>
            <View style={s.maintenanceIcon}>
              <Ionicons name="ellipse-outline" size={16} color={tiresUrgency.color} />
            </View>
            <View style={s.maintenanceContent}>
              <Text style={s.maintenanceLabel}>Λάστιχα</Text>
              <Text style={s.maintenanceDate}>{formatDate(vehicle.tiresNextChangeDate)}</Text>
            </View>
            <View style={s.maintenanceStatus}>
              <Text style={[s.maintenanceStatusText, { color: tiresUrgency.color }]}>
                {tiresUrgency.label}
              </Text>
            </View>
          </View>

          {/* Insurance */}
          <View style={s.maintenanceRow}>
            <View style={s.maintenanceIcon}>
              <Ionicons name="shield-checkmark-outline" size={16} color={insuranceUrgency.color} />
            </View>
            <View style={s.maintenanceContent}>
              <Text style={s.maintenanceLabel}>
                Ασφάλεια {vehicle.insuranceHasMixedCoverage ? '(Μικτή)' : ''}
              </Text>
              <Text style={s.maintenanceDate}>{formatDate(vehicle.insuranceExpiryDate)}</Text>
            </View>
            <View style={s.maintenanceStatus}>
              <Text style={[s.maintenanceStatusText, { color: insuranceUrgency.color }]}>
                {insuranceUrgency.label}
              </Text>
            </View>
          </View>

          {/* Service */}
          <View style={s.maintenanceRow}>
            <View style={s.maintenanceIcon}>
              <Ionicons name="construct-outline" size={16} color={serviceUrgency.color} />
            </View>
            <View style={s.maintenanceContent}>
              <Text style={s.maintenanceLabel}>Σέρβις</Text>
              <Text style={s.maintenanceDate}>
                {vehicle.nextServiceMileage ? `Στα ${vehicle.nextServiceMileage.toLocaleString('el-GR')} km` : '-'}
              </Text>
            </View>
            <View style={s.maintenanceStatus}>
              <Text style={[s.maintenanceStatusText, { color: serviceUrgency.color }]}>
                {serviceUrgency.label}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <Breadcrumb
        items={[
          { label: 'Αρχική', path: '/', icon: 'home' },
          { label: 'Συντήρηση' },
        ]}
      />

      <View style={s.topBar}>
        <Text style={s.title}>Συντήρηση Οχημάτων</Text>
        <Text style={s.subtitle}>Ταξινόμηση κατά:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sortButtons}>
          {(['kteo', 'tires', 'insurance', 'service'] as SortOption[]).map(option => (
            <TouchableOpacity
              key={option}
              style={[s.sortBtn, sortBy === option && s.sortBtnActive]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[s.sortText, sortBy === option && s.sortTextActive]}>
                {getSortLabel(option)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={maintenanceInfo}
        keyExtractor={item => item.vehicle.id}
        style={s.list}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => renderMaintenanceCard(item)}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Ionicons name="construct-outline" size={48} color={Colors.textSecondary} />
            <Text style={s.emptyText}>Δεν βρέθηκαν οχήματα</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  topBar: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: Colors.text, 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 12, 
    color: Colors.textSecondary, 
    fontWeight: '600', 
    marginBottom: 8, 
    marginTop: 8 
  },
  sortButtons: { 
    flexDirection: 'row' 
  },
  sortBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  sortBtnActive: { 
    backgroundColor: Colors.primary 
  },
  sortText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: Colors.textSecondary 
  },
  sortTextActive: { 
    color: '#fff' 
  },
  list: { 
    flex: 1 
  },
  listContent: { 
    padding: 12, 
    paddingBottom: 100 
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardHeaderLeft: { 
    flex: 1 
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: 12,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  maintenanceIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  maintenanceContent: {
    flex: 1,
  },
  maintenanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  maintenanceDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  maintenanceStatus: {
    alignItems: 'flex-end',
  },
  maintenanceStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
