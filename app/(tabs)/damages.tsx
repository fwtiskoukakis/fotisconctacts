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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../../components/glass-card';
import { Colors, Typography, Shadows, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { VehicleService } from '../../services/vehicle.service';
import { Vehicle, VehicleStatus } from '../../models/vehicle.interface';
import { supabase } from '../../utils/supabase';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;

type GridStyle = 'list' | 'grid3' | 'grid4' | 'grid5';

interface VehicleWithDamage {
  id: string;
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  category?: string;
  status?: VehicleStatus;
  damageCount: number;
  lastDamageDate: Date;
  severity: 'minor' | 'moderate' | 'severe';
  isInDatabase: boolean;
}

interface DamageDetail {
  id: string;
  severity: 'minor' | 'moderate' | 'severe';
  viewSide: 'front' | 'rear' | 'left' | 'right';
  description: string;
  xPosition: number;
  yPosition: number;
  createdAt: Date;
  contractRenterName: string;
  contractDate: Date;
}

const getGridConfig = (style: GridStyle) => {
  switch (style) {
    case 'list':
      return { numColumns: 1, cardWidth: width - (CARD_MARGIN * 2) };
    case 'grid3':
      return { numColumns: 3, cardWidth: (width - (CARD_MARGIN * 4)) / 3 };
    case 'grid4':
      return { numColumns: 4, cardWidth: (width - (CARD_MARGIN * 5)) / 4 };
    case 'grid5':
      return { numColumns: 5, cardWidth: (width - (CARD_MARGIN * 6)) / 5 };
    default:
      return { numColumns: 5, cardWidth: (width - (CARD_MARGIN * 6)) / 5 };
  }
};

export default function DamagesScreen() {
  const router = useRouter();
  const [vehiclesWithDamages, setVehiclesWithDamages] = useState<VehicleWithDamage[]>([]);
  const [filtered, setFiltered] = useState<VehicleWithDamage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'minor' | 'moderate' | 'severe'>('all');
  const [gridStyle, setGridStyle] = useState<GridStyle>('grid5');
  const [damageModalVisible, setDamageModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithDamage | null>(null);
  const [damageDetails, setDamageDetails] = useState<DamageDetail[]>([]);

  useEffect(() => {
    loadVehiclesWithDamages();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehiclesWithDamages, search, filter]);

  async function loadVehiclesWithDamages() {
    try {
      // Get all damage points with contract information
      const { data: damageData, error: damageError } = await supabase
        .from('damage_points')
        .select(`
          *,
          contracts!inner(
            car_license_plate,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (damageError) {
        console.error('Error fetching damages:', damageError);
        Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης ζημιών');
        return;
      }

      if (!damageData) {
        setVehiclesWithDamages([]);
        return;
      }

      // Group damages by license plate
      const damageMap = new Map<string, {
        damageCount: number;
        lastDamageDate: Date;
        severity: 'minor' | 'moderate' | 'severe';
        plateNumber: string;
      }>();

      damageData.forEach((damage: any) => {
        const plateNumber = damage.contracts.car_license_plate;
        const damageDate = new Date(damage.created_at);
        
        if (!damageMap.has(plateNumber)) {
          damageMap.set(plateNumber, {
            damageCount: 0,
            lastDamageDate: damageDate,
            severity: damage.severity,
            plateNumber: plateNumber,
          });
        }

        const existing = damageMap.get(plateNumber)!;
        existing.damageCount++;
        
        // Update to most recent damage date
        if (damageDate > existing.lastDamageDate) {
          existing.lastDamageDate = damageDate;
        }

        // Update to highest severity
        const severityOrder = { minor: 1, moderate: 2, severe: 3 };
        if (severityOrder[damage.severity] > severityOrder[existing.severity]) {
          existing.severity = damage.severity;
        }
      });

      // Get all vehicles from database
      const allVehicles = await VehicleService.getAllVehicles();
      const vehicleMap = new Map<string, Vehicle>();
      allVehicles.forEach(vehicle => {
        vehicleMap.set(vehicle.licensePlate, vehicle);
      });

      // Create combined list
      const vehiclesWithDamagesList: VehicleWithDamage[] = Array.from(damageMap.values()).map(damageInfo => {
        const vehicle = vehicleMap.get(damageInfo.plateNumber);
        
        if (vehicle) {
          // Vehicle exists in database
          return {
            id: vehicle.id,
            licensePlate: damageInfo.plateNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            category: vehicle.category,
            status: vehicle.status,
            damageCount: damageInfo.damageCount,
            lastDamageDate: damageInfo.lastDamageDate,
            severity: damageInfo.severity,
            isInDatabase: true,
          };
        } else {
          // Vehicle doesn't exist in database - show only plate number
          return {
            id: `damage-${damageInfo.plateNumber}`, // Generate unique ID
            licensePlate: damageInfo.plateNumber,
            damageCount: damageInfo.damageCount,
            lastDamageDate: damageInfo.lastDamageDate,
            severity: damageInfo.severity,
            isInDatabase: false,
          };
        }
      });

      // Sort by last damage date (most recent first)
      vehiclesWithDamagesList.sort((a, b) => b.lastDamageDate.getTime() - a.lastDamageDate.getTime());

      setVehiclesWithDamages(vehiclesWithDamagesList);
    } catch (error) {
      console.error('Error loading vehicles with damages:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης οχημάτων με ζημιές');
    }
  }

  function filterVehicles() {
    let result = vehiclesWithDamages;
    
    // Filter by severity
    if (filter === 'minor') result = result.filter(v => v.severity === 'minor');
    if (filter === 'moderate') result = result.filter(v => v.severity === 'moderate');
    if (filter === 'severe') result = result.filter(v => v.severity === 'severe');
    
    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v =>
        v.licensePlate.toLowerCase().includes(q) ||
        (v.make && v.make.toLowerCase().includes(q)) ||
        (v.model && v.model.toLowerCase().includes(q))
      );
    }
    
    setFiltered(result);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehiclesWithDamages();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return Colors.success;
      case 'moderate': return Colors.warning;
      case 'severe': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'minor': return 'Μικρή';
      case 'moderate': return 'Μέτρια';
      case 'severe': return 'Σοβαρή';
      default: return severity;
    }
  };

  const getViewLabel = (view: string): string => {
    switch (view) {
      case 'front': return 'Μπροστά';
      case 'rear': return 'Πίσω';
      case 'left': return 'Αριστερά';
      case 'right': return 'Δεξιά';
      default: return view;
    }
  };

  const getStatusColor = (status?: string): string => {
    if (!status) return Colors.textSecondary;
    switch (status) {
      case 'available': return Colors.success;
      case 'rented': return Colors.primary;
      case 'maintenance': return Colors.warning;
      case 'retired': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const handleVehiclePress = async (vehicle: VehicleWithDamage) => {
    try {
      setSelectedVehicle(vehicle);
      
      // Get all damages for this specific vehicle
      const { data: damageData, error } = await supabase
        .from('damage_points')
        .select(`
          *,
          contracts!inner(
            car_license_plate,
            renter_full_name,
            created_at
          )
        `)
        .eq('contracts.car_license_plate', vehicle.licensePlate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching damages:', error);
        Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης ζημιών');
        return;
      }

      if (!damageData || damageData.length === 0) {
        Alert.alert('Ζημιές', 'Δεν βρέθηκαν ζημιές για αυτό το όχημα');
        return;
      }

      // Format damage details
      const formattedDamages: DamageDetail[] = damageData.map((damage: any) => ({
        id: damage.id,
        severity: damage.severity,
        viewSide: damage.view_side,
        description: damage.description,
        xPosition: damage.x_position,
        yPosition: damage.y_position,
        createdAt: new Date(damage.created_at),
        contractRenterName: damage.contracts.renter_full_name,
        contractDate: new Date(damage.contracts.created_at),
      }));

      setDamageDetails(formattedDamages);
      setDamageModalVisible(true);
    } catch (error) {
      console.error('Error handling vehicle press:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης λεπτομερειών ζημιών');
    }
  };

  return (
    <View style={s.container}>
      <View style={s.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={s.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={s.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={s.breadcrumbCurrent}>Ζημιές</Text>
      </View>

      <View style={s.topBar}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput style={s.searchInput} placeholder="Αναζήτηση..." value={search} onChangeText={setSearch} />
        </View>
        
        {/* Grid Style Selector */}
        <View style={s.gridStyleSelector}>
          <Text style={s.gridStyleLabel}>Προβολή:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.gridStyleButtons}>
            {([
              ['list', 'Λίστα', 'list-outline'],
              ['grid3', '3x', 'grid-outline'],
              ['grid4', '4x', 'grid-outline'],
              ['grid5', '5x', 'grid-outline']
            ] as const).map(([style, label, icon]) => (
              <TouchableOpacity 
                key={style} 
                style={[s.gridStyleBtn, gridStyle === style && s.gridStyleBtnActive]} 
                onPress={() => setGridStyle(style as GridStyle)}
              >
                <Ionicons 
                  name={icon as any} 
                  size={14} 
                  color={gridStyle === style ? '#fff' : Colors.textSecondary} 
                />
                <Text style={[s.gridStyleText, gridStyle === style && s.gridStyleTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>
          {([['all', 'Όλα'], ['minor', 'Μικρές'], ['moderate', 'Μέτριες'], ['severe', 'Σοβαρές']] as const).map(([f, label]) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {label} ({f === 'all' ? vehiclesWithDamages.length : vehiclesWithDamages.filter(v => v.severity === f).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={gridStyle} // Force re-render when grid style changes
        data={filtered}
        numColumns={getGridConfig(gridStyle).numColumns}
        keyExtractor={(item) => item.id}
        style={s.list}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: vehicle }) => {
          const config = getGridConfig(gridStyle);
          
          if (gridStyle === 'list') {
            return (
              <TouchableOpacity 
                style={[s.listCard, { width: config.cardWidth }]} 
                onPress={() => handleVehiclePress(vehicle)}
                activeOpacity={0.7}
              >
                <View style={s.listRow}>
                  <View style={s.listLeft}>
                    <Text style={s.listName} numberOfLines={1}>
                      {vehicle.isInDatabase ? `${vehicle.make} ${vehicle.model}` : vehicle.licensePlate}
                    </Text>
                    <Text style={s.listDetail}>{vehicle.licensePlate}</Text>
                    {vehicle.isInDatabase && vehicle.year && <Text style={s.listDetail}>Έτος: {vehicle.year}</Text>}
                    {vehicle.isInDatabase && vehicle.color && <Text style={s.listDetail}>Χρώμα: {vehicle.color}</Text>}
                    <Text style={s.listDetail}>Ζημιές: {vehicle.damageCount}</Text>
                    <Text style={s.listDetail}>Τελευταία: {vehicle.lastDamageDate.toLocaleDateString('el-GR')}</Text>
                  </View>
                  <View style={s.listRight}>
                    <View style={[s.listBadge, { backgroundColor: getSeverityColor(vehicle.severity) + '15' }]}>
                      <Text style={[s.listBadgeText, { color: getSeverityColor(vehicle.severity) }]}>
                        {getSeverityLabel(vehicle.severity)}
                      </Text>
                    </View>
                    {vehicle.isInDatabase && vehicle.status && (
                      <View style={[s.statusBadge, { backgroundColor: getStatusColor(vehicle.status) + '15' }]}>
                        <Text style={[s.statusBadgeText, { color: getStatusColor(vehicle.status) }]}>
                          {vehicle.status === 'available' ? 'Διαθέσιμο' : vehicle.status === 'rented' ? 'Ενοικιασμένο' : 'Συντήρηση'}
                        </Text>
                      </View>
                    )}
                    {!vehicle.isInDatabase && (
                      <View style={[s.warningBadge, { backgroundColor: Colors.warning + '15' }]}>
                        <Text style={[s.warningBadgeText, { color: Colors.warning }]}>
                          Μόνο Πινακίδα
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }
          
          return (
            <TouchableOpacity 
              style={[s.gridCard, { width: config.cardWidth }]} 
              onPress={() => handleVehiclePress(vehicle)}
              activeOpacity={0.7}
            >
              <View style={s.gridCardContent}>
                <View style={s.gridCardHeader}>
                  <View style={[s.severityDot, { backgroundColor: getSeverityColor(vehicle.severity) }]} />
                  {!vehicle.isInDatabase && (
                    <Ionicons name="warning-outline" size={12} color={Colors.warning} />
                  )}
                </View>
                <View style={s.gridCardBody}>
                  <Text style={s.makeModel} numberOfLines={2}>
                    {vehicle.isInDatabase ? `${vehicle.make} ${vehicle.model}` : vehicle.licensePlate}
                  </Text>
                  <Text style={s.plateNumber} numberOfLines={1}>
                    {vehicle.licensePlate}
                  </Text>
                  <Text style={s.damageCount}>
                    {vehicle.damageCount} ζημι{vehicle.damageCount === 1 ? 'ά' : 'ές'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Ionicons name="warning-outline" size={48} color={Colors.textSecondary} />
            <Text style={s.emptyText}>Δεν βρέθηκαν οχήματα με ζημιές</Text>
          </View>
        )}
      />
      
      {/* Damage Details Modal */}
      <Modal
        visible={damageModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDamageModalVisible(false)}
      >
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>
              Ζημιές - {selectedVehicle?.isInDatabase 
                ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.licensePlate})`
                : selectedVehicle?.licensePlate}
            </Text>
            <TouchableOpacity 
              style={s.closeButton}
              onPress={() => setDamageModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={s.modalContent}>
            <View style={s.damageStats}>
              <Text style={s.damageStatsText}>
                Σύνολο ζημιών: {damageDetails.length}
              </Text>
            </View>
            
            {damageDetails.map((damage, index) => (
              <View key={damage.id} style={s.damageCard}>
                <View style={s.damageHeader}>
                  <View style={[s.damageSeverityBadge, { backgroundColor: getSeverityColor(damage.severity) + '15' }]}>
                    <Text style={[s.damageSeverityText, { color: getSeverityColor(damage.severity) }]}>
                      {getSeverityLabel(damage.severity)}
                    </Text>
                  </View>
                  <Text style={s.damageNumber}>#{index + 1}</Text>
                </View>
                
                <Text style={s.damageDescription}>{damage.description}</Text>
                
                <View style={s.damageDetails}>
                  <View style={s.damageDetailRow}>
                    <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                    <Text style={s.damageDetailText}>
                      {getViewLabel(damage.viewSide)} - X:{damage.xPosition.toFixed(1)}% Y:{damage.yPosition.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={s.damageDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <Text style={s.damageDetailText}>
                      {damage.createdAt.toLocaleDateString('el-GR')} {damage.createdAt.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  
                  <View style={s.damageDetailRow}>
                    <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                    <Text style={s.damageDetailText}>
                      {damage.contractRenterName} ({damage.contractDate.toLocaleDateString('el-GR')})
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  
  // Grid Style Selector
  gridStyleSelector: { marginBottom: 8 },
  gridStyleLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  gridStyleButtons: { flexDirection: 'row', gap: 6 },
  gridStyleBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: '#f3f4f6', 
    marginRight: 6,
    gap: 4,
  },
  gridStyleBtnActive: { backgroundColor: Colors.primary },
  gridStyleText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  gridStyleTextActive: { color: '#fff' },
  
  filters: { flexDirection: 'row', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 6 },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  
  list: { flex: 1, padding: CARD_MARGIN },
  listContent: { paddingBottom: 100 },
  
  // Grid View Styles
  gridCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    margin: CARD_MARGIN / 2,
    ...Shadows.sm 
  },
  gridCardContent: {
    padding: 8,
    height: 90,
    justifyContent: 'space-between',
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gridCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  damageCount: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  
  // List View Styles
  listCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 8,
    ...Shadows.sm 
  },
  listRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 12,
  },
  listLeft: { 
    flex: 1, 
    marginRight: 8 
  },
  listName: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: Colors.text, 
    marginBottom: 2 
  },
  listDetail: { 
    fontSize: 12, 
    color: Colors.textSecondary, 
    marginBottom: 2 
  },
  listRight: { 
    alignItems: 'flex-end', 
    gap: 6 
  },
  listBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  listBadgeText: { 
    fontSize: 10, 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  statusBadgeText: { 
    fontSize: 10, 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  warningBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  warningBadgeText: { 
    fontSize: 10, 
    fontWeight: '700', 
    textTransform: 'uppercase' 
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
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  damageStats: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Shadows.sm,
  },
  damageStatsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  damageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  damageSeverityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  damageSeverityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  damageNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  damageDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  damageDetails: {
    gap: 8,
  },
  damageDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  damageDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
