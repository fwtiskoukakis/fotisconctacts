import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from '../utils/design-system';

const { width } = Dimensions.get('window');

interface FabAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface ContextAwareFabProps {
  onNewContract?: () => void;
  onNewDamage?: () => void;
  onNewCar?: () => void;
  onNewUser?: () => void;
  onQuickPhoto?: () => void;
  onDamageTemplate?: () => void;
  onCarMaintenance?: () => void;
  onCarInspection?: () => void;
  onGenerateReport?: () => void;
  onExportData?: () => void;
  onScheduleReport?: () => void;
}

export function ContextAwareFab({
  onNewContract,
  onNewDamage,
  onNewCar,
  onNewUser,
  onQuickPhoto,
  onDamageTemplate,
  onCarMaintenance,
  onCarInspection,
  onGenerateReport,
  onExportData,
  onScheduleReport,
}: ContextAwareFabProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));

  function getActionsForCurrentPage(): FabAction[] {
    switch (pathname) {
      case '/':
        return [
          {
            id: 'new-contract',
            label: 'Νέο Συμβόλαιο',
            icon: '📋',
            onPress: () => {
              setIsExpanded(false);
              onNewContract?.();
            },
          },
          {
            id: 'new-damage',
            label: 'Καταγραφή Ζημιάς',
            icon: '⚠️',
            onPress: () => {
              setIsExpanded(false);
              onNewDamage?.();
            },
          },
          {
            id: 'new-user',
            label: 'Νέος Χρήστης',
            icon: '👤',
            onPress: () => {
              setIsExpanded(false);
              onNewUser?.();
            },
          },
        ];

      case '/contracts':
        return [
          {
            id: 'new-contract',
            label: 'Νέο Συμβόλαιο',
            icon: '📋',
            onPress: () => {
              setIsExpanded(false);
              onNewContract?.();
            },
          },
          {
            id: 'bulk-operations',
            label: 'Μαζικές Ενέργειες',
            icon: '⚡',
            onPress: () => {
              setIsExpanded(false);
              // TODO: Implement bulk operations
            },
          },
          {
            id: 'import-contracts',
            label: 'Εισαγωγή',
            icon: '📥',
            onPress: () => {
              setIsExpanded(false);
              // TODO: Implement import
            },
          },
        ];

      case '/damage-report':
        return [
          {
            id: 'new-damage',
            label: 'Νέα Ζημιά',
            icon: '⚠️',
            onPress: () => {
              setIsExpanded(false);
              onNewDamage?.();
            },
          },
          {
            id: 'quick-photo',
            label: 'Γρήγορη Φωτογραφία',
            icon: '📷',
            onPress: () => {
              setIsExpanded(false);
              onQuickPhoto?.();
            },
          },
        {
          id: 'damage-template',
          label: 'Πρότυπο Ζημιάς',
          icon: '📝',
          onPress: () => {
            setIsExpanded(false);
            onDamageTemplate?.();
          },
        },
        ];

      case '/cars':
        return [
          {
            id: 'new-car',
            label: 'Νέο Αυτοκίνητο',
            icon: '🚗',
            onPress: () => {
              setIsExpanded(false);
              onNewCar?.();
            },
          },
          {
            id: 'car-maintenance',
            label: 'Συντήρηση',
            icon: '🔧',
            onPress: () => {
              setIsExpanded(false);
              onCarMaintenance?.();
            },
          },
          {
            id: 'car-inspection',
            label: 'Επιθεώρηση',
            icon: '🔍',
            onPress: () => {
              setIsExpanded(false);
              onCarInspection?.();
            },
          },
        ];

      case '/analytics':
        return [
          {
            id: 'generate-report',
            label: 'Αναφορά',
            icon: '📊',
            onPress: () => {
              setIsExpanded(false);
              onGenerateReport?.();
            },
          },
          {
            id: 'export-data',
            label: 'Εξαγωγή',
            icon: '📤',
            onPress: () => {
              setIsExpanded(false);
              onExportData?.();
            },
          },
          {
            id: 'schedule-report',
            label: 'Προγραμματισμός',
            icon: '⏰',
            onPress: () => {
              setIsExpanded(false);
              onScheduleReport?.();
            },
          },
        ];

      case '/profile':
        return [
          {
            id: 'edit-profile',
            label: 'Επεξεργασία',
            icon: '✏️',
            onPress: () => {
              setIsExpanded(false);
              // TODO: Implement profile edit
            },
          },
          {
            id: 'settings',
            label: 'Ρυθμίσεις',
            icon: '⚙️',
            onPress: () => {
              setIsExpanded(false);
              // TODO: Navigate to settings
            },
          },
          {
            id: 'backup-data',
            label: 'Αντίγραφο',
            icon: '💾',
            onPress: () => {
              setIsExpanded(false);
              // TODO: Implement data backup
            },
          },
        ];

      default:
        return [
          {
            id: 'new-contract',
            label: 'Νέο Συμβόλαιο',
            icon: '📋',
            onPress: () => {
              setIsExpanded(false);
              onNewContract?.();
            },
          },
        ];
    }
  }

  function toggleExpanded() {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: newExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: newExpanded ? 1 : 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }

  const actions = getActionsForCurrentPage();

  return (
    <View style={styles.container}>
      {/* Actions Modal */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExpanded(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsExpanded(false)}
        >
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={[
                  styles.actionItem,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        scale: scaleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                      {
                        translateY: scaleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.actionButton, Glass.regular]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <Animated.Text
          style={[
            styles.fabIcon,
            {
              transform: [
                {
                  rotate: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            },
          ]}
        >
          +
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Higher above bottom tab bar
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.lg,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 120, // Space above bottom tab bar
  },
  actionsContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionItem: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    minWidth: 160,
    ...Shadows.md,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
});
