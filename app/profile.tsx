import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { AuthService } from '../services/auth.service';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { Contract } from '../models/contract.interface';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  signatureUrl?: string;
  avatarUrl?: string;
  createdAt: string;
  isActive: boolean;
  // AADE Fields
  aadeEnabled?: boolean;
  companyVatNumber?: string;
  companyName?: string;
}

interface UserStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalRevenue: number;
  averageContractValue: number;
  favoriteCarMake: string;
  totalCarsManaged: number;
}

type TabType = 'overview' | 'activity' | 'contracts' | 'settings';

/**
 * Profile Screen with Facebook-style tabs
 */
export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const user = await AuthService.getCurrentUser();
      
      if (user) {
        const profileData = await AuthService.getUserProfile(user.id);
        if (profileData) {
          setProfile({
            id: profileData.id,
            name: profileData.name || 'Χρήστης',
            email: profileData.email || user.email || '',
            phone: profileData.phone,
            address: profileData.address,
            signatureUrl: profileData.signature_url,
            avatarUrl: profileData.avatar_url,
            createdAt: profileData.created_at || new Date().toISOString(),
            isActive: profileData.is_active !== false,
            aadeEnabled: profileData.aade_enabled,
            companyVatNumber: profileData.company_vat_number,
            companyName: profileData.company_name,
          });
        }

        const contracts = await SupabaseContractService.getAllContracts();
        setRecentContracts(contracts.slice(0, 10));

        const stats = calculateUserStats(contracts);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης προφίλ');
    } finally {
      setLoading(false);
    }
  }

  function calculateUserStats(contracts: Contract[]): UserStats {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const totalRevenue = contracts.reduce((sum, c) => sum + (c.rentalPeriod.totalCost || 0), 0);
    const averageContractValue = totalContracts > 0 ? totalRevenue / totalContracts : 0;
    
    const carMakes = contracts.map(c => c.carInfo.make).filter(Boolean);
    const makeCounts = carMakes.reduce((acc, make) => {
      acc[make] = (acc[make] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteCarMake = Object.keys(makeCounts).reduce((a, b) => 
      makeCounts[a] > makeCounts[b] ? a : b, 'N/A'
    );

    return {
      totalContracts,
      activeContracts,
      completedContracts,
      totalRevenue,
      averageContractValue,
      favoriteCarMake,
      totalCarsManaged: new Set(contracts.map(c => c.carInfo.licensePlate)).size,
    };
  }

  async function handleSignOut() {
    Alert.alert(
      'Αποσύνδεση',
      'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Αποσύνδεση',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              router.replace('/auth/sign-in');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Σφάλμα', 'Αποτυχία αποσύνδεσης');
            }
          },
        },
      ]
    );
  }

  function renderProfileHeader() {
    return (
      <View style={[styles.profileHeader, Glassmorphism.light]}>
        <View style={styles.avatarContainer}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name || 'Χρήστης'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'email@example.com'}</Text>
          {profile?.companyName && (
            <Text style={styles.profileCompany}>🏢 {profile.companyName}</Text>
          )}
          <View style={styles.profileBadges}>
            <View style={[styles.statusBadge, { backgroundColor: profile?.isActive ? Colors.success : Colors.error }]}>
              <Text style={styles.statusBadgeText}>{profile?.isActive ? 'Ενεργός' : 'Ανενεργός'}</Text>
            </View>
            {profile?.aadeEnabled && (
              <View style={[styles.statusBadge, { backgroundColor: Colors.info }]}>
                <Text style={styles.statusBadgeText}>📋 Πελατολόγιο</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  function renderTabs() {
    const tabs: { key: TabType; label: string; icon: string }[] = [
      { key: 'overview', label: 'Επισκόπηση', icon: '📊' },
      { key: 'activity', label: 'Δραστηριότητα', icon: '📈' },
      { key: 'contracts', label: 'Συμβόλαια', icon: '📋' },
      { key: 'settings', label: 'Ρυθμίσεις', icon: '⚙️' },
    ];

    return (
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabIcon,
                activeTab === tab.key && styles.tabIconActive,
              ]}>
                {tab.icon}
              </Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  function renderOverviewTab() {
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics */}
        {userStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Στατιστικά</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
                <Text style={styles.statValue}>{userStats.totalContracts}</Text>
                <Text style={styles.statLabel}>Συνολικά</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.success }]}>
                <Text style={styles.statValue}>{userStats.activeContracts}</Text>
                <Text style={styles.statLabel}>Ενεργά</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.info }]}>
                <Text style={styles.statValue}>€{userStats.totalRevenue.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Έσοδα</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.warning }]}>
                <Text style={styles.statValue}>{userStats.favoriteCarMake}</Text>
                <Text style={styles.statLabel}>Top Μάρκα</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Γρήγορες Ενέργειες</Text>
          <TouchableOpacity 
            style={[styles.actionCard, Glassmorphism.light]}
            onPress={() => router.push('/new-contract')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Νέο Συμβόλαιο</Text>
              <Text style={styles.actionSubtitle}>Δημιουργία νέας ενοικίασης</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, Glassmorphism.light]}
            onPress={() => router.push('/cars')}
          >
            <Text style={styles.actionIcon}>🚗</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Διαχείριση Αυτοκινήτων</Text>
              <Text style={styles.actionSubtitle}>Προβολή & επεξεργασία στόλου</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, Glassmorphism.light]}
            onPress={() => router.push('/aade-settings')}
          >
            <Text style={styles.actionIcon}>🏛️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ψηφιακό Πελατολόγιο</Text>
              <Text style={styles.actionSubtitle}>Ρυθμίσεις ΑΑΔΕ</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderActivityTab() {
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Πρόσφατη Δραστηριότητα</Text>
          <View style={[styles.emptyState, Glassmorphism.light]}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateText}>Δεν υπάρχει πρόσφατη δραστηριότητα</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  function renderContractsTab() {
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Πρόσφατα Συμβόλαια ({recentContracts.length})</Text>
          {recentContracts.length > 0 ? (
            recentContracts.map((contract) => (
              <TouchableOpacity
                key={contract.id}
                style={[styles.contractCard, Glassmorphism.light]}
                onPress={() => router.push(`/contract-details?contractId=${contract.id}`)}
              >
                <View style={styles.contractInfo}>
                  <Text style={styles.contractRenter}>{contract.renterInfo.fullName}</Text>
                  <Text style={styles.contractCar}>
                    {contract.carInfo.makeModel} • {contract.carInfo.licensePlate}
                  </Text>
                  <Text style={styles.contractDate}>
                    {new Date(contract.rentalPeriod.pickupDate).toLocaleDateString('el-GR')}
                  </Text>
                </View>
                <View style={styles.contractRight}>
                  <Text style={styles.contractCost}>€{contract.rentalPeriod.totalCost}</Text>
                  <Text style={styles.contractArrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, Glassmorphism.light]}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateText}>Δεν υπάρχουν συμβόλαια</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  function renderSettingsTab() {
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Προσωπικά Στοιχεία</Text>
          
          <TouchableOpacity style={[styles.settingCard, Glassmorphism.light]}>
            <Text style={styles.settingIcon}>👤</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Ονοματεπώνυμο</Text>
              <Text style={styles.settingValue}>{profile?.name || 'Δεν έχει οριστεί'}</Text>
            </View>
            <Text style={styles.settingArrow}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingCard, Glassmorphism.light]}>
            <Text style={styles.settingIcon}>📧</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email</Text>
              <Text style={styles.settingValue}>{profile?.email || 'Δεν έχει οριστεί'}</Text>
            </View>
            <Text style={styles.settingArrow}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingCard, Glassmorphism.light]}>
            <Text style={styles.settingIcon}>📱</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Τηλέφωνο</Text>
              <Text style={styles.settingValue}>{profile?.phone || 'Δεν έχει οριστεί'}</Text>
            </View>
            <Text style={styles.settingArrow}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Εφαρμογή</Text>
          
          <TouchableOpacity 
            style={[styles.settingCard, Glassmorphism.light]}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingIcon}>⚙️</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Ρυθμίσεις</Text>
              <Text style={styles.settingValue}>Όλες οι ρυθμίσεις</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingCard, Glassmorphism.light]}
            onPress={() => router.push('/aade-settings')}
          >
            <Text style={styles.settingIcon}>🏛️</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Ψηφιακό Πελατολόγιο</Text>
              <Text style={styles.settingValue}>
                {profile?.aadeEnabled ? 'Ενεργό' : 'Ανενεργό'}
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Αποσύνδεση</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'activity':
        return renderActivityTab();
      case 'contracts':
        return renderContractsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderOverviewTab();
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Προφίλ" showActions={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Προφίλ" showActions={true} />
      
      {renderProfileHeader()}
      {renderTabs()}
      
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
      
      <BottomTabBar />
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  profileCompany: {
    ...Typography.bodySmall,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabsContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.xs,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 18,
    marginRight: Spacing.xs,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: Spacing.sm,
  },
  section: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
    marginBottom: Spacing.xs,
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
    textAlign: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  actionArrow: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  contractCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  contractInfo: {
    flex: 1,
  },
  contractRenter: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  contractCar: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  contractDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  contractRight: {
    alignItems: 'flex-end',
  },
  contractCost: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  contractArrow: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingValue: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  settingArrow: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: Spacing.xxl,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: Colors.error,
    margin: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  signOutText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

