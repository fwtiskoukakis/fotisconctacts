import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../../components/glass-card';
import { Colors, Typography, Glass } from '../../utils/design-system';
import { smoothScrollConfig } from '../../utils/animations';
import { AuthService } from '../../services/auth.service';
import { useNotifications } from '../../hooks/useNotifications';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false);
  const { sendTestNotification } = useNotifications();

  const handleSignOut = async () => {
    Alert.alert('Αποσύνδεση', 'Θέλετε να αποσυνδεθείτε;', [
      { text: 'Ακύρωση', style: 'cancel' },
      {
        text: 'Αποσύνδεση',
        style: 'destructive',
        onPress: async () => {
          await AuthService.signOut();
          router.replace('/auth/sign-in');
        },
      },
    ]);
  };

  const SettingItem = ({ icon, label, onPress, showArrow = true, value, onValueChange }: any) => (
    <TouchableOpacity style={s.item} onPress={onValueChange ? undefined : onPress} disabled={!!onValueChange}>
      <View style={s.itemLeft}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
        <Text style={s.itemLabel}>{label}</Text>
      </View>
      {onValueChange ? (
        <Switch value={value} onValueChange={onValueChange} trackColor={{ true: Colors.primary }} />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>

      <View style={s.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={s.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={s.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={s.breadcrumbCurrent}>Ρυθμίσεις</Text>
      </View>

      <ScrollView style={s.content} {...smoothScrollConfig}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Λογαριασμός</Text>
          <View style={s.card}>
            <SettingItem icon="person" label="Προφίλ" onPress={() => router.push('/profile')} />
            <SettingItem icon="shield-checkmark" label="Ασφάλεια" onPress={() => Alert.alert('Σύντομα', 'Η λειτουργία θα είναι διαθέσιμη σύντομα')} />
            <SettingItem icon="receipt" label="Ρυθμίσεις AADE" onPress={() => router.push('/aade-settings')} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ειδοποιήσεις</Text>
          <View style={s.card}>
            <SettingItem icon="notifications" label="Ειδοποιήσεις" value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            <SettingItem icon="mail" label="Email Ειδοποιήσεις" value={true} onValueChange={() => {}} />
            <SettingItem 
              icon="flask" 
              label="Test Push Notification" 
              onPress={async () => {
                try {
                  await sendTestNotification();
                  Alert.alert('Επιτυχία', 'Η δοκιμαστική ειδοποίηση στάλθηκε!');
                } catch (error) {
                  Alert.alert('Σφάλμα', 'Αποτυχία αποστολής ειδοποίησης');
                }
              }} 
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ασφάλεια</Text>
          <View style={s.card}>
            <SettingItem icon="finger-print" label="Biometric Login" value={biometricsEnabled} onValueChange={setBiometricsEnabled} />
            <SettingItem icon="key" label="Αλλαγή Κωδικού" onPress={() => router.push('/auth/reset-password')} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Γενικά</Text>
          <View style={s.card}>
            <SettingItem icon="information-circle" label="Πληροφορίες" onPress={() => Alert.alert('Εφαρμογή', 'Έκδοση 1.0.0')} />
            <SettingItem icon="document-text" label="Όροι Χρήσης" onPress={() => Alert.alert('Όροι Χρήσης', 'Σύντομα διαθέσιμο')} />
            <SettingItem icon="lock-closed" label="Πολιτική Απορρήτου" onPress={() => Alert.alert('Πολιτική', 'Σύντομα διαθέσιμο')} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>🧪 Developer / Test</Text>
          <View style={s.card}>
            <SettingItem icon="camera" label="📸 Contract Photo Upload Test" onPress={() => router.push('/contract-photo-upload-test')} />
            <SettingItem icon="flask" label="🎨 Dark Mode Test" onPress={() => router.push('/dark-mode-test')} />
            <SettingItem icon="document" label="📄 Contract Photo Test" onPress={() => router.push('/contract-photo-test')} />
          </View>
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color={Colors.error} />
          <Text style={s.signOutText}>Αποσύνδεση</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 6 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breadcrumbText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  breadcrumbCurrent: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  content: { flex: 1, padding: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemLabel: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.error + '10', padding: 14, borderRadius: 12, marginVertical: 16 },
  signOutText: { fontSize: 14, fontWeight: '700', color: Colors.error },
});
