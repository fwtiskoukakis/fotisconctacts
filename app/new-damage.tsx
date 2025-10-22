import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../utils/design-system';

export default function NewDamageScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    licensePlate: '',
    damageDescription: '',
    severity: 'minor' as 'minor' | 'moderate' | 'severe',
    location: '',
  });

  async function saveDamage() {
    if (!formData.licensePlate || !formData.damageDescription) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τα απαιτούμενα πεδία');
      return;
    }

    try {
      // TODO: Implement damage creation logic
      Alert.alert('Επιτυχία', 'Η ζημιά καταγράφηκε!');
      router.back();
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία καταγραφής ζημιάς');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Καταγραφή Ζημιάς</Text>
        <TouchableOpacity onPress={saveDamage}>
          <Text style={styles.saveButton}>Αποθήκευση</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Πινακίδα Αυτοκινήτου *</Text>
          <TextInput
            style={styles.input}
            value={formData.licensePlate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, licensePlate: text }))}
            placeholder="ABC-1234"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Περιγραφή Ζημιάς *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.damageDescription}
            onChangeText={(text) => setFormData(prev => ({ ...prev, damageDescription: text }))}
            placeholder="Περιγράψτε τη ζημιά..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Σοβαρότητα</Text>
          <View style={styles.severityButtons}>
            {(['minor', 'moderate', 'severe'] as const).map((severity) => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.severityButton,
                  formData.severity === severity && styles.severityButtonActive,
                  severity === 'minor' && styles.severityMinor,
                  severity === 'moderate' && styles.severityModerate,
                  severity === 'severe' && styles.severitySevere,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, severity }))}
              >
                <Text style={[
                  styles.severityButtonText,
                  formData.severity === severity && styles.severityButtonTextActive,
                ]}>
                  {severity === 'minor' ? 'Μικρή' : severity === 'moderate' ? 'Μέτρια' : 'Σοβαρή'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Τοποθεσία</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="π.χ. Μπροστινό προφυλακτήρας"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: Spacing.sm },
  headerTitle: { fontSize: 18, color: Colors.text, fontWeight: '700' },
  saveButton: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  content: { flex: 1, padding: Spacing.md },
  formSection: { marginBottom: Spacing.lg },
  inputLabel: { fontSize: 14, color: Colors.text, fontWeight: '600', marginBottom: Spacing.sm },
  input: {
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  severityButtons: { flexDirection: 'row', gap: Spacing.sm },
  severityButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severityButtonActive: { borderColor: Colors.primary },
  severityMinor: {},
  severityModerate: {},
  severitySevere: {},
  severityButtonText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  severityButtonTextActive: { color: Colors.primary },
});
