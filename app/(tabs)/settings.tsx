import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../utils/design-system';

/**
 * Settings page - redirects to unified Profile page
 * All settings are now merged into /profile
 */
export default function SettingsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified profile page
    router.replace('/profile');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
