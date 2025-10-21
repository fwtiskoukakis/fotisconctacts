import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MainLayout } from '../components/main-layout';
import { useThemeColors } from '../contexts/theme-context';
import { GlassCard } from '../components/glass-card';

export default function DarkModeTest() {
  const colors = useThemeColors();

  return (
    <MainLayout scrollable>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          FleetOS Dark Mode Test
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This page demonstrates the dark mode implementation
        </Text>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Theme Colors
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Background: {colors.background}
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Text: {colors.text}
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Primary: {colors.primary}
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Surface: {colors.surface}
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Features
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            • Pure black background in dark mode
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            • Theme toggle in header (sun/moon icon)
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            • Automatic system theme detection
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            • FleetOS cyan accent color maintained
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            • Glass morphism effects adapt to theme
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            How to Test
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            1. Tap the sun/moon icon in the header
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            2. Switch your device theme in settings
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            3. Navigate through different pages
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            4. Notice all colors change consistently
          </Text>
        </GlassCard>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
});
