import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { BottomTabBar } from '../../components/bottom-tab-bar';
import { Colors } from '../../utils/design-system';

/**
 * Shared layout for main app pages with persistent bottom navigation
 * Only the content (Slot) will change when navigating, not the navbar
 */
export default function TabsLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App Header - shown on all tab pages */}
      <AppHeader showActions={true} />
      
      {/* Page Content - this changes when navigating */}
      <View style={styles.content}>
        <Slot />
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

