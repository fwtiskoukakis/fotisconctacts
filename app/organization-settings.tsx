import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { OrganizationService } from '../services/organization.service';
import { Organization, OrganizationSettings } from '../models/multi-tenant.types';

export default function OrganizationSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'integrations' | 'notifications'>('general');

  useEffect(() => {
    loadOrganizationData();
  }, []);

  async function loadOrganizationData() {
    setLoading(true);
    try {
      const [orgData, settingsData] = await Promise.all([
        OrganizationService.getCurrentOrganization(),
        OrganizationService.getCurrentOrganization().then(org => 
          org ? OrganizationService.getOrganizationSettings(org.id) : null
        ),
      ]);

      setOrganization(orgData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading organization data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης δεδομένων επιχείρησης.');
    } finally {
      setLoading(false);
    }
  }

  async function saveOrganizationData() {
    if (!organization) return;

    setSaving(true);
    try {
      await OrganizationService.updateOrganization(organization.id, organization);
      if (settings) {
        await OrganizationService.updateOrganizationSettings(organization.id, settings);
      }
      Alert.alert('Επιτυχία', 'Τα δεδομένα αποθηκεύτηκαν επιτυχώς!');
    } catch (error) {
      console.error('Error saving organization data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης δεδομένων.');
    } finally {
      setSaving(false);
    }
  }

  function renderTabButton(tab: string, title: string, icon: string) {
    return (
      <TouchableOpacity
        style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab as any)}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={activeTab === tab ? '#fff' : Colors.textSecondary}
        />
        <Text style={[
          styles.tabButtonText,
          activeTab === tab && styles.tabButtonTextActive,
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderGeneralTab() {
    if (!organization) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Βασικές Πληροφορίες</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Επωνυμία Εταιρείας *</Text>
          <TextInput
            style={styles.input}
            value={organization.company_name}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, company_name: text } : null)}
            placeholder="Επωνυμία Εταιρείας"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Επωνυμία Απόδοσης</Text>
          <TextInput
            style={styles.input}
            value={organization.trading_name || ''}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, trading_name: text } : null)}
            placeholder="Επωνυμία Απόδοσης"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>ΑΦΜ (ΦΠΑ) *</Text>
          <TextInput
            style={styles.input}
            value={organization.vat_number}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, vat_number: text } : null)}
            placeholder="123456789"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>ΔΟΥ</Text>
          <TextInput
            style={styles.input}
            value={organization.doy || ''}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, doy: text } : null)}
            placeholder="ΔΟΥ"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>ΚΑΔ</Text>
          <TextInput
            style={styles.input}
            value={organization.activity_code || ''}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, activity_code: text } : null)}
            placeholder="Κωδικός Δραστηριότητας"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Αριθμός ΓΕΜΗ</Text>
          <TextInput
            style={styles.input}
            value={organization.registration_number || ''}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, registration_number: text } : null)}
            placeholder="Αριθμός ΓΕΜΗ"
          />
        </View>

        <Text style={styles.sectionTitle}>Στοιχεία Επικοινωνίας</Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Διεύθυνση Έδρας *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={organization.primary_address}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, primary_address: text } : null)}
            placeholder="Διεύθυνση Έδρας"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Κύριο Τηλέφωνο *</Text>
          <TextInput
            style={styles.input}
            value={organization.phone_primary}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, phone_primary: text } : null)}
            placeholder="2101234567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Κύριο Email *</Text>
          <TextInput
            style={styles.input}
            value={organization.email_primary}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, email_primary: text } : null)}
            placeholder="info@company.gr"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Ιστοσελίδα</Text>
          <TextInput
            style={styles.input}
            value={organization.website || ''}
            onChangeText={(text) => setOrganization(prev => prev ? { ...prev, website: text } : null)}
            placeholder="https://www.company.gr"
            keyboardType="url"
          />
        </View>
      </View>
    );
  }

  function renderBrandingTab() {
    if (!organization) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Χρώματα Επιχείρησης</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Κύριο Χρώμα</Text>
          <View style={styles.colorInputContainer}>
            <TextInput
              style={styles.colorInput}
              value={organization.brand_color_primary}
              onChangeText={(text) => setOrganization(prev => prev ? { ...prev, brand_color_primary: text } : null)}
              placeholder="#007AFF"
            />
            <View style={[styles.colorPreview, { backgroundColor: organization.brand_color_primary }]} />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Δευτερεύον Χρώμα</Text>
          <View style={styles.colorInputContainer}>
            <TextInput
              style={styles.colorInput}
              value={organization.brand_color_secondary}
              onChangeText={(text) => setOrganization(prev => prev ? { ...prev, brand_color_secondary: text } : null)}
              placeholder="#FFD700"
            />
            <View style={[styles.colorPreview, { backgroundColor: organization.brand_color_secondary }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Λογότυπο & Εικόνες</Text>

        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
          <Text style={styles.uploadButtonText}>Ανέβασμα Λογότυπου</Text>
          <Text style={styles.uploadButtonSubtext}>PNG, JPG (μέχρι 2MB)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
          <Text style={styles.uploadButtonText}>Ανέβασμα Εικονιδίου</Text>
          <Text style={styles.uploadButtonSubtext}>PNG (32x32px)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
          <Text style={styles.uploadButtonText}>Εικόνα Κεφαλίδας Συμβολαίων</Text>
          <Text style={styles.uploadButtonSubtext}>PNG, JPG (1200x300px)</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Όροι & Προϋποθέσεις</Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Όροι & Προϋποθέσεις</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings?.terms_and_conditions || ''}
            onChangeText={(text) => setSettings(prev => prev ? { ...prev, terms_and_conditions: text } : null)}
            placeholder="Όροι και προϋποθέσεις..."
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Πολιτική Απορρήτου</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings?.privacy_policy || ''}
            onChangeText={(text) => setSettings(prev => prev ? { ...prev, privacy_policy: text } : null)}
            placeholder="Πολιτική απορρήτου..."
            multiline
            numberOfLines={6}
          />
        </View>
      </View>
    );
  }

  function renderIntegrationsTab() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Ενσωματώσεις</Text>
        
        <SimpleGlassCard style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <Text style={styles.integrationTitle}>ΑΑΔΕ - Ψηφιακό Πελατολόγιο</Text>
          </View>
          <Text style={styles.integrationDescription}>
            Σύνδεση με το σύστημα της ΑΑΔΕ για την αυτόματη υποβολή συμβολαίων
          </Text>
          <View style={styles.integrationStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: organization?.aade_enabled ? Colors.success : Colors.textSecondary }
            ]} />
            <Text style={styles.statusText}>
              {organization?.aade_enabled ? 'Ενεργοποιημένη' : 'Απενεργοποιημένη'}
            </Text>
          </View>
          <TouchableOpacity style={styles.integrationButton}>
            <Text style={styles.integrationButtonText}>
              {organization?.aade_enabled ? 'Ρυθμίσεις' : 'Ενεργοποίηση'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </SimpleGlassCard>

        <SimpleGlassCard style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <Ionicons name="globe-outline" size={24} color={Colors.primary} />
            <Text style={styles.integrationTitle}>WordPress / WooCommerce</Text>
          </View>
          <Text style={styles.integrationDescription}>
            Εισαγωγή οχημάτων και κρατήσεων από την ιστοσελίδα σας
          </Text>
          <View style={styles.integrationStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: Colors.textSecondary }]} />
            <Text style={styles.statusText}>Δεν έχει ρυθμιστεί</Text>
          </View>
          <TouchableOpacity style={styles.integrationButton}>
            <Text style={styles.integrationButtonText}>Ρύθμιση</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </SimpleGlassCard>

        <SimpleGlassCard style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <Ionicons name="document-outline" size={24} color={Colors.primary} />
            <Text style={styles.integrationTitle}>XML Feed Import</Text>
          </View>
          <Text style={styles.integrationDescription}>
            Εισαγωγή οχημάτων από XML feed ή CSV αρχείο
          </Text>
          <View style={styles.integrationStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: Colors.textSecondary }]} />
            <Text style={styles.statusText}>Δεν έχει ρυθμιστεί</Text>
          </View>
          <TouchableOpacity style={styles.integrationButton}>
            <Text style={styles.integrationButtonText}>Ρύθμιση</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </SimpleGlassCard>

        <SimpleGlassCard style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <Ionicons name="business-outline" size={24} color={Colors.primary} />
            <Text style={styles.integrationTitle}>Wheelsys Migration</Text>
          </View>
          <Text style={styles.integrationDescription}>
            Μετάβαση από το σύστημα Wheelsys με εισαγωγή όλων των δεδομένων
          </Text>
          <View style={styles.integrationStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: Colors.textSecondary }]} />
            <Text style={styles.statusText}>Δεν έχει ρυθμιστεί</Text>
          </View>
          <TouchableOpacity style={styles.integrationButton}>
            <Text style={styles.integrationButtonText}>Ρύθμιση</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </SimpleGlassCard>
      </View>
    );
  }

  function renderNotificationsTab() {
    if (!settings) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Ειδοποιήσεις Email</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Ενεργοποίηση Email Ειδοποιήσεων</Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              settings.email_notifications_enabled && styles.toggleButtonActive,
            ]}
            onPress={() => setSettings(prev => prev ? {
              ...prev,
              email_notifications_enabled: !prev.email_notifications_enabled,
            } : null)}
          >
            <Text style={[
              styles.toggleButtonText,
              settings.email_notifications_enabled && styles.toggleButtonTextActive,
            ]}>
              {settings.email_notifications_enabled ? 'Ενεργοποιημένες' : 'Απενεργοποιημένες'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Όνομα Αποστολέα</Text>
          <TextInput
            style={styles.input}
            value={settings.email_from_name || ''}
            onChangeText={(text) => setSettings(prev => prev ? { ...prev, email_from_name: text } : null)}
            placeholder="π.χ. AGGELOS RENTALS"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Email Αποστολέα</Text>
          <TextInput
            style={styles.input}
            value={settings.email_from_address || ''}
            onChangeText={(text) => setSettings(prev => prev ? { ...prev, email_from_address: text } : null)}
            placeholder="noreply@aggelosrentals.gr"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Υπογραφή Email</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.email_signature || ''}
            onChangeText={(text) => setSettings(prev => prev ? { ...prev, email_signature: text } : null)}
            placeholder="Υπογραφή που θα εμφανίζεται στα emails..."
            multiline
            numberOfLines={4}
          />
        </View>

        <Text style={styles.sectionTitle}>Ειδοποιήσεις SMS</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Ενεργοποίηση SMS</Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              settings.sms_enabled && styles.toggleButtonActive,
            ]}
            onPress={() => setSettings(prev => prev ? {
              ...prev,
              sms_enabled: !prev.sms_enabled,
            } : null)}
          >
            <Text style={[
              styles.toggleButtonText,
              settings.sms_enabled && styles.toggleButtonTextActive,
            ]}>
              {settings.sms_enabled ? 'Ενεργοποιημένες' : 'Απενεργοποιημένες'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Πάροχος SMS</Text>
          <TextInput
            style={styles.input}
            value={settings.sms_provider || ''}
            onChangeText={(text) => setSettings(prev => prev ? { ...prev, sms_provider: text } : null)}
            placeholder="π.χ. Twilio, Viber"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>API Key SMS</Text>
          <TextInput
            style={styles.input}
            value={settings.sms_api_key || ''}
            onChangeText={(text) => setSettings(prev => prev ? { ...prev, sms_api_key: text } : null)}
            placeholder="API Key"
            secureTextEntry
          />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση δεδομένων...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!organization) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="business-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.loadingText}>Δεν βρέθηκε επιχείρηση</Text>
          <TouchableOpacity style={styles.setupButton} onPress={() => router.push('/business-onboarding')}>
            <Text style={styles.setupButtonText}>Ρύθμιση Επιχείρησης</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} {...smoothScrollConfig}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ρυθμίσεις Επιχείρησης</Text>
            <Text style={styles.headerSubtitle}>{organization.company_name}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveOrganizationData}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {renderTabButton('general', 'Γενικά', 'business-outline')}
          {renderTabButton('branding', 'Εικόνα', 'color-palette-outline')}
          {renderTabButton('integrations', 'Ενσωματώσεις', 'link-outline')}
          {renderTabButton('notifications', 'Ειδοποιήσεις', 'notifications-outline')}
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'branding' && renderBrandingTab()}
          {activeTab === 'integrations' && renderIntegrationsTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  setupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  setupButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    ...Shadows.sm,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  content: {
    padding: Spacing.md,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorInput: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  uploadButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  uploadButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  uploadButtonSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  integrationCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  integrationTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  integrationDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  integrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  integrationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  integrationButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});

