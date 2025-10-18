import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { Breadcrumb } from '../components/breadcrumb';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';
import { supabase } from '../utils/supabase';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

const { width } = Dimensions.get('window');

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
  description?: string;
  features?: string;
  images?: string[];
  agency?: string;
  island?: string;
  category?: string;
  status?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contract {
  id: string;
  renterFullName: string;
  renterPhoneNumber?: string;
  renterEmail?: string;
  pickupDate: string;
  dropoffDate: string;
  totalCost: number;
  carMileage?: number;
  fuelLevel?: number;
  createdAt: string;
}

interface DamageRecord {
  id: string;
  contractId: string;
  description: string;
  severity: string;
  viewSide: string;
  xPosition: number;
  yPosition: number;
  createdAt: string;
  contractRenterFullName?: string;
}

interface Payment {
  id: string;
  contractId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  contractRenterName?: string;
}

interface CarStats {
  totalContracts: number;
  totalRevenue: number;
  totalMileage: number;
  totalDamages: number;
  averageRentalDays: number;
  utilizationRate: number;
}

export default function CarDetailsScreen() {
  const router = useRouter();
  const { carId } = useLocalSearchParams();
  const [car, setCar] = useState<Car | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<CarStats>({
    totalContracts: 0,
    totalRevenue: 0,
    totalMileage: 0,
    totalDamages: 0,
    averageRentalDays: 0,
    utilizationRate: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'damages' | 'payments'>('overview');

  useEffect(() => {
    loadCarDetails();
  }, [carId]);

  async function loadCarDetails() {
    try {
      setLoading(true);

      // Load car details
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      if (carError) {
        console.error('Error loading car:', carError);
        Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης στοιχείων αυτοκινήτου');
        router.back();
        return;
      }

      const mappedCar: Car = {
        id: carData.id,
        make: carData.make,
        model: carData.model,
        makeModel: carData.make_model,
        year: carData.year,
        licensePlate: carData.license_plate,
        color: carData.color,
        fuelType: carData.fuel_type,
        transmission: carData.transmission,
        seats: carData.seats,
        dailyRate: carData.daily_rate,
        isAvailable: carData.is_available,
        description: carData.description,
        features: carData.features,
        images: carData.images,
        agency: carData.agency,
        island: carData.island,
        category: carData.category,
        status: carData.status,
        type: carData.type,
        createdAt: carData.created_at,
        updatedAt: carData.updated_at,
      };

      setCar(mappedCar);

      // Load contracts for this car
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('car_license_plate', mappedCar.licensePlate)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('Error loading contracts:', contractsError);
      } else {
        const mappedContracts: Contract[] = contractsData?.map(c => ({
          id: c.id,
          renterFullName: c.renter_full_name,
          renterPhoneNumber: c.renter_phone_number,
          renterEmail: c.renter_email,
          pickupDate: c.pickup_date,
          dropoffDate: c.dropoff_date,
          totalCost: c.total_cost,
          carMileage: c.car_mileage,
          fuelLevel: c.fuel_level,
          createdAt: c.created_at,
        })) || [];
        setContracts(mappedContracts);

        // Calculate stats
        calculateStats(mappedContracts, mappedCar);
      }

      // Load damage points for this car's contracts
      if (contractsData && contractsData.length > 0) {
        const contractIds = contractsData.map(c => c.id);
        const { data: damagesData, error: damagesError } = await supabase
          .from('damage_points')
          .select('*, contracts!inner(renter_full_name)')
          .in('contract_id', contractIds)
          .order('created_at', { ascending: false });

        if (damagesError) {
          console.error('Error loading damages:', damagesError);
        } else {
          const mappedDamages: DamageRecord[] = damagesData?.map(d => ({
            id: d.id,
            contractId: d.contract_id,
            description: d.description,
            severity: d.severity,
            viewSide: d.view_side,
            xPosition: d.x_position,
            yPosition: d.y_position,
            createdAt: d.created_at,
            contractRenterFullName: d.contracts?.renter_full_name,
          })) || [];
          setDamages(mappedDamages);
        }
      }

      // Note: Payments table doesn't exist yet in the schema, so we'll show a placeholder
      // When you add a payments table, uncomment this:
      /*
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, contracts!inner(renter_name)')
        .in('contract_id', contractIds)
        .order('payment_date', { ascending: false });

      if (!paymentsError && paymentsData) {
        const mappedPayments: Payment[] = paymentsData.map(p => ({
          id: p.id,
          contractId: p.contract_id,
          amount: p.amount,
          paymentMethod: p.payment_method,
          paymentDate: p.payment_date,
          notes: p.notes,
          contractRenterName: p.contracts?.renter_name,
        }));
        setPayments(mappedPayments);
      }
      */

    } catch (error) {
      console.error('Error loading car details:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης στοιχείων');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(contractsList: Contract[], carData: Car) {
    const totalContracts = contractsList.length;
    const totalRevenue = contractsList.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    
    // Note: car_mileage is the starting mileage, we don't have end mileage in schema
    const totalMileage = contractsList.reduce((sum, c) => sum + (c.carMileage || 0), 0);

    const totalDamages = damages.length;

    // Calculate average rental days
    let totalDays = 0;
    contractsList.forEach(c => {
      const pickup = new Date(c.pickupDate);
      const dropoff = new Date(c.dropoffDate);
      const days = Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += days;
    });
    const averageRentalDays = totalContracts > 0 ? Math.round(totalDays / totalContracts) : 0;

    // Calculate utilization rate (simplified - days rented / days since creation)
    const carAge = Math.ceil((Date.now() - new Date(carData.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const utilizationRate = carAge > 0 ? Math.round((totalDays / carAge) * 100) : 0;

    setStats({
      totalContracts,
      totalRevenue,
      totalMileage,
      totalDamages,
      averageRentalDays,
      utilizationRate: Math.min(utilizationRate, 100),
    });
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadCarDetails();
    setRefreshing(false);
  }

  function renderOverviewTab() {
    if (!car) return null;

    return (
      <View style={styles.tabContent}>
        {/* Car Image */}
        {car.images && car.images.length > 0 && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: car.images[0] }} 
              style={styles.carImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, Glassmorphism.light]}>
            <Text style={styles.statValue}>{stats.totalContracts}</Text>
            <Text style={styles.statLabel}>Συμβόλαια</Text>
          </View>
          <View style={[styles.statBox, Glassmorphism.light]}>
            <Text style={styles.statValue}>€{stats.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Έσοδα</Text>
          </View>
          <View style={[styles.statBox, Glassmorphism.light]}>
            <Text style={styles.statValue}>{stats.totalMileage.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Χιλιόμετρα</Text>
          </View>
          <View style={[styles.statBox, Glassmorphism.light]}>
            <Text style={styles.statValue}>{stats.totalDamages}</Text>
            <Text style={styles.statLabel}>Ζημιές</Text>
          </View>
          <View style={[styles.statBox, Glassmorphism.light]}>
            <Text style={styles.statValue}>{stats.averageRentalDays}</Text>
            <Text style={styles.statLabel}>Μέσες Ημέρες</Text>
          </View>
          <View style={[styles.statBox, Glassmorphism.light]}>
            <Text style={styles.statValue}>{stats.utilizationRate}%</Text>
            <Text style={styles.statLabel}>Χρήση</Text>
          </View>
        </View>

        {/* Car Details */}
        <View style={[styles.section, Glassmorphism.light]}>
          <Text style={styles.sectionTitle}>Στοιχεία Οχήματος</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Μάρκα:</Text>
            <Text style={styles.detailValue}>{car.make}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Μοντέλο:</Text>
            <Text style={styles.detailValue}>{car.model}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Έτος:</Text>
            <Text style={styles.detailValue}>{car.year}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Πινακίδα:</Text>
            <Text style={styles.detailValue}>{car.licensePlate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Χρώμα:</Text>
            <Text style={styles.detailValue}>{car.color || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Καύσιμο:</Text>
            <Text style={styles.detailValue}>{car.fuelType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Κιβώτιο:</Text>
            <Text style={styles.detailValue}>{car.transmission}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Θέσεις:</Text>
            <Text style={styles.detailValue}>{car.seats}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Κατηγορία:</Text>
            <Text style={styles.detailValue}>{car.category || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ημερήσιο Κόστος:</Text>
            <Text style={[styles.detailValue, styles.priceText]}>€{car.dailyRate}/ημέρα</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Κατάσταση:</Text>
            <View style={[
              styles.statusBadge,
              car.isAvailable ? styles.availableBadge : styles.unavailableBadge
            ]}>
              <Text style={styles.statusText}>
                {car.isAvailable ? 'Διαθέσιμο' : 'Μη Διαθέσιμο'}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {car.description && (
          <View style={[styles.section, Glassmorphism.light]}>
            <Text style={styles.sectionTitle}>Περιγραφή</Text>
            <Text style={styles.descriptionText}>{car.description}</Text>
          </View>
        )}

        {/* Features */}
        {car.features && (
          <View style={[styles.section, Glassmorphism.light]}>
            <Text style={styles.sectionTitle}>Χαρακτηριστικά</Text>
            <Text style={styles.featuresText}>{car.features}</Text>
          </View>
        )}
      </View>
    );
  }

  function renderContractsTab() {
    if (contracts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyText}>Δεν υπάρχουν συμβόλαια για αυτό το όχημα</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {contracts.map((contract) => (
          <TouchableOpacity
            key={contract.id}
            style={[styles.contractCard, Glassmorphism.light]}
            onPress={() => router.push(`/contract-details?contractId=${contract.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.contractHeader}>
              <Text style={styles.contractRenter}>{contract.renterFullName}</Text>
              <View style={styles.contractFuelBadge}>
                <Text style={styles.contractFuelText}>⛽ {contract.fuelLevel}/8</Text>
              </View>
            </View>
            
            <View style={styles.contractDetails}>
              <Text style={styles.contractDate}>
                📅 {format(new Date(contract.pickupDate), 'dd/MM/yyyy', { locale: el })} - {format(new Date(contract.dropoffDate), 'dd/MM/yyyy', { locale: el })}
              </Text>
              {contract.renterPhoneNumber && (
                <Text style={styles.contractInfo}>📞 {contract.renterPhoneNumber}</Text>
              )}
              {contract.carMileage && (
                <Text style={styles.contractInfo}>
                  🛣️ Αρχικά: {contract.carMileage.toLocaleString()} km
                </Text>
              )}
              <Text style={styles.contractCost}>💰 €{contract.totalCost.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderDamagesTab() {
    if (damages.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>Δεν υπάρχουν καταγεγραμμένες ζημιές</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {damages.map((damage) => (
          <View key={damage.id} style={[styles.damageCard, Glassmorphism.light]}>
            <View style={styles.damageHeader}>
              <View style={[
                styles.severityBadge,
                damage.severity === 'minor' && styles.minorBadge,
                damage.severity === 'moderate' && styles.moderateBadge,
                damage.severity === 'severe' && styles.severeBadge,
              ]}>
                <Text style={styles.severityText}>
                  {damage.severity === 'minor' ? 'Μικρή' :
                   damage.severity === 'moderate' ? 'Μέτρια' : 'Σοβαρή'}
                </Text>
              </View>
              <Text style={styles.damageView}>
                {damage.viewSide === 'front' ? 'Μπροστά' :
                 damage.viewSide === 'rear' ? 'Πίσω' :
                 damage.viewSide === 'left' ? 'Αριστερά' : 'Δεξιά'}
              </Text>
            </View>
            
            <Text style={styles.damageDescription}>{damage.description}</Text>
            
            {damage.contractRenterFullName && (
              <Text style={styles.damageRenter}>Ενοικιαστής: {damage.contractRenterFullName}</Text>
            )}
            
            <Text style={styles.damageDate}>
              {format(new Date(damage.createdAt), 'dd/MM/yyyy HH:mm', { locale: el })}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  function renderPaymentsTab() {
    // Placeholder until payments table is implemented
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>💳</Text>
        <Text style={styles.emptyText}>Το σύστημα πληρωμών θα προστεθεί σύντομα</Text>
        <Text style={styles.emptySubtext}>
          Θα μπορείτε να παρακολουθείτε όλες τις πληρωμές που σχετίζονται με αυτό το όχημα
        </Text>
      </View>
    );

    /* When payments are implemented:
    if (payments.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyText}>Δεν υπάρχουν καταγεγραμμένες πληρωμές</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {payments.map((payment) => (
          <View key={payment.id} style={[styles.paymentCard, Glassmorphism.light]}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentAmount}>€{payment.amount.toFixed(2)}</Text>
              <Text style={styles.paymentMethod}>{payment.paymentMethod}</Text>
            </View>
            
            {payment.contractRenterName && (
              <Text style={styles.paymentRenter}>{payment.contractRenterName}</Text>
            )}
            
            {payment.notes && (
              <Text style={styles.paymentNotes}>{payment.notes}</Text>
            )}
            
            <Text style={styles.paymentDate}>
              {format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm', { locale: el })}
            </Text>
          </View>
        ))}
      </View>
    );
    */
  }

  if (loading || !car) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Φόρτωση..." showActions={false} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Φόρτωση στοιχείων...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader 
        title={car.makeModel} 
        showActions={true}
        onBack={() => router.back()}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Αρχική', path: '/' },
          { label: 'Αυτοκίνητα', path: '/cars' },
          { label: car.licensePlate },
        ]}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Επισκόπηση
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contracts' && styles.activeTab]}
          onPress={() => setActiveTab('contracts')}
        >
          <Text style={[styles.tabText, activeTab === 'contracts' && styles.activeTabText]}>
            Συμβόλαια ({contracts.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'damages' && styles.activeTab]}
          onPress={() => setActiveTab('damages')}
        >
          <Text style={[styles.tabText, activeTab === 'damages' && styles.activeTabText]}>
            Ζημιές ({damages.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>
            Πληρωμές
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'contracts' && renderContractsTab()}
        {activeTab === 'damages' && renderDamagesTab()}
        {activeTab === 'payments' && renderPaymentsTab()}
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Extra space for bottom tab bar
  },
  tabContent: {
    padding: Spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '30%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  priceText: {
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  availableBadge: {
    backgroundColor: Colors.success,
  },
  unavailableBadge: {
    backgroundColor: Colors.error,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  featuresText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    ...Typography.h4,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  contractCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  contractRenter: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
  },
  contractFuelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.info,
  },
  contractFuelText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  contractDetails: {
    gap: Spacing.xs,
  },
  contractDate: {
    ...Typography.body,
    color: Colors.text,
  },
  contractInfo: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  contractCost: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  damageCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  minorBadge: {
    backgroundColor: Colors.warning,
  },
  moderateBadge: {
    backgroundColor: '#FF9800',
  },
  severeBadge: {
    backgroundColor: Colors.error,
  },
  severityText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  damageView: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  damageDescription: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  damageRenter: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  damageDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  paymentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentAmount: {
    ...Typography.h3,
    color: Colors.success,
    fontWeight: 'bold',
  },
  paymentMethod: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  paymentRenter: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  paymentNotes: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  paymentDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});

