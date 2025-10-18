/**
 * Design System for AGGELOS Rentals App
 * Centralized colors, typography, spacing, and shadows
 */

export const Colors = {
  // Primary Brand Colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  
  // Secondary Brand Colors
  secondary: '#8b5cf6',
  secondaryDark: '#7c3aed',
  secondaryLight: '#a78bfa',
  
  // Status Colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  
  // Neutral Colors
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  // Text Colors
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // Status Specific
  active: '#10b981',
  inactive: '#6b7280',
  pending: '#f59e0b',
  overdue: '#ef4444',
  
  // Fuel Level Colors
  fuelHigh: '#10b981',
  fuelMedium: '#f59e0b',
  fuelLow: '#ef4444',
  
  // Damage Colors
  damageMinor: '#f59e0b',
  damageMajor: '#ef4444',
  damageCritical: '#dc2626',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: { 
    fontSize: 32, 
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: { 
    fontSize: 24, 
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: { 
    fontSize: 20, 
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: { 
    fontSize: 18, 
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: { 
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: { 
    fontSize: 14,
    lineHeight: 20,
  },
  caption: { 
    fontSize: 12,
    lineHeight: 16,
  },
  button: { 
    fontSize: 16, 
    fontWeight: '600' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Glassmorphism Effects - Fixed for better contrast
export const Glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.lg,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(15px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Shadows.lg,
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.lg,
  },
  primary: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    ...Shadows.lg,
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    ...Shadows.lg,
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    ...Shadows.lg,
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    ...Shadows.lg,
  },
  info: {
    backgroundColor: 'rgba(6, 182, 212, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)',
    ...Shadows.lg,
  },
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const Layout = {
  headerHeight: 60,
  tabBarHeight: 80,
  cardPadding: 16,
  screenPadding: 16,
  maxWidth: 1200,
};
