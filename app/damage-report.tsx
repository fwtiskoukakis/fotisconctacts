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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { ContextAwareFab } from '../components/context-aware-fab';
import { DamageTemplateSelector } from '../components/damage-template-selector';
import { PhotoCaptureService } from '../services/photo-capture.service';
import { DamageTemplateService, DamageTemplate } from '../services/damage-template.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface DamageReport {
  id: string;
  contractId: string;
  carId: string;
  damageType: 'scratch' | 'dent' | 'crack' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  description: string;
  estimatedCost: number;
  photos: string[];
  reportedBy: string;
  reportedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export default function DamageReportScreen() {
  const router = useRouter();
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [newReport, setNewReport] = useState<Partial<DamageReport>>({
    damageType: 'scratch',
    severity: 'minor',
    location: '',
    description: '',
    estimatedCost: 0,
    photos: [],
    status: 'pending',
  });

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
    const damageTypeInfo = damageTypes.find(d => d.id === report.damageType);

    return (
      <View key={report.id} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportMainInfo}>
            <Text style={styles.reportLocation}>{report.location}</Text>
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
            <Text style={styles.detailLabel}>Τύπος:</Text>
            <Text style={styles.detailValue}>
              {damageTypeInfo?.icon} {damageTypeInfo?.label}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Εκτιμώμενο Κόστος:</Text>
            <Text style={styles.detailValue}>€{report.estimatedCost}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ημερομηνία:</Text>
            <Text style={styles.detailValue}>
              {report.reportedAt.toLocaleDateString('el-GR')}
            </Text>
          </View>
        </View>

        <View style={styles.reportFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(report.status)}</Text>
          </View>
          {report.photos.length > 0 && (
            <Text style={styles.photosCount}>📷 {report.photos.length} φωτογραφίες</Text>
          )}
        </View>
      </View>
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
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors.warning }]}>
            <Text style={styles.statValue}>{damageReports.filter(r => r.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Εκκρεμείς</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.success }]}>
            <Text style={styles.statValue}>{damageReports.filter(r => r.status === 'approved').length}</Text>
            <Text style={styles.statLabel}>Εγκεκριμένες</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.error }]}>
            <Text style={styles.statValue}>{damageReports.filter(r => r.status === 'rejected').length}</Text>
            <Text style={styles.statLabel}>Απορριφθείσες</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
