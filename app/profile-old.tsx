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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { AuthService } from '../services/auth.service';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { Contract } from '../models/contract.interface';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  signatureUrl?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  role: 'admin' | 'user' | 'manager';
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
  };
}

interface UserActivity {
  id: string;
  type: 'contract_created' | 'contract_updated' | 'contract_completed' | 'car_added' | 'damage_reported' | 'login';
  description: string;
  timestamp: Date;
  contractId?: string;
  carId?: string;
  metadata?: any;
}

interface UserStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalRevenue: number;
  averageContractValue: number;
  favoriteCarMake: string;
  totalCarsManaged: number;
  lastActivity: Date;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
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
        // Load user profile
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
            lastLoginAt: profileData.last_login_at,
            isActive: profileData.is_active !== false,
            role: profileData.role || 'user',
            preferences: {
              notifications: profileData.notifications !== false,
              darkMode: profileData.dark_mode === true,
              language: profileData.language || 'el',
              timezone: profileData.timezone || 'Europe/Athens',
            },
          });
        }

        // Load user contracts
        const contracts = await SupabaseContractService.getAllContracts();
        setRecentContracts(contracts.slice(0, 5)); // Last 5 contracts

        // Calculate user stats
        const stats = calculateUserStats(contracts);
        setUserStats(stats);

        // Generate user activity
        const activity = generateUserActivity(contracts, profileData);
        setUserActivity(activity);
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
    
    // Find favorite car make
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
      lastActivity: contracts.length > 0 ? new Date(Math.max(...contracts.map(c => new Date(c.createdAt || c.rentalPeriod.pickupDate).getTime()))) : new Date(),
    };
  }

  function generateUserActivity(contracts: Contract[], profileData: any): UserActivity[] {
    const activities: UserActivity[] = [];
    
    // Add contract activities
    contracts.forEach(contract => {
      activities.push({
        id: `contract-${contract.id}`,
        type: 'contract_created',
        description: `Δημιουργήθηκε συμβόλαιο για ${contract.renterInfo.fullName}`,
        timestamp: new Date(contract.createdAt || contract.rentalPeriod.pickupDate),
        contractId: contract.id,
        metadata: { renterName: contract.renterInfo.fullName, carModel: contract.carInfo.makeModel },
      });

      if (contract.status === 'completed') {
        activities.push({
          id: `completed-${contract.id}`,
          type: 'contract_completed',
          description: `Ολοκληρώθηκε συμβόλαιο με ${contract.renterInfo.fullName}`,
          timestamp: new Date(contract.rentalPeriod.dropoffDate),
          contractId: contract.id,
          metadata: { renterName: contract.renterInfo.fullName, totalCost: contract.rentalPeriod.totalCost },
        });
      }
    });

    // Add login activity
    if (profileData?.last_login_at) {
      activities.push({
        id: 'last-login',
        type: 'login',
        description: 'Τελευταία είσοδος στο σύστημα',
        timestamp: new Date(profileData.last_login_at),
      });
    }

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }

  function startEdit(field: string, currentValue: string) {
    setEditingField(field);
    setEditValue(currentValue);
    setShowEditModal(true);
  }

  async function saveEdit() {
    if (!profile || !editingField) return;

    try {
      // Update profile state
      setProfile(prev => prev ? {
        ...prev,
        [editingField]: editValue,
      } : null);

      // TODO: Save to Supabase
      // await AuthService.updateUserProfile(profile.id, { [editingField]: editValue });

      setShowEditModal(false);
      setEditingField(null);
      setEditValue('');
      
      Alert.alert('Επιτυχία', 'Τα στοιχεία ενημερώθηκαν επιτυχώς');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης στοιχείων');
    }
  }

  function cancelEdit() {
    setShowEditModal(false);
    setEditingField(null);
    setEditValue('');
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'contract_created': return '📋';
      case 'contract_updated': return '✏️';
      case 'contract_completed': return '✅';
      case 'car_added': return '🚗';
      case 'damage_reported': return '⚠️';
      case 'login': return '🔐';
      default: return '📝';
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'admin': return Colors.error;
      case 'manager': return Colors.warning;
      case 'user': return Colors.success;
      default: return Colors.gray;
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'admin': return 'Διαχειριστής';
      case 'manager': return 'Διαχειριστής';
      case 'user': return 'Χρήστης';
      default: return 'Χρήστης';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return Colors.success;
      case 'completed': return Colors.info;
      case 'upcoming': return Colors.warning;
      default: return Colors.gray;
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  function EditableProfileItem({ icon, title, value, onEdit }: {
    icon: string;
    title: string;
    value: string;
    onEdit: () => void;
  }) {
    return (
      <TouchableOpacity
        style={[styles.profileItem, Glassmorphism.light]}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <Text style={styles.profileItemIcon}>{icon}</Text>
        <View style={styles.profileItemContent}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          <Text style={styles.profileItemValue}>{value}</Text>
        </View>
        <Text style={styles.profileItemArrow}>✏️</Text>
      </TouchableOpacity>
    );
  }

  function ProfileItem({ icon, title, value, onPress }: {
    icon: string;
    title: string;
    value: string;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        style={[styles.profileItem, Glassmorphism.light]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.profileItemIcon}>{icon}</Text>
        <View style={styles.profileItemContent}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          <Text style={styles.profileItemValue}>{value}</Text>
        </View>
        <Text style={styles.profileItemArrow}>›</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Προφίλ" showActions={true} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Φόρτωση...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Προφίλ" showActions={true} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
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
            <View style={styles.profileBadges}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(profile?.role || 'user') }]}>
                <Text style={styles.roleBadgeText}>{getRoleLabel(profile?.role || 'user')}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: profile?.isActive ? Colors.success : Colors.error }]}>
                <Text style={styles.statusBadgeText}>{profile?.isActive ? 'Ενεργός' : 'Ανενεργός'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Statistics */}
        {userStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Στατιστικά</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
                <Text style={styles.statValue}>{userStats.totalContracts}</Text>
                <Text style={styles.statLabel}>Συνολικά Συμβόλαια</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.success }]}>
                <Text style={styles.statValue}>{userStats.activeContracts}</Text>
                <Text style={styles.statLabel}>Ενεργά</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.info }]}>
                <Text style={styles.statValue}>€{userStats.totalRevenue.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Συνολικά Έσοδα</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: Colors.warning }]}>
                <Text style={styles.statValue}>{userStats.favoriteCarMake}</Text>
                <Text style={styles.statLabel}>Αγαπημένη Μάρκα</Text>
              </View>
            </View>
          </View>
        )}

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Προσωπικά Στοιχεία</Text>
          
          <EditableProfileItem
            icon="👤"
            title="Ονοματεπώνυμο"
            value={profile?.name || 'Δεν έχει οριστεί'}
            onEdit={() => startEdit('name', profile?.name || '')}
          />
          
          <EditableProfileItem
            icon="📧"
            title="Email"
            value={profile?.email || 'Δεν έχει οριστεί'}
            onEdit={() => startEdit('email', profile?.email || '')}
          />
          
          <EditableProfileItem
            icon="📱"
            title="Τηλέφωνο"
            value={profile?.phone || 'Δεν έχει οριστεί'}
            onEdit={() => startEdit('phone', profile?.phone || '')}
          />
          
          <EditableProfileItem
            icon="📍"
            title="Διεύθυνση"
            value={profile?.address || 'Δεν έχει οριστεί'}
            onEdit={() => startEdit('address', profile?.address || '')}
          />
          
          <EditableProfileItem
            icon="✍️"
            title="Υπογραφή"
            value={profile?.signatureUrl ? 'Ορισμένη' : 'Δεν έχει οριστεί'}
            onEdit={() => router.push('/edit-signature')}
          />
        </View>

        {/* Recent Contracts */}
        {recentContracts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Πρόσφατα Συμβόλαια</Text>
            {recentContracts.map((contract) => (
              <TouchableOpacity
                key={contract.id}
                style={[styles.contractItem, Glassmorphism.light]}
                onPress={() => router.push(`/contract-details?contractId=${contract.id}`)}
              >
                <View style={styles.contractInfo}>
                  <Text style={styles.contractRenter}>{contract.renterInfo.fullName}</Text>
                  <Text style={styles.contractCar}>
                    {contract.carInfo.makeModel} • {contract.carInfo.licensePlate}
                  </Text>
                  <Text style={styles.contractDate}>
                    {formatDate(new Date(contract.rentalPeriod.pickupDate))}
                  </Text>
                </View>
                <View style={styles.contractStatus}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(contract.status) }]} />
                  <Text style={styles.contractCost}>€{contract.rentalPeriod.totalCost}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* User Activity */}
        {userActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Πρόσφατη Δραστηριότητα</Text>
            {userActivity.map((activity) => (
              <View key={activity.id} style={[styles.activityItem, Glassmorphism.light]}>
                <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                <View style={styles.activityContent}>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ρυθμίσεις</Text>
          
          <ProfileItem
            icon="⚙️"
            title="Ρυθμίσεις"
            value="Όλες οι ρυθμίσεις"
            onPress={() => router.push('/settings')}
          />
          
          <ProfileItem
            icon="🔒"
            title="Ασφάλεια"
            value="Αλλαγή Κωδικού"
            onPress={() => router.push('/change-password')}
          />
          
          <ProfileItem
            icon="📊"
            title="Αναφορές"
            value="Εξαγωγή Δεδομένων"
            onPress={() => router.push('/export-data')}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Αποσύνδεση</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={cancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Επεξεργασία</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Εισάγετε ${editingField}`}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelEdit}>
                <Text style={styles.modalCancelText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveEdit}>
                <Text style={styles.modalSaveText}>Αποθήκευση</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  avatarContainer: {
    marginRight: Spacing.lg,
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
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  roleBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
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
    textAlign: 'center',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  profileItemIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  profileItemValue: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  profileItemArrow: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  contractItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  contractInfo: {
    flex: 1,
  },
  contractRenter: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
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
  contractStatus: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  contractCost: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  signOutButton: {
    backgroundColor: Colors.error,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  signOutText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '90%',
    maxWidth: 400,
    ...Shadows.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalSaveText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});