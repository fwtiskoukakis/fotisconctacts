import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { supabase } from '../utils/supabase';
import { BusinessOnboardingData, BusinessOnboardingStep } from '../models/multi-tenant.types';

export default function BusinessOnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<BusinessOnboardingData>({
    businessType: 'small',
    businessDetails: {
      companyName: '',
      tradingName: '',
      vatNumber: '',
      doy: '',
      activityCode: '',
      registrationNumber: '',
    },
    contactLocation: {
      primaryAddress: '',
      phonePrimary: '',
      emailPrimary: '',
      branches: [],
    },
    branding: {
      brandColorPrimary: '#007AFF',
      brandColorSecondary: '#FFD700',
    },
    aadeIntegration: {
      enabled: false,
      testMode: true,
    },
    teamMembers: [],
    subscription: {
      plan: 'free',
    },
  });

  const [steps, setSteps] = useState<BusinessOnboardingStep[]>([
    {
      id: 'business-type',
      title: 'Τύπος Επιχείρησης',
      description: 'Επιλέξτε το μέγεθος της επιχείρησής σας',
      icon: 'business-outline',
      completed: false,
      required: true,
    },
    {
      id: 'business-details',
      title: 'Στοιχεία Επιχείρησης',
      description: 'Συμπληρώστε τα νομικά στοιχεία',
      icon: 'document-text-outline',
      completed: false,
      required: true,
    },
    {
      id: 'contact-location',
      title: 'Επικοινωνία & Τοποθεσία',
      description: 'Στοιχεία επικοινωνίας και διευθύνσεις',
      icon: 'location-outline',
      completed: false,
      required: true,
    },
    {
      id: 'branding',
      title: 'Εικόνα Επιχείρησης',
      description: 'Λογότυπο, χρώματα και προσωποποίηση',
      icon: 'color-palette-outline',
      completed: false,
      required: true,
    },
    {
      id: 'aade-integration',
      title: 'Σύνδεση ΑΑΔΕ',
      description: 'Ρύθμιση ψηφιακού πελατολογίου',
      icon: 'shield-checkmark-outline',
      completed: false,
      required: false,
    },
    {
      id: 'team-members',
      title: 'Ομάδα Εργασίας',
      description: 'Προσθήκη μελών της ομάδας',
      icon: 'people-outline',
      completed: false,
      required: true,
    },
    {
      id: 'import-data',
      title: 'Εισαγωγή Δεδομένων',
      description: 'Εισαγωγή υπαρχόντων δεδομένων',
      icon: 'cloud-upload-outline',
      completed: false,
      required: false,
    },
    {
      id: 'subscription',
      title: 'Συνδρομή',
      description: 'Επιλέξτε το πρόγραμμα σας',
      icon: 'card-outline',
      completed: false,
      required: true,
    },
    {
      id: 'quick-start',
      title: 'Έναρξη',
      description: 'Ολοκληρώστε τη ρύθμιση',
      icon: 'rocket-outline',
      completed: false,
      required: true,
    },
  ]);

  useEffect(() => {
    updateStepCompletion();
  }, [onboardingData]);

  function updateStepCompletion() {
    setSteps(prevSteps => prevSteps.map(step => {
      let completed = false;
      
      switch (step.id) {
        case 'business-type':
          completed = !!onboardingData.businessType;
          break;
        case 'business-details':
          completed = !!(
            onboardingData.businessDetails.companyName &&
            onboardingData.businessDetails.vatNumber
          );
          break;
        case 'contact-location':
          completed = !!(
            onboardingData.contactLocation.primaryAddress &&
            onboardingData.contactLocation.phonePrimary &&
            onboardingData.contactLocation.emailPrimary
          );
          break;
        case 'branding':
          completed = !!(
            onboardingData.branding.brandColorPrimary &&
            onboardingData.branding.brandColorSecondary
          );
          break;
        case 'aade-integration':
          completed = !onboardingData.aadeIntegration.enabled || 
            (!!onboardingData.aadeIntegration.aadeUserId && !!onboardingData.aadeIntegration.aadeSubscriptionKey);
          break;
        case 'team-members':
          completed = onboardingData.teamMembers.length > 0;
          break;
        case 'import-data':
          completed = true; // Optional step
          break;
        case 'subscription':
          completed = !!onboardingData.subscription.plan;
          break;
        case 'quick-start':
          completed = false; // Will be completed after creation
          break;
      }
      
      return { ...step, completed };
    }));
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function completeOnboarding() {
    setLoading(true);
    try {
      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          company_name: onboardingData.businessDetails.companyName,
          trading_name: onboardingData.businessDetails.tradingName,
          slug: generateSlug(onboardingData.businessDetails.companyName),
          vat_number: onboardingData.businessDetails.vatNumber,
          doy: onboardingData.businessDetails.doy,
          activity_code: onboardingData.businessDetails.activityCode,
          registration_number: onboardingData.businessDetails.registrationNumber,
          primary_address: onboardingData.contactLocation.primaryAddress,
          phone_primary: onboardingData.contactLocation.phonePrimary,
          email_primary: onboardingData.contactLocation.emailPrimary,
          business_type: onboardingData.businessType,
          brand_color_primary: onboardingData.branding.brandColorPrimary,
          brand_color_secondary: onboardingData.branding.brandColorSecondary,
          aade_enabled: onboardingData.aadeIntegration.enabled,
          aade_test_mode: onboardingData.aadeIntegration.testMode,
          subscription_plan: onboardingData.subscription.plan,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create organization settings
      await supabase.from('organization_settings').insert({
        organization_id: organization.id,
        contract_prefix: 'CNT',
        contract_number_start: 1000,
      });

      // Create primary branch
      if (onboardingData.contactLocation.branches.length > 0) {
        await supabase.from('branches').insert({
          organization_id: organization.id,
          name: 'Κεντρικό',
          address: onboardingData.contactLocation.primaryAddress,
          is_primary: true,
        });
      }

      // Update current user with organization
      const { error: userError } = await supabase
        .from('users')
        .update({
          organization_id: organization.id,
          role: 'owner',
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (userError) throw userError;

      Alert.alert(
        'Επιτυχία!',
        'Η επιχείρησή σας δημιουργήθηκε επιτυχώς! Καλώς ήρθατε στο AGGELOS RENTALS.',
        [
          {
            text: 'Συνέχεια',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία δημιουργίας επιχείρησης. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return renderBusinessTypeStep();
      case 1:
        return renderBusinessDetailsStep();
      case 2:
        return renderContactLocationStep();
      case 3:
        return renderBrandingStep();
      case 4:
        return renderAADEIntegrationStep();
      case 5:
        return renderTeamMembersStep();
      case 6:
        return renderImportDataStep();
      case 7:
        return renderSubscriptionStep();
      case 8:
        return renderQuickStartStep();
      default:
        return null;
    }
  }

  function renderBusinessTypeStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Επιλέξτε τον τύπο επιχείρησής σας</Text>
        <Text style={styles.stepDescription}>
          Αυτό θα μας βοηθήσει να προσαρμόσουμε τις δυνατότητες για τις ανάγκες σας
        </Text>
        
        <View style={styles.optionsContainer}>
          {[
            { type: 'small', title: 'Μικρή Επιχείρηση', description: '1-5 οχήματα', icon: 'car-outline' },
            { type: 'medium', title: 'Μεσαία Επιχείρηση', description: '6-20 οχήματα', icon: 'business-outline' },
            { type: 'large', title: 'Μεγάλη Επιχείρηση', description: '21+ οχήματα', icon: 'storefront-outline' },
          ].map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                onboardingData.businessType === option.type && styles.optionCardSelected,
              ]}
              onPress={() => setOnboardingData(prev => ({
                ...prev,
                businessType: option.type as any,
              }))}
            >
              <Ionicons
                name={option.icon as any}
                size={32}
                color={onboardingData.businessType === option.type ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[
                styles.optionTitle,
                onboardingData.businessType === option.type && styles.optionTitleSelected,
              ]}>
                {option.title}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderBusinessDetailsStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Στοιχεία Επιχείρησης</Text>
        <Text style={styles.stepDescription}>
          Συμπληρώστε τα νομικά στοιχεία της επιχείρησής σας
        </Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Επωνυμία Εταιρείας *</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.businessDetails.companyName}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                businessDetails: { ...prev.businessDetails, companyName: text },
              }))}
              placeholder="π.χ. ΑΓΓΕΛΟΣ RENTALS Α.Ε."
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Επωνυμία Απόδοσης</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.businessDetails.tradingName}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                businessDetails: { ...prev.businessDetails, tradingName: text },
              }))}
              placeholder="π.χ. Aggelos Rentals"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ΑΦΜ (ΦΠΑ) *</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.businessDetails.vatNumber}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                businessDetails: { ...prev.businessDetails, vatNumber: text },
              }))}
              placeholder="123456789"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ΔΟΥ</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.businessDetails.doy}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                businessDetails: { ...prev.businessDetails, doy: text },
              }))}
              placeholder="π.χ. Α' ΑΘΗΝΩΝ"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ΚΑΔ (Κωδικός Δραστηριότητας)</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.businessDetails.activityCode}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                businessDetails: { ...prev.businessDetails, activityCode: text },
              }))}
              placeholder="π.χ. 77.11.10.01"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Αριθμός ΓΕΜΗ</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.businessDetails.registrationNumber}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                businessDetails: { ...prev.businessDetails, registrationNumber: text },
              }))}
              placeholder="π.χ. 123456789"
            />
          </View>
        </View>
      </View>
    );
  }

  function renderContactLocationStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Επικοινωνία & Τοποθεσία</Text>
        <Text style={styles.stepDescription}>
          Στοιχεία επικοινωνίας και διευθύνσεις επιχείρησης
        </Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Διεύθυνση Έδρας *</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.contactLocation.primaryAddress}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                contactLocation: { ...prev.contactLocation, primaryAddress: text },
              }))}
              placeholder="Οδός, Αριθμός, ΤΚ, Πόλη"
              multiline
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Κύριο Τηλέφωνο *</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.contactLocation.phonePrimary}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                contactLocation: { ...prev.contactLocation, phonePrimary: text },
              }))}
              placeholder="2101234567"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Κύριο Email *</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.contactLocation.emailPrimary}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                contactLocation: { ...prev.contactLocation, emailPrimary: text },
              }))}
              placeholder="info@aggelosrentals.gr"
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ιστοσελίδα</Text>
            <TextInput
              style={styles.input}
              value={onboardingData.contactLocation.website}
              onChangeText={(text) => setOnboardingData(prev => ({
                ...prev,
                contactLocation: { ...prev.contactLocation, website: text },
              }))}
              placeholder="https://www.aggelosrentals.gr"
              keyboardType="url"
            />
          </View>
        </View>
      </View>
    );
  }

  function renderBrandingStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Εικόνα Επιχείρησης</Text>
        <Text style={styles.stepDescription}>
          Ρυθμίστε τα χρώματα και την εικόνα της επιχείρησής σας
        </Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Κύριο Χρώμα</Text>
            <View style={styles.colorInputContainer}>
              <TextInput
                style={styles.colorInput}
                value={onboardingData.branding.brandColorPrimary}
                onChangeText={(text) => setOnboardingData(prev => ({
                  ...prev,
                  branding: { ...prev.branding, brandColorPrimary: text },
                }))}
                placeholder="#007AFF"
              />
              <View style={[styles.colorPreview, { backgroundColor: onboardingData.branding.brandColorPrimary }]} />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Δευτερεύον Χρώμα</Text>
            <View style={styles.colorInputContainer}>
              <TextInput
                style={styles.colorInput}
                value={onboardingData.branding.brandColorSecondary}
                onChangeText={(text) => setOnboardingData(prev => ({
                  ...prev,
                  branding: { ...prev.branding, brandColorSecondary: text },
                }))}
                placeholder="#FFD700"
              />
              <View style={[styles.colorPreview, { backgroundColor: onboardingData.branding.brandColorSecondary }]} />
            </View>
          </View>
          
          <TouchableOpacity style={styles.uploadButton}>
            <Ionicons name="cloud-upload-outline" size={24} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Ανέβασμα Λογότυπου</Text>
            <Text style={styles.uploadButtonSubtext}>PNG, JPG (μέχρι 2MB)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderAADEIntegrationStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Σύνδεση ΑΑΔΕ</Text>
        <Text style={styles.stepDescription}>
          Ρυθμίστε τη σύνδεση με το ψηφιακό πελατολόγιο της ΑΑΔΕ
        </Text>
        
        <View style={styles.formContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              onboardingData.aadeIntegration.enabled && styles.toggleButtonActive,
            ]}
            onPress={() => setOnboardingData(prev => ({
              ...prev,
              aadeIntegration: { ...prev.aadeIntegration, enabled: !prev.aadeIntegration.enabled },
            }))}
          >
            <Text style={[
              styles.toggleButtonText,
              onboardingData.aadeIntegration.enabled && styles.toggleButtonTextActive,
            ]}>
              {onboardingData.aadeIntegration.enabled ? 'Ενεργοποιημένη' : 'Απενεργοποιημένη'}
            </Text>
          </TouchableOpacity>
          
          {onboardingData.aadeIntegration.enabled && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AADE User ID</Text>
                <TextInput
                  style={styles.input}
                  value={onboardingData.aadeIntegration.aadeUserId}
                  onChangeText={(text) => setOnboardingData(prev => ({
                    ...prev,
                    aadeIntegration: { ...prev.aadeIntegration, aadeUserId: text },
                  }))}
                  placeholder="AADE User ID"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AADE Subscription Key</Text>
                <TextInput
                  style={styles.input}
                  value={onboardingData.aadeIntegration.aadeSubscriptionKey}
                  onChangeText={(text) => setOnboardingData(prev => ({
                    ...prev,
                    aadeIntegration: { ...prev.aadeIntegration, aadeSubscriptionKey: text },
                  }))}
                  placeholder="AADE Subscription Key"
                  secureTextEntry
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  onboardingData.aadeIntegration.testMode && styles.toggleButtonActive,
                ]}
                onPress={() => setOnboardingData(prev => ({
                  ...prev,
                  aadeIntegration: { ...prev.aadeIntegration, testMode: !prev.aadeIntegration.testMode },
                }))}
              >
                <Text style={[
                  styles.toggleButtonText,
                  onboardingData.aadeIntegration.testMode && styles.toggleButtonTextActive,
                ]}>
                  {onboardingData.aadeIntegration.testMode ? 'Λειτουργία Δοκιμής' : 'Λειτουργία Παραγωγής'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  function renderTeamMembersStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Ομάδα Εργασίας</Text>
        <Text style={styles.stepDescription}>
          Προσθέστε τα μέλη της ομάδας σας
        </Text>
        
        <View style={styles.formContainer}>
          {onboardingData.teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMemberCard}>
              <Text style={styles.teamMemberTitle}>Μέλος {index + 1}</Text>
              <TextInput
                style={styles.input}
                value={member.name}
                onChangeText={(text) => {
                  const newMembers = [...onboardingData.teamMembers];
                  newMembers[index] = { ...member, name: text };
                  setOnboardingData(prev => ({ ...prev, teamMembers: newMembers }));
                }}
                placeholder="Όνομα"
              />
              <TextInput
                style={styles.input}
                value={member.email}
                onChangeText={(text) => {
                  const newMembers = [...onboardingData.teamMembers];
                  newMembers[index] = { ...member, email: text };
                  setOnboardingData(prev => ({ ...prev, teamMembers: newMembers }));
                }}
                placeholder="Email"
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  const newMembers = onboardingData.teamMembers.filter((_, i) => i !== index);
                  setOnboardingData(prev => ({ ...prev, teamMembers: newMembers }));
                }}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setOnboardingData(prev => ({
              ...prev,
              teamMembers: [...prev.teamMembers, {
                name: '',
                email: '',
                role: 'agent',
              }],
            }))}
          >
            <Ionicons name="add-outline" size={24} color={Colors.primary} />
            <Text style={styles.addButtonText}>Προσθήκη Μελών</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderImportDataStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Εισαγωγή Δεδομένων</Text>
        <Text style={styles.stepDescription}>
          Εισαγάγετε υπαρχόντων δεδομένων από άλλα συστήματα
        </Text>
        
        <View style={styles.importOptionsContainer}>
          {[
            { type: 'wordpress', title: 'WordPress/WooCommerce', description: 'Εισαγωγή οχημάτων από ιστοσελίδα', icon: 'globe-outline' },
            { type: 'xml', title: 'XML Feed', description: 'Εισαγωγή από XML αρχείο', icon: 'document-outline' },
            { type: 'csv', title: 'CSV File', description: 'Εισαγωγή από CSV αρχείο', icon: 'table-outline' },
            { type: 'manual', title: 'Χειροκίνητα', description: 'Εισαγωγή δεδομένων χειροκίνητα', icon: 'create-outline' },
          ].map((option) => (
            <TouchableOpacity key={option.type} style={styles.importOption}>
              <Ionicons name={option.icon as any} size={32} color={Colors.primary} />
              <Text style={styles.importOptionTitle}>{option.title}</Text>
              <Text style={styles.importOptionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.skipText}>
          Μπορείτε να παραλείψετε αυτό το βήμα και να προσθέσετε δεδομένα αργότερα
        </Text>
      </View>
    );
  }

  function renderSubscriptionStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Επιλέξτε το Πρόγραμμα σας</Text>
        <Text style={styles.stepDescription}>
          Ξεκινήστε με δωρεάν δοκιμή 30 ημερών
        </Text>
        
        <View style={styles.subscriptionOptionsContainer}>
          {[
            { plan: 'free', title: 'Δωρεάν', price: '€0', description: 'Έως 5 οχήματα, βασικές δυνατότητες', features: ['Έως 5 οχήματα', 'Βασικά συμβόλαια', 'Απλές αναφορές'] },
            { plan: 'basic', title: 'Βασικό', price: '€29', description: 'Έως 20 οχήματα, πλήρες σύστημα', features: ['Έως 20 οχήματα', 'Πλήρες σύστημα', 'ΑΑΔΕ ενσωμάτωση', 'Email/SMS'] },
            { plan: 'pro', title: 'Επαγγελματικό', price: '€59', description: 'Άπειρα οχήματα, προηγμένες δυνατότητες', features: ['Άπειρα οχήματα', 'Προηγμένες αναφορές', 'Ενσωματώσεις', 'Πολλαπλές τοποθεσίες'] },
          ].map((option) => (
            <TouchableOpacity
              key={option.plan}
              style={[
                styles.subscriptionOption,
                onboardingData.subscription.plan === option.plan && styles.subscriptionOptionSelected,
              ]}
              onPress={() => setOnboardingData(prev => ({
                ...prev,
                subscription: { ...prev.subscription, plan: option.plan as any },
              }))}
            >
              <Text style={[
                styles.subscriptionTitle,
                onboardingData.subscription.plan === option.plan && styles.subscriptionTitleSelected,
              ]}>
                {option.title}
              </Text>
              <Text style={[
                styles.subscriptionPrice,
                onboardingData.subscription.plan === option.plan && styles.subscriptionPriceSelected,
              ]}>
                {option.price}/μήνα
              </Text>
              <Text style={styles.subscriptionDescription}>{option.description}</Text>
              <View style={styles.featuresContainer}>
                {option.features.map((feature, index) => (
                  <Text key={index} style={styles.featureText}>• {feature}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderQuickStartStep() {
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.filter(step => step.required).length;
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Έτοιμοι να ξεκινήσουμε;</Text>
        <Text style={styles.stepDescription}>
          Ολοκληρώσατε {completedSteps} από {totalSteps} απαιτούμενα βήματα
        </Text>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Σύνοψη Ρυθμίσεων:</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Επιχείρηση:</Text>
            <Text style={styles.summaryValue}>{onboardingData.businessDetails.companyName}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>ΑΦΜ:</Text>
            <Text style={styles.summaryValue}>{onboardingData.businessDetails.vatNumber}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Τύπος:</Text>
            <Text style={styles.summaryValue}>
              {onboardingData.businessType === 'small' ? 'Μικρή' : 
               onboardingData.businessType === 'medium' ? 'Μεσαία' : 'Μεγάλη'} Επιχείρηση
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Πρόγραμμα:</Text>
            <Text style={styles.summaryValue}>
              {onboardingData.subscription.plan === 'free' ? 'Δωρεάν' :
               onboardingData.subscription.plan === 'basic' ? 'Βασικό' : 'Επαγγελματικό'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>ΑΑΔΕ:</Text>
            <Text style={styles.summaryValue}>
              {onboardingData.aadeIntegration.enabled ? 'Ενεργοποιημένη' : 'Απενεργοποιημένη'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.completeButton, loading && styles.completeButtonDisabled]}
          onPress={completeOnboarding}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="rocket-outline" size={24} color="#fff" />
              <Text style={styles.completeButtonText}>Δημιουργία Επιχείρησης</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
            <Text style={styles.headerTitle}>Ρύθμιση Επιχείρησης</Text>
            <Text style={styles.headerSubtitle}>
              Βήμα {currentStep + 1} από {steps.length}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Ολοκληρώθηκε
          </Text>
        </View>

        {/* Steps Navigation */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepIndicator,
                index === currentStep && styles.stepIndicatorActive,
                step.completed && styles.stepIndicatorCompleted,
                index < currentStep && styles.stepIndicatorPast,
              ]}
              onPress={() => setCurrentStep(index)}
            >
              <Ionicons
                name={step.completed ? 'checkmark' : (step.icon as any)}
                size={16}
                color={
                  step.completed ? '#fff' :
                  index === currentStep ? Colors.primary :
                  index < currentStep ? Colors.primary :
                  Colors.textSecondary
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Step */}
        <SimpleGlassCard style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Ionicons name={steps[currentStep].icon as any} size={32} color={Colors.primary} />
            <View style={styles.stepHeaderText}>
              <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
              <Text style={styles.stepDescription}>{steps[currentStep].description}</Text>
            </View>
          </View>
          
          {renderStepContent()}
        </SimpleGlassCard>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color={Colors.primary} />
              <Text style={styles.prevButtonText}>Προηγούμενο</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < steps.length - 1 ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                !steps[currentStep].completed && steps[currentStep].required && styles.nextButtonDisabled,
              ]}
              onPress={nextStep}
              disabled={!steps[currentStep].completed && steps[currentStep].required}
            >
              <Text style={styles.nextButtonText}>Επόμενο</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, loading && styles.nextButtonDisabled]}
              onPress={completeOnboarding}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Ολοκλήρωση</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
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
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepIndicatorActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepIndicatorCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepIndicatorPast: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  stepCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stepHeaderText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  stepTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  formContainer: {
    gap: Spacing.md,
  },
  inputGroup: {
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
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  optionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  optionTitleSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
  teamMemberCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  teamMemberTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
  },
  addButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  addButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  importOptionsContainer: {
    gap: Spacing.md,
  },
  importOption: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  importOptionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  importOptionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  skipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  subscriptionOptionsContainer: {
    gap: Spacing.md,
  },
  subscriptionOption: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  subscriptionOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  subscriptionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  subscriptionTitleSelected: {
    color: Colors.primary,
  },
  subscriptionPrice: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  subscriptionPriceSelected: {
    color: Colors.primary,
  },
  subscriptionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  featuresContainer: {
    marginTop: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 4,
  },
  summaryContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  completeButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  completeButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '700',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  prevButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  nextButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '700',
  },
});


