/**
 * FleetOS Design System
 * Centralized design tokens with FleetOS branding and glass morphism effects
 */

import { FleetOSColors } from './brand-colors';

// FleetOS Brand Colors
export const Colors = {
  // Primary Brand Colors (FleetOS Cyan)
  primary: FleetOSColors.primary.cyan,
  primaryDark: FleetOSColors.primary.cyanDark,
  primaryLight: FleetOSColors.primary.cyanLight,
  
  // Secondary Colors
  secondary: '#5856D6',
  secondaryDark: '#3634A3',
  secondaryLight: '#7D7AFF',
  
  // iOS System Colors
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemGreen: '#34C759',
  systemMint: '#00C7BE',
  systemTeal: '#30B0C7',
  systemCyan: '#32ADE6',
  systemBlue: '#007AFF',
  systemIndigo: '#5856D6',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  systemBrown: '#A2845E',
  
  // Status Colors
  success: FleetOSColors.status.success,
  error: FleetOSColors.status.error,
  warning: FleetOSColors.status.warning,
  info: FleetOSColors.status.info,
  
  // iOS Gray Scale
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  
  // Backgrounds
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F2F2F7',
  
  surface: '#FFFFFF',
  surfaceElevated: 'rgba(255, 255, 255, 0.95)',
  
  // Borders
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  separator: 'rgba(60, 60, 67, 0.29)',
  
  // Text Colors (iOS Style)
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  textInverse: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C43',
  quaternaryLabel: '#3C3C43',
  
  // Glass Effect Colors
  glassLight: 'rgba(255, 255, 255, 0.7)',
  glassMedium: 'rgba(255, 255, 255, 0.5)',
  glassDark: 'rgba(0, 0, 0, 0.3)',
  glassWhite: 'rgba(255, 255, 255, 0.8)',
  
  // Status Specific
  active: '#34C759',
  inactive: '#8E8E93',
  pending: '#FF9500',
  overdue: '#FF3B30',
};

// iOS 26 Spacing (using 4pt grid)
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// iOS Typography (San Francisco Pro)
export const Typography = {
  largeTitle: { 
    fontSize: 34, 
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: { 
    fontSize: 28, 
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: { 
    fontSize: 22, 
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: { 
    fontSize: 20, 
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  headline: { 
    fontSize: 17, 
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  body: { 
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodyLarge: { 
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 23,
    letterSpacing: -0.24,
  },
  callout: { 
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subheadline: { 
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: { 
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: { 
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: { 
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  // Additional typography styles
  h3: { 
    fontSize: 18, 
    fontWeight: '600' as const,
    lineHeight: 23,
    letterSpacing: -0.24,
  },
  h4: { 
    fontSize: 16, 
    fontWeight: '600' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  caption: { 
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  bodyMedium: { 
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  bodySmall: { 
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 19,
    letterSpacing: -0.16,
  },
  bodyXSmall: { 
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
};

// iOS 26 Shadows (Soft and Realistic)
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  // iOS-specific floating shadow
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
};

// iOS 26 Liquid Glass Effects
export const Glass = {
  // Ultra-thin glass for headers/navbars
  ultraThin: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Shadows.floating,
  },
  // Thin glass for cards
  thin: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...Shadows.md,
  },
  // Regular glass for elevated surfaces
  regular: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Shadows.lg,
  },
  // Thick glass for modals
  thick: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Shadows.xl,
  },
  // Tinted glass variants
  tinted: {
    backgroundColor: 'rgba(242, 242, 247, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...Shadows.md,
  },
  // Dark glass for dark mode
  dark: {
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.lg,
  },
};

// iOS Border Radius (Continuous curves)
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
  // iOS-specific radii
  card: 16,
  button: 12,
  pill: 20,
  modal: 24,
};

// Animation Configurations
export const Animations = {
  // iOS spring animation configs
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  springBouncy: {
    damping: 15,
    stiffness: 200,
    mass: 0.8,
  },
  springGentle: {
    damping: 25,
    stiffness: 250,
    mass: 1.2,
  },
  // Timing configs
  fast: 200,
  normal: 300,
  slow: 500,
};

// Layout Constants
export const Layout = {
  headerHeight: 56,
  headerHeightLarge: 96,
  tabBarHeight: 72,
  cardPadding: 16,
  screenPadding: 16,
  maxWidth: 1200,
  safeAreaTop: 44,
  safeAreaBottom: 34,
};

// Blur Intensities (for BlurView)
export const BlurIntensity = {
  subtle: 40,
  light: 60,
  regular: 80,
  strong: 100,
};

// Haptic Feedback Types
export const HapticFeedback = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  selection: 'selection',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
};

// iOS 26 Glass Morphism Effects
export const Glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(30px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(25px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(40px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
  },
  info: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
  },
};
