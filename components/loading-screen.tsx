import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { FleetOSLogo } from './fleetos-logo';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ 
  onLoadingComplete, 
  duration = 3000 
}: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the loading sequence
    startLoadingSequence();
  }, []);

  const startLoadingSequence = () => {
    // Create a sequence of animations
    const sequence = Animated.sequence([
      // Initial fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      
      // Logo scale in
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      
      // Text fade in
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Start the sequence
    sequence.start();

    // Start continuous animations
    startContinuousAnimations();

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration - 500, // Leave 500ms for fade out
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Complete loading after duration
    setTimeout(() => {
      fadeOut();
    }, duration);
  };

  const startContinuousAnimations = () => {
    // Continuous rotation animation
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotation.start();

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  };

  const fadeOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onLoadingComplete?.();
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.6],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background gradient */}
      <View style={styles.background} />
      
      {/* Floating particles */}
      <View style={styles.particles}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: (width / 7) * (index + 1),
                top: height * 0.2 + Math.sin(index) * 50,
                transform: [
                  { rotate: rotation },
                  { scale: pulseAnim },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo container with animations */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotation },
              ],
            },
          ]}
        >
          <FleetOSLogo 
            variant="icon" 
            size={120} 
            style={styles.logo}
          />
        </Animated.View>

        {/* App name */}
        <Animated.View style={{ opacity: textFadeAnim }}>
          <Text style={styles.appName}>FleetOS</Text>
          <Text style={styles.tagline}>Fleet Management System</Text>
        </Animated.View>

        {/* Loading progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
          <Animated.Text style={[styles.loadingText, { opacity: textFadeAnim }]}>
            Loading...
          </Animated.Text>
        </View>
      </View>

      {/* Bottom decorative elements */}
      <View style={styles.bottomDecorations}>
        <Animated.View
          style={[
            styles.decorationCircle,
            {
              transform: [
                { rotate: rotation },
                { scale: pulseAnim },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.decorationCircle,
            styles.decorationCircleSmall,
            {
              transform: [
                { rotate: rotation },
                { scale: pulseAnim },
              ],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.primaryDark} 100%)`,
  },
  particles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryLight,
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: Spacing.xxxl,
    ...Shadows.lg,
  },
  logo: {
    ...Shadows.xl,
  },
  appName: {
    ...Typography.largeTitle,
    color: Colors.text,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    width: width * 0.7,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.glassMedium,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomDecorations: {
    position: 'absolute',
    bottom: height * 0.15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  decorationCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    opacity: 0.3,
  },
  decorationCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
});
