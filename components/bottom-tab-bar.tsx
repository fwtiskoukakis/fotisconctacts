import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Glassmorphism } from '../utils/design-system';

const { width } = Dimensions.get('window');

interface TabItem {
  key: string;
  label: string;
  icon: string;
  route: string;
}

const tabs: TabItem[] = [
  {
    key: 'home',
    label: 'Αρχική',
    icon: '🏠',
    route: '/',
  },
  {
    key: 'contracts',
    label: 'Συμβόλαια',
    icon: '📋',
    route: '/contracts',
  },
  {
    key: 'damage',
    label: 'Ζημιές',
    icon: '⚠️',
    route: '/damage-report',
  },
  {
    key: 'cars',
    label: 'Αυτοκίνητα',
    icon: '🚗',
    route: '/cars',
  },
  {
    key: 'analytics',
    label: 'Αναφορές',
    icon: '📊',
    route: '/analytics',
  },
  {
    key: 'profile',
    label: 'Προφίλ',
    icon: '👤',
    route: '/profile',
  },
];

interface BottomTabBarProps {
  onTabPress?: (tab: TabItem) => void;
}

export function BottomTabBar({ onTabPress }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleTabPress(tab: TabItem) {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      router.push(tab.route);
    }
  }

  function isActive(route: string): boolean {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.activeTab]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabContent, active && styles.activeTabContent]}>
                <Text style={[styles.tabIcon, active && styles.activeTabIcon]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </View>
              {active && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    ...Glassmorphism.light,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeTabContent: {
    // Additional styling for active state
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  activeTabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});
