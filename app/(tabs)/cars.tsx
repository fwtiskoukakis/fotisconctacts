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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../../components/glass-card';
import { Colors, Typography, Spacing } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { CarService } from '../../services/car.service';
import { Car } from '../../models/car.interface';

export default function CarsScreen() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [filtered, setFiltered] = useState<Car[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'rented'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
    fuelType: 'gasoline' as 'gasoline' | 'diesel' | 'electric' | 'hybrid',
    transmission: 'manual' as 'manual' | 'automatic',
    seats: 5,
    dailyRate: 0,
    category: '',
    type: 'Car',
    kteoLastDate: null as Date | null,
    kteoExpiryDate: null as Date | null,
    insuranceExpiryDate: null as Date | null,
    insuranceCompany: '',
    insurancePolicyNumber: '',
    tiresFrontDate: null as Date | null,
    tiresFrontBrand: '',
    tiresRearDate: null as Date | null,
    tiresRearBrand: '',
    notes: '',
  });

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [cars, search, filter]);

  async function loadCars() {
    try {
      const data = await CarService.getAllCars();
      setCars(data);
    } catch (error) {
      console.error('Error loading cars:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης αυτοκινήτων');
    }
  }

  function openAddModal() {
    setEditingCar(null);
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      color: '',
      fuelType: 'gasoline',
      transmission: 'manual',
      seats: 5,
      dailyRate: 0,
      category: '',
      type: 'Car',
      kteoLastDate: null,
      kteoExpiryDate: null,
      insuranceExpiryDate: null,
      insuranceCompany: '',
      insurancePolicyNumber: '',
      tiresFrontDate: null,
      tiresFrontBrand: '',
      tiresRearDate: null,
      tiresRearBrand: '',
      notes: '',
    });
    setShowModal(true);
  }

  function openEditModal(car: Car) {
    setEditingCar(car);
    setFormData({
      make: car.make,
      model: car.model,
      year: car.year || new Date().getFullYear(),
      licensePlate: car.licensePlate,
      color: car.color || '',
      fuelType: (car.fuelType as any) || 'gasoline',
      transmission: (car.transmission as any) || 'manual',
      seats: car.seats || 5,
      dailyRate: car.dailyRate || 0,
      category: car.category || '',
      type: car.type || 'Car',
      kteoLastDate: car.kteoLastDate || null,
      kteoExpiryDate: car.kteoExpiryDate || null,
      insuranceExpiryDate: car.insuranceExpiryDate || null,
      insuranceCompany: car.insuranceCompany || '',
      insurancePolicyNumber: car.insurancePolicyNumber || '',
      tiresFrontDate: car.tiresFrontDate || null,
      tiresFrontBrand: car.tiresFrontBrand || '',
      tiresRearDate: car.tiresRearDate || null,
      tiresRearBrand: car.tiresRearBrand || '',
      notes: car.notes || '',
    });
    setShowModal(true);
  }

  async function saveCar() {
    if (!formData.make || !formData.model || !formData.licensePlate) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τα απαιτούμενα πεδία (Μάρκα, Μοντέλο, Πινακίδα)');
      return;
    }

    try {
      if (editingCar) {
        // Update existing car
        await CarService.updateCar(editingCar.id, formData);
        Alert.alert('Επιτυχία', 'Το αυτοκίνητο ενημερώθηκε επιτυχώς!');
      } else {
        // Create new car
        await CarService.createCar({
          ...formData,
          isAvailable: true,
          status: 'available',
        } as any);
        Alert.alert('Επιτυχία', 'Το αυτοκίνητο προστέθηκε επιτυχώς!');
      }
      setShowModal(false);
      loadCars();
    } catch (error) {
      console.error('Error saving car:', error);
      Alert.alert('Σφάλμα', `Αποτυχία: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    }
  }

  async function deleteCar(car: Car) {
    Alert.alert(
      'Επιβεβαίωση Διαγραφής',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε το "${car.make} ${car.model}" (${car.licensePlate});`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await CarService.deleteCar(car.id);
              Alert.alert('Επιτυχία', 'Το αυτοκίνητο διαγράφηκε επιτυχώς.');
              loadCars();
            } catch (error) {
              Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής αυτοκινήτου.');
            }
          }
        }
      ]
    );
  }

  function filterCars() {
    let result = cars;
    if (filter === 'available') result = result.filter(c => c.isAvailable === true);
    if (filter === 'rented') result = result.filter(c => c.isAvailable === false);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
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
      {/* Breadcrumb */}
      <View style={s.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={s.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={s.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={s.breadcrumbCurrent}>Αυτοκίνητα</Text>
      </View>

      {/* Top Bar with Search and Filters */}
      <View style={s.topBar}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput style={s.searchInput} placeholder="Αναζήτηση..." value={search} onChangeText={setSearch} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>
          {([['all', 'Όλα'], ['available', 'Διαθέσιμα'], ['rented', 'Μη Διαθέσιμα']] as const).map(([f, label]) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {label} ({cars.filter(c => f === 'all' || (f === 'available' ? c.isAvailable : !c.isAvailable)).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cars List */}
      <ScrollView style={s.list} contentContainerStyle={s.listContent} {...smoothScrollConfig} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.map(car => (
          <TouchableOpacity key={car.id} style={s.card} onPress={() => openEditModal(car)}>
            <View style={s.row}>
              <View style={s.left}>
                <Text style={s.name} numberOfLines={1}>{car.make} {car.model}</Text>
                <Text style={s.detail}>{car.licensePlate} • {car.year}</Text>
                <Text style={s.detail}>{car.fuelType || 'N/A'} • €{car.dailyRate}/day</Text>
              </View>
              <View style={s.right}>
                <View style={[s.badge, { backgroundColor: car.isAvailable ? Colors.success + '15' : Colors.error + '15' }]}>
                  <Text style={[s.badgeText, { color: car.isAvailable ? Colors.success : Colors.error }]}>
                    {car.isAvailable ? 'Διαθέσιμο' : 'Μη Διαθέσιμο'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteCar(car);
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
            <TouchableOpacity style={s.addButton} onPress={openAddModal}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={s.addButtonText}>Προσθήκη Αυτοκινήτου</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={s.modalCancelButton}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>{editingCar ? 'Επεξεργασία' : 'Νέο Αυτοκίνητο'}</Text>
            <TouchableOpacity onPress={saveCar}>
              <Text style={s.modalSaveButton}>Αποθήκευση</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalContent}>
            <View style={s.formSection}>
              <Text style={s.inputLabel}>Μάρκα *</Text>
              <TextInput
                style={s.input}
                value={formData.make}
                onChangeText={(text) => setFormData(prev => ({ ...prev, make: text }))}
                placeholder="Toyota"
              />
            </View>

            <View style={s.formSection}>
              <Text style={s.inputLabel}>Μοντέλο *</Text>
              <TextInput
                style={s.input}
                value={formData.model}
                onChangeText={(text) => setFormData(prev => ({ ...prev, model: text }))}
                placeholder="Yaris"
              />
            </View>

            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Έτος</Text>
                <TextInput
                  style={s.input}
                  value={formData.year.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, year: parseInt(text) || new Date().getFullYear() }))}
                  placeholder="2023"
                  keyboardType="numeric"
                />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Πινακίδα *</Text>
                <TextInput
                  style={s.input}
                  value={formData.licensePlate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, licensePlate: text }))}
                  placeholder="ABC-1234"
                />
              </View>
            </View>

            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Καύσιμο</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['gasoline', 'diesel', 'electric', 'hybrid'].map((fuel) => (
                    <TouchableOpacity
                      key={fuel}
                      style={[s.chip, formData.fuelType === fuel && s.chipActive]}
                      onPress={() => setFormData(prev => ({ ...prev, fuelType: fuel as any }))}
                    >
                      <Text style={[s.chipText, formData.fuelType === fuel && s.chipTextActive]}>{fuel}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Θέσεις</Text>
                <TextInput
                  style={s.input}
                  value={formData.seats.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, seats: parseInt(text) || 5 }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Ημερήσια Τιμή (€)</Text>
                <TextInput
                  style={s.input}
                  value={formData.dailyRate.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, dailyRate: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* KTEO Section */}
            <View style={s.formSection}>
              <Text style={[s.inputLabel, { fontSize: 16, marginTop: 8 }]}>KTEO</Text>
            </View>
            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Τελευταίο KTEO</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.kteoLastDate ? formData.kteoLastDate.toISOString().split('T')[0] : ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, kteoLastDate: text ? new Date(text) : null }))}
                />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Λήξη KTEO</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.kteoExpiryDate ? formData.kteoExpiryDate.toISOString().split('T')[0] : ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, kteoExpiryDate: text ? new Date(text) : null }))}
                />
              </View>
            </View>

            {/* Insurance Section */}
            <View style={s.formSection}>
              <Text style={[s.inputLabel, { fontSize: 16, marginTop: 8 }]}>Ασφάλεια</Text>
            </View>
            <View style={s.formSection}>
              <Text style={s.inputLabel}>Ασφαλιστική Εταιρεία</Text>
              <TextInput
                style={s.input}
                value={formData.insuranceCompany}
                onChangeText={(text) => setFormData(prev => ({ ...prev, insuranceCompany: text }))}
                placeholder="π.χ. Groupama"
              />
            </View>
            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Αριθμός Ασφαλιστηρίου</Text>
                <TextInput
                  style={s.input}
                  value={formData.insurancePolicyNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, insurancePolicyNumber: text }))}
                  placeholder="Policy #"
                />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Λήξη Ασφάλειας</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.insuranceExpiryDate ? formData.insuranceExpiryDate.toISOString().split('T')[0] : ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, insuranceExpiryDate: text ? new Date(text) : null }))}
                />
              </View>
            </View>

            {/* Tires Section */}
            <View style={s.formSection}>
              <Text style={[s.inputLabel, { fontSize: 16, marginTop: 8 }]}>Λάστιχα</Text>
            </View>
            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Μπροστινά - Ημερομηνία</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.tiresFrontDate ? formData.tiresFrontDate.toISOString().split('T')[0] : ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, tiresFrontDate: text ? new Date(text) : null }))}
                />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Μπροστινά - Μάρκα</Text>
                <TextInput
                  style={s.input}
                  value={formData.tiresFrontBrand}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, tiresFrontBrand: text }))}
                  placeholder="π.χ. Michelin"
                />
              </View>
            </View>
            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Πίσω - Ημερομηνία</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.tiresRearDate ? formData.tiresRearDate.toISOString().split('T')[0] : ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, tiresRearDate: text ? new Date(text) : null }))}
                />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.inputLabel}>Πίσω - Μάρκα</Text>
                <TextInput
                  style={s.input}
                  value={formData.tiresRearBrand}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, tiresRearBrand: text }))}
                  placeholder="π.χ. Bridgestone"
                />
              </View>
            </View>

            {/* Notes Section */}
            <View style={s.formSection}>
              <Text style={s.inputLabel}>Σημειώσεις</Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Προσθέστε τυχόν παρατηρήσεις..."
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* FAB Button for Add */}
      {filtered.length > 0 && (
        <TouchableOpacity style={s.fab} onPress={openAddModal}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
  filterBtn: { backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  detail: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  right: { alignItems: 'flex-end', gap: 8 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  deleteButton: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 16, marginBottom: 24 },
  addButton: { backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: Colors.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalCancelButton: { fontSize: 16, color: Colors.textSecondary },
  modalTitle: { fontSize: 18, color: Colors.text, fontWeight: '700' },
  modalSaveButton: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  modalContent: { flex: 1, padding: Spacing.md },
  formSection: { marginBottom: Spacing.md },
  formRow: { flexDirection: 'row', gap: Spacing.sm },
  inputLabel: { fontSize: 14, color: Colors.text, fontWeight: '600', marginBottom: Spacing.sm },
  input: { fontSize: 16, color: Colors.text, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chip: { backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.text },
  chipTextActive: { color: '#fff' },
});
