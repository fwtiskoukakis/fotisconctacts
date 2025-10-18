import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { ContractTemplate, ContractTemplateData } from '../models/contract-template.interface';
import { ContractTemplateService } from '../services/contract-template.service';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glassmorphism } from '../utils/design-system';

interface ContractTemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ContractTemplate) => void;
  onCreateCustom: () => void;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function ContractTemplateSelector({
  visible,
  onClose,
  onSelectTemplate,
  onCreateCustom,
}: ContractTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ContractTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const categories: TemplateCategory[] = [
    { id: 'all', name: 'Όλα', icon: '📋', color: Colors.primary },
    { id: 'standard', name: 'Standard', icon: '🚗', color: Colors.info },
    { id: 'luxury', name: 'Luxury', icon: '✨', color: Colors.warning },
    { id: 'commercial', name: 'Commercial', icon: '🚛', color: Colors.success },
    { id: 'long-term', name: 'Long-term', icon: '📅', color: Colors.secondary },
    { id: 'custom', name: 'Custom', icon: '⚙️', color: Colors.gray },
  ];

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const loadedTemplates = await ContractTemplateService.getAllTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης προτύπων');
    } finally {
      setLoading(false);
    }
  }

  function filterTemplates() {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }

  function handleSelectTemplate(template: ContractTemplate) {
    onSelectTemplate(template);
    onClose();
  }

  function renderTemplateItem({ item }: { item: ContractTemplate }) {
    const categoryInfo = categories.find(cat => cat.id === item.category);
    
    return (
      <TouchableOpacity
        style={[styles.templateCard, Glassmorphism.light]}
        onPress={() => handleSelectTemplate(item)}
        activeOpacity={0.7}
      >
        <View style={styles.templateHeader}>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{item.name}</Text>
            <Text style={styles.templateDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: categoryInfo?.color }]}>
            <Text style={styles.categoryIcon}>{categoryInfo?.icon}</Text>
          </View>
        </View>

        <View style={styles.templateDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Κατηγορία:</Text>
            <Text style={styles.detailValue}>{categoryInfo?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Χρήση:</Text>
            <Text style={styles.detailValue}>{item.usageCount} φορές</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Κόστος:</Text>
            <Text style={styles.detailValue}>€{item.templateData.baseDailyRate}/ημέρα</Text>
          </View>
        </View>

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3} περισσότερα</Text>
            )}
          </View>
        )}

        <View style={styles.templateFooter}>
          <Text style={styles.templateDate}>
            Δημιουργήθηκε: {new Date(item.createdAt).toLocaleDateString('el-GR')}
          </Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Προεπιλογή</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderCategoryFilter() {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
              { borderColor: category.color }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryButtonIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Δεν βρέθηκαν πρότυπα</Text>
        <Text style={styles.emptySubtitle}>
          {selectedCategory === 'all' 
            ? 'Δεν υπάρχουν διαθέσιμα πρότυπα συμβολαίων'
            : `Δεν υπάρχουν πρότυπα στην κατηγορία "${categories.find(c => c.id === selectedCategory)?.name}"`
          }
        </Text>
        <TouchableOpacity style={styles.createCustomButton} onPress={onCreateCustom}>
          <Text style={styles.createCustomButtonText}>Δημιουργία Προσαρμοσμένου</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Επιλογή Προτύπου</Text>
          <TouchableOpacity style={styles.createButton} onPress={onCreateCustom}>
            <Text style={styles.createButtonText}>Νέο</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Αναζήτηση προτύπων..."
              placeholderTextColor={Colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        {renderCategoryFilter()}

        {/* Templates List */}
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoriesContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  categoryButtonText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  templateCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  templateInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  templateName: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  templateDetails: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
  },
  moreTagsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    alignSelf: 'center',
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  defaultBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  defaultBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  createCustomButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  createCustomButtonText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
