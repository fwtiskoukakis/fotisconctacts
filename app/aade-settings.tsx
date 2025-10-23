import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../utils/design-system';

/**
 * AADE Settings page - redirects to unified Profile page
 * All AADE settings are now merged into /profile
 */
export default function AADESettingsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified profile page (scroll to AADE section)
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
