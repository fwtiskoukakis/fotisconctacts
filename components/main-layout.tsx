import React from 'react';
import { View, StyleSheet, ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from './app-header';
import { BottomTabBar } from './bottom-tab-bar';
import { Colors } from '../utils/design-system';

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
}

/**
 * Main layout wrapper that provides persistent header and bottom navigation
 * Use this for all main pages to prevent navbar from re-rendering on navigation
 */
export function MainLayout({
  children,
  showHeader = true,
  showBottomNav = true,
  scrollable = false,
  scrollViewProps,
}: MainLayoutProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Persistent App Header */}
      {showHeader && <AppHeader showActions={true} />}
      
      {/* Page Content */}
      {scrollable ? (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>
          {children}
        </View>
      )}
      
      {/* Persistent Bottom Navigation */}
      {showBottomNav && <BottomTabBar />}
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 120, // Space for bottom nav
  },
});

