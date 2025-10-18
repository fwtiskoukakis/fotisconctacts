import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { Breadcrumb } from '../components/breadcrumb';
import { ContextAwareFab } from '../components/context-aware-fab';
import { DamageTemplateSelector } from '../components/damage-template-selector';
import { PhotoCaptureService } from '../services/photo-capture.service';
import { DamageTemplateService, DamageTemplate } from '../services/damage-template.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';
import { supabase } from '../utils/supabase';
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
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [newReport, setNewReport] = useState<Partial<DamageReport>>({
    severity: 'minor',
    description: '',
    viewSide: 'front',
    xPosition: 50,
    yPosition: 50,
  });

  useEffect(() => {
    loadDamages();
  }, []);

  async function loadDamages() {
    try {
      setLoading(true);
      
      console.log('Loading damages from Supabase...');
      
      // Load all damage points with contract information
      const { data, error } = await supabase
        .from('damage_points')
        .select(`
          *,
          contracts!inner(
            renter_full_name,
            car_license_plate
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Damages query result:', { data, error });

      if (error) {
        console.error('Error loading damages:', error);
        Alert.alert('Σφάλμα', `Αποτυχία φόρτωσης ζημιών: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No damages found in database');
        Alert.alert(
          'Δεν υπάρχουν δεδομένα',
          'Δεν βρέθηκαν ζημιές στη βάση δεδομένων. Βεβαιωθείτε ότι έχετε εκτελέσει το SQL script: supabase/insert-example-contracts-and-damages.sql'
        );
        setDamageReports([]);
        return;
      }

      const mappedDamages: DamageReport[] = data?.map(d => ({
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

      console.log(`Loaded ${mappedDamages.length} damages successfully`);
      setDamageReports(mappedDamages);
    } catch (error) {
      console.error('Error loading damages:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης ζημιών');
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDamages();
    setRefreshing(false);
  }

  const damageTypes = [
    { id: 'scratch', label: 'Γρατζουνιά', icon: '🔸' },
    { id: 'dent', label: 'Σκάσιμο', icon: '🔹' },
    { id: 'crack', label: 'Ρωγμή', icon: '⚡' },
    { id: 'other', label: 'Άλλο', icon: '❓' },
  ];

  const severityLevels = [
    { id: 'minor', label: 'Μικρή', color: Colors.success },
    { id: 'moderate', label: 'Μέτρια', color: Colors.warning },
    { id: 'severe', label: 'Σοβαρή', color: Colors.error },
  ];

  function handleSaveReport() {
    if (!newReport.location || !newReport.description) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    const report: DamageReport = {
      id: Date.now().toString(),
      contractId: newReport.contractId || '',
      carId: newReport.carId || '',
      damageType: newReport.damageType || 'scratch',
      severity: newReport.severity || 'minor',
      location: newReport.location,
      description: newReport.description,
      estimatedCost: newReport.estimatedCost || 0,
      photos: newReport.photos || [],
      reportedBy: 'Current User',
      reportedAt: new Date(),
      status: 'pending',
    };

    setDamageReports(prev => [report, ...prev]);
    setShowNewForm(false);
    setNewReport({
      damageType: 'scratch',
      severity: 'minor',
      location: '',
      description: '',
      estimatedCost: 0,
      photos: [],
      status: 'pending',
    });
    
    Alert.alert('Επιτυχία', 'Η καταγραφή ζημιάς αποθηκεύτηκε επιτυχώς');
  }

  function renderDamageReport(report: DamageReport) {
    const severityInfo = severityLevels.find(s => s.id === report.severity);
    
    const viewSideLabel = {
      front: 'Μπροστά',
      rear: 'Πίσω',
      left: 'Αριστερά',
      right: 'Δεξιά',
    }[report.viewSide];

    return (
      <TouchableOpacity 
        key={report.id} 
        style={[styles.reportCard, Glassmorphism.light]}
        onPress={() => router.push(`/contract-details?contractId=${report.contractId}`)}
        activeOpacity={0.7}
      >
        <View style={styles.reportHeader}>
          <View style={styles.reportMainInfo}>
            <Text style={styles.reportLocation}>
              {report.carLicensePlate || 'N/A'} - {viewSideLabel}
            </Text>
            <Text style={styles.reportDescription} numberOfLines={2}>
              {report.description}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: severityInfo?.color }]}>
            <Text style={styles.severityText}>{severityInfo?.label}</Text>
          </View>
        </View>

        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ενοικιαστής:</Text>
            <Text style={styles.detailValue}>
              {report.contractRenterName || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Θέση:</Text>
            <Text style={styles.detailValue}>
              X: {report.xPosition.toFixed(1)}%, Y: {report.yPosition.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ημερομηνία:</Text>
            <Text style={styles.detailValue}>
              {format(report.createdAt, 'dd/MM/yyyy HH:mm', { locale: el })}
            </Text>
          </View>
        </View>

        <View style={styles.reportFooter}>
          <Text style={styles.viewContractText}>👁️ Δείτε Συμβόλαιο</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'approved': return Colors.success;
      case 'rejected': return Colors.error;
      default: return Colors.gray;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Εκκρεμής';
      case 'approved': return 'Εγκεκριμένη';
      case 'rejected': return 'Απορριφθείσα';
      default: return 'Άγνωστη';
    }
  }

  function handleSelectTemplate(template: DamageTemplate) {
    const templateData = DamageTemplateService.applyTemplate(template);
    setNewReport(prev => ({
      ...prev,
      ...templateData,
    }));
    Alert.alert(
      'Πρότυπο Εφαρμόστηκε',
      `Το πρότυπο "${template.name}" εφαρμόστηκε επιτυχώς. Μπορείτε να τροποποιήσετε τα στοιχεία αν χρειάζεται.`
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Καταγραφή Ζημιών" showActions={true} />
      
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Αρχική', path: '/' },
          { label: 'Καταγραφή Ζημιών' },
        ]}
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
            <Text style={styles.statValue}>{damageReports.length}</Text>
            <Text style={styles.statLabel}>Συνολικές</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.warning }]}>
            <Text style={styles.statValue}>{damageReports.filter(r => r.severity === 'minor').length}</Text>
            <Text style={styles.statLabel}>Μικρές</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.statValue}>{damageReports.filter(r => r.severity === 'moderate').length}</Text>
            <Text style={styles.statLabel}>Μέτριες</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.error }]}>
            <Text style={styles.statValue}>{damageReports.filter(r => r.severity === 'severe').length}</Text>
            <Text style={styles.statLabel}>Σοβαρές</Text>
          </View>
        </View>

        {/* New Report Form */}
        {showNewForm && (
          <View style={[styles.formContainer, Glassmorphism.light]}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Νέα Καταγραφή Ζημιάς</Text>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => setShowTemplateSelector(true)}
              >
                <Text style={styles.templateButtonText}>📝 Πρότυπο</Text>
              </TouchableOpacity>
            </View>
            
            {/* Damage Type */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Τύπος Ζημιάς</Text>
              <View style={styles.optionsGrid}>
                {damageTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.optionButton,
                      newReport.damageType === type.id && styles.optionButtonActive
                    ]}
                    onPress={() => setNewReport(prev => ({ ...prev, damageType: type.id as any }))}
                  >
                    <Text style={styles.optionIcon}>{type.icon}</Text>
                    <Text style={styles.optionLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Severity */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Βαθμός Σοβαρότητας</Text>
              <View style={styles.optionsGrid}>
                {severityLevels.map(severity => (
                  <TouchableOpacity
                    key={severity.id}
                    style={[
                      styles.optionButton,
                      newReport.severity === severity.id && styles.optionButtonActive
                    ]}
                    onPress={() => setNewReport(prev => ({ ...prev, severity: severity.id as any }))}
                  >
                    <Text style={styles.optionLabel}>{severity.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Τοποθεσία</Text>
              <TextInput
                style={styles.textInput}
                value={newReport.location}
                onChangeText={(text) => setNewReport(prev => ({ ...prev, location: text }))}
                placeholder="π.χ. Πίσω αριστερό φτερό"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Περιγραφή</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newReport.description}
                onChangeText={(text) => setNewReport(prev => ({ ...prev, description: text }))}
                placeholder="Αναλυτική περιγραφή της ζημιάς..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Estimated Cost */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Εκτιμώμενο Κόστος (€)</Text>
              <TextInput
                style={styles.textInput}
                value={newReport.estimatedCost?.toString() || ''}
                onChangeText={(text) => setNewReport(prev => ({ ...prev, estimatedCost: parseFloat(text) || 0 }))}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            {/* Form Actions */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewForm(false)}
              >
                <Text style={styles.cancelButtonText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveReport}
              >
                <Text style={styles.saveButtonText}>Αποθήκευση</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reports List */}
        <View style={styles.reportsContainer}>
          {damageReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyTitle}>Δεν υπάρχουν καταγραφές ζημιών</Text>
              <Text style={styles.emptySubtitle}>
                Πατήστε το κουμπί "+" για να δημιουργήσετε την πρώτη καταγραφή
              </Text>
            </View>
          ) : (
            damageReports.map(renderDamageReport)
          )}
        </View>
      </ScrollView>

      {/* Context-Aware Floating Action Button */}
      <ContextAwareFab
        onNewDamage={() => setShowNewForm(true)}
        onQuickPhoto={async () => {
          const photo = await PhotoCaptureService.quickDamagePhoto();
          if (photo) {
            // Add photo to current damage report if form is open
            if (showNewForm) {
              setNewReport(prev => ({
                ...prev,
                photos: [...(prev.photos || []), photo]
              }));
              Alert.alert('Επιτυχία', 'Η φωτογραφία προστέθηκε στην καταγραφή ζημιάς');
            } else {
              Alert.alert('Πληροφορία', 'Η φωτογραφία τραβήχθηκε. Ανοίξτε τη φόρμα νέας ζημιάς για να την προσθέσετε.');
            }
          }
        }}
        onDamageTemplate={() => setShowTemplateSelector(true)}
      />

      {/* Damage Template Selector */}
      <DamageTemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleSelectTemplate}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for bottom tab bar and FAB
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  statValue: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
  },
  formContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  templateButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  templateButtonText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  optionLabel: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reportsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  reportMainInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  reportLocation: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reportDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  viewContractText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  photosCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
