import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { FinancialService, FinancialStats } from '../services/financial.service';
import { OrganizationService } from '../services/organization.service';
import { Invoice, Expense, Revenue } from '../models/multi-tenant.types';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

export default function FinancialManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses' | 'revenues'>('overview');
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);

  useEffect(() => {
    loadFinancialData();
  }, [activeTab]);

  async function loadFinancialData() {
    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε επιχείρηση.');
        router.back();
        return;
      }

      const [statsData, invoicesData, expensesData, revenuesData] = await Promise.all([
        FinancialService.getFinancialStats(organization.id),
        activeTab === 'invoices' ? FinancialService.getInvoices(organization.id) : Promise.resolve([]),
        activeTab === 'expenses' ? FinancialService.getExpenses(organization.id) : Promise.resolve([]),
        activeTab === 'revenues' ? FinancialService.getRevenues(organization.id) : Promise.resolve([]),
      ]);

      setFinancialStats(statsData);
      setInvoices(invoicesData);
      setExpenses(expensesData);
      setRevenues(revenuesData);
    } catch (error) {
      console.error('Error loading financial data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης οικονομικών δεδομένων.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'paid': return Colors.success;
      case 'sent': return Colors.warning;
      case 'overdue': return Colors.error;
      case 'draft': return Colors.textSecondary;
      case 'cancelled': return Colors.error;
      default: return Colors.textSecondary;
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Πληρωμένο';
      case 'sent': return 'Στάλθηκε';
      case 'overdue': return 'Εκπρόθεσμο';
      case 'draft': return 'Προσχέδιο';
      case 'cancelled': return 'Ακυρωμένο';
      default: return status;
    }
  }

  function renderOverviewTab() {
    if (!financialStats) return null;

    return (
      <View>
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <SimpleGlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <Text style={styles.metricLabel}>Συνολικά Έσοδα</Text>
            </View>
            <Text style={styles.metricValue}>€{financialStats.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.metricChange}>+€{financialStats.monthlyRevenue.toLocaleString()} αυτόν τον μήνα</Text>
          </SimpleGlassCard>

          <SimpleGlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-down" size={24} color={Colors.error} />
              <Text style={styles.metricLabel}>Συνολικά Έξοδα</Text>
            </View>
            <Text style={styles.metricValue}>€{financialStats.totalExpenses.toLocaleString()}</Text>
            <Text style={styles.metricChange}>€{financialStats.monthlyExpenses.toLocaleString()} αυτόν τον μήνα</Text>
          </SimpleGlassCard>

          <SimpleGlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="wallet" size={24} color={Colors.primary} />
              <Text style={styles.metricLabel}>Καθαρό Κέρδος</Text>
            </View>
            <Text style={[styles.metricValue, { color: financialStats.netProfit >= 0 ? Colors.success : Colors.error }]}>
              €{financialStats.netProfit.toLocaleString()}
            </Text>
            <Text style={styles.metricChange}>
              {financialStats.monthlyProfit >= 0 ? '+' : ''}€{financialStats.monthlyProfit.toLocaleString()} αυτόν τον μήνα
            </Text>
          </SimpleGlassCard>

          <SimpleGlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="document-text" size={24} color={Colors.warning} />
              <Text style={styles.metricLabel}>Εκκρεμή Τιμολόγια</Text>
            </View>
            <Text style={styles.metricValue}>€{financialStats.outstandingInvoices.toLocaleString()}</Text>
            <Text style={styles.metricChange}>
              €{financialStats.overdueInvoices.toLocaleString()} εκπρόθεσμα
            </Text>
          </SimpleGlassCard>
        </View>

        {/* Revenue Sources */}
        <SimpleGlassCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Κορυφαίες Πηγές Εσόδων</Text>
          {financialStats.topRevenueSources.length === 0 ? (
            <Text style={styles.emptyChart}>Δεν υπάρχουν δεδομένα εσόδων</Text>
          ) : (
            financialStats.topRevenueSources.map((source, index) => (
              <View key={source.source} style={styles.chartItem}>
                <View style={styles.chartItemInfo}>
                  <Text style={styles.chartItemLabel}>{source.source}</Text>
                  <Text style={styles.chartItemValue}>€{source.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.chartItemBar}>
                  <View 
                    style={[
                      styles.chartItemBarFill, 
                      { 
                        width: `${source.percentage}%`,
                        backgroundColor: index === 0 ? Colors.primary : index === 1 ? Colors.success : index === 2 ? Colors.warning : Colors.info
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartItemPercentage}>{source.percentage.toFixed(1)}%</Text>
              </View>
            ))
          )}
        </SimpleGlassCard>

        {/* Expense Categories */}
        <SimpleGlassCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Κατηγορίες Εξόδων</Text>
          {financialStats.expenseCategories.length === 0 ? (
            <Text style={styles.emptyChart}>Δεν υπάρχουν δεδομένα εξόδων</Text>
          ) : (
            financialStats.expenseCategories.map((category, index) => (
              <View key={category.category} style={styles.chartItem}>
                <View style={styles.chartItemInfo}>
                  <Text style={styles.chartItemLabel}>{category.category}</Text>
                  <Text style={styles.chartItemValue}>€{category.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.chartItemBar}>
                  <View 
                    style={[
                      styles.chartItemBarFill, 
                      { 
                        width: `${category.percentage}%`,
                        backgroundColor: index === 0 ? Colors.error : index === 1 ? Colors.warning : index === 2 ? Colors.info : Colors.textSecondary
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartItemPercentage}>{category.percentage.toFixed(1)}%</Text>
              </View>
            ))
          )}
        </SimpleGlassCard>
      </View>
    );
  }

  function renderInvoicesTab() {
    return (
      <View>
        {invoices.length === 0 ? (
          <SimpleGlassCard style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Δεν υπάρχουν τιμολόγια</Text>
            <Text style={styles.emptyDescription}>Δημιουργήστε το πρώτο τιμολόγιο</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddInvoiceModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Νέο Τιμολόγιο</Text>
            </TouchableOpacity>
          </SimpleGlassCard>
        ) : (
          invoices.map((invoice) => (
            <SimpleGlassCard key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                  <Text style={styles.invoiceCustomer}>
                    {typeof invoice.customer === 'object' ? invoice.customer?.full_name : 'Άγνωστος Πελάτης'}
                  </Text>
                  <Text style={styles.invoiceDate}>
                    {format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: el })}
                  </Text>
                </View>
                <View style={styles.invoiceAmountContainer}>
                  <Text style={styles.invoiceAmount}>€{invoice.amount.toLocaleString()}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(invoice.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(invoice.status) }
                    ]}>
                      {getStatusLabel(invoice.status)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {invoice.description && (
                <Text style={styles.invoiceDescription}>{invoice.description}</Text>
              )}
              
              <View style={styles.invoiceActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="eye" size={16} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Προβολή</Text>
                </TouchableOpacity>
                {invoice.status === 'sent' && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="checkmark" size={16} color={Colors.success} />
                    <Text style={styles.actionButtonText}>Πληρωμή</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="create" size={16} color={Colors.warning} />
                  <Text style={styles.actionButtonText}>Επεξεργασία</Text>
                </TouchableOpacity>
              </View>
            </SimpleGlassCard>
          ))
        )}
      </View>
    );
  }

  function renderExpensesTab() {
    return (
      <View>
        {expenses.length === 0 ? (
          <SimpleGlassCard style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Δεν υπάρχουν έξοδα</Text>
            <Text style={styles.emptyDescription}>Καταγράψτε το πρώτο έξοδο</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddExpenseModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Νέο Έξοδο</Text>
            </TouchableOpacity>
          </SimpleGlassCard>
        ) : (
          expenses.map((expense) => (
            <SimpleGlassCard key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDate}>
                    {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: el })}
                  </Text>
                </View>
                <View style={styles.expenseAmountContainer}>
                  <Text style={styles.expenseAmount}>€{expense.amount.toLocaleString()}</Text>
                  <View style={[
                    styles.approvalBadge,
                    { backgroundColor: expense.approved ? Colors.success + '20' : Colors.warning + '20' }
                  ]}>
                    <Text style={[
                      styles.approvalBadgeText,
                      { color: expense.approved ? Colors.success : Colors.warning }
                    ]}>
                      {expense.approved ? 'Εγκεκριμένο' : 'Εκκρεμές'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {expense.receipt_url && (
                <View style={styles.receiptContainer}>
                  <Ionicons name="receipt" size={16} color={Colors.primary} />
                  <Text style={styles.receiptText}>Υπάρχει απόδειξη</Text>
                </View>
              )}
              
              <View style={styles.expenseActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="eye" size={16} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Προβολή</Text>
                </TouchableOpacity>
                {!expense.approved && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="checkmark" size={16} color={Colors.success} />
                    <Text style={styles.actionButtonText}>Έγκριση</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="create" size={16} color={Colors.warning} />
                  <Text style={styles.actionButtonText}>Επεξεργασία</Text>
                </TouchableOpacity>
              </View>
            </SimpleGlassCard>
          ))
        )}
      </View>
    );
  }

  function renderRevenuesTab() {
    return (
      <View>
        {revenues.length === 0 ? (
          <SimpleGlassCard style={styles.emptyCard}>
            <Ionicons name="cash-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Δεν υπάρχουν έσοδα</Text>
            <Text style={styles.emptyDescription}>Καταγράψτε το πρώτο έσοδο</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddRevenueModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Νέο Έσοδο</Text>
            </TouchableOpacity>
          </SimpleGlassCard>
        ) : (
          revenues.map((revenue) => (
            <SimpleGlassCard key={revenue.id} style={styles.revenueCard}>
              <View style={styles.revenueHeader}>
                <View style={styles.revenueInfo}>
                  <Text style={styles.revenueSource}>{revenue.source}</Text>
                  <Text style={styles.revenueDescription}>{revenue.description}</Text>
                  <Text style={styles.revenueDate}>
                    {format(new Date(revenue.revenue_date), 'dd/MM/yyyy', { locale: el })}
                  </Text>
                </View>
                <View style={styles.revenueAmountContainer}>
                  <Text style={styles.revenueAmount}>€{revenue.amount.toLocaleString()}</Text>
                  <Text style={styles.revenuePaymentMethod}>{revenue.payment_method}</Text>
                </View>
              </View>
              
              {revenue.contract_id && (
                <View style={styles.contractContainer}>
                  <Ionicons name="document" size={16} color={Colors.primary} />
                  <Text style={styles.contractText}>Συνδέεται με συμβόλαιο</Text>
                </View>
              )}
              
              <View style={styles.revenueActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="eye" size={16} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Προβολή</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="create" size={16} color={Colors.warning} />
                  <Text style={styles.actionButtonText}>Επεξεργασία</Text>
                </TouchableOpacity>
              </View>
            </SimpleGlassCard>
          ))
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση οικονομικών δεδομένων...</Text>
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
            <Text style={styles.headerTitle}>Οικονομική Διαχείριση</Text>
            <Text style={styles.headerSubtitle}>Έσοδα, έξοδα και τιμολόγια</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (activeTab === 'invoices') setShowAddInvoiceModal(true);
              else if (activeTab === 'expenses') setShowAddExpenseModal(true);
              else if (activeTab === 'revenues') setShowAddRevenueModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {[
                { value: 'overview', label: 'Επισκόπηση', icon: 'bar-chart' },
                { value: 'invoices', label: 'Τιμολόγια', icon: 'document-text' },
                { value: 'expenses', label: 'Έξοδα', icon: 'receipt' },
                { value: 'revenues', label: 'Έσοδα', icon: 'cash' },
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
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'invoices' && renderInvoicesTab()}
          {activeTab === 'expenses' && renderExpensesTab()}
          {activeTab === 'revenues' && renderRevenuesTab()}
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
  metricsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    padding: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  metricValue: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metricChange: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chartCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  chartTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  emptyChart: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  chartItemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  chartItemLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  chartItemValue: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chartItemBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  chartItemBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartItemPercentage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
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
  invoiceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
  },
  invoiceCustomer: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  invoiceDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  invoiceAmountContainer: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
    marginTop: Spacing.xs,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  invoiceDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  expenseCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  expenseCategory: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expenseDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    ...Typography.h4,
    color: Colors.error,
    fontWeight: '700',
  },
  approvalBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
    marginTop: Spacing.xs,
  },
  approvalBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  receiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  receiptText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  expenseActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  revenueCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueSource: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  revenueDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  revenueDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  revenueAmountContainer: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    ...Typography.h4,
    color: Colors.success,
    fontWeight: '700',
  },
  revenuePaymentMethod: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  contractContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  contractText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  revenueActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
