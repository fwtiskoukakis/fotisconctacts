import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Breadcrumb } from '../../components/breadcrumb';
import { SimpleGlassCard } from '../../components/glass-card';
import { SupabaseContractService } from '../../services/supabase-contract.service';
import { Colors, Typography, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    upcoming: 0,
    revenue: 0,
    monthRevenue: 0,
    avgValue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const contracts = await SupabaseContractService.getAllContracts();
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      setStats({
        total: contracts.length,
        active: contracts.filter(c => c.status === 'active').length,
        completed: contracts.filter(c => c.status === 'completed').length,
        upcoming: contracts.filter(c => c.status === 'upcoming').length,
        revenue: contracts.reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0),
        monthRevenue: contracts.filter(c => {
          const d = new Date(c.rentalPeriod.pickupDate);
          return d.getMonth() === month && d.getFullYear() === year;
        }).reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0),
        avgValue: contracts.length ? contracts.reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0) / contracts.length : 0,
      });
    } catch (error) {
      console.error(error);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const StatCard = ({ icon, label, value, color }: any) => (
    <View style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={s.statContent}>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>

      <Breadcrumb 
        items={[
          { label: 'Αρχική', path: '/', icon: 'home' },
          { label: 'Αναλυτικά' },
        ]}
      />

      <ScrollView style={s.content} {...smoothScrollConfig} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={s.sectionTitle}>Επισκόπηση</Text>
        <View style={s.grid}>
          <StatCard icon="documents" label="Συνολικά" value={stats.total} color={Colors.primary} />
          <StatCard icon="checkmark-circle" label="Ενεργά" value={stats.active} color={Colors.success} />
          <StatCard icon="time" label="Επερχόμενα" value={stats.upcoming} color={Colors.info} />
          <StatCard icon="checkmark-done" label="Ολοκληρωμένα" value={stats.completed} color={Colors.textSecondary} />
        </View>

        <Text style={s.sectionTitle}>Εσοδα</Text>
        <View style={s.revenueCard}>
          <View style={s.revenueRow}>
            <Ionicons name="trending-up" size={24} color={Colors.success} />
            <View>
              <Text style={s.revenueLabel}>Συνολικά Εσοδα</Text>
              <Text style={s.revenueValue}>€{stats.revenue.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={s.revenueCard}>
          <View style={s.revenueRow}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <View>
              <Text style={s.revenueLabel}>Αυτόν τον Μήνα</Text>
              <Text style={s.revenueValue}>€{stats.monthRevenue.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={s.revenueCard}>
          <View style={s.revenueRow}>
            <Ionicons name="calculator" size={24} color={Colors.info} />
            <View>
              <Text style={s.revenueLabel}>Μέση Αξία Συμβολαίου</Text>
              <Text style={s.revenueValue}>€{Math.round(stats.avgValue)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginVertical: 8, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  statContent: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  revenueCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  revenueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  revenueLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  revenueValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
});
