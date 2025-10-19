/**
 * iOS 26 Animation Utilities
 * Smooth scrolling, transitions, and spring animations
 */

import { Animated, Easing } from 'react-native';
import { Animations } from './design-system';

/**
 * Create a spring animation with iOS-like physics
 */
export function springAnimation(
  value: Animated.Value,
  toValue: number,
  config?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
    useNativeDriver?: boolean;
  }
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue,
    damping: config?.damping ?? Animations.spring.damping,
    stiffness: config?.stiffness ?? Animations.spring.stiffness,
    mass: config?.mass ?? Animations.spring.mass,
    useNativeDriver: config?.useNativeDriver ?? true,
  });
}

/**
 * Create a timing animation with ease-in-out curve
 */
export function timingAnimation(
  value: Animated.Value,
  toValue: number,
  duration: number = Animations.normal,
  useNativeDriver: boolean = true
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1), // iOS ease-in-out
    useNativeDriver,
  });
}

/**
 * Fade in animation
 */
export function fadeIn(
  value: Animated.Value,
  duration: number = Animations.normal
): Animated.CompositeAnimation {
  return timingAnimation(value, 1, duration);
}

/**
 * Fade out animation
 */
export function fadeOut(
  value: Animated.Value,
  duration: number = Animations.normal
): Animated.CompositeAnimation {
  return timingAnimation(value, 0, duration);
}

/**
 * Slide up animation
 */
export function slideUp(
  value: Animated.Value,
  fromValue: number = 50,
  duration: number = Animations.normal
): Animated.CompositeAnimation {
  value.setValue(fromValue);
  return timingAnimation(value, 0, duration);
}

/**
 * Slide down animation
 */
export function slideDown(
  value: Animated.Value,
  toValue: number = 50,
  duration: number = Animations.normal
): Animated.CompositeAnimation {
  return timingAnimation(value, toValue, duration);
}

/**
 * Scale animation (for button press)
 */
export function scaleAnimation(
  value: Animated.Value,
  toValue: number,
  duration: number = Animations.fast
): Animated.CompositeAnimation {
  return timingAnimation(value, toValue, duration);
}

/**
 * Parallel animations
 */
export function parallel(
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation {
  return Animated.parallel(animations);
}

/**
 * Sequence animations
 */
export function sequence(
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation {
  return Animated.sequence(animations);
}

/**
 * Stagger animations
 */
export function stagger(
  delay: number,
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation {
  return Animated.stagger(delay, animations);
}

/**
 * Loop animation
 */
export function loop(
  animation: Animated.CompositeAnimation,
  iterations: number = -1 // -1 for infinite
): Animated.CompositeAnimation {
  return Animated.loop(animation, { iterations });
}

/**
 * Interpolate for smooth transitions
 */
export function interpolate(
  value: Animated.Value,
  inputRange: number[],
  outputRange: number[] | string[]
) {
  return value.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });
}

/**
 * Create a bouncy entrance animation
 */
export function bouncyEntrance(
  opacity: Animated.Value,
  translateY: Animated.Value,
  scale: Animated.Value
): Animated.CompositeAnimation {
  opacity.setValue(0);
  translateY.setValue(30);
  scale.setValue(0.9);

  return parallel([
    fadeIn(opacity, Animations.normal),
    springAnimation(translateY, 0, Animations.springBouncy),
    springAnimation(scale, 1, Animations.springBouncy),
  ]);
}

/**
 * Create a smooth scroll config
 */
export const smoothScrollConfig = {
  decelerationRate: 'fast' as const,
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
  bounces: true,
  bouncesZoom: false,
  scrollEventThrottle: 16,
  snapToAlignment: 'start' as const,
};

/**
 * iOS-style elastic scroll
 */
export const elasticScrollConfig = {
  ...smoothScrollConfig,
  decelerationRate: 0.998,
  snapToInterval: undefined,
  snapToOffsets: undefined,
};

