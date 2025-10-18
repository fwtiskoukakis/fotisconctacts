import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../services/auth.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../utils/design-system';

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
  showActions?: boolean;
  onBackPress?: () => void;
}

export function AppHeader({ 
  showBack = false, 
  title, 
  showActions = true,
  onBackPress 
}: AppHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  async function handleSignOut() {
    await AuthService.signOut();
    router.replace('/auth/sign-in');
  }

  function handleBackPress() {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  }

  return (
    <>
      <View style={styles.header}>
        {/* Left: Back or Logo */}
        {showBack ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/')} style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>AGGELOS</Text>
              <Text style={styles.brandSubtitle}>RENTALS</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Center: Title */}
        {title && <Text style={styles.headerTitle}>{title}</Text>}

        {/* Right: Actions */}
        {showActions && (
          <View style={styles.headerActions}>
            {/* Notifications */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowNotifications(true)}
            >
              <Text style={styles.icon}>🔔</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>

            {/* User Menu */}
            <TouchableOpacity 
              style={styles.userButton}
              onPress={() => setShowUserMenu(true)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* User Menu Modal */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowUserMenu(false)}>
          <View style={styles.userMenu}>
            <View style={styles.userMenuHeader}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>A</Text>
                </View>
                <View>
                  <Text style={styles.userName}>Admin User</Text>
                  <Text style={styles.userEmail}>admin@aggelos.com</Text>
                </View>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowUserMenu(false);
                router.push('/user-management');
              }}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuText}>Διαχείριση Χρηστών</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowUserMenu(false);
                // TODO: Navigate to settings
              }}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>Ρυθμίσεις</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowUserMenu(false);
                // TODO: Navigate to reports
              }}
            >
              <Text style={styles.menuIcon}>📊</Text>
              <Text style={styles.menuText}>Αναφορές</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={[styles.menuItem, styles.dangerItem]}
              onPress={() => {
                setShowUserMenu(false);
                handleSignOut();
              }}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, styles.dangerText]}>Αποσύνδεση</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.notificationsModal}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.notificationsTitle}>Ειδοποιήσεις</Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.notificationsList}>
            {/* Notification Items */}
            <View style={styles.notificationItem}>
              <View style={[styles.notificationIcon, { backgroundColor: Colors.warning }]}>
                <Text style={styles.notificationEmoji}>⚠️</Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Επιστροφή Σήμερα</Text>
                <Text style={styles.notificationText}>
                  Toyota Corolla (ΑΒΓ-1234) επιστρέφεται σε 2 ώρες
                </Text>
                <Text style={styles.notificationTime}>πριν από 30 λεπτά</Text>
              </View>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notificationIcon, { backgroundColor: Colors.fuelLow }]}>
                <Text style={styles.notificationEmoji}>⛽</Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Χαμηλή Στάθμη Καυσίμου</Text>
                <Text style={styles.notificationText}>
                  Mercedes E200 επιστράφηκε με 2/8 καύσιμα
                </Text>
                <Text style={styles.notificationTime}>πριν από 1 ώρα</Text>
              </View>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notificationIcon, { backgroundColor: Colors.error }]}>
                <Text style={styles.notificationEmoji}>💰</Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Πληρωμή Εκκρεμεί</Text>
                <Text style={styles.notificationText}>
                  Συμβόλαιο #1234 - €250 εκκρεμεί
                </Text>
                <Text style={styles.notificationTime}>πριν από 2 ώρες</Text>
              </View>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notificationIcon, { backgroundColor: Colors.success }]}>
                <Text style={styles.notificationEmoji}>✅</Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Επιτυχής Επιστροφή</Text>
                <Text style={styles.notificationText}>
                  BMW X5 επιστράφηκε επιτυχώς
                </Text>
                <Text style={styles.notificationTime}>πριν από 3 ώρες</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandInfo: {
    alignItems: 'flex-start',
  },
  brandName: {
    ...Typography.h4,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    position: 'relative',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
  userButton: {
    padding: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: Spacing.md,
  },
  userMenu: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    minWidth: 250,
    ...Shadows.lg,
  },
  userMenuHeader: {
    padding: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: Colors.textInverse,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  menuIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
  },
  dangerItem: {
    backgroundColor: '#fef2f2',
  },
  dangerText: {
    color: Colors.error,
  },
  notificationsModal: {
    flex: 1,
    backgroundColor: Colors.surface,
    marginTop: 100,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.xl,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notificationsTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
    padding: Spacing.sm,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationEmoji: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  notificationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
});
