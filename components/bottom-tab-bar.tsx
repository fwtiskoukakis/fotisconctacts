import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Glassmorphism } from '../utils/design-system';

const { width, height } = Dimensions.get('window');

// Responsive sizing based on screen width
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isLargeDevice = width >= 414;

// Calculate responsive font sizes
const getResponsiveFontSize = () => {
  if (isSmallDevice) return 10;
  if (isMediumDevice) return 11;
  return 12; // Large devices like iPhone 15 Pro Max
};

const getResponsiveIconSize = () => {
  if (isSmallDevice) return 18;
  if (isMediumDevice) return 20;
  return 22; // Large devices
};

const getResponsiveIconSizeActive = () => {
  if (isSmallDevice) return 20;
  if (isMediumDevice) return 22;
  return 24; // Large devices
};

const getResponsivePadding = () => {
  if (isSmallDevice) return 6;
  if (isMediumDevice) return 8;
  return 10; // Large devices
};

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
                <Text 
                  style={[styles.tabLabel, active && styles.activeTabLabel]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit={isLargeDevice}
                  minimumFontScale={0.8}
                >
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
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    paddingVertical: getResponsivePadding(),
    paddingHorizontal: Spacing.xs,
    ...Glassmorphism.light,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: isLargeDevice ? 70 : 65,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(),
    paddingHorizontal: 2,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: isLargeDevice ? 4 : 2,
  },
  activeTabContent: {
    // Additional styling for active state
  },
  tabIcon: {
    fontSize: getResponsiveIconSize(),
    marginBottom: 1,
    lineHeight: getResponsiveIconSize() + 2,
  },
  activeTabIcon: {
    fontSize: getResponsiveIconSizeActive(),
    lineHeight: getResponsiveIconSizeActive() + 2,
  },
  tabLabel: {
    fontSize: getResponsiveFontSize(),
    lineHeight: getResponsiveFontSize() + 4,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
    maxWidth: '100%',
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: getResponsiveFontSize() + 0.5,
  },
  activeIndicator: {
    position: 'absolute',
    top: isLargeDevice ? 6 : 4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});
