import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { FleetService, Vehicle } from '../services/fleet.service';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'performance' | 'accessories'>('overview');

  useEffect(() => {
    if (vehicleId) {
      loadVehicleDetails();
    }
  }, [vehicleId]);

  async function loadVehicleDetails() {
    if (typeof vehicleId !== 'string') {
      Alert.alert('Σφάλμα', 'Μη έγκυρο αναγνωριστικό οχήματος.');
      router.back();
      return;
    }

    setLoading(true);
    try {
      const vehicleData = await FleetService.getVehicle(vehicleId);
      setVehicle(vehicleData);
    } catch (error) {
      console.error('Error loading vehicle details:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης λεπτομερειών οχήματος.');
      router.back();
    } finally {
      setLoading(false);
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

  function renderTabButton(tab: string, title: string, icon: string) {
    return (
      <TouchableOpacity
        style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab as any)}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={activeTab === tab ? '#fff' : Colors.textSecondary}
        />
        <Text style={[
          styles.tabButtonText,
          activeTab === tab && styles.tabButtonTextActive,
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderOverviewTab() {
    if (!vehicle) return null;

    return (
      <View style={styles.tabContent}>
        <SimpleGlassCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Βασικές Πληροφορίες</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Μάρκα & Μοντέλο</Text>
              <Text style={styles.infoValue}>{vehicle.make} {vehicle.model}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Έτος</Text>
              <Text style={styles.infoValue}>{vehicle.year}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Αριθμός Κυκλοφορίας</Text>
              <Text style={styles.infoValue}>{vehicle.license_plate}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Κατηγορία</Text>
              <Text style={styles.infoValue}>{getCategoryLabel(vehicle.category)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Χρώμα</Text>
              <Text style={styles.infoValue}>{vehicle.color || 'Μη διαθέσιμο'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>VIN</Text>
              <Text style={styles.infoValue}>{vehicle.vin || 'Μη διαθέσιμο'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Χιλιόμετρα</Text>
              <Text style={styles.infoValue}>{vehicle.mileage.toLocaleString()} km</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Καύσιμο</Text>
              <Text style={styles.infoValue}>{vehicle.fuel_level}/8</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ασφάλιση</Text>
              <Text style={styles.infoValue}>
                {vehicle.insurance_type === 'basic' ? 'Βασική' : 'Πλήρης'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Κατάσταση</Text>
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
            </View>
          </View>
        </SimpleGlassCard>

        <SimpleGlassCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Τιμές</Text>
          
          <View style={styles.pricingGrid}>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Ημερήσια</Text>
              <Text style={styles.pricingValue}>€{vehicle.daily_rate}</Text>
            </View>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Εβδομαδιαία</Text>
              <Text style={styles.pricingValue}>€{vehicle.weekly_rate || 'N/A'}</Text>
            </View>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Μηνιαία</Text>
              <Text style={styles.pricingValue}>€{vehicle.monthly_rate || 'N/A'}</Text>
            </View>
          </View>
        </SimpleGlassCard>

        <SimpleGlassCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Οικονομικά</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Τιμή Αγοράς</Text>
              <Text style={styles.infoValue}>
                {vehicle.purchase_price ? `€${vehicle.purchase_price.toLocaleString()}` : 'Μη διαθέσιμο'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ημερομηνία Αγοράς</Text>
              <Text style={styles.infoValue}>
                {vehicle.purchase_date ? format(new Date(vehicle.purchase_date), 'dd/MM/yyyy', { locale: el }) : 'Μη διαθέσιμο'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Συνολικές Ενοικιάσεις</Text>
              <Text style={styles.infoValue}>{vehicle.total_rentals}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Συνολικό Έσοδο</Text>
              <Text style={styles.infoValue}>€{vehicle.total_revenue.toLocaleString()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Μέση Βαθμολογία</Text>
              <Text style={styles.infoValue}>
                {vehicle.average_rating > 0 ? `${vehicle.average_rating.toFixed(1)}/5` : 'Δεν υπάρχουν αξιολογήσεις'}
              </Text>
            </View>
          </View>
        </SimpleGlassCard>

        <SimpleGlassCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Ασφάλιση & Έγγραφα</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Πάροχος Ασφάλισης</Text>
              <Text style={styles.infoValue}>{vehicle.insurance_provider || 'Μη διαθέσιμο'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Αριθμός Ασφάλισης</Text>
              <Text style={styles.infoValue}>{vehicle.insurance_policy_number || 'Μη διαθέσιμο'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Λήξη Ασφάλισης</Text>
              <Text style={styles.infoValue}>
                {vehicle.insurance_expiry ? format(new Date(vehicle.insurance_expiry), 'dd/MM/yyyy', { locale: el }) : 'Μη διαθέσιμο'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Λήξη ΚΤΕΟ</Text>
              <Text style={styles.infoValue}>
                {vehicle.kteo_expiry ? format(new Date(vehicle.kteo_expiry), 'dd/MM/yyyy', { locale: el }) : 'Μη διαθέσιμο'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Λήξη Φόρου Κυκλοφορίας</Text>
              <Text style={styles.infoValue}>
                {vehicle.road_tax_expiry ? format(new Date(vehicle.road_tax_expiry), 'dd/MM/yyyy', { locale: el }) : 'Μη διαθέσιμο'}
              </Text>
            </View>
          </View>
        </SimpleGlassCard>
      </View>
    );
  }

  function renderMaintenanceTab() {
    if (!vehicle) return null;

    return (
      <View style={styles.tabContent}>
        <SimpleGlassCard style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ιστορικό Συντήρησης</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Προσθήκη</Text>
            </TouchableOpacity>
          </View>
          
          {vehicle.maintenance_records && vehicle.maintenance_records.length > 0 ? (
            vehicle.maintenance_records.map((record) => (
              <View key={record.id} style={styles.maintenanceRecord}>
                <View style={styles.maintenanceHeader}>
                  <Text style={styles.maintenanceType}>
                    {record.maintenance_type === 'routine' ? 'Συνηθισμένη Συντήρηση' :
                     record.maintenance_type === 'repair' ? 'Επισκευή' :
                     record.maintenance_type === 'inspection' ? 'Επιθεώρηση' : 'Επείγουσα'}
                  </Text>
                  <Text style={styles.maintenanceDate}>
                    {format(new Date(record.performed_at), 'dd/MM/yyyy', { locale: el })}
                  </Text>
                </View>
                <Text style={styles.maintenanceDescription}>{record.description}</Text>
                <View style={styles.maintenanceDetails}>
                  {record.mileage && (
                    <Text style={styles.maintenanceDetail}>
                      Χιλιόμετρα: {record.mileage.toLocaleString()} km
                    </Text>
                  )}
                  {record.cost && (
                    <Text style={styles.maintenanceDetail}>
                      Κόστος: €{record.cost}
                    </Text>
                  )}
                  {record.service_provider && (
                    <Text style={styles.maintenanceDetail}>
                      Πάροχος: {record.service_provider}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Δεν υπάρχουν εγγραφές συντήρησης</Text>
              <Text style={styles.emptyDescription}>
                Προσθέστε την πρώτη εγγραφή συντήρησης για αυτό το όχημα
              </Text>
            </View>
          )}
        </SimpleGlassCard>
      </View>
    );
  }

  function renderPerformanceTab() {
    if (!vehicle) return null;

    return (
      <View style={styles.tabContent}>
        <SimpleGlassCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Στατιστικά Επιδόσεων</Text>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Ionicons name="trending-up" size={24} color={Colors.primary} />
              <Text style={styles.performanceLabel}>Συνολικό Έσοδο</Text>
              <Text style={styles.performanceValue}>€{vehicle.total_revenue.toLocaleString()}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="car" size={24} color={Colors.success} />
              <Text style={styles.performanceLabel}>Ενοικιάσεις</Text>
              <Text style={styles.performanceValue}>{vehicle.total_rentals}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="star" size={24} color={Colors.warning} />
              <Text style={styles.performanceLabel}>Βαθμολογία</Text>
              <Text style={styles.performanceValue}>
                {vehicle.average_rating > 0 ? `${vehicle.average_rating.toFixed(1)}/5` : 'N/A'}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="speedometer" size={24} color={Colors.info} />
              <Text style={styles.performanceLabel}>Χιλιόμετρα</Text>
              <Text style={styles.performanceValue}>{vehicle.mileage.toLocaleString()}</Text>
            </View>
          </View>
        </SimpleGlassCard>

        <SimpleGlassCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Κόστος Λειτουργίας</Text>
          
          <View style={styles.costBreakdown}>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Τιμή Αγοράς</Text>
              <Text style={styles.costValue}>
                {vehicle.purchase_price ? `€${vehicle.purchase_price.toLocaleString()}` : 'N/A'}
              </Text>
            </View>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Συντήρηση</Text>
              <Text style={styles.costValue}>€0</Text>
            </View>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Ασφάλιση</Text>
              <Text style={styles.costValue}>€0</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Συνολικό Κόστος</Text>
              <Text style={styles.costValue}>
                {vehicle.purchase_price ? `€${vehicle.purchase_price.toLocaleString()}` : 'N/A'}
              </Text>
            </View>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Κέρδος</Text>
              <Text style={[styles.costValue, { color: Colors.success }]}>
                €{(vehicle.total_revenue - (vehicle.purchase_price || 0)).toLocaleString()}
              </Text>
            </View>
          </View>
        </SimpleGlassCard>
      </View>
    );
  }

  function renderAccessoriesTab() {
    if (!vehicle) return null;

    return (
      <View style={styles.tabContent}>
        <SimpleGlassCard style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Εξοπλισμός</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Προσθήκη</Text>
            </TouchableOpacity>
          </View>
          
          {vehicle.accessories && vehicle.accessories.length > 0 ? (
            vehicle.accessories.filter(a => a.is_active).map((assignment) => (
              <View key={assignment.id} style={styles.accessoryItem}>
                <View style={styles.accessoryInfo}>
                  <Text style={styles.accessoryName}>
                    {assignment.accessory?.name || 'Άγνωστος εξοπλισμός'}
                  </Text>
                  <Text style={styles.accessoryDescription}>
                    {assignment.accessory?.description || 'Δεν υπάρχει περιγραφή'}
                  </Text>
                </View>
                <View style={styles.accessoryDetails}>
                  <Text style={styles.accessoryPrice}>
                    €{assignment.accessory?.daily_price || 0}/ημέρα
                  </Text>
                  <Text style={styles.accessoryCategory}>
                    {assignment.accessory?.category === 'safety' ? 'Ασφάλεια' :
                     assignment.accessory?.category === 'comfort' ? 'Άνεση' :
                     assignment.accessory?.category === 'entertainment' ? 'Ψυχαγωγία' : 'Χρήσιμο'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Δεν έχει ανατεθεί εξοπλισμός</Text>
              <Text style={styles.emptyDescription}>
                Προσθέστε εξοπλισμό για να αυξήσετε την αξία του οχήματος
              </Text>
            </View>
          )}
        </SimpleGlassCard>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση οχήματος...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="car-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.loadingText}>Δεν βρέθηκε όχημα</Text>
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
            <Text style={styles.headerTitle}>{vehicle.make} {vehicle.model}</Text>
            <Text style={styles.headerSubtitle}>{vehicle.license_plate}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Vehicle Status */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(vehicle.status) }
          ]} />
          <Text style={styles.statusText}>{getStatusLabel(vehicle.status)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{getCategoryLabel(vehicle.category)}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {renderTabButton('overview', 'Επισκόπηση', 'information-circle-outline')}
          {renderTabButton('maintenance', 'Συντήρηση', 'construct-outline')}
          {renderTabButton('performance', 'Επιδόσεις', 'trending-up-outline')}
          {renderTabButton('accessories', 'Εξοπλισμός', 'bag-outline')}
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'maintenance' && renderMaintenanceTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'accessories' && renderAccessoriesTab()}
        </View>
      </ScrollView>
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
  editButton: {
    padding: Spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 8,
  },
  statusBadgeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  content: {
    padding: Spacing.md,
  },
  tabContent: {
    flex: 1,
  },
  infoCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addButtonText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xxs,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pricingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pricingItem: {
    alignItems: 'center',
  },
  pricingLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxs,
  },
  pricingValue: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  maintenanceRecord: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  maintenanceType: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  maintenanceDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  maintenanceDescription: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  maintenanceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  maintenanceDetail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 8,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  performanceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  performanceValue: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  costBreakdown: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  costLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  costValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  costDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  accessoryItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accessoryInfo: {
    marginBottom: Spacing.sm,
  },
  accessoryName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  accessoryDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  accessoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessoryPrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  accessoryCategory: {
    ...Typography.caption,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 8,
  },
  emptyState: {
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
});
