import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../utils/design-system';

interface FilterOptions {
  status: 'all' | 'active' | 'completed' | 'upcoming';
  dateRange: 'all' | 'today' | 'week' | 'month';
  priceRange: 'all' | 'low' | 'medium' | 'high';
  fuelLevel: 'all' | 'high' | 'medium' | 'low';
}

interface AdvancedSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export function AdvancedSearch({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
}: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false);

  function updateFilter(key: keyof FilterOptions, value: string) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function getFilterCount() {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.fuelLevel !== 'all') count++;
    return count;
  }

  const filterCount = getFilterCount();

  return (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Αναζήτηση συμβολαίων..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, filterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filter Chips */}
      {filterCount > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          {filters.status !== 'all' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {filters.status === 'active' ? 'Ενεργά' : 
                 filters.status === 'completed' ? 'Ολοκληρωμένα' : 'Επερχόμενα'}
              </Text>
              <TouchableOpacity
                onPress={() => updateFilter('status', 'all')}
                style={styles.chipClose}
              >
                <Text style={styles.chipCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {filters.dateRange !== 'all' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {filters.dateRange === 'today' ? 'Σήμερα' :
                 filters.dateRange === 'week' ? 'Εβδομάδα' : 'Μήνας'}
              </Text>
              <TouchableOpacity
                onPress={() => updateFilter('dateRange', 'all')}
                style={styles.chipClose}
              >
                <Text style={styles.chipCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {filters.priceRange !== 'all' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {filters.priceRange === 'low' ? 'Χαμηλό κόστος' :
                 filters.priceRange === 'medium' ? 'Μεσαίο κόστος' : 'Υψηλό κόστος'}
              </Text>
              <TouchableOpacity
                onPress={() => updateFilter('priceRange', 'all')}
                style={styles.chipClose}
              >
                <Text style={styles.chipCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {filters.fuelLevel !== 'all' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {filters.fuelLevel === 'high' ? 'Υψηλή στάθμη' :
                 filters.fuelLevel === 'medium' ? 'Μεσαία στάθμη' : 'Χαμηλή στάθμη'}
              </Text>
              <TouchableOpacity
                onPress={() => updateFilter('fuelLevel', 'all')}
                style={styles.chipClose}
              >
                <Text style={styles.chipCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.clearAllChip}
            onPress={onClearFilters}
          >
            <Text style={styles.clearAllText}>Καθαρισμός όλων</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Φίλτρα Αναζήτησης</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Κατάσταση</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: 'Όλα' },
                    { key: 'active', label: 'Ενεργά' },
                    { key: 'completed', label: 'Ολοκληρωμένα' },
                    { key: 'upcoming', label: 'Επερχόμενα' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        filters.status === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => updateFilter('status', option.key)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.status === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Χρονικό Διάστημα</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: 'Όλα' },
                    { key: 'today', label: 'Σήμερα' },
                    { key: 'week', label: 'Εβδομάδα' },
                    { key: 'month', label: 'Μήνας' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        filters.dateRange === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => updateFilter('dateRange', option.key)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.dateRange === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Κόστος</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: 'Όλα' },
                    { key: 'low', label: '€0-50' },
                    { key: 'medium', label: '€50-150' },
                    { key: 'high', label: '€150+' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        filters.priceRange === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => updateFilter('priceRange', option.key)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.priceRange === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fuel Level Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Στάθμη Καυσίμου</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: 'Όλα' },
                    { key: 'high', label: 'Υψηλή (6-8)' },
                    { key: 'medium', label: 'Μεσαία (3-5)' },
                    { key: 'low', label: 'Χαμηλή (1-2)' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        filters.fuelLevel === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => updateFilter('fuelLevel', option.key)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.fuelLevel === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  onClearFilters();
                  setShowFilters(false);
                }}
              >
                <Text style={styles.clearFiltersText}>Καθαρισμός Φίλτρων</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFiltersText}>Εφαρμογή</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
  chipsContainer: {
    maxHeight: 50,
  },
  chipsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '500',
  },
  chipClose: {
    padding: 2,
  },
  chipCloseText: {
    fontSize: 12,
    color: Colors.textInverse,
  },
  clearAllChip: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  clearAllText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    ...Shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
    padding: Spacing.sm,
  },
  modalBody: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterSectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  clearFiltersText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyFiltersText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontWeight: '600',
  },
});
