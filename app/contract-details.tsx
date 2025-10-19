import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { SimpleGlassCard } from '../components/glass-card';
import { PDFContractGenerator } from '../components/pdf-contract-generator';
import { Contract, User } from '../models/contract.interface';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { supabase } from '../utils/supabase';
import { Colors, Typography, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { createContractWithAADE, canSubmitToAADE, getAADEStatusMessage } from '../utils/aade-contract-helper';

export default function ContractDetailsScreen() {
  const router = useRouter();
  const { contractId } = useLocalSearchParams();
  const [contract, setContract] = React.useState<Contract | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [submittingAADE, setSubmittingAADE] = React.useState(false);

  React.useEffect(() => {
    loadContract();
  }, [contractId]);

  async function loadContract() {
    if (typeof contractId === 'string') {
      try {
        const c = await SupabaseContractService.getContractById(contractId);
        if (c) {
          setContract(c);
          if (c.userId) {
            const { data: userData } = await supabase.from('users').select('id,name,email,phone,address,signature_url,created_at,updated_at').eq('id', c.userId).single();
            if (userData) {
              setUser({
                id: userData.id,
                name: userData.name,
                email: userData.email || '',
                phone: userData.phone || '',
                address: userData.address || '',
                signature: userData.signature_url || '',
                signatureUrl: userData.signature_url,
                createdAt: new Date(userData.created_at),
                updatedAt: userData.updated_at ? new Date(userData.updated_at) : undefined,
              });
            }
          }
        } else {
          Alert.alert('Σφάλμα', 'Το συμβόλαιο δεν βρέθηκε.');
          router.back();
        }
      } catch (error) {
        Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης');
        router.back();
      }
    }
  }

  function handleEdit() {
    if (contract) router.push(`/edit-contract?contractId=${contract.id}`);
  }

  async function handlePushToAADE() {
    if (!contract) return;

    // Check if can submit
    const validation = canSubmitToAADE(contract);
    if (!validation.canSubmit) {
      Alert.alert('Σφάλμα', validation.reason || 'Δεν είναι δυνατή η υποβολή στο AADE');
      return;
    }

    // Check if already submitted
    if (contract.aadeStatus === 'submitted' || contract.aadeStatus === 'completed') {
      Alert.alert(
        'Ειδοποίηση',
        'Αυτό το συμβόλαιο έχει ήδη υποβληθεί στο AADE.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Υποβολή στο AADE',
      'Θέλετε να υποβάλετε αυτό το συμβόλαιο στο AADE;',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Υποβολή',
          onPress: async () => {
            setSubmittingAADE(true);
            try {
              const result = await createContractWithAADE(contract, contract.id);
              
              if (result.success) {
                Alert.alert(
                  'Επιτυχία',
                  `Το συμβόλαιο υποβλήθηκε επιτυχώς στο AADE${result.aadeDclId ? ` με DCL ID: ${result.aadeDclId}` : ''}`
                );
                // Reload contract to get updated AADE status
                await loadContract();
              } else {
                Alert.alert('Σφάλμα', result.error || 'Αποτυχία υποβολής στο AADE');
              }
            } catch (error) {
              Alert.alert('Σφάλμα', 'Αποτυχία υποβολής στο AADE');
              console.error('AADE submission error:', error);
            } finally {
              setSubmittingAADE(false);
            }
          },
        },
      ]
    );
  }

  if (!contract) {
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
      <AppHeader title="Λεπτομέρειες Συμβολαίου" showBack={true} showActions={true} />

      <View style={s.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={s.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={s.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <TouchableOpacity onPress={() => router.push('/contracts')} style={s.breadcrumbItem}>
          <Text style={s.breadcrumbText}>Συμβόλαια</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={s.breadcrumbCurrent}>#{contract.id.slice(0, 8)}</Text>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.scrollContent} {...smoothScrollConfig}>
        {/* AADE Status Badge */}
        {contract.aadeStatus && (
          <View style={s.aadeStatusContainer}>
            <View style={[s.aadeBadge, { backgroundColor: getAADEStatusMessage(contract.aadeStatus).color + '15' }]}>
              <Ionicons 
                name={contract.aadeStatus === 'submitted' || contract.aadeStatus === 'completed' ? 'checkmark-circle' : 'alert-circle'} 
                size={18} 
                color={getAADEStatusMessage(contract.aadeStatus).color} 
              />
              <Text style={[s.aadeStatusText, { color: getAADEStatusMessage(contract.aadeStatus).color }]}>
                {getAADEStatusMessage(contract.aadeStatus).text}
              </Text>
            </View>
            {contract.aadeDclId && (
              <Text style={s.aadeDclId}>DCL ID: {contract.aadeDclId}</Text>
            )}
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ενοικιαστής</Text>
          <View style={s.card}>
            <InfoRow icon="person" label="Όνομα" value={contract.renterInfo?.fullName || 'N/A'} />
            <InfoRow icon="mail" label="Email" value={contract.renterInfo?.email || 'N/A'} />
            <InfoRow icon="call" label="Τηλέφωνο" value={contract.renterInfo?.phoneNumber || 'N/A'} />
            {contract.renterInfo?.licenseNumber && (
              <InfoRow icon="card" label="Άδεια" value={contract.renterInfo.licenseNumber} />
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Αυτοκίνητο</Text>
          <View style={s.card}>
            <InfoRow icon="car" label="Όχημα" value={contract.carInfo?.makeModel || 'N/A'} />
            <InfoRow icon="pricetag" label="Πινακίδα" value={contract.carInfo?.licensePlate || 'N/A'} />
            <InfoRow icon="speedometer" label="Χιλιόμετρα" value={`${contract.carCondition?.mileage || contract.carInfo?.mileage || 0} km`} />
            <InfoRow icon="water" label="Καύσιμο" value={`${contract.carCondition?.fuelLevel || 0}/8`} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Περίοδος & Κόστος</Text>
          <View style={s.card}>
            <InfoRow icon="calendar" label="Παραλαβή" value={contract.rentalPeriod?.pickupDate ? new Date(contract.rentalPeriod.pickupDate).toLocaleDateString('el-GR') : 'N/A'} />
            <InfoRow icon="calendar" label="Επιστροφή" value={contract.rentalPeriod?.dropoffDate ? new Date(contract.rentalPeriod.dropoffDate).toLocaleDateString('el-GR') : 'N/A'} />
            <InfoRow icon="time" label="Ημέρες" value={(() => {
              if (contract.rentalPeriod?.pickupDate && contract.rentalPeriod?.dropoffDate) {
                const days = Math.ceil((new Date(contract.rentalPeriod.dropoffDate).getTime() - new Date(contract.rentalPeriod.pickupDate).getTime()) / (1000 * 60 * 60 * 24));
                return days.toString();
              }
              return '0';
            })()} />
            <InfoRow icon="cash" label="Σύνολο" value={`€${contract.rentalPeriod?.totalCost || 0}`} />
          </View>
        </View>

        {contract.damagePoints && contract.damagePoints.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ζημιές ({contract.damagePoints.length})</Text>
            <View style={s.card}>
              {contract.damagePoints.map((d, idx) => {
                const markerTypeLabels: Record<string, string> = {
                  'slight-scratch': 'Γρατζουνιά',
                  'heavy-scratch': 'Βαθιά γρατζουνιά',
                  'bent': 'Λυγισμένη λαμαρίνα',
                  'broken': 'Σπασμένο/Λείπει'
                };
                const markerLabel = d.markerType ? markerTypeLabels[d.markerType] : 'Ζημιά';
                return (
                  <View key={idx} style={s.damageRow}>
                    <Ionicons name="alert-circle" size={16} color={Colors.error} />
                    <Text style={s.damageText}>{markerLabel} - {d.description || d.view} ({d.severity})</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={s.actions}>
          <TouchableOpacity style={s.btn} onPress={handleEdit}>
            <Ionicons name="create" size={18} color="#fff" />
            <Text style={s.btnText}>Επεξεργασία</Text>
          </TouchableOpacity>
        </View>

        {/* Professional PDF Generator */}
        {user && (
          <PDFContractGenerator
            contract={contract}
            user={user}
            style={{ marginHorizontal: 16, marginTop: 16 }}
          />
        )}

        {/* AADE Push Button */}
        <TouchableOpacity 
          style={[s.aadeButton, submittingAADE && s.aadeButtonDisabled]} 
          onPress={handlePushToAADE}
          disabled={submittingAADE}
        >
          {submittingAADE ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={s.aadeButtonText}>Αποστολή στο AADE...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={s.aadeButtonText}>Αποστολή στο AADE</Text>
            </>
          )}
        </TouchableOpacity>
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
  scrollContent: { paddingBottom: 120 },
  aadeStatusContainer: { marginBottom: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12, ...Shadows.sm },
  aadeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8 },
  aadeStatusText: { fontSize: 14, fontWeight: '600' },
  aadeDclId: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, fontFamily: 'monospace' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, marginLeft: 4, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, ...Shadows.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', minWidth: 80 },
  infoValue: { fontSize: 13, color: Colors.text, flex: 1, fontWeight: '600' },
  damageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  damageText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, padding: 12, borderRadius: 12 },
  btnSecondary: { backgroundColor: Colors.success },
  btnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  aadeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    ...Shadows.sm,
  },
  aadeButtonDisabled: {
    opacity: 0.6,
  },
  aadeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
