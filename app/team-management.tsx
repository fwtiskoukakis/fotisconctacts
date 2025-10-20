import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { OrganizationService } from '../services/organization.service';
import { TeamMember, Branch } from '../models/multi-tenant.types';

export default function TeamManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'agent' as 'admin' | 'manager' | 'agent' | 'viewer',
    branchId: '',
  });

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε επιχείρηση.');
        router.back();
        return;
      }

      const [membersData, branchesData] = await Promise.all([
        OrganizationService.getTeamMembers(organization.id),
        OrganizationService.getBranches(organization.id),
      ]);

      setTeamMembers(membersData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading team data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης δεδομένων ομάδας.');
    } finally {
      setLoading(false);
    }
  }

  async function inviteTeamMember() {
    if (!inviteForm.email || !inviteForm.role) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία.');
      return;
    }

    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) return;

      await OrganizationService.inviteTeamMember(organization.id, {
        email: inviteForm.email,
        role: inviteForm.role,
        branchId: inviteForm.branchId || undefined,
      });

      Alert.alert('Επιτυχία', 'Η πρόσκληση στάλθηκε επιτυχώς!');
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'agent', branchId: '' });
      loadTeamData(); // Refresh the list
    } catch (error) {
      console.error('Error inviting team member:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποστολής πρόσκλησης.');
    }
  }

  async function updateMemberRole(memberId: string, newRole: 'admin' | 'manager' | 'agent' | 'viewer') {
    try {
      await OrganizationService.updateTeamMemberRole(memberId, newRole);
      Alert.alert('Επιτυχία', 'Ο ρόλος ενημερώθηκε επιτυχώς!');
      loadTeamData(); // Refresh the list
    } catch (error) {
      console.error('Error updating member role:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία ενημέρωσης ρόλου.');
    }
  }

  async function removeTeamMember(memberId: string, memberName: string) {
    Alert.alert(
      'Αφαίρεση Μελους',
      `Είστε σίγουροι ότι θέλετε να αφαιρέσετε το μέλος "${memberName}" από την ομάδα;`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Αφαίρεση',
          style: 'destructive',
          onPress: async () => {
            try {
              await OrganizationService.removeTeamMember(memberId);
              Alert.alert('Επιτυχία', 'Το μέλος αφαιρέθηκε επιτυχώς!');
              loadTeamData(); // Refresh the list
            } catch (error) {
              console.error('Error removing team member:', error);
              Alert.alert('Σφάλμα', 'Αποτυχία αφαίρεσης μελους.');
            }
          },
        },
      ]
    );
  }

  function getRoleColor(role: string): string {
    switch (role) {
      case 'owner': return Colors.primary;
      case 'admin': return Colors.warning;
      case 'manager': return Colors.success;
      case 'agent': return Colors.info;
      case 'viewer': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  }

  function getRoleLabel(role: string): string {
    switch (role) {
      case 'owner': return 'Ιδιοκτήτης';
      case 'admin': return 'Διαχειριστής';
      case 'manager': return 'Διευθυντής';
      case 'agent': return 'Πράκτορας';
      case 'viewer': return 'Παρατηρητής';
      default: return role;
    }
  }

  function renderMemberCard(member: TeamMember) {
    return (
      <SimpleGlassCard key={member.id} style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
            <View style={styles.memberRoleContainer}>
              <View style={[
                styles.roleBadge,
                { backgroundColor: getRoleColor(member.role) + '20' }
              ]}>
                <Text style={[
                  styles.roleBadgeText,
                  { color: getRoleColor(member.role) }
                ]}>
                  {getRoleLabel(member.role)}
                </Text>
              </View>
              {member.branch && (
                <Text style={styles.branchText}>{member.branch.name}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.memberMenu}
            onPress={() => {
              Alert.alert(
                'Ενέργειες Μελους',
                `Επιλέξτε ενέργεια για το μέλος "${member.name}":`,
                [
                  { text: 'Ακύρωση', style: 'cancel' },
                  ...(member.role !== 'owner' ? [
                    { text: 'Αλλαγή Ρόλου', onPress: () => showRoleChangeModal(member) },
                    { text: 'Αφαίρεση', style: 'destructive', onPress: () => removeTeamMember(member.id, member.name) },
                  ] : []),
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.memberStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Συμβόλαια</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Τελευταία Σύνδεση</Text>
            <Text style={styles.statValue}>Σήμερα</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Κατάσταση</Text>
            <Text style={[
              styles.statValue,
              { color: member.is_active ? Colors.success : Colors.textSecondary }
            ]}>
              {member.is_active ? 'Ενεργό' : 'Ανενεργό'}
            </Text>
          </View>
        </View>
      </SimpleGlassCard>
    );
  }

  function showRoleChangeModal(member: TeamMember) {
    Alert.alert(
      'Αλλαγή Ρόλου',
      `Επιλέξτε νέο ρόλο για το μέλος "${member.name}":`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        { text: 'Διαχειριστής', onPress: () => updateMemberRole(member.id, 'admin') },
        { text: 'Διευθυντής', onPress: () => updateMemberRole(member.id, 'manager') },
        { text: 'Πράκτορας', onPress: () => updateMemberRole(member.id, 'agent') },
        { text: 'Παρατηρητής', onPress: () => updateMemberRole(member.id, 'viewer') },
      ]
    );
  }

  function renderInviteModal() {
    return (
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={styles.modalCancelButton}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Πρόσκληση Μελους</Text>
            <TouchableOpacity onPress={inviteTeamMember}>
              <Text style={styles.modalSaveButton}>Αποστολή</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.email}
                onChangeText={(text) => setInviteForm(prev => ({ ...prev, email: text }))}
                placeholder="example@company.gr"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Ρόλος *</Text>
              <View style={styles.roleOptions}>
                {[
                  { value: 'admin', label: 'Διαχειριστής', description: 'Πλήρη πρόσβαση σε όλα' },
                  { value: 'manager', label: 'Διευθυντής', description: 'Διαχείριση συμβολαίων και οχημάτων' },
                  { value: 'agent', label: 'Πράκτορας', description: 'Δημιουργία συμβολαίων' },
                  { value: 'viewer', label: 'Παρατηρητής', description: 'Μόνο προβολή δεδομένων' },
                ].map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleOption,
                      inviteForm.role === role.value && styles.roleOptionSelected,
                    ]}
                    onPress={() => setInviteForm(prev => ({ ...prev, role: role.value as any }))}
                  >
                    <Text style={[
                      styles.roleOptionTitle,
                      inviteForm.role === role.value && styles.roleOptionTitleSelected,
                    ]}>
                      {role.label}
                    </Text>
                    <Text style={styles.roleOptionDescription}>{role.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {branches.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Τοποθεσία</Text>
                <View style={styles.branchOptions}>
                  <TouchableOpacity
                    style={[
                      styles.branchOption,
                      !inviteForm.branchId && styles.branchOptionSelected,
                    ]}
                    onPress={() => setInviteForm(prev => ({ ...prev, branchId: '' }))}
                  >
                    <Text style={[
                      styles.branchOptionText,
                      !inviteForm.branchId && styles.branchOptionTextSelected,
                    ]}>
                      Όλες οι τοποθεσίες
                    </Text>
                  </TouchableOpacity>
                  {branches.map((branch) => (
                    <TouchableOpacity
                      key={branch.id}
                      style={[
                        styles.branchOption,
                        inviteForm.branchId === branch.id && styles.branchOptionSelected,
                      ]}
                      onPress={() => setInviteForm(prev => ({ ...prev, branchId: branch.id }))}
                    >
                      <Text style={[
                        styles.branchOptionText,
                        inviteForm.branchId === branch.id && styles.branchOptionTextSelected,
                      ]}>
                        {branch.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση ομάδας...</Text>
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
            <Text style={styles.headerTitle}>Διαχείριση Ομάδας</Text>
            <Text style={styles.headerSubtitle}>{teamMembers.length} μέλη</Text>
          </View>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <SimpleGlassCard style={styles.statCard}>
            <Ionicons name="people" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{teamMembers.length}</Text>
            <Text style={styles.statLabel}>Συνολικά Μέλη</Text>
          </SimpleGlassCard>
          <SimpleGlassCard style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{teamMembers.filter(m => m.is_active).length}</Text>
            <Text style={styles.statLabel}>Ενεργά</Text>
          </SimpleGlassCard>
          <SimpleGlassCard style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.warning} />
            <Text style={styles.statNumber}>{teamMembers.filter(m => m.role === 'admin' || m.role === 'owner').length}</Text>
            <Text style={styles.statLabel}>Διαχειριστές</Text>
          </SimpleGlassCard>
        </View>

        {/* Team Members */}
        <View style={styles.membersContainer}>
          <Text style={styles.sectionTitle}>Μέλη Ομάδας</Text>
          {teamMembers.length === 0 ? (
            <SimpleGlassCard style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Κανένα μέλος</Text>
              <Text style={styles.emptyDescription}>
                Προσκαλέστε τα πρώτα μέλη της ομάδας σας
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowInviteModal(true)}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Πρόσκληση Μελους</Text>
              </TouchableOpacity>
            </SimpleGlassCard>
          ) : (
            teamMembers.map(renderMemberCard)
          )}
        </View>
      </ScrollView>

      {renderInviteModal()}
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
  inviteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    ...Shadows.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statNumber: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  membersContainer: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  memberCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  memberAvatarText: {
    ...Typography.h4,
    color: '#fff',
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  memberEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
  },
  roleBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  branchText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  memberMenu: {
    padding: Spacing.xs,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
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
    marginTop: Spacing.xs,
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
  formGroup: {
    marginBottom: Spacing.lg,
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
  roleOptions: {
    gap: Spacing.sm,
  },
  roleOption: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
  },
  roleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  roleOptionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  roleOptionTitleSelected: {
    color: Colors.primary,
  },
  roleOptionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  branchOptions: {
    gap: Spacing.sm,
  },
  branchOption: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
  },
  branchOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  branchOptionText: {
    ...Typography.body,
    color: Colors.text,
  },
  branchOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
