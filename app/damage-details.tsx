import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Shadows } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { supabase } from '../utils/supabase';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface DamageDetail {
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
  carMakeModel?: string;
}

export default function DamageDetailsScreen() {
  const router = useRouter();
  const { damageId } = useLocalSearchParams();
  const [damage, setDamage] = React.useState<DamageDetail | null>(null);

  React.useEffect(() => {
    loadDamage();
  }, [damageId]);

  async function loadDamage() {
    if (typeof damageId === 'string') {
      try {
        const { data, error } = await supabase
          .from('damage_points')
          .select(`
            *,
            contracts!inner(
              renter_full_name,
              car_license_plate,
              car_make_model
            )
          `)
          .eq('id', damageId)
          .single();

        if (error) throw error;

        if (data) {
          setDamage({
            id: data.id,
            contractId: data.contract_id,
            xPosition: data.x_position,
            yPosition: data.y_position,
            viewSide: data.view_side,
            description: data.description,
            severity: data.severity,
            createdAt: new Date(data.created_at),
            contractRenterName: data.contracts?.renter_full_name,
            carLicensePlate: data.contracts?.car_license_plate,
            carMakeModel: data.contracts?.car_make_model,
          });
        }
      } catch (error) {
        Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης ζημιάς');
        router.back();
      }
    }
  }

  function handleEdit() {
    if (damage) {
      router.push(`/contract-details?contractId=${damage.contractId}`);
    }
  }

  function handleViewContract() {
    if (damage) {
      router.push(`/contract-details?contractId=${damage.contractId}`);
    }
  }

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
      case 'front': return 'Μπροστινή Πλευρά';
      case 'rear': return 'Πίσω Πλευρά';
      case 'left': return 'Αριστερή Πλευρά';
      case 'right': return 'Δεξιά Πλευρά';
      default: return view;
    }
  };

  if (!damage) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Λεπτομέρειες Ζημιάς" showBack onBack={() => router.back()} />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Φόρτωση...</Text>
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Λεπτομέρειες Ζημιάς"
        showBack
        onBack={() => router.back()}
        showActions
      />

      <ScrollView style={styles.content} {...smoothScrollConfig}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.breadcrumbItem}>
            <Ionicons name="home" size={14} color={Colors.primary} />
            <Text style={styles.breadcrumbText}>Αρχική</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          <TouchableOpacity onPress={() => router.push('/(tabs)/damage-report')} style={styles.breadcrumbItem}>
            <Text style={styles.breadcrumbText}>Ζημιές</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          <Text style={styles.breadcrumbCurrent}>Λεπτομέρειες</Text>
        </View>

        {/* Severity Badge */}
        <View style={[styles.severityBanner, { backgroundColor: getSeverityColor(damage.severity) + '20' }]}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(damage.severity) }]}>
            <Ionicons name="warning" size={24} color="#fff" />
          </View>
          <View style={styles.severityInfo}>
            <Text style={[styles.severityText, { color: getSeverityColor(damage.severity) }]}>
              {getSeverityLabel(damage.severity).toUpperCase()}
            </Text>
            <Text style={styles.severitySubtext}>
              Επίπεδο Σοβαρότητας
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <SimpleGlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Πληροφορίες Οχήματος</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Αριθμός Κυκλοφορίας:</Text>
            <Text style={styles.value}>{damage.carLicensePlate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Όχημα:</Text>
            <Text style={styles.value}>{damage.carMakeModel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ενοικιαστής:</Text>
            <Text style={styles.value}>{damage.contractRenterName}</Text>
          </View>
        </SimpleGlassCard>

        {/* Damage Details */}
        <SimpleGlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Λεπτομέρειες Ζημιάς</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Πλευρά:</Text>
            <Text style={styles.value}>{getViewLabel(damage.viewSide)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Θέση (X, Y):</Text>
            <Text style={styles.value}>
              {damage.xPosition.toFixed(1)}%, {damage.yPosition.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ημερομηνία:</Text>
            <Text style={styles.value}>
              {format(damage.createdAt, 'dd/MM/yyyy HH:mm', { locale: el })}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.description]}>
            <Text style={styles.label}>Περιγραφή:</Text>
            <Text style={[styles.value, styles.descriptionText]}>
              {damage.description}
            </Text>
          </View>
        </SimpleGlassCard>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleViewContract}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Προβολή Συμβολαίου</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Επεξεργασία</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 6,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  severityBanner: {
    margin: 12,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...Shadows.md,
  },
  severityBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityInfo: {
    flex: 1,
  },
  severityText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  severitySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  card: {
    margin: 12,
    marginTop: 0,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  description: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  descriptionText: {
    textAlign: 'left',
    marginTop: 6,
    lineHeight: 20,
  },
  actions: {
    margin: 12,
    marginTop: 0,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    ...Shadows.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});

