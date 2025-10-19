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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/auth.service';
import { Colors, Spacing, Shadows, BorderRadius } from '../../utils/design-system';

const { width, height } = Dimensions.get('window');

/**
 * Modern & Beautiful Sign In Screen
 */
export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [logoScale] = useState(new Animated.Value(0.3));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 15,
        friction: 5,
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Modern Gradient Background */}
          <View style={styles.gradientBackground}>
            <View style={[styles.gradientCircle, styles.circle1]} />
            <View style={[styles.gradientCircle, styles.circle2]} />
            <View style={[styles.gradientCircle, styles.circle3]} />
          </View>

          {/* Logo and Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: logoScale }
                ],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandSubtitle}>Καλώς ήρθατε πίσω</Text>
          </Animated.View>

          {/* Main Form Card */}
          <Animated.View 
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Κωδικός Πρόσβασης"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>
                Ξεχάσατε τον κωδικό σας;
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.signInButtonText}>Σύνδεση</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ή</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/auth/sign-up')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.signUpButtonText}>
                Δημιουργία Λογαριασμού
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              { opacity: fadeAnim },
            ]}
          >
            <View style={styles.footerRow}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.textSecondary} />
              <Text style={styles.footerText}>Ασφαλής Σύνδεση</Text>
            </View>
            <Text style={styles.copyrightText}>
              © 2024 AGGELOS Rentals
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="key" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Επαναφορά Κωδικού</Text>
              <Text style={styles.modalDescription}>
                Εισάγετε το email σας για να λάβετε οδηγίες επαναφοράς
              </Text>
            </View>
            
            <View style={styles.modalInputWrapper}>
              <View style={styles.modalInputContainer}>
                <Ionicons name="mail" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowForgotPassword(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSendButton}
                onPress={handleSendResetEmail}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalSendText}>Αποστολή</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  // Gradient Background
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.08,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: Colors.primary,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: Colors.secondary,
    bottom: -100,
    left: -80,
  },
  circle3: {
    width: 200,
    height: 200,
    backgroundColor: Colors.info,
    top: height * 0.5,
    right: -50,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  logoWrapper: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 120,
  },
  brandSubtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: Spacing.sm,
  },
  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    ...Shadows.lg,
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    height: 54,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Buttons
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    marginBottom: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dividerContainer: {
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
    fontSize: 13,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
    fontWeight: '500',
  },
  signUpButton: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  signUpButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  copyrightText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    ...Shadows.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInputWrapper: {
    marginBottom: Spacing.xl,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    height: 54,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  modalSendButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    gap: 6,
    ...Shadows.sm,
  },
  modalSendText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
