import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { BottomTabBar } from '../../components/bottom-tab-bar';
import { ContextAwareFab } from '../../components/context-aware-fab';
import { Colors } from '../../utils/design-system';

/**
 * Shared layout for main app pages with persistent bottom navigation
 * Only the content (Slot) will change when navigating, not the navbar
 */
export default function TabsLayout() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App Header - shown on all tab pages */}
      <AppHeader showActions={true} />
      
      {/* Page Content - this changes when navigating */}
      <View style={styles.content}>
        <Slot />
        
        {/* Floating Action Button - context-aware */}
        <ContextAwareFab
          onNewContract={() => router.push('/new-contract')}
          onNewDamage={() => router.push('/new-damage')} // Navigate to new damage screen
          onNewCar={() => router.push('/fleet-management')} // Navigate to fleet management to add new car
        />
      </View>
      
      {/* Bottom Tab Bar - persistent across navigation */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});

