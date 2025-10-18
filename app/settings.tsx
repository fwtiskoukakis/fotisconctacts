import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/app-header';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../utils/design-system';

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSync: true,
    biometricAuth: false,
    emailReports: true,
  });

  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Λογαριασμός',
      items: [
        {
          id: 'profile',
          title: 'Προφίλ',
          subtitle: 'Επεξεργασία προσωπικών στοιχείων',
          icon: '👤',
          type: 'navigation',
          onPress: () => router.push('/profile'),
        },
        {
          id: 'security',
          title: 'Ασφάλεια',
          subtitle: 'Κωδικός πρόσβασης και εισόδος',
          icon: '🔒',
          type: 'navigation',
          onPress: () => router.push('/security'),
        },
        {
          id: 'preferences',
          title: 'Προτιμήσεις',
          subtitle: 'Γλώσσα και εμφάνιση',
          icon: '⚙️',
          type: 'navigation',
          onPress: () => router.push('/preferences'),
        },
      ],
    },
    {
      id: 'aade',
      title: 'Ψηφιακό Πελατολόγιο',
      items: [
        {
          id: 'aade-config',
          title: 'Ρυθμίσεις Πελατολογίου',
          subtitle: 'Digital Client Registry - ΑΑΔΕ',
          icon: '🏛️',
          type: 'navigation',
          onPress: () => router.push('/aade-settings'),
        },
      ],
    },
    {
      id: 'app',
      title: 'Εφαρμογή',
      items: [
        {
          id: 'notifications',
          title: 'Ειδοποιήσεις',
          subtitle: 'Λάβετε ειδοποιήσεις για νέα συμβόλαια',
          icon: '🔔',
          type: 'toggle',
          value: settings.notifications,
          onToggle: (value) => setSettings(prev => ({ ...prev, notifications: value })),
        },
        {
          id: 'autoSync',
          title: 'Αυτόματη Συγχρονισμός',
          subtitle: 'Συγχρονισμός με Supabase',
          icon: '🔄',
          type: 'toggle',
          value: settings.autoSync,
          onToggle: (value) => setSettings(prev => ({ ...prev, autoSync: value })),
        },
        {
          id: 'darkMode',
          title: 'Σκοτεινό Θέμα',
          subtitle: 'Ενεργοποίηση σκοτεινού θέματος',
          icon: '🌙',
          type: 'toggle',
          value: settings.darkMode,
          onToggle: (value) => setSettings(prev => ({ ...prev, darkMode: value })),
        },
      ],
    },
    {
      id: 'security',
      title: 'Ασφάλεια',
      items: [
        {
          id: 'biometricAuth',
          title: 'Βιομετρική Εισόδος',
          subtitle: 'Χρήση δακτυλικού αποτυπώματος ή Face ID',
          icon: '👆',
          type: 'toggle',
          value: settings.biometricAuth,
          onToggle: (value) => setSettings(prev => ({ ...prev, biometricAuth: value })),
        },
        {
          id: 'sessionTimeout',
          title: 'Λήξη Συνεδρίας',
          subtitle: 'Αυτόματη αποσύνδεση μετά από 30 λεπτά',
          icon: '⏰',
          type: 'navigation',
          onPress: () => router.push('/session-settings'),
        },
      ],
    },
    {
      id: 'data',
      title: 'Δεδομένα',
      items: [
        {
          id: 'backup',
          title: 'Αντίγραφο Ασφαλείας',
          subtitle: 'Δημιουργία αντιγράφου ασφαλείας',
          icon: '💾',
          type: 'action',
          onPress: () => handleBackup(),
        },
        {
          id: 'export',
          title: 'Εξαγωγή Δεδομένων',
          subtitle: 'Εξαγωγή συμβολαίων σε CSV',
          icon: '📤',
          type: 'action',
          onPress: () => handleExport(),
        },
        {
          id: 'clearData',
          title: 'Εκκαθάριση Δεδομένων',
          subtitle: 'Διαγραφή όλων των τοπικών δεδομένων',
          icon: '🗑️',
          type: 'action',
          onPress: () => handleClearData(),
        },
      ],
    },
    {
      id: 'support',
      title: 'Υποστήριξη',
      items: [
        {
          id: 'help',
          title: 'Βοήθεια',
          subtitle: 'Οδηγίες χρήσης',
          icon: '❓',
          type: 'navigation',
          onPress: () => router.push('/help'),
        },
        {
          id: 'contact',
          title: 'Επικοινωνία',
          subtitle: 'Επικοινωνία με την υποστήριξη',
          icon: '📞',
          type: 'navigation',
          onPress: () => router.push('/contact'),
        },
        {
          id: 'about',
          title: 'Σχετικά',
          subtitle: 'Έκδοση και πληροφορίες',
          icon: 'ℹ️',
          type: 'navigation',
          onPress: () => router.push('/about'),
        },
      ],
    },
  ];

  function handleBackup() {
    Alert.alert(
      'Αντίγραφο Ασφαλείας',
      'Θέλετε να δημιουργήσετε αντίγραφο ασφαλείας των δεδομένων σας;',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Δημιουργία',
          onPress: () => {
            // TODO: Implement backup functionality
            Alert.alert('Επιτυχία', 'Το αντίγραφο ασφαλείας δημιουργήθηκε επιτυχώς');
          },
        },
      ]
    );
  }

  function handleExport() {
    Alert.alert(
      'Εξαγωγή Δεδομένων',
      'Θέλετε να εξάγετε τα συμβόλαια σε αρχείο CSV;',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Εξαγωγή',
          onPress: () => {
            // TODO: Implement export functionality
            Alert.alert('Επιτυχία', 'Τα δεδομένα εξήχθησαν επιτυχώς');
          },
        },
      ]
    );
  }

  function handleClearData() {
    Alert.alert(
      'Εκκαθάριση Δεδομένων',
      'Είστε σίγουροι ότι θέλετε να διαγράψετε όλα τα τοπικά δεδομένα; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.',
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear data functionality
            Alert.alert('Επιτυχία', 'Τα δεδομένα διαγράφηκαν επιτυχώς');
          },
        },
      ]
    );
  }

  function renderSettingsItem(item: SettingsItem) {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingsItem}
        onPress={item.onPress}
        activeOpacity={item.type === 'toggle' ? 1 : 0.7}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemIcon}>{item.icon}</Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.itemRight}>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={item.value ? '#FFFFFF' : Colors.textSecondary}
            />
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderSettingsSection(section: SettingsSection) {
    return (
      <View key={section.id} style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionContent}>
          {section.items.map(renderSettingsItem)}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Ρυθμίσεις" showActions={false} />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Χρήστης</Text>
            <Text style={styles.userEmail}>user@example.com</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Επεξεργασία</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map(renderSettingsSection)}

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => {
              Alert.alert(
                'Αποσύνδεση',
                'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;',
                [
                  { text: 'Ακύρωση', style: 'cancel' },
                  {
                    text: 'Αποσύνδεση',
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Implement sign out functionality
                      router.push('/auth/sign-in');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.signOutText}>Αποσύνδεση</Text>
          </TouchableOpacity>
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
  scrollContainer: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  userAvatarText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  editButtonText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  itemRight: {
    marginLeft: Spacing.sm,
  },
  chevron: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  signOutSection: {
    margin: Spacing.md,
    marginBottom: Spacing.xl,
  },
  signOutButton: {
    backgroundColor: Colors.error,
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
});
