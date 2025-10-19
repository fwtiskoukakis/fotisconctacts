import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../../components/glass-card';
import { Colors, Typography, Shadows, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { supabase } from '../../utils/supabase';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface DamageReport {
  id: string;
  contractId: string;
  xPosition: number;
  yPosition: number;
  viewSide: 'front' | 'rear' | 'left' | 'right';
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  createdAt: Date;
  contractRenterName?: string;
  carLicensePlate?: string;
}

export default function DamageReportScreen() {
  const router = useRouter();
  const [damages, setDamages] = useState<DamageReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDamages();
  }, []);

  async function loadDamages() {
    try {
      const { data, error } = await supabase
        .from('damage_points')
        .select(`*,contracts!inner(renter_full_name,car_license_plate)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: DamageReport[] = data?.map(d => ({
        id: d.id,
        contractId: d.contract_id,
        xPosition: d.x_position,
        yPosition: d.y_position,
        viewSide: d.view_side,
        description: d.description,
        severity: d.severity,
        createdAt: new Date(d.created_at),
        contractRenterName: d.contracts?.renter_full_name,
        carLicensePlate: d.contracts?.car_license_plate,
      })) || [];

      setDamages(mapped);
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης');
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDamages();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return Colors.success;
      case 'moderate': return Colors.warning;
      case 'severe': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'minor': return 'Μικρή';
      case 'moderate': return 'Μέτρια';
      case 'severe': return 'Σοβαρή';
      default: return severity;
    }
  };

  const getViewLabel = (view: string) => {
    switch (view) {
      case 'front': return 'Μπροστά';
      case 'rear': return 'Πίσω';
      case 'left': return 'Αριστερά';
      case 'right': return 'Δεξιά';
      default: return view;
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

      {/* Stats */}
      <View style={s.stats}>
        <View style={[s.stat, { backgroundColor: Colors.primary + '20' }]}>
          <Text style={[s.statValue, { color: Colors.primary }]}>{damages.length}</Text>
          <Text style={s.statLabel}>Σύνολο</Text>
        </View>
        <View style={[s.stat, { backgroundColor: Colors.success + '20' }]}>
          <Text style={[s.statValue, { color: Colors.success }]}>{damages.filter(d => d.severity === 'minor').length}</Text>
          <Text style={s.statLabel}>Μικρές</Text>
        </View>
        <View style={[s.stat, { backgroundColor: Colors.warning + '20' }]}>
          <Text style={[s.statValue, { color: Colors.warning }]}>{damages.filter(d => d.severity === 'moderate').length}</Text>
          <Text style={s.statLabel}>Μέτριες</Text>
        </View>
        <View style={[s.stat, { backgroundColor: Colors.error + '20' }]}>
          <Text style={[s.statValue, { color: Colors.error }]}>{damages.filter(d => d.severity === 'severe').length}</Text>
          <Text style={s.statLabel}>Σοβαρές</Text>
        </View>
      </View>

      <ScrollView style={s.list} {...smoothScrollConfig} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {damages.map(d => (
          <TouchableOpacity key={d.id} style={s.card} onPress={() => router.push(`/contract-details?contractId=${d.contractId}`)}>
            <View style={s.row}>
              <View style={s.left}>
                <Text style={s.name} numberOfLines={1}>{d.carLicensePlate} - {getViewLabel(d.viewSide)}</Text>
                <Text style={s.detail} numberOfLines={2}>{d.description}</Text>
                <Text style={s.renter}>{d.contractRenterName}</Text>
                <Text style={s.date}>{format(d.createdAt, 'dd/MM/yyyy HH:mm', { locale: el })}</Text>
              </View>
              <View style={s.right}>
                <View style={[s.badge, { backgroundColor: getSeverityColor(d.severity) + '15' }]}>
                  <Text style={[s.badgeText, { color: getSeverityColor(d.severity) }]}>
                    {getSeverityLabel(d.severity)}
                  </Text>
                </View>
                <Text style={s.pos}>X:{d.xPosition.toFixed(1)}% Y:{d.yPosition.toFixed(1)}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {damages.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="warning-outline" size={48} color={Colors.textSecondary} />
            <Text style={s.emptyText}>Δεν βρέθηκαν ζημιές</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 6 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breadcrumbText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  breadcrumbCurrent: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  stats: { flexDirection: 'row', padding: 8, gap: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  stat: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  list: { flex: 1, padding: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, ...Shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  detail: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  renter: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  date: { fontSize: 10, color: Colors.textTertiary },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  pos: { fontSize: 9, color: Colors.textTertiary },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
});
