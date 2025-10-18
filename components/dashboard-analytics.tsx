import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../utils/design-system';

interface AnalyticsData {
  totalRevenue: number;
  activeRentals: number;
  upcomingReturns: number;
  revenueThisMonth: number;
  totalContracts: number;
  averageRentalDuration: number;
}

interface DashboardAnalyticsProps {
  analytics: AnalyticsData;
  onStatPress?: (statType: string) => void;
}

export function DashboardAnalytics({ analytics, onStatPress }: DashboardAnalyticsProps) {
  const stats = [
    {
      id: 'revenue',
      title: 'Έσοδα Μήνα',
      value: `€${analytics.revenueThisMonth.toLocaleString()}`,
      icon: '💰',
      color: Colors.primary,
      subtitle: `Συνολικά: €${analytics.totalRevenue.toLocaleString()}`,
    },
    {
      id: 'active',
      title: 'Ενεργές Ενοικιάσεις',
      value: analytics.activeRentals.toString(),
      icon: '🚗',
      color: Colors.success,
      subtitle: `${analytics.totalContracts} συνολικά συμβόλαια`,
    },
    {
      id: 'returns',
      title: 'Επιστροφές Σήμερα',
      value: analytics.upcomingReturns.toString(),
      icon: '⏰',
      color: analytics.upcomingReturns > 0 ? Colors.warning : Colors.info,
      subtitle: analytics.upcomingReturns > 0 ? 'Απαιτεί προσοχή' : 'Όλα εντάξει',
    },
    {
      id: 'duration',
      title: 'Μέση Διάρκεια',
      value: `${analytics.averageRentalDuration} ημέρες`,
      icon: '📅',
      color: Colors.secondary,
      subtitle: 'Ενεργές ενοικιάσεις',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Επισκόπηση επιχείρησης</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={[styles.statCard, { backgroundColor: stat.color }]}
            onPress={() => onStatPress?.(stat.id)}
            activeOpacity={0.8}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            </View>
            <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.95,
  },
  statSubtitle: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.85,
    fontWeight: '500',
  },
});
