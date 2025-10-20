import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../utils/design-system';

const { width } = Dimensions.get('window');

interface FABAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
}

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [rotation] = useState(new Animated.Value(0));

  const toggleFAB = () => {
    const toValue = isOpen ? 0 : 1;
    const rotationValue = isOpen ? 0 : 1;

    Animated.parallel([
      Animated.spring(animation, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(rotation, {
        toValue: rotationValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    setIsOpen(!isOpen);
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const actionButtons = actions.map((action, index) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -(index + 1) * 70],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        key={action.id}
        style={[
          styles.actionButton,
          {
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButtonContent, { backgroundColor: action.color }]}
          onPress={() => {
            action.onPress();
            toggleFAB();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>{action.icon}</Text>
        </TouchableOpacity>
        <View style={styles.actionLabel}>
          <Text style={styles.actionLabelText}>{action.label}</Text>
        </View>
      </Animated.View>
    );
  });

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      {actionButtons}
      
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggleFAB}
          activeOpacity={1}
        />
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleFAB}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.fabContent,
            {
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Higher above bottom tab bar
    right: 20,
    zIndex: 9999, // Above navbar
    elevation: 9999, // For Android
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    elevation: 8,
  },
  fabContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
  },
  actionButtonContent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    elevation: 6,
  },
  actionIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  actionLabel: {
    position: 'absolute',
    right: 60,
    top: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  actionLabelText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
});
