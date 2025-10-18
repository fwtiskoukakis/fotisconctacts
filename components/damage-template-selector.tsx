import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { DamageTemplate, DamageTemplateService } from '../services/damage-template.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface DamageTemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DamageTemplate) => void;
}

export function DamageTemplateSelector({
  visible,
  onClose,
  onSelectTemplate,
}: DamageTemplateSelectorProps) {
  const [templates, setTemplates] = useState<DamageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Όλα');

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const loadedTemplates = await DamageTemplateService.getAllTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading damage templates:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης προτύπων ζημιών');
    } finally {
      setLoading(false);
    }
  }

  const categories = ['Όλα', ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Όλα' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'minor': return Colors.success;
      case 'moderate': return Colors.warning;
      case 'severe': return Colors.error;
      default: return Colors.textSecondary;
    }
  }

  function getSeverityText(severity: string) {
    switch (severity) {
      case 'minor': return 'Μικρή';
      case 'moderate': return 'Μέτρια';
      case 'severe': return 'Σοβαρή';
      default: return 'Άγνωστη';
    }
  }

  function getDamageTypeIcon(type: string) {
    switch (type) {
      case 'scratch': return '🔸';
      case 'dent': return '🔹';
      case 'crack': return '⚡';
      case 'other': return '❓';
      default: return '❓';
    }
  }

  const renderTemplateItem = ({ item }: { item: DamageTemplate }) => (
    <TouchableOpacity
      style={[styles.templateItem, Glassmorphism.light]}
      onPress={() => {
        onSelectTemplate(item);
        onClose();
      }}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateIcon}>{getDamageTypeIcon(item.damageType)}</Text>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{item.name}</Text>
          <Text style={styles.templateDescription}>{item.description}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{getSeverityText(item.severity)}</Text>
        </View>
      </View>
      
      <View style={styles.templateDetails}>
        <Text style={styles.templateDetail}>Τοποθεσία: {item.location}</Text>
        <Text style={styles.templateDetail}>Κόστος: €{item.estimatedCost}</Text>
        <Text style={styles.templateDetail}>Κατηγορία: {item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, Glassmorphism.medium]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Πρότυπα Ζημιών</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Αναζήτηση προτύπων..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={categories}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === item && styles.categoryButtonTextSelected,
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          />

          {loading ? (
            <Text style={styles.loadingText}>Φόρτωση προτύπων...</Text>
          ) : (
            <FlatList
              data={filteredTemplates}
              renderItem={renderTemplateItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.templatesList}
              ListEmptyComponent={() => (
                <Text style={styles.emptyStateText}>Δεν βρέθηκαν πρότυπα.</Text>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '100%',
    height: '80%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  searchInput: {
    ...Typography.body,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoriesContainer: {
    marginBottom: Spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  categoryButtonTextSelected: {
    color: Colors.textInverse,
    fontWeight: 'bold',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  templatesList: {
    paddingBottom: Spacing.md,
  },
  templateItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  templateInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  templateName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 2,
  },
  templateDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  templateDetail: {
    ...Typography.bodyXSmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
