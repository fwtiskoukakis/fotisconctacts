import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { Breadcrumb } from '../components/breadcrumb';
import { AuthService } from '../services/auth.service';
import { supabase } from '../utils/supabase';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface AADESettings {
  aadeUserId: string;
  aadeSubscriptionKey: string;
  companyVatNumber: string;
  companyName: string;
  companyAddress: string;
  companyActivity: string;
  aadeEnabled: boolean;
}

/**
 * AADE Settings Screen
 * Allows users to configure their AADE myDATA integration credentials
 */
export default function AADESettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AADESettings>({
    aadeUserId: '',
    aadeSubscriptionKey: '',
    companyVatNumber: '',
    companyName: '',
    companyAddress: '',
    companyActivity: '',
    aadeEnabled: false,
  });

  const [showKeys, setShowKeys] = useState({
    userId: false,
    subscriptionKey: false,
  });

  useEffect(() => {
    loadAADESettings();
  }, []);

  async function loadAADESettings() {
    try {
      setLoading(true);
      const user = await AuthService.getCurrentUser();
      
      if (user) {
        setUserId(user.id);
        const profile = await AuthService.getUserProfile(user.id);
        
        if (profile) {
          setSettings({
            aadeUserId: profile.aade_user_id || '',
            aadeSubscriptionKey: profile.aade_subscription_key || '',
            companyVatNumber: profile.company_vat_number || '',
            companyName: profile.company_name || '',
            companyAddress: profile.company_address || '',
            companyActivity: profile.company_activity || '',
            aadeEnabled: profile.aade_enabled || false,
          });
        }
      }
    } catch (error) {
      console.error('Error loading AADE settings:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης ρυθμίσεων ΑΑΔΕ');
    } finally {
      setLoading(false);
    }
  }

  async function saveAADESettings() {
    if (!userId) {
      Alert.alert('Σφάλμα', 'Δεν βρέθηκε χρήστης');
      return;
    }

    // Validate required fields if AADE is enabled
    if (settings.aadeEnabled) {
      if (!settings.aadeUserId || !settings.aadeSubscriptionKey || !settings.companyVatNumber) {
        Alert.alert(
          'Ελλιπή Στοιχεία',
          'Παρακαλώ συμπληρώστε τα υποχρεωτικά πεδία: AADE User ID, Subscription Key και ΑΦΜ'
        );
        return;
      }

      // Validate VAT number format (9 digits)
      if (!/^\d{9}$/.test(settings.companyVatNumber)) {
        Alert.alert('Λάθος ΑΦΜ', 'Το ΑΦΜ πρέπει να αποτελείται από 9 ψηφία');
        return;
      }
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('users')
        .update({
          aade_user_id: settings.aadeUserId || null,
          aade_subscription_key: settings.aadeSubscriptionKey || null,
          company_vat_number: settings.companyVatNumber || null,
          company_name: settings.companyName || null,
          company_address: settings.companyAddress || null,
          company_activity: settings.companyActivity || null,
          aade_enabled: settings.aadeEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Επιτυχία',
        'Οι ρυθμίσεις ΑΑΔΕ αποθηκεύτηκαν επιτυχώς',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving AADE settings:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης ρυθμίσεων ΑΑΔΕ');
    } finally {
      setSaving(false);
    }
  }

  async function testAADEConnection() {
    if (!settings.aadeUserId || !settings.aadeSubscriptionKey) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε το AADE User ID και το Subscription Key');
      return;
    }

    Alert.alert(
      'Δοκιμή Σύνδεσης',
      'Η δοκιμή σύνδεσης με το AADE θα υλοποιηθεί σύντομα',
      [{ text: 'OK' }]
    );
  }

  function updateSetting(key: keyof AADESettings, value: string | boolean) {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Ρυθμίσεις ΑΑΔΕ" showBackButton onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Ρυθμίσεις ΑΑΔΕ" showBackButton onBackPress={() => router.back()} />
      
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Αρχική', path: '/' },
          { label: 'Ρυθμίσεις', path: '/settings' },
          { label: 'Ψηφιακό Πελατολόγιο' },
        ]}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, Glassmorphism.info]}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Σχετικά με το Ψηφιακό Πελατολόγιο</Text>
            <Text style={styles.infoText}>
              Η ενσωμάτωση με το Ψηφιακό Πελατολόγιο (Digital Client Registry) της ΑΑΔΕ σας επιτρέπει να υποβάλλετε αυτόματα τα στοιχεία των ενοικιάσεων σας.
            </Text>
          </View>
        </View>

        {/* Enable AADE Toggle */}
        <View style={[styles.section, Glassmorphism.light]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Ενεργοποίηση Ψηφιακού Πελατολογίου</Text>
              <Text style={styles.toggleSubtitle}>
                Ενεργοποιήστε την αυτόματη υποβολή στο Digital Client Registry
              </Text>
            </View>
            <Switch
              value={settings.aadeEnabled}
              onValueChange={(value) => updateSetting('aadeEnabled', value)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={settings.aadeEnabled ? '#FFFFFF' : Colors.textSecondary}
            />
          </View>
        </View>

        {/* Digital Client Registry Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Διαπιστευτήρια Ψηφιακού Πελατολογίου</Text>
          
          <View style={[styles.inputCard, Glassmorphism.light]}>
            <Text style={styles.inputLabel}>AADE User ID *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={settings.aadeUserId}
                onChangeText={(value) => updateSetting('aadeUserId', value)}
                placeholder="Εισάγετε το AADE User ID"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showKeys.userId}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowKeys(prev => ({ ...prev, userId: !prev.userId }))}
              >
                <Text style={styles.eyeIcon}>{showKeys.userId ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inputCard, Glassmorphism.light]}>
            <Text style={styles.inputLabel}>AADE Subscription Key *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={settings.aadeSubscriptionKey}
                onChangeText={(value) => updateSetting('aadeSubscriptionKey', value)}
                placeholder="Εισάγετε το Subscription Key"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showKeys.subscriptionKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowKeys(prev => ({ ...prev, subscriptionKey: !prev.subscriptionKey }))}
              >
                <Text style={styles.eyeIcon}>{showKeys.subscriptionKey ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Στοιχεία Επιχείρησης</Text>
          
          <View style={[styles.inputCard, Glassmorphism.light]}>
            <Text style={styles.inputLabel}>ΑΦΜ (VAT Number) *</Text>
            <TextInput
              style={styles.input}
              value={settings.companyVatNumber}
              onChangeText={(value) => updateSetting('companyVatNumber', value.replace(/\D/g, ''))}
              placeholder="123456789"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numeric"
              maxLength={9}
            />
            <Text style={styles.inputHint}>9 ψηφία</Text>
          </View>

          <View style={[styles.inputCard, Glassmorphism.light]}>
            <Text style={styles.inputLabel}>Επωνυμία Επιχείρησης</Text>
            <TextInput
              style={styles.input}
              value={settings.companyName}
              onChangeText={(value) => updateSetting('companyName', value)}
              placeholder="π.χ. AGGELOS RENTALS ΙΚΕ"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={[styles.inputCard, Glassmorphism.light]}>
            <Text style={styles.inputLabel}>Διεύθυνση Επιχείρησης</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings.companyAddress}
              onChangeText={(value) => updateSetting('companyAddress', value)}
              placeholder="π.χ. Λεωφ. Συγγρού 123, Αθήνα 11745"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={[styles.inputCard, Glassmorphism.light]}>
            <Text style={styles.inputLabel}>Δραστηριότητα Επιχείρησης</Text>
            <TextInput
              style={styles.input}
              value={settings.companyActivity}
              onChangeText={(value) => updateSetting('companyActivity', value)}
              placeholder="π.χ. Ενοικίαση Αυτοκινήτων"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        {/* Test Connection Button */}
        <TouchableOpacity
          style={[styles.testButton, Glassmorphism.light]}
          onPress={testAADEConnection}
          disabled={!settings.aadeUserId || !settings.aadeSubscriptionKey}
        >
          <Text style={styles.testButtonIcon}>🔌</Text>
          <Text style={styles.testButtonText}>Δοκιμή Σύνδεσης ΑΑΔΕ</Text>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Πού μπορώ να βρω αυτά τα στοιχεία;</Text>
          <Text style={styles.helpText}>
            • Εγγραφείτε στο AADE Developer Portal: https://mydata-dev-register.azurewebsites.net{'\n'}
            • Συνδεθείτε στο Digital Client Registry API Portal{'\n'}
            • Θα βρείτε το User ID (aade-user-id) και το Subscription Key (ocp-apim-subscription-key){'\n'}
            • Το ΑΦΜ είναι ο φορολογικός σας αριθμός μητρώου (9 ψηφία){'\n'}
            • Base URL Production: https://mydatapi.aade.gr/DCL/{'\n'}
            • Base URL Development: https://mydataapidev.aade.gr/DCL/
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveAADESettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Αποθήκευση Ρυθμίσεων</Text>
          )}
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  inputCard: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  inputLabel: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    padding: Spacing.xs,
  },
  eyeIcon: {
    fontSize: 20,
  },
  inputHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  testButtonIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  testButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  helpSection: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  helpTitle: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  helpText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

