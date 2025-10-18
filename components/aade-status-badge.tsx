import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getAADEStatusMessage } from '../utils/aade-contract-helper';

interface AADEStatusBadgeProps {
  status: string | null;
  dclId?: number | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  compact?: boolean;
}

/**
 * Display AADE submission status as a badge
 */
export function AADEStatusBadge({
  status,
  dclId,
  errorMessage,
  onRetry,
  compact = false,
}: AADEStatusBadgeProps) {
  const statusInfo = getAADEStatusMessage(status);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          { backgroundColor: statusInfo.color },
          compact && styles.badgeCompact,
        ]}
      >
        <Text style={styles.icon}>{statusInfo.icon}</Text>
        <Text style={styles.text}>{statusInfo.text}</Text>
      </View>

      {!compact && dclId && (
        <Text style={styles.dclId}>DCL ID: {dclId}</Text>
      )}

      {!compact && status === 'error' && errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Επανυποβολή</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 14,
    color: '#fff',
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  dclId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#fee',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    fontSize: 12,
    color: '#c00',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

