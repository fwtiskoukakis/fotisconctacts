import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { FleetService, Vehicle as FleetVehicle, FleetStats } from '../services/fleet.service';
import { VehicleService } from '../services/vehicle.service';
import { Vehicle } from '../models/vehicle.interface';
import { AuthService } from '../services/auth.service';
import { OrganizationService } from '../services/organization.service';

export default function FleetManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'rented' | 'maintenance' | 'retired'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'car' | 'atv' | 'scooter' | 'motorcycle' | 'van' | 'truck'>('all');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    category: 'car' as 'car' | 'atv' | 'scooter' | 'motorcycle' | 'van' | 'truck',
    color: '',
    vin: '',
    mileage: 0,
    fuel_level: 8,
    insurance_type: 'basic' as 'basic' | 'full',
    daily_rate: 50,
    weekly_rate: 300,
    monthly_rate: 1000,
    purchase_price: 0,
    purchase_date: '',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    kteo_expiry: '',
    road_tax_expiry: '',
    status: 'available' as 'available' | 'rented' | 'maintenance' | 'retired',
  });

  useEffect(() => {
    loadFleetData();
  }, []);

  async function loadFleetData() {
    setLoading(true);
    try {
      // Try using new VehicleService first
      try {
        const vehiclesData = await VehicleService.getAllVehicles();
        setVehicles(vehiclesData);
        
        // Calculate basic stats from vehicles
        const stats: FleetStats = {
          totalVehicles: vehiclesData.length,
          availableVehicles: vehiclesData.filter(v => v.status === 'available').length,
          rentedVehicles: vehiclesData.filter(v => v.status === 'rented').length,
          maintenanceVehicles: vehiclesData.filter(v => v.status === 'maintenance').length,
          retiredVehicles: vehiclesData.filter(v => v.status === 'retired').length,
          totalFleetValue: 0,
          averageUtilizationRate: 0,
          topPerformingVehicles: [],
          maintenanceAlerts: [],
        };
        setFleetStats(stats);
        return;
      } catch (vehicleError) {
        console.log('VehicleService not available, falling back to FleetService');
      }

      // Fallback to old FleetService if new service fails
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε επιχείρηση.');
        router.back();
        return;
      }

      const [vehiclesData, statsData] = await Promise.all([
        FleetService.getVehicles(organization.id),
        FleetService.getFleetStats(organization.id),
      ]);

      setVehicles(vehiclesData as any);
      setFleetStats(statsData);
    } catch (error) {
      console.error('Error loading fleet data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης δεδομένων στόλου.');
    } finally {
      setLoading(false);
    }
  }

  async function addVehicle() {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.license_plate) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τα απαιτούμενα πεδία.');
      return;
    }

    try {
      // Get current user
      const user = await AuthService.getCurrentUser();
      if (!user) {
        Alert.alert('Σφάλμα', 'Πρέπει να είστε συνδεδεμένοι.');
        return;
      }

      // Create vehicle using new VehicleService
      const vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        licensePlate: newVehicle.license_plate,
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        color: newVehicle.color || null,
        category: newVehicle.category || null,
        currentMileage: newVehicle.mileage || 0,
        status: newVehicle.status,
        insuranceType: newVehicle.insurance_type || null,
        insuranceExpiryDate: newVehicle.insurance_expiry ? new Date(newVehicle.insurance_expiry) : null,
        insuranceCompany: newVehicle.insurance_provider || null,
        insurancePolicyNumber: newVehicle.insurance_policy_number || null,
        kteoExpiryDate: newVehicle.kteo_expiry ? new Date(newVehicle.kteo_expiry) : null,
        kteoLastDate: null,
        tiresFrontDate: null,
        tiresFrontBrand: null,
        tiresRearDate: null,
        tiresRearBrand: null,
        notes: null,
      };

      await VehicleService.createVehicle(vehicleData);
      Alert.alert('Επιτυχία', 'Το όχημα προστέθηκε επιτυχώς!');
      setShowAddVehicleModal(false);
      setNewVehicle({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        category: 'car',
        color: '',
        vin: '',
        mileage: 0,
        fuel_level: 8,
        insurance_type: 'basic',
        daily_rate: 50,
        weekly_rate: 300,
        monthly_rate: 1000,
        purchase_price: 0,
        purchase_date: '',
        insurance_provider: '',
        insurance_policy_number: '',
        insurance_expiry: '',
        kteo_expiry: '',
        road_tax_expiry: '',
        status: 'available',
      });
      loadFleetData();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert('Σφάλμα', `Αποτυχία προσθήκης οχήματος: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'available': return Colors.success;
      case 'rented': return Colors.primary;
      case 'maintenance': return Colors.warning;
      case 'retired': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'available': return 'Διαθέσιμο';
      case 'rented': return 'Ενοικιασμένο';
      case 'maintenance': return 'Συντήρηση';
      case 'retired': return 'Αποσυρμένο';
      default: return status;
    }
  }

  function getCategoryLabel(category: string): string {
    switch (category) {
      case 'car': return 'Αυτοκίνητο';
      case 'atv': return 'ATV';
      case 'scooter': return 'Scooter';
      case 'motorcycle': return 'Μοτοσικλέτα';
      case 'van': return 'Van';
      case 'truck': return 'Φορτηγό';
      default: return category;
    }
  }

  function filteredVehicles() {
    return vehicles.filter(vehicle => {
      const matchesSearch = searchTerm === '' || 
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = selectedFilter === 'all' || vehicle.status === selectedFilter;
      const matchesCategory = selectedCategory === 'all' || vehicle.category === selectedCategory;
      
      return matchesSearch && matchesFilter && matchesCategory;
    });
  }

  function renderVehicleCard(vehicle: Vehicle) {
    return (
      <SimpleGlassCard key={vehicle.id} style={styles.vehicleCard}>
        <TouchableOpacity onPress={() => router.push(`/vehicle-details?vehicleId=${vehicle.id}`)}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleMakeModel}>{vehicle.make} {vehicle.model}</Text>
              <Text style={styles.vehicleYear}>{vehicle.year}</Text>
              <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
            </View>
            <View style={styles.vehicleStatusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(vehicle.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(vehicle.status) }
                ]}>
                  {getStatusLabel(vehicle.status)}
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {getCategoryLabel(vehicle.category)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.vehicleDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{vehicle.mileage.toLocaleString()} km</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="flash-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{vehicle.fuel_level}/8</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>€{vehicle.daily_rate}/ημέρα</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="trending-up-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{vehicle.total_rentals} ενοικιάσεις</Text>
            </View>
          </View>
          
          {vehicle.branch && (
            <View style={styles.vehicleBranch}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.branchText}>{vehicle.branch.name}</Text>
            </View>
          )}
        </TouchableOpacity>
      </SimpleGlassCard>
    );
  }

  function renderAddVehicleModal() {
    return (
      <Modal
        visible={showAddVehicleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddVehicleModal(false)}>
              <Text style={styles.modalCancelButton}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Νέο Όχημα</Text>
            <TouchableOpacity onPress={addVehicle}>
              <Text style={styles.modalSaveButton}>Προσθήκη</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Βασικές Πληροφορίες</Text>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Μάρκα *</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.make}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, make: text }))}
                    placeholder="Toyota"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Μοντέλο *</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.model}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
                    placeholder="Yaris"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Έτος</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.year.toString()}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, year: parseInt(text) || new Date().getFullYear() }))}
                    placeholder="2023"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Αριθμός Κυκλοφορίας *</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.license_plate}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, license_plate: text }))}
                    placeholder="ABC-1234"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Κατηγορία</Text>
                <View style={styles.categoryOptions}>
                  {[
                    { value: 'car', label: 'Αυτοκίνητο' },
                    { value: 'atv', label: 'ATV' },
                    { value: 'scooter', label: 'Scooter' },
                    { value: 'motorcycle', label: 'Μοτοσικλέτα' },
                    { value: 'van', label: 'Van' },
                    { value: 'truck', label: 'Φορτηγό' },
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.value}
                      style={[
                        styles.categoryOption,
                        newVehicle.category === category.value && styles.categoryOptionSelected,
                      ]}
                      onPress={() => setNewVehicle(prev => ({ ...prev, category: category.value as any }))}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newVehicle.category === category.value && styles.categoryOptionTextSelected,
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Τιμές</Text>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Ημερήσια Τιμή (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.daily_rate.toString()}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, daily_rate: parseFloat(text) || 0 }))}
                    placeholder="50"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Εβδομαδιαία Τιμή (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.weekly_rate?.toString() || ''}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, weekly_rate: parseFloat(text) || 0 }))}
                    placeholder="300"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Μηνιαία Τιμή (€)</Text>
                <TextInput
                  style={styles.input}
                  value={newVehicle.monthly_rate?.toString() || ''}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, monthly_rate: parseFloat(text) || 0 }))}
                  placeholder="1000"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Κατάσταση</Text>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Χιλιόμετρα</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.mileage.toString()}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, mileage: parseInt(text) || 0 }))}
                    placeholder="50000"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Καύσιμο (1-8)</Text>
                  <TextInput
                    style={styles.input}
                    value={newVehicle.fuel_level.toString()}
                    onChangeText={(text) => setNewVehicle(prev => ({ ...prev, fuel_level: parseInt(text) || 8 }))}
                    placeholder="8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Τύπος Ασφάλισης</Text>
                <View style={styles.insuranceOptions}>
                  <TouchableOpacity
                    style={[
                      styles.insuranceOption,
                      newVehicle.insurance_type === 'basic' && styles.insuranceOptionSelected,
                    ]}
                    onPress={() => setNewVehicle(prev => ({ ...prev, insurance_type: 'basic' }))}
                  >
                    <Text style={[
                      styles.insuranceOptionText,
                      newVehicle.insurance_type === 'basic' && styles.insuranceOptionTextSelected,
                    ]}>
                      Βασική
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.insuranceOption,
                      newVehicle.insurance_type === 'full' && styles.insuranceOptionSelected,
                    ]}
                    onPress={() => setNewVehicle(prev => ({ ...prev, insurance_type: 'full' }))}
                  >
                    <Text style={[
                      styles.insuranceOptionText,
                      newVehicle.insurance_type === 'full' && styles.insuranceOptionTextSelected,
                    ]}>
                      Πλήρης
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση στόλου...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} {...smoothScrollConfig}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Διαχείριση Στόλου</Text>
            <Text style={styles.headerSubtitle}>{vehicles.length} οχήματα</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddVehicleModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Fleet Stats */}
        {fleetStats && (
          <View style={styles.statsContainer}>
            <SimpleGlassCard style={styles.statCard}>
              <Ionicons name="car" size={20} color={Colors.primary} />
              <Text style={styles.statNumber}>{fleetStats.totalVehicles}</Text>
              <Text style={styles.statLabel}>Σύνολο</Text>
            </SimpleGlassCard>
            <SimpleGlassCard style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.statNumber}>{fleetStats.availableVehicles}</Text>
              <Text style={styles.statLabel}>Διαθέσιμα</Text>
            </SimpleGlassCard>
            <SimpleGlassCard style={styles.statCard}>
              <Ionicons name="time" size={20} color={Colors.warning} />
              <Text style={styles.statNumber}>{fleetStats.maintenanceVehicles}</Text>
              <Text style={styles.statLabel}>Συντήρηση</Text>
            </SimpleGlassCard>
            <SimpleGlassCard style={styles.statCard}>
              <Ionicons name="trending-up" size={20} color={Colors.info} />
              <Text style={styles.statNumber}>{fleetStats.maintenanceAlerts.length}</Text>
              <Text style={styles.statLabel}>Ειδοποιήσεις</Text>
            </SimpleGlassCard>
          </View>
        )}

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Αναζήτηση οχημάτων..."
              placeholderTextColor={Colors.textSecondary}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={styles.filtersRow}>
              {[
                { value: 'all', label: 'Όλα' },
                { value: 'available', label: 'Διαθέσιμα' },
                { value: 'rented', label: 'Ενοικιασμένα' },
                { value: 'maintenance', label: 'Συντήρηση' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter.value && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(filter.value as any)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedFilter === filter.value && styles.filterChipTextActive,
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFiltersScroll}>
            <View style={styles.filtersRow}>
              {[
                { value: 'all', label: 'Όλες οι κατηγορίες' },
                { value: 'car', label: 'Αυτοκίνητα' },
                { value: 'atv', label: 'ATV' },
                { value: 'scooter', label: 'Scooters' },
                { value: 'motorcycle', label: 'Μοτοσικλέτες' },
                { value: 'van', label: 'Vans' },
              ].map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.filterChip,
                    selectedCategory === category.value && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category.value as any)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedCategory === category.value && styles.filterChipTextActive,
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Vehicles List */}
        <View style={styles.vehiclesContainer}>
          {filteredVehicles().length === 0 ? (
            <SimpleGlassCard style={styles.emptyCard}>
              <Ionicons name="car-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Δεν βρέθηκαν οχήματα</Text>
              <Text style={styles.emptyDescription}>
                {searchTerm || selectedFilter !== 'all' || selectedCategory !== 'all'
                  ? 'Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης'
                  : 'Προσθέστε το πρώτο όχημά σας στον στόλο'
                }
              </Text>
              {(!searchTerm && selectedFilter === 'all' && selectedCategory === 'all') && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowAddVehicleModal(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Προσθήκη Οχήματος</Text>
                </TouchableOpacity>
              )}
            </SimpleGlassCard>
          ) : (
            filteredVehicles().map(renderVehicleCard)
          )}
        </View>
      </ScrollView>

      {renderAddVehicleModal()}
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
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    ...Shadows.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  statNumber: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  filtersScroll: {
    marginBottom: Spacing.sm,
  },
  categoryFiltersScroll: {
    marginBottom: Spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  vehiclesContainer: {
    padding: Spacing.md,
  },
  vehicleCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleMakeModel: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  vehicleYear: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehiclePlate: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  vehicleStatusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 8,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  vehicleBranch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  branchText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  emptyButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCancelButton: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  modalSaveButton: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  insuranceOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  insuranceOption: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  insuranceOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  insuranceOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  insuranceOptionTextSelected: {
    color: '#fff',
  },
});
