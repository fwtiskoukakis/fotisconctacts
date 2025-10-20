import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// @ts-ignore - vector icons types may be missing in this environment
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { WordPressIntegrationService, WordPressConfig, ImportMappingConfig, WooCommerceProduct } from '../services/wordpress-integration.service';
import { OrganizationService } from '../services/organization.service';
import { Integration } from '../models/multi-tenant.types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

export default function WordPressIntegrationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'setup' | 'mapping' | 'import' | 'history'>('setup');
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [importJobs, setImportJobs] = useState<any[]>([]);
  const [wooProducts, setWooProducts] = useState<WooCommerceProduct[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [config, setConfig] = useState<WordPressConfig>({
    url: '',
    username: '',
    password: '',
    consumerKey: '',
    consumerSecret: '',
    version: 'v3',
  });
  const [mapping, setMapping] = useState<ImportMappingConfig>({});
  const [importOptions, setImportOptions] = useState({
    updateExisting: false,
    skipDuplicates: true,
    category: '',
    branchId: '',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  async function loadIntegrationData() {
    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε επιχείρηση.');
        router.back();
        return;
      }

      const [integrationData, jobsData, mappingData] = await Promise.all([
        WordPressIntegrationService.getIntegration(organization.id),
        WordPressIntegrationService.getImportJobs(organization.id),
        WordPressIntegrationService.getImportMapping(organization.id),
      ]);

      setIntegration(integrationData);
      setImportJobs(jobsData);
      setMapping((mappingData as any)?.mapping_config || WordPressIntegrationService.getDefaultMappings());

      if (integrationData) {
        const configData = integrationData.config as WordPressConfig;
        setConfig(configData);
      }
    } catch (error) {
      console.error('Error loading integration data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης δεδομένων ολοκλήρωσης.');
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    if (!config.url || !config.consumerKey || !config.consumerSecret) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.');
      return;
    }

    setTestingConnection(true);
    try {
      const result = await WordPressIntegrationService.testConnection(config);
      if (result.success) {
        Alert.alert('Επιτυχία', 'Η σύνδεση με το WooCommerce είναι επιτυχής!');
      } else {
        Alert.alert('Σφάλμα', result.error || 'Αποτυχία σύνδεσης.');
      }
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης.');
    } finally {
      setTestingConnection(false);
    }
  }

  async function saveIntegration() {
    const validation = WordPressIntegrationService.validateConfig(config);
    if (!validation.isValid) {
      Alert.alert('Σφάλμα', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) return;

      if (integration) {
        await WordPressIntegrationService.updateIntegration(integration.id, config);
      } else {
        await WordPressIntegrationService.saveIntegration(organization.id, config);
      }

      Alert.alert('Επιτυχία', 'Η διαμόρφωση αποθηκεύτηκε επιτυχώς!');
      setShowConfigModal(false);
      loadIntegrationData();
    } catch (error) {
      console.error('Error saving integration:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης διαμόρφωσης.');
    } finally {
      setLoading(false);
    }
  }

  async function saveMapping() {
    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) return;

      await WordPressIntegrationService.saveImportMapping(organization.id, mapping);
      Alert.alert('Επιτυχία', 'Η διαμόρφωση mapping αποθηκεύτηκε επιτυχώς!');
      setShowMappingModal(false);
    } catch (error) {
      console.error('Error saving mapping:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης mapping.');
    } finally {
      setLoading(false);
    }
  }

  async function loadWooCommerceProducts() {
    if (!integration) {
      Alert.alert('Σφάλμα', 'Παρακαλώ διαμορφώστε πρώτα την ολοκλήρωση.');
      return;
    }

    setLoading(true);
    try {
      const products = await WordPressIntegrationService.getWooCommerceProducts(
        integration.config as WordPressConfig,
        1,
        50
      );
      setWooProducts(products);
      setActiveTab('import');
    } catch (error) {
      console.error('Error loading WooCommerce products:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης προϊόντων WooCommerce.');
    } finally {
      setLoading(false);
    }
  }

  async function startImport() {
    if (!integration) {
      Alert.alert('Σφάλμα', 'Δεν υπάρχει διαμορφωμένη ολοκλήρωση.');
      return;
    }

    setImporting(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) return;

      const result = await WordPressIntegrationService.importVehiclesFromWooCommerce(
        organization.id,
        integration.config as WordPressConfig,
        mapping,
        importOptions
      );

      if (result.success) {
        Alert.alert(
          'Επιτυχία',
          `Εισαγωγή ολοκληρώθηκε!\nΕισαγάγηκαν: ${result.imported}\nΠαραλείφθηκαν: ${result.skipped}\nΣφάλματα: ${result.errors.length}`
        );
        setShowImportModal(false);
        setActiveTab('history');
        loadIntegrationData();
      } else {
        Alert.alert('Σφάλμα', result.errors.join('\n'));
      }
    } catch (error) {
      console.error('Error importing vehicles:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία εισαγωγής οχημάτων.');
    } finally {
      setImporting(false);
    }
  }

  function renderSetupTab() {
    return (
      <View>
        {integration ? (
          <SimpleGlassCard style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.statusTitle}>Ολοκλήρωση Ενεργή</Text>
            </View>
            <Text style={styles.statusDescription}>
              Η ολοκλήρωση με το WooCommerce είναι διαμορφωμένη και ενεργή.
            </Text>
            <View style={styles.configDetails}>
              <Text style={styles.configLabel}>WordPress URL:</Text>
              <Text style={styles.configValue}>{config.url}</Text>
              <Text style={styles.configLabel}>Consumer Key:</Text>
              <Text style={styles.configValue}>{config.consumerKey ? '***' + config.consumerKey.slice(-4) : 'Δεν έχει οριστεί'}</Text>
              <Text style={styles.configLabel}>Consumer Secret:</Text>
              <Text style={styles.configValue}>{config.consumerSecret ? '***' + config.consumerSecret.slice(-4) : 'Δεν έχει οριστεί'}</Text>
            </View>
            <View style={styles.statusActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowConfigModal(true)}>
                <Ionicons name="settings" size={16} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Επεξεργασία</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={testConnection}>
                <Ionicons name="wifi" size={16} color={Colors.success} />
                <Text style={styles.actionButtonText}>Έλεγχος</Text>
              </TouchableOpacity>
            </View>
          </SimpleGlassCard>
        ) : (
          <SimpleGlassCard style={styles.setupCard}>
            <Ionicons name="add-circle-outline" size={48} color={Colors.primary} />
            <Text style={styles.setupTitle}>Διαμόρφωση WooCommerce</Text>
            <Text style={styles.setupDescription}>
              Διαμορφώστε την ολοκλήρωση με το WooCommerce για να εισάγετε προϊόντα ως οχήματα.
            </Text>
            <TouchableOpacity style={styles.setupButton} onPress={() => setShowConfigModal(true)}>
              <Ionicons name="settings" size={20} color="#fff" />
              <Text style={styles.setupButtonText}>Έναρξη Διαμόρφωσης</Text>
            </TouchableOpacity>
          </SimpleGlassCard>
        )}

        {/* Quick Actions */}
        <SimpleGlassCard style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Γρήγορες Ενέργειες</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionButton, !integration && styles.disabledButton]} 
              onPress={() => setActiveTab('mapping')}
              disabled={!integration}
            >
              <Ionicons name="swap-horizontal" size={24} color={integration ? Colors.warning : Colors.textSecondary} />
              <Text style={[styles.quickActionText, !integration && { color: Colors.textSecondary }]}>Mapping</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, !integration && styles.disabledButton]} 
              onPress={loadWooCommerceProducts}
              disabled={!integration}
            >
              <Ionicons name="download" size={24} color={integration ? Colors.success : Colors.textSecondary} />
              <Text style={[styles.quickActionText, !integration && { color: Colors.textSecondary }]}>Εισαγωγή</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => setActiveTab('history')}
            >
              <Ionicons name="time" size={24} color={Colors.info} />
              <Text style={styles.quickActionText}>Ιστορικό</Text>
            </TouchableOpacity>
          </View>
        </SimpleGlassCard>
      </View>
    );
  }

  function renderMappingTab() {
    const defaultMappings = WordPressIntegrationService.getDefaultMappings();
    const vehicleFields = [
      'license_plate', 'make', 'model', 'year', 'color', 'fuel_type', 
      'transmission', 'seats', 'doors', 'engine_size', 'mileage', 
      'daily_rate', 'status', 'description'
    ];

    return (
      <View>
        <SimpleGlassCard style={styles.mappingCard}>
          <Text style={styles.sectionTitle}>Field Mapping</Text>
          <Text style={styles.sectionDescription}>
            Ορίστε πώς τα πεδία του WooCommerce θα αντιστοιχιστούν στα πεδία των οχημάτων.
          </Text>
          
          <View style={styles.mappingContainer}>
            {vehicleFields.map((vehicleField) => (
              <View key={vehicleField} style={styles.mappingRow}>
                <Text style={styles.vehicleFieldLabel}>{vehicleField}</Text>
                <TextInput
                  style={styles.mappingInput}
                  value={mapping[vehicleField] || ''}
                  onChangeText={(text) => setMapping(prev => ({ ...prev, [vehicleField]: text }))}
                  placeholder="WooCommerce field"
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity
                  style={styles.suggestButton}
                  onPress={() => {
                    const suggestion = defaultMappings[vehicleField];
                    if (suggestion) {
                      setMapping(prev => ({ ...prev, [vehicleField]: suggestion }));
                    }
                  }}
                >
                  <Ionicons name="bulb" size={16} color={Colors.warning} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.mappingActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setMapping(defaultMappings)}>
              <Ionicons name="refresh" size={16} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Επαναφορά</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowMappingModal(true)}>
              <Ionicons name="save" size={16} color={Colors.success} />
              <Text style={styles.actionButtonText}>Αποθήκευση</Text>
            </TouchableOpacity>
          </View>
        </SimpleGlassCard>
      </View>
    );
  }

  function renderImportTab() {
    return (
      <View>
        <SimpleGlassCard style={styles.importCard}>
          <Text style={styles.sectionTitle}>Εισαγωγή Οχημάτων</Text>
          <Text style={styles.sectionDescription}>
            Εισάγετε οχήματα από τα προϊόντα του WooCommerce.
          </Text>

          {wooProducts.length > 0 && (
            <View style={styles.productsPreview}>
              <Text style={styles.previewTitle}>Προεπισκόπηση Προϊόντων ({wooProducts.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.productsList}>
                  {wooProducts.slice(0, 10).map((product) => (
                    <View key={product.id} style={styles.productPreview}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productPrice}>€{product.price}</Text>
                      <Text style={styles.productSku}>SKU: {product.sku}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={styles.importOptions}>
            <TouchableOpacity 
              style={[styles.optionRow, importOptions.updateExisting && styles.optionSelected]}
              onPress={() => setImportOptions(prev => ({ ...prev, updateExisting: !prev.updateExisting }))}
            >
              <Ionicons 
                name={importOptions.updateExisting ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={importOptions.updateExisting ? Colors.success : Colors.textSecondary} 
              />
              <Text style={styles.optionText}>Ενημέρωση υπαρχόντων οχημάτων</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionRow, importOptions.skipDuplicates && styles.optionSelected]}
              onPress={() => setImportOptions(prev => ({ ...prev, skipDuplicates: !prev.skipDuplicates }))}
            >
              <Ionicons 
                name={importOptions.skipDuplicates ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={importOptions.skipDuplicates ? Colors.success : Colors.textSecondary} 
              />
              <Text style={styles.optionText}>Παράλειψη διπλότυπων</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.importButton} onPress={() => setShowImportModal(true)}>
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.importButtonText}>Έναρξη Εισαγωγής</Text>
          </TouchableOpacity>
        </SimpleGlassCard>
      </View>
    );
  }

  function renderHistoryTab() {
    return (
      <View>
        {importJobs.length === 0 ? (
          <SimpleGlassCard style={styles.emptyCard}>
            <Ionicons name="time-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Δεν υπάρχει ιστορικό εισαγωγής</Text>
            <Text style={styles.emptyDescription}>Οι εισαγωγές θα εμφανιστούν εδώ</Text>
          </SimpleGlassCard>
        ) : (
          importJobs.map((job) => (
            <SimpleGlassCard key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>Εισαγωγή #{job.id}</Text>
                  <Text style={styles.jobDate}>
                    {format(new Date(job.started_at), 'dd/MM/yyyy HH:mm', { locale: el })}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: job.status === 'completed' ? Colors.success + '20' : 
                                    job.status === 'failed' ? Colors.error + '20' : Colors.warning + '20' }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: job.status === 'completed' ? Colors.success : 
                              job.status === 'failed' ? Colors.error : Colors.warning }
                  ]}>
                    {job.status === 'completed' ? 'Ολοκληρώθηκε' :
                     job.status === 'failed' ? 'Απέτυχε' : 'Σε Εξέλιξη'}
                  </Text>
                </View>
              </View>

              {job.result && (
                <View style={styles.jobResult}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Εισαγάγηκαν:</Text>
                    <Text style={styles.resultValue}>{job.result.imported}</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Παραλείφθηκαν:</Text>
                    <Text style={styles.resultValue}>{job.result.skipped}</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Σφάλματα:</Text>
                    <Text style={styles.resultValue}>{job.result.errors?.length || 0}</Text>
                  </View>
                </View>
              )}

              {job.error && (
                <Text style={styles.jobError}>{job.error}</Text>
              )}
            </SimpleGlassCard>
          ))
        )}
      </View>
    );
  }

  function renderConfigModal() {
    return (
      <Modal
        visible={showConfigModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowConfigModal(false)}>
              <Text style={styles.modalCancelButton}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Διαμόρφωση WooCommerce</Text>
            <TouchableOpacity onPress={saveIntegration} disabled={loading}>
              <Text style={[styles.modalSaveButton, loading && { opacity: 0.5 }]}>
                {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <SimpleGlassCard style={styles.modalCard}>
              <Text style={styles.modalSectionTitle}>Στοιχεία Σύνδεσης</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WordPress URL *</Text>
                <TextInput
                  style={styles.input}
                  value={config.url}
                  onChangeText={(text) => setConfig(prev => ({ ...prev, url: text }))}
                  placeholder="https://yourwebsite.com"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Consumer Key *</Text>
                <TextInput
                  style={styles.input}
                  value={config.consumerKey}
                  onChangeText={(text) => setConfig(prev => ({ ...prev, consumerKey: text }))}
                  placeholder="ck_..."
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Consumer Secret *</Text>
                <TextInput
                  style={styles.input}
                  value={config.consumerSecret}
                  onChangeText={(text) => setConfig(prev => ({ ...prev, consumerSecret: text }))}
                  placeholder="cs_..."
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="none"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={styles.testButton} 
                onPress={testConnection}
                disabled={testingConnection}
              >
                <Ionicons name="wifi" size={20} color="#fff" />
                <Text style={styles.testButtonText}>
                  {testingConnection ? 'Έλεγχος...' : 'Έλεγχος Σύνδεσης'}
                </Text>
              </TouchableOpacity>
            </SimpleGlassCard>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  function renderImportModal() {
    return (
      <Modal
        visible={showImportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowImportModal(false)}>
              <Text style={styles.modalCancelButton}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Εισαγωγή Οχημάτων</Text>
            <TouchableOpacity onPress={startImport} disabled={importing}>
              <Text style={[styles.modalSaveButton, importing && { opacity: 0.5 }]}>
                {importing ? 'Εισαγωγή...' : 'Εισαγωγή'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <SimpleGlassCard style={styles.modalCard}>
              <Text style={styles.modalSectionTitle}>Επιλογές Εισαγωγής</Text>
              
              <View style={styles.importSummary}>
                <Text style={styles.summaryText}>
                  Θα εισαχθούν <Text style={styles.summaryHighlight}>{wooProducts.length}</Text> προϊόντα από το WooCommerce
                </Text>
                <Text style={styles.summaryText}>
                  Χρησιμοποιείται mapping: <Text style={styles.summaryHighlight}>{Object.keys(mapping).length}</Text> πεδία
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.optionRow, importOptions.updateExisting && styles.optionSelected]}
                onPress={() => setImportOptions(prev => ({ ...prev, updateExisting: !prev.updateExisting }))}
              >
                <Ionicons 
                  name={importOptions.updateExisting ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={importOptions.updateExisting ? Colors.success : Colors.textSecondary} 
                />
                <Text style={styles.optionText}>Ενημέρωση υπαρχόντων οχημάτων</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionRow, importOptions.skipDuplicates && styles.optionSelected]}
                onPress={() => setImportOptions(prev => ({ ...prev, skipDuplicates: !prev.skipDuplicates }))}
              >
                <Ionicons 
                  name={importOptions.skipDuplicates ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={importOptions.skipDuplicates ? Colors.success : Colors.textSecondary} 
                />
                <Text style={styles.optionText}>Παράλειψη διπλότυπων</Text>
              </TouchableOpacity>
            </SimpleGlassCard>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  if (loading && !integration) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση ολοκλήρωσης WooCommerce...</Text>
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
            <Text style={styles.headerTitle}>WooCommerce Integration</Text>
            <Text style={styles.headerSubtitle}>Εισαγωγή οχημάτων από WooCommerce</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {[
                { value: 'setup', label: 'Διαμόρφωση', icon: 'settings' },
                { value: 'mapping', label: 'Mapping', icon: 'swap-horizontal' },
                { value: 'import', label: 'Εισαγωγή', icon: 'download' },
                { value: 'history', label: 'Ιστορικό', icon: 'time' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[
                    styles.tab,
                    activeTab === tab.value && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab.value as any)}
                >
                  <Ionicons 
                    name={tab.icon as any} 
                    size={16} 
                    color={activeTab === tab.value ? '#fff' : Colors.textSecondary} 
                  />
                  <Text style={[
                    styles.tabText,
                    activeTab === tab.value && styles.tabTextActive,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'setup' && renderSetupTab()}
          {activeTab === 'mapping' && renderMappingTab()}
          {activeTab === 'import' && renderImportTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </View>
      </ScrollView>

      {renderConfigModal()}
      {renderImportModal()}
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
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
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
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    padding: Spacing.md,
  },
  statusCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    ...Typography.title3,
    color: Colors.success,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  statusDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  configDetails: {
    marginBottom: Spacing.md,
  },
  configLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  configValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  statusActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  setupCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  setupTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  setupDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  setupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  setupButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  quickActionsCard: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  quickActionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  mappingCard: {
    padding: Spacing.md,
  },
  mappingContainer: {
    marginBottom: Spacing.md,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  vehicleFieldLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    minWidth: 120,
  },
  mappingInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  suggestButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mappingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  importCard: {
    padding: Spacing.md,
  },
  productsPreview: {
    marginBottom: Spacing.md,
  },
  previewTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  productsList: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  productPreview: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 150,
  },
  productName: {
    ...Typography.caption1,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  productPrice: {
    ...Typography.caption1,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  productSku: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  importOptions: {
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  optionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  optionText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  importButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  importButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  jobCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
  },
  jobDate: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
  },
  statusBadgeText: {
    ...Typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  jobResult: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  resultValue: {
    ...Typography.caption1,
    color: Colors.text,
    fontWeight: '600',
  },
  jobError: {
    ...Typography.caption1,
    color: Colors.error,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCancelButton: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
  },
  modalSaveButton: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  modalCard: {
    padding: Spacing.md,
  },
  modalSectionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.body,
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
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  testButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  testButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  importSummary: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
