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
import { Breadcrumb } from '../../components/breadcrumb';
import { SimpleGlassCard } from '../../components/glass-card';
import { Colors, Typography, Shadows, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { VehicleService } from '../../services/vehicle.service';
import { Vehicle, VehicleStatus } from '../../models/vehicle.interface';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;

type GridStyle = 'list' | 'grid3' | 'grid4' | 'grid5';

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

export default function CarsScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filtered, setFiltered] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [gridStyle, setGridStyle] = useState<GridStyle>('grid5');

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [vehicles, search, filter]);

  async function loadCars() {
    try {
      const data = await VehicleService.getAllVehiclesWithUpdatedAvailability();
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
      <Breadcrumb 
        items={[
          { label: 'Αρχική', path: '/', icon: 'home' },
          { label: 'Στόλος' },
        ]}
      />

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
          {([['all', 'Ολα'], ['available', 'Διαθέσιμα'], ['rented', 'Ενοικιασμένα'], ['maintenance', 'Συντήρηση']] as const).map(([f, label]) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {label} ({f === 'all' ? vehicles.length : vehicles.filter(c => c.status === f).length})
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
          
          // Debug logging for status
          if (vehicle.licensePlate === 'BMZ1133') {
            console.log(`🔍 DEBUG BMZ1133: status=${vehicle.status}, plate=${vehicle.licensePlate}`);
            console.log(`🔍 DEBUG BMZ1133: getStatusColor result=${getStatusColor(vehicle.status)}`);
          }
          
          // Use the same color logic as vehicle details page
          function getStatusColor(status: string): string {
            switch (status) {
              case 'available': return Colors.success;
              case 'rented': return Colors.primary;
              case 'maintenance': return Colors.warning;
              case 'retired': return Colors.textSecondary;
              default: return Colors.textSecondary;
            }
          }
          
          if (gridStyle === 'list') {
            return (
              <TouchableOpacity 
                style={[s.listCard, { width: config.cardWidth }]} 
                onPress={() => router.push(`/car-details?carId=${vehicle.id}`)}
                activeOpacity={0.7}
              >
                <View style={s.listRow}>
                  <View style={s.listLeft}>
                    <Text style={s.listName} numberOfLines={1}>{vehicle.make} {vehicle.model}</Text>
                    <Text style={s.listDetail}>{vehicle.licensePlate} • {vehicle.year}</Text>
                    {vehicle.color && <Text style={s.listDetail}>Χρώμα: {vehicle.color}</Text>}
                    {vehicle.category && <Text style={s.listDetail}>Κατηγορία: {vehicle.category}</Text>}
                  </View>
                  <View style={s.listRight}>
                    <View style={[s.listBadge, { backgroundColor: getStatusColor(vehicle.status) + '15' }]}>
                      <Text style={[s.listBadgeText, { color: getStatusColor(vehicle.status) }]}>
                        {vehicle.status === 'available' ? 'Διαθέσιμο' : vehicle.status === 'rented' ? 'Ενοικιασμένο' : 'Συντήρηση'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={s.listDeleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteVehicle(vehicle);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }
          
          return (
            <TouchableOpacity 
              style={[s.gridCard, { width: config.cardWidth }]} 
              onPress={() => router.push(`/car-details?carId=${vehicle.id}`)}
              activeOpacity={0.7}
            >
              <View style={s.gridCardContent}>
                <View style={s.gridCardHeader}>
                  <View style={[s.statusDot, { backgroundColor: getStatusColor(vehicle.status) }]} />
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
                <View style={s.gridCardBody}>
                  <Text style={s.makeModel} numberOfLines={2}>
                    {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={s.plateNumber} numberOfLines={1}>
                    {vehicle.licensePlate}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
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
    height: 80,
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
  statusDot: {
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
  deleteButton: { 
    padding: 2,
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
  listDeleteButton: { 
    padding: 4 
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
