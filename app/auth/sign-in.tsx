import React, { useState, useEffect } from 'react';
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
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/auth.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../../utils/design-system';

const { width, height } = Dimensions.get('window');

/**
 * Professional Business Sign In Screen
 */
export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }

    setIsLoading(true);

    try {
      const { user, error } = await AuthService.signIn({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert('Σφάλμα Σύνδεσης', error.message);
        return;
      }

      if (user) {
        // Navigate to main app
        router.replace('/');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης. Παρακαλώ προσπαθήστε ξανά.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    setResetEmail(email);
    setShowForgotPassword(true);
  }

  async function handleSendResetEmail() {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      Alert.alert('Σφάλμα', 'Παρακαλώ εισάγετε έγκυρο email');
      return;
    }

    setIsLoading(true);
    const { error } = await AuthService.resetPassword(resetEmail.trim());
    setIsLoading(false);

    if (error) {
      Alert.alert('Σφάλμα', error.message);
    } else {
      Alert.alert(
        'Επιτυχία',
        'Ελέγξτε το email σας για οδηγίες ανάκτησης κωδικού',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowForgotPassword(false);
              setResetEmail('');
            },
          },
        ]
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Decorative Elements */}
          <View style={styles.backgroundPattern}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>

          {/* Header Section */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.logoContainer, Glassmorphism.medium]}>
              <Text style={styles.logoText}>FC</Text>
            </View>
            <Text style={styles.appTitle}>Fotis Contacts</Text>
            <Text style={styles.appSubtitle}>Σύστημα Διαχείρισης Ενοικιάσεων Αυτοκινήτων</Text>
            <Text style={styles.welcomeText}>Καλώς ήρθατε! Συνδεθείτε για να συνεχίσετε</Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View 
            style={[
              styles.formContainer,
              Glassmorphism.medium,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.formTitle}>Σύνδεση Χρήστη</Text>
            <Text style={styles.formSubtitle}>Εισάγετε τα στοιχεία σας</Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, Glassmorphism.light]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Κωδικός Πρόσβασης</Text>
              <View style={[styles.inputContainer, Glassmorphism.light]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Εισάγετε τον κωδικό σας"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPassword}>
                Ξεχάσατε τον κωδικό σας;
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.signInButtonText}>Σύνδεση</Text>
                  <Text style={styles.signInButtonIcon}>→</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ή</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={[styles.signUpButton, Glassmorphism.light]}
              onPress={() => router.push('/auth/sign-up')}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                Δεν έχετε λογαριασμό; <Text style={styles.signUpButtonTextBold}>Εγγραφείτε</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.footerText}>
              © 2024 Fotis Contacts. Όλα τα δικαιώματα διατηρούνται.
            </Text>
            <Text style={styles.versionText}>Έκδοση 1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, Glassmorphism.medium]}>
            <Text style={styles.modalTitle}>Επαναφορά Κωδικού</Text>
            <Text style={styles.modalDescription}>
              Εισάγετε το email σας και θα σας στείλουμε οδηγίες για την επαναφορά του κωδικού σας.
            </Text>
            
            <View style={[styles.modalInputContainer, Glassmorphism.light]}>
              <Text style={styles.modalInputIcon}>📧</Text>
              <TextInput
                style={styles.modalInput}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, Glassmorphism.light]}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={styles.modalCancelText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSendButton}
                onPress={handleSendResetEmail}
              >
                <Text style={styles.modalSendText}>Αποστολή</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.05,
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.secondary,
    opacity: 0.05,
    bottom: -50,
    left: -50,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.info,
    opacity: 0.05,
    top: height * 0.4,
    right: -30,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appTitle: {
    ...Typography.h1,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  appSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formContainer: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  formTitle: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  formSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPassword: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    ...Typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: Spacing.sm,
  },
  signInButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  signUpButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  signUpButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  signUpButtonTextBold: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalInputIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  modalInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalCancelText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  modalSendButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  modalSendText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
