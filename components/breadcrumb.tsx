import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../utils/design-system';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter();

  function handlePress(path?: string) {
    if (path) {
      router.push(path as any);
    }
  }

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          {index > 0 && <Text style={styles.separator}>›</Text>}
          {item.path ? (
            <TouchableOpacity onPress={() => handlePress(item.path)}>
              <Text style={styles.link}>{item.label}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.current}>{item.label}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.xs,
  },
  link: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
  },
  current: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
});

