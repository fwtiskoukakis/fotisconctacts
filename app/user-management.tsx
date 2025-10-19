import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User } from '../models/contract.interface';
import { supabase } from '../utils/supabase';
import { SignaturePad } from '../components/signature-pad';
import Svg, { Path } from 'react-native-svg';

/**
 * User management screen for adding, editing, and managing users
 */
export default function UserManagementScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserSignature, setNewUserSignature] = useState('');
  const [newUserSignaturePaths, setNewUserSignaturePaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const loadedUsers: User[] = data?.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        signature: u.signature_url || '',
        signatureUrl: u.signature_url,
        createdAt: new Date(u.created_at),
        updatedAt: u.updated_at ? new Date(u.updated_at) : undefined,
      })) || [];
      
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης χρηστών');
    }
  }

  function handleAddUser() {
    setNewUserName('');
    setNewUserSignature('');
    setNewUserSignaturePaths([]);
    setShowAddModal(true);
  }

  function handleEditUser(user: User) {
    setEditingUser(user);
    setNewUserName(user.name);
    setNewUserSignature(user.signature);
    setNewUserSignaturePaths([]);
    setShowEditModal(true);
  }

  async function handleSaveUser() {
    if (!newUserName.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε όνομα χρήστη');
      return;
    }

    setIsLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            name: newUserName.trim(),
            signature_url: newUserSignature,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        
        Alert.alert('Επιτυχία', 'Ο χρήστης ενημερώθηκε επιτυχώς');
        setShowEditModal(false);
      } else {
        // Create new user
        const { error } = await supabase
          .from('users')
          .insert({
            name: newUserName.trim(),
            signature_url: newUserSignature,
          });
        
        if (error) throw error;
        
        Alert.alert('Επιτυχία', 'Ο χρήστης δημιουργήθηκε επιτυχώς');
        setShowAddModal(false);
      }
      
      setEditingUser(null);
      setNewUserName('');
      setNewUserSignature('');
      await loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία αποθήκευσης χρήστη');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteUser(user: User) {
    if (users.length <= 1) {
      Alert.alert('Σφάλμα', 'Δεν μπορείτε να διαγράψετε τον τελευταίο χρήστη');
      return;
    }

    Alert.alert(
      'Διαγραφή Χρήστη',
      `Είστε σίγουροι ότι θέλετε να διαγράψετε τον χρήστη "${user.name}";`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);
              
              if (error) throw error;
              
              await loadUsers();
              Alert.alert('Επιτυχία', 'Ο χρήστης διαγράφηκε επιτυχώς');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής χρήστη');
            }
          },
        },
      ]
    );
  }

  function handleSignatureSave(uri: string) {
    setNewUserSignature(uri);
    
    try {
      // Decode base64 data URI to get SVG content
      // URI format: data:image/svg+xml;base64,XXX
      if (uri.startsWith('data:image/svg+xml;base64,')) {
        const base64Data = uri.split(',')[1];
        const svgContent = decodeURIComponent(escape(atob(base64Data)));
        
        // Extract paths from SVG content
        const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
        if (pathMatches) {
          const paths = pathMatches.map(match => {
            const dMatch = match.match(/d="([^"]*)"/);
            return dMatch ? dMatch[1] : '';
          }).filter(path => path !== '');
          setNewUserSignaturePaths(paths);
        }
      }
    } catch (error) {
      console.error('Error parsing signature data:', error);
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderUserModal() {
    const isEdit = !!editingUser;
    const modalTitle = isEdit ? 'Επεξεργασία Χρήστη' : 'Νέος Χρήστης';
    const buttonText = isEdit ? 'Ενημέρωση' : 'Δημιουργία';
    const isVisible = showAddModal || showEditModal;

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingUser(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setEditingUser(null);
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Ακύρωση</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TouchableOpacity
              onPress={handleSaveUser}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Αποθήκευση...' : buttonText}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Όνομα Χρήστη</Text>
              <TextInput
                style={styles.textInput}
                value={newUserName}
                onChangeText={setNewUserName}
                placeholder="Εισάγετε όνομα χρήστη"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Υπογραφή</Text>
              {newUserSignaturePaths.length > 0 ? (
                <View style={styles.signaturePreview}>
                  <Svg width="100%" height="100%" style={styles.signatureSvg} viewBox="0 0 300 200">
                    {newUserSignaturePaths.map((path, index) => (
                      <Path
                        key={index}
                        d={path}
                        stroke="black"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </Svg>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => {
                      setNewUserSignature('');
                      setNewUserSignaturePaths([]);
                    }}
                  >
                    <Text style={styles.retakeButtonText}>Αλλαγή Υπογραφής</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.signatureCapture}>
                  <SignaturePad
                    onSignatureSave={handleSignatureSave}
                    initialSignature={newUserSignature}
                  />
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Πίσω</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Διαχείριση Χρηστών</Text>
        <TouchableOpacity onPress={handleAddUser} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Προσθήκη</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Δεν υπάρχουν χρήστες</Text>
            <Text style={styles.emptySubtitle}>
              Πατήστε "Προσθήκη" για να δημιουργήσετε τον πρώτο χρήστη
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userDate}>
                  Δημιουργήθηκε: {formatDate(user.createdAt)}
                </Text>
                {user.signature && (
                  <View style={styles.signatureIndicator}>
                    <Text style={styles.signatureText}>✓ Υπογραφή διαθέσιμη</Text>
                  </View>
                )}
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditUser(user)}
                >
                  <Text style={styles.editButtonText}>Επεξεργασία</Text>
                </TouchableOpacity>
                {users.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <Text style={styles.deleteButtonText}>Διαγραφή</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {renderUserModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userInfo: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  signatureIndicator: {
    alignSelf: 'flex-start',
  },
  signatureText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  signaturePreview: {
    alignItems: 'center',
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    marginBottom: 10,
  },
  signatureSvg: {
    backgroundColor: 'transparent',
  },
  retakeButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  signatureCapture: {
    alignItems: 'center',
  },
});
