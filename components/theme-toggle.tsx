import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeToggle, useThemeColors, useIsDarkMode } from '../contexts/theme-context';

interface ThemeToggleProps {
  style?: any;
}

export function ThemeToggle({ style }: ThemeToggleProps) {
  const { toggleTheme, currentTheme } = useThemeToggle();
  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'automatic':
        return 'phone-portrait';
      default:
        return 'sunny';
    }
  };

  const getThemeLabel = () => {
    switch (currentTheme) {
      case 'light':
        return 'Φωτεινό θέμα';
      case 'dark':
        return 'Σκοτεινό θέμα';
      case 'automatic':
        return 'Αυτόματο θέμα';
      default:
        return 'Φωτεινό θέμα';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons 
            name={getThemeIcon()} 
            size={24} 
            color={colors.primary} 
          />
        </View>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            Θέμα εφαρμογής
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {getThemeLabel()}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.textSecondary} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  rightContent: {
    marginLeft: 8,
  },
});

export default ThemeToggle;
