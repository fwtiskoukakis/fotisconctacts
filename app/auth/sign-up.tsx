import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth.service';

/**
 * Sign Up Screen
 */
export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp() {
    // Validation
    if (!name.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε το όνομά σας');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε το email σας');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε έγκυρο email');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Σφάλμα', 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Σφάλμα', 'Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    setIsLoading(true);

    try {
      const { user, error } = await AuthService.signUp({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      });

      if (error) {
        Alert.alert('Σφάλμα Εγγραφής', error.message);
        return;
      }

      if (user) {
        // Check if email confirmation is required
        const session = await AuthService.getSession();
        const needsEmailConfirmation = !session;
        
        Alert.alert(
          'Επιτυχής Εγγραφή',
          needsEmailConfirmation
            ? 'Ο λογαριασμός σας δημιουργήθηκε! Παρακαλώ ελέγξτε το email σας για επιβεβαίωση πριν συνδεθείτε.'
            : 'Ο λογαριασμός σας δημιουργήθηκε επιτυχώς!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (needsEmailConfirmation) {
                  router.replace('/auth/sign-in');
                } else {
                  router.replace('/');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία εγγραφής. Παρακαλώ προσπαθήστε ξανά.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Πίσω</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Εγγραφή</Text>
            <View style={styles.backButton} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Δημιουργία Λογαριασμού</Text>
            <Text style={styles.formSubtitle}>
              Συμπληρώστε τα στοιχεία σας για να ξεκινήσετε
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ονοματεπώνυμο *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="π.χ. Γιάννης Παπαδόπουλος"
                placeholderTextColor="#999"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Κωδικός *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Τουλάχιστον 6 χαρακτήρες"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Text style={styles.hint}>Τουλάχιστον 6 χαρακτήρες</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Επιβεβαίωση Κωδικού *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Επαναλάβετε τον κωδικό"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>Δημιουργία Λογαριασμού</Text>
              )}
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Με την εγγραφή συμφωνείτε με τους{' '}
                <Text style={styles.termsLink}>Όρους Χρήσης</Text> και την{' '}
                <Text style={styles.termsLink}>Πολιτική Απορρήτου</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  signUpButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

