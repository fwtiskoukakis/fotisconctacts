import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { ContextAwareFab } from '../components/context-aware-fab';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalRevenue: number;
  totalContracts: number;
  activeRentals: number;
  completedRentals: number;
  averageRentalDuration: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  mostPopularCar: string;
  averageDailyRate: number;
}

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalContracts: 0,
    activeRentals: 0,
    completedRentals: 0,
    averageRentalDuration: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    revenueGrowth: 0,
    mostPopularCar: '',
    averageDailyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      
      // Get all contracts
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*');

      if (error) {
        console.error('Error loading contracts:', error);
        return;
      }

      // Calculate analytics
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      const totalRevenue = contracts?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;
      const totalContracts = contracts?.length || 0;
      
      const activeRentals = contracts?.filter(c => {
        const pickup = new Date(c.pickup_date);
        const dropoff = new Date(c.dropoff_date);
        return pickup <= now && now <= dropoff;
      }).length || 0;

      const completedRentals = contracts?.filter(c => {
        const dropoff = new Date(c.dropoff_date);
        return dropoff < now;
      }).length || 0;

      const revenueThisMonth = contracts?.filter(c => {
        const pickup = new Date(c.pickup_date);
        return pickup.getMonth() === thisMonth && pickup.getFullYear() === thisYear;
      }).reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;

      const revenueLastMonth = contracts?.filter(c => {
        const pickup = new Date(c.pickup_date);
        return pickup.getMonth() === lastMonth && pickup.getFullYear() === lastMonthYear;
      }).reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;

      const revenueGrowth = revenueLastMonth > 0 
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
        : 0;

      // Calculate average rental duration
      const activeContracts = contracts?.filter(c => {
        const pickup = new Date(c.pickup_date);
        const dropoff = new Date(c.dropoff_date);
        return pickup <= now && now <= dropoff;
      }) || [];

      const averageRentalDuration = activeContracts.length > 0
        ? activeContracts.reduce((sum, c) => {
            const pickup = new Date(c.pickup_date);
            const dropoff = new Date(c.dropoff_date);
            return sum + Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / activeContracts.length
        : 0;

      // Find most popular car
      const carCounts: { [key: string]: number } = {};
      contracts?.forEach(c => {
        const carKey = `${c.car_make} ${c.car_model}`;
        carCounts[carKey] = (carCounts[carKey] || 0) + 1;
      });

      const mostPopularCar = Object.keys(carCounts).reduce((a, b) => 
        carCounts[a] > carCounts[b] ? a : b, 'N/A'
      );

      // Calculate average daily rate
      const averageDailyRate = totalContracts > 0 
        ? totalRevenue / totalContracts 
        : 0;

      setAnalytics({
        totalRevenue,
        totalContracts,
        activeRentals,
        completedRentals,
        averageRentalDuration: Math.round(averageRentalDuration),
        revenueThisMonth,
        revenueLastMonth,
        revenueGrowth: Math.round(revenueGrowth),
        mostPopularCar,
        averageDailyRate: Math.round(averageDailyRate),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function StatCard({ title, value, subtitle, color = Colors.primary, icon }: {
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
    icon?: string;
  }) {
    return (
      <View style={[styles.statCard, { backgroundColor: color }]}>
        <View style={styles.statHeader}>
          {icon && <Text style={styles.statIcon}>{icon}</Text>}
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
          </View>
        </View>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Αναφορές" showActions={true} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Revenue Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Έσοδα</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Συνολικά Έσοδα"
              value={`€${analytics.totalRevenue.toLocaleString()}`}
              subtitle="Όλων των εποχών"
              color={Colors.primary}
              icon="💰"
            />
            
            <StatCard
              title="Έσοδα Μήνα"
              value={`€${analytics.revenueThisMonth.toLocaleString()}`}
              subtitle={`${analytics.revenueGrowth > 0 ? '+' : ''}${analytics.revenueGrowth}% από προηγούμενο μήνα`}
              color={analytics.revenueGrowth >= 0 ? Colors.success : Colors.error}
              icon="📈"
            />
          </View>
        </View>

        {/* Contracts Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Συμβόλαια</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Συνολικά Συμβόλαια"
              value={analytics.totalContracts.toString()}
              subtitle="Όλα τα συμβόλαια"
              color={Colors.secondary}
              icon="📋"
            />
            
            <StatCard
              title="Ενεργές Ενοικιάσεις"
              value={analytics.activeRentals.toString()}
              subtitle="Σε εξέλιξη"
              color={Colors.warning}
              icon="🚗"
            />
            
            <StatCard
              title="Ολοκληρωμένα"
              value={analytics.completedRentals.toString()}
              subtitle="Τελειωμένα"
              color={Colors.success}
              icon="✅"
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Μετρικές Απόδοσης</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Μέση Διάρκεια"
              value={`${analytics.averageRentalDuration} ημέρες`}
              subtitle="Ενεργές ενοικιάσεις"
              color={Colors.info}
              icon="📅"
            />
            
            <StatCard
              title="Μέσο Κόστος"
              value={`€${analytics.averageDailyRate}`}
              subtitle="Ανά συμβόλαιο"
              color={Colors.primary}
              icon="💳"
            />
          </View>
        </View>

        {/* Popular Cars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Δημοφιλή Αυτοκίνητα</Text>
          <View style={[styles.popularCarCard, Glassmorphism.light]}>
            <Text style={styles.popularCarIcon}>🏆</Text>
            <View style={styles.popularCarInfo}>
              <Text style={styles.popularCarTitle}>Πιο Δημοφιλές</Text>
              <Text style={styles.popularCarName}>{analytics.mostPopularCar}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Γρήγορες Ενέργειες</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={[styles.quickActionButton, Glassmorphism.light]}>
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Εξαγωγή PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.quickActionButton, Glassmorphism.light]}>
              <Text style={styles.quickActionIcon}>📧</Text>
              <Text style={styles.quickActionText}>Αποστολή Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.quickActionButton, Glassmorphism.light]}>
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Ημερολόγιο</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.quickActionButton, Glassmorphism.light]}>
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Ρυθμίσεις</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Context-Aware Floating Action Button */}
      <ContextAwareFab
        onGenerateReport={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία δημιουργίας αναφοράς θα προστεθεί σύντομα');
        }}
        onExportData={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία εξαγωγής δεδομένων θα προστεθεί σύντομα');
        }}
        onScheduleReport={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία προγραμματισμού αναφορών θα προστεθεί σύντομα');
        }}
      />

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100, // Space for tab bar
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...Typography.h4,
    color: Colors.textInverse,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statSubtitle: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  popularCarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  popularCarIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  popularCarInfo: {
    flex: 1,
  },
  popularCarTitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  popularCarName: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
});
