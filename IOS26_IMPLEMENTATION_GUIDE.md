# 🎨 iOS 26 Liquid Glass Implementation Guide

This guide explains how to implement iOS 26 Liquid Glass design across the entire app with smooth scrolling and modern interactions.

## 📋 Table of Contents
1. [Design System Overview](#design-system-overview)
2. [Global Components](#global-components)
3. [Page Implementation](#page-implementation)
4. [Smooth Scrolling](#smooth-scrolling)
5. [Animations](#animations)
6. [Best Practices](#best-practices)

---

## 🎨 Design System Overview

### Updated Design Tokens

The design system (`utils/design-system.ts`) now includes:

- **iOS System Colors** - Authentic iOS color palette
- **SF Pro Typography** - San Francisco font sizing
- **Liquid Glass Effects** - Pre-configured blur/transparency
- **Soft Shadows** - iOS-style depth
- **Animation Configs** - Spring and timing presets

### Key Imports

```typescript
import {
  Colors,
  Typography,
  Glass,
  BorderRadius,
  Shadows,
  BlurIntensity,
  Animations,
} from '../utils/design-system';
```

---

## 🧩 Global Components

### 1. AppHeader (✅ Complete)

Already redesigned with glass effect. Features:
- Translucent blur background
- iOS-style back button
- Modern user menu
- Smooth animations

### 2. BottomTabBar (✅ Complete)

Already redesigned with:
- Floating glass pill design
- 5 tabs (removed Analytics)
- Spring animations
- iOS icons

### 3. GlassCard Component (✅ New)

Reusable component for cards:

```typescript
import { GlassCard, SimpleGlassCard } from '../components/glass-card';

// With blur
<GlassCard variant="regular" style={{ padding: 16 }}>
  <Text>Content</Text>
</GlassCard>

// Without blur (better performance)
<SimpleGlassCard variant="thin" style={{ padding: 12 }}>
  <Text>Content</Text>
</SimpleGlassCard>
```

**Variants:**
- `ultraThin` - 50% opacity, for headers
- `thin` - 60% opacity, for cards
- `regular` - 70% opacity (default)
- `thick` - 85% opacity, for modals
- `tinted` - Colored glass effect

---

## 📱 Page Implementation

### Step-by-Step for Each Page

#### 1. Update Imports

```typescript
import { BlurView } from 'expo-blur';
import { Colors, Typography, Glass, BorderRadius, BlurIntensity } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { GlassCard, SimpleGlassCard } from '../components/glass-card';
```

#### 2. Update Background

Change from solid color to iOS gray:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F2F2F7 (iOS gray)
  },
});
```

#### 3. Replace Cards with GlassCard

**Before:**
```typescript
<View style={styles.card}>
  <Text>Content</Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Shadows.sm,
  },
});
```

**After:**
```typescript
<SimpleGlassCard style={{ padding: 16, marginBottom: 12 }}>
  <Text>Content</Text>
</SimpleGlassCard>
```

#### 4. Update Typography

Use iOS-style typography:

```typescript
// Title
<Text style={styles.title}>Title</Text>

const styles = StyleSheet.create({
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
});

// Body
<Text style={styles.body}>Body text</Text>

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
```

#### 5. Update Colors

Replace all colors with system colors:

```typescript
// Primary actions
backgroundColor: Colors.primary, // #007AFF

// Success/Active
backgroundColor: Colors.systemGreen, // #34C759

// Error/Destructive
backgroundColor: Colors.systemRed, // #FF3B30

// Warning
backgroundColor: Colors.systemOrange, // #FF9500

// Text
color: Colors.text, // #000000
color: Colors.textSecondary, // #8E8E93
```

---

## 📜 Smooth Scrolling

### Apply to All ScrollViews

```typescript
import { smoothScrollConfig } from '../utils/animations';

<ScrollView
  {...smoothScrollConfig}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
>
  {/* Content */}
</ScrollView>
```

### For Lists

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  {...smoothScrollConfig}
  contentContainerStyle={{ paddingBottom: 100 }}
/>
```

---

## ✨ Animations

### 1. Page Entrance Animations

```typescript
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { fadeIn, slideUp } from '../utils/animations';

export default function MyScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      fadeIn(fadeAnim),
      slideUp(slideAnim, 30),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Content */}
    </Animated.View>
  );
}
```

### 2. Button Press Animations

```typescript
import { useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';

function AnimatedButton() {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text>Press Me</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
```

---

## 🎯 Best Practices

### 1. Performance

- **Use `SimpleGlassCard` for lists** - Blur is expensive
- **Limit blur views** - Max 2-3 per screen
- **Use `useNativeDriver: true`** - For all animations
- **Memoize components** - Prevent unnecessary re-renders

### 2. Visual Hierarchy

```
Background (#F2F2F7) → Cards (glass) → Elevated (modal glass)
```

- Use different glass variants for depth
- Lighter glass for floating elements
- Heavier glass for modals

### 3. Spacing

Use consistent spacing from design system:

```typescript
padding: Spacing.md, // 12px
marginBottom: Spacing.lg, // 16px
gap: Spacing.sm, // 8px
```

### 4. Border Radius

Use semantic radii:

```typescript
borderRadius: BorderRadius.card, // 16px
borderRadius: BorderRadius.button, // 12px
borderRadius: BorderRadius.pill, // 20px
```

### 5. Shadows

Apply appropriate shadows:

```typescript
...Shadows.sm, // For cards
...Shadows.md, // For elevated cards
...Shadows.floating, // For floating elements
```

---

## 📄 Example Page Template

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/design-system';
import { smoothScrollConfig, fadeIn, slideUp } from '../utils/animations';

export default function MyScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([fadeIn(fadeAnim), slideUp(slideAnim, 30)]).start();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    // Load data
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="My Screen" showBack={true} showActions={true} />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={styles.breadcrumbText}>Home</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={styles.breadcrumbCurrent}>My Screen</Text>
      </View>

      <Animated.ScrollView
        style={styles.content}
        {...smoothScrollConfig}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <SimpleGlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Card Title</Text>
          <Text style={styles.cardBody}>Card content</Text>
        </SimpleGlassCard>
      </Animated.ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.glassLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    gap: 6,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    ...Typography.footnote,
    color: Colors.primary,
    fontWeight: '500',
  },
  breadcrumbCurrent: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  cardBody: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
```

---

## 🚀 Implementation Checklist

For each page:

- [ ] Import new design system
- [ ] Update background to `Colors.background`
- [ ] Replace cards with `SimpleGlassCard` or `GlassCard`
- [ ] Apply `smoothScrollConfig` to ScrollView
- [ ] Update typography with `Typography.*`
- [ ] Replace colors with `Colors.*`
- [ ] Add entrance animations
- [ ] Update breadcrumb styling
- [ ] Test on iOS and web

---

## 📚 Next Steps

1. **Start with homepage** (`app/index.tsx`)
2. **Move to list pages** (contracts, cars, damages)
3. **Update detail pages** (contract-details, car-details)
4. **Finish with forms** (new-contract, edit-contract)

Each page should take ~15-30 minutes to update following this guide!

