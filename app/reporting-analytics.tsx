import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { ReportingService, ReportData, DashboardData, ChartData } from '../services/reporting.service';
import { OrganizationService } from '../services/organization.service';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

const { width: screenWidth } = Dimensions.get('window');

export default function ReportingAnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'templates'>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [savedReports, setSavedReports] = useState<ReportData[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    branchId: '',
    category: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε επιχείρηση.');
        router.back();
        return;
      }

      if (activeTab === 'dashboard') {
        const dashboard = await ReportingService.getDashboardData(organization.id);
        setDashboardData(dashboard);
      } else if (activeTab === 'reports') {
        const reports = await ReportingService.getSavedReports(organization.id);
        setSavedReports(reports);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης αναλυτικών δεδομένων.');
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    if (!selectedReportType) {
      Alert.alert('Σφάλμα', 'Παρακαλώ επιλέξτε τύπο αναφοράς.');
      return;
    }

    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) return;

      const report = await ReportingService.generateBusinessReport(
        organization.id,
        selectedReportType,
        reportFilters
      );

      Alert.alert('Επιτυχία', 'Η αναφορά δημιουργήθηκε επιτυχώς!');
      setShowGenerateModal(false);
      setSelectedReportType('');
      setReportFilters({ startDate: '', endDate: '', branchId: '', category: '' });
      
      if (activeTab === 'reports') {
        loadDashboardData(); // Reload to show new report
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία δημιουργίας αναφοράς.');
    } finally {
      setLoading(false);
    }
  }

  function renderKPICard(kpi: any) {
    return (
      <SimpleGlassCard key={kpi.id} style={styles.kpiCard}>
        <View style={styles.kpiHeader}>
          <Text style={styles.kpiTitle}>{kpi.title}</Text>
          <View style={[styles.kpiTrend, { backgroundColor: kpi.trend.startsWith('+') ? Colors.success + '20' : Colors.error + '20' }]}>
            <Text style={[styles.kpiTrendText, { color: kpi.trend.startsWith('+') ? Colors.success : Colors.error }]}>
              {kpi.trend}
            </Text>
          </View>
        </View>
        <Text style={styles.kpiValue}>
          {kpi.value.toLocaleString()}{kpi.unit}
        </Text>
      </SimpleGlassCard>
    );
  }

  function renderChart(chartData: ChartData, title: string) {
    if (!chartData.labels.length) {
      return (
        <SimpleGlassCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.emptyChart}>Δεν υπάρχουν δεδομένα</Text>
        </SimpleGlassCard>
      );
    }

    return (
      <SimpleGlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartContainer}>
          {/* Simple bar chart representation */}
          <View style={styles.barChart}>
            {chartData.labels.map((label, index) => (
              <View key={label} style={styles.barItem}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: Math.max(20, (chartData.datasets[0].data[index] / Math.max(...chartData.datasets[0].data)) * 100),
                        backgroundColor: chartData.datasets[0].color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{label}</Text>
                <Text style={styles.barValue}>{chartData.datasets[0].data[index]}</Text>
              </View>
            ))}
          </View>
        </View>
      </SimpleGlassCard>
    );
  }

  function renderDashboardTab() {
    if (!dashboardData) return null;

    return (
      <View>
        {/* KPIs */}
        <View style={styles.kpisContainer}>
          {dashboardData.kpis.map(renderKPICard)}
        </View>

        {/* Charts */}
        <View style={styles.chartsContainer}>
          {dashboardData.widgets.map((widget) => (
            <View key={widget.id} style={styles.widgetContainer}>
              {renderChart(widget.data, widget.title)}
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <SimpleGlassCard style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Γρήγορες Ενέργειες</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowGenerateModal(true)}>
              <Ionicons name="document-text" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Νέα Αναφορά</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => setActiveTab('reports')}>
              <Ionicons name="folder-open" size={24} color={Colors.success} />
              <Text style={styles.quickActionText}>Αποθηκευμένες</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => setActiveTab('templates')}>
              <Ionicons name="library" size={24} color={Colors.warning} />
              <Text style={styles.quickActionText}>Πρότυπα</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => {}}>
              <Ionicons name="download" size={24} color={Colors.info} />
              <Text style={styles.quickActionText}>Εξαγωγή</Text>
            </TouchableOpacity>
          </View>
        </SimpleGlassCard>
      </View>
    );
  }

  function renderReportsTab() {
    return (
      <View>
        {savedReports.length === 0 ? (
          <SimpleGlassCard style={styles.emptyCard}>
            <Ionicons name="document-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Δεν υπάρχουν αποθηκευμένες αναφορές</Text>
            <Text style={styles.emptyDescription}>Δημιουργήστε την πρώτη αναφορά</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowGenerateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Δημιουργία Αναφοράς</Text>
            </TouchableOpacity>
          </SimpleGlassCard>
        ) : (
          savedReports.map((report) => (
            <SimpleGlassCard key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportType}>{report.type}</Text>
                  <Text style={styles.reportDate}>
                    {format(new Date(report.generatedAt), 'dd/MM/yyyy HH:mm', { locale: el })}
                  </Text>
                </View>
                <View style={styles.reportActions}>
                  <TouchableOpacity style={styles.reportActionButton}>
                    <Ionicons name="eye" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reportActionButton}>
                    <Ionicons name="download" size={16} color={Colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reportActionButton}>
                    <Ionicons name="share" size={16} color={Colors.warning} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Report Summary */}
              <View style={styles.reportSummary}>
                {report.type === 'revenue' && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Συνολικά Έσοδα:</Text>
                    <Text style={styles.summaryValue}>€{report.data.summary?.totalRevenue?.toLocaleString() || '0'}</Text>
                  </View>
                )}
                {report.type === 'expenses' && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Συνολικά Έξοδα:</Text>
                    <Text style={styles.summaryValue}>€{report.data.summary?.totalExpenses?.toLocaleString() || '0'}</Text>
                  </View>
                )}
                {report.type === 'contracts' && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Συνολικά Συμβόλαια:</Text>
                    <Text style={styles.summaryValue}>{report.data.summary?.totalContracts || '0'}</Text>
                  </View>
                )}
                {report.type === 'financial' && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Καθαρό Κέρδος:</Text>
                    <Text style={[styles.summaryValue, { color: (report.data.summary?.netProfit || 0) >= 0 ? Colors.success : Colors.error }]}>
                      €{report.data.summary?.netProfit?.toLocaleString() || '0'}
                    </Text>
                  </View>
                )}
              </View>
            </SimpleGlassCard>
          ))
        )}
      </View>
    );
  }

  function renderTemplatesTab() {
    const reportTypes = [
      { value: 'revenue', label: 'Έσοδα', icon: 'trending-up', description: 'Αναφορά εσόδων και πωλήσεων' },
      { value: 'expenses', label: 'Έξοδα', icon: 'trending-down', description: 'Αναφορά εξόδων και δαπανών' },
      { value: 'fleet', label: 'Στόλος', icon: 'car', description: 'Αναφορά αξιοποίησης και συντήρησης' },
      { value: 'customer', label: 'Πελάτες', icon: 'people', description: 'Αναφορά πελατών και ενοικιάσεων' },
      { value: 'contracts', label: 'Συμβόλαια', icon: 'document-text', description: 'Αναφορά συμβολαίων και ενοικιάσεων' },
      { value: 'damage', label: 'Ζημιές', icon: 'warning', description: 'Αναφορά ζημιών και επισκευών' },
      { value: 'financial', label: 'Οικονομικά', icon: 'calculator', description: 'Ολοκληρωμένη οικονομική αναφορά' },
    ];

    return (
      <View>
        <Text style={styles.sectionTitle}>Πρότυπα Αναφορών</Text>
        <Text style={styles.sectionDescription}>
          Επιλέξτε τύπο αναφοράς για να δημιουργήσετε μια νέα αναφορά
        </Text>
        
        <View style={styles.templatesGrid}>
          {reportTypes.map((template) => (
            <TouchableOpacity
              key={template.value}
              style={styles.templateCard}
              onPress={() => {
                setSelectedReportType(template.value);
                setShowGenerateModal(true);
              }}
            >
              <View style={styles.templateIcon}>
                <Ionicons name={template.icon as any} size={32} color={Colors.primary} />
              </View>
              <Text style={styles.templateTitle}>{template.label}</Text>
              <Text style={styles.templateDescription}>{template.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderGenerateModal() {
    return (
      <Modal
        visible={showGenerateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
              <Text style={styles.modalCancelButton}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Δημιουργία Αναφοράς</Text>
            <TouchableOpacity onPress={generateReport} disabled={loading}>
              <Text style={[styles.modalSaveButton, loading && { opacity: 0.5 }]}>
                {loading ? 'Δημιουργία...' : 'Δημιουργία'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <SimpleGlassCard style={styles.modalCard}>
              <Text style={styles.modalSectionTitle}>Τύπος Αναφοράς</Text>
              <Text style={styles.selectedReportType}>
                {selectedReportType ? selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1) : 'Επιλέξτε τύπο'}
              </Text>
            </SimpleGlassCard>

            <SimpleGlassCard style={styles.modalCard}>
              <Text style={styles.modalSectionTitle}>Φίλτρα</Text>
              
              <View style={styles.filterRow}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Ημερομηνία Από</Text>
                  <Text style={styles.filterValue}>
                    {reportFilters.startDate || 'Επιλέξτε ημερομηνία'}
                  </Text>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Ημερομηνία Έως</Text>
                  <Text style={styles.filterValue}>
                    {reportFilters.endDate || 'Επιλέξτε ημερομηνία'}
                  </Text>
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Κατηγορία</Text>
                  <Text style={styles.filterValue}>
                    {reportFilters.category || 'Όλες οι κατηγορίες'}
                  </Text>
                </View>
              </View>
            </SimpleGlassCard>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση αναλυτικών δεδομένων...</Text>
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
            <Text style={styles.headerTitle}>Αναφορές & Αναλυτικά</Text>
            <Text style={styles.headerSubtitle}>Επιχειρηματικές αναφορές και στατιστικά</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowGenerateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {[
                { value: 'dashboard', label: 'Dashboard', icon: 'bar-chart' },
                { value: 'reports', label: 'Αναφορές', icon: 'document-text' },
                { value: 'templates', label: 'Πρότυπα', icon: 'library' },
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
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
        </View>
      </ScrollView>

      {renderGenerateModal()}
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
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    ...Shadows.sm,
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
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    padding: Spacing.md,
  },
  kpisContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: (screenWidth - Spacing.md * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  kpiTrend: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
  },
  kpiTrendText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  kpiValue: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  chartsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  widgetContainer: {
    marginBottom: Spacing.md,
  },
  chartCard: {
    padding: Spacing.md,
  },
  chartTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  chartContainer: {
    height: 200,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  barLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  barValue: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyChart: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.lg,
  },
  quickActionsCard: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minWidth: (screenWidth - Spacing.md * 2 - Spacing.sm) / 2,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
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
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  emptyButtonText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  reportCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
  },
  reportType: {
    ...Typography.body,
    color: Colors.primary,
    marginTop: 2,
  },
  reportDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reportActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reportActionButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportSummary: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  templateCard: {
    flex: 1,
    minWidth: (screenWidth - Spacing.md * 2 - Spacing.sm) / 2,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  templateTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  templateDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
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
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCancelButton: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  modalTitle: {
    ...Typography.h4,
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
    marginBottom: Spacing.md,
  },
  modalSectionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  selectedReportType: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  filterValue: {
    ...Typography.body,
    color: Colors.text,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
