/**
 * Maintenance Urgency Utilities
 * Calculates urgency levels and colors for vehicle maintenance items
 */

import { differenceInDays } from 'date-fns';
import { Colors } from './design-system';

export type UrgencyLevel = 'expired' | 'critical' | 'warning' | 'soon' | 'ok';

export interface UrgencyResult {
  level: UrgencyLevel;
  color: string;
  daysRemaining: number;
  label: string;
}

/**
 * Calculate urgency level based on expiry date
 * @param expiryDate - The expiry date to check
 * @returns Urgency result with level, color, and days remaining
 */
export function calculateExpiryUrgency(expiryDate: Date | null | undefined): UrgencyResult {
  if (!expiryDate) {
    return {
      level: 'ok',
      color: Colors.textSecondary,
      daysRemaining: Infinity,
      label: 'Μη καθορισμένο',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const daysRemaining = differenceInDays(expiry, today);

  if (daysRemaining < 0) {
    return {
      level: 'expired',
      color: Colors.error,
      daysRemaining,
      label: `Έληξε πριν ${Math.abs(daysRemaining)} ημέρες`,
    };
  }

  if (daysRemaining === 0) {
    return {
      level: 'expired',
      color: Colors.error,
      daysRemaining: 0,
      label: 'Λήγει σήμερα',
    };
  }

  if (daysRemaining <= 7) {
    return {
      level: 'critical',
      color: '#FF3B30', // Bright red
      daysRemaining,
      label: `${daysRemaining} ημέρες`,
    };
  }

  if (daysRemaining <= 30) {
    return {
      level: 'warning',
      color: '#FF9500', // Orange
      daysRemaining,
      label: `${daysRemaining} ημέρες`,
    };
  }

  if (daysRemaining <= 60) {
    return {
      level: 'soon',
      color: '#FFCC00', // Yellow
      daysRemaining,
      label: `${daysRemaining} ημέρες`,
    };
  }

  return {
    level: 'ok',
    color: Colors.success,
    daysRemaining,
    label: `${daysRemaining} ημέρες`,
  };
}

/**
 * Calculate urgency for service based on mileage
 * @param currentMileage - Current vehicle mileage
 * @param nextServiceMileage - Target mileage for next service
 * @returns Urgency result with level, color, and km remaining
 */
export function calculateServiceUrgency(
  currentMileage: number,
  nextServiceMileage: number | null | undefined
): UrgencyResult {
  if (!nextServiceMileage) {
    return {
      level: 'ok',
      color: Colors.textSecondary,
      daysRemaining: Infinity,
      label: 'Μη καθορισμένο',
    };
  }

  const kmRemaining = nextServiceMileage - currentMileage;

  if (kmRemaining <= 0) {
    return {
      level: 'expired',
      color: Colors.error,
      daysRemaining: kmRemaining,
      label: `Υπέρβαση ${Math.abs(kmRemaining)} km`,
    };
  }

  if (kmRemaining <= 500) {
    return {
      level: 'critical',
      color: '#FF3B30',
      daysRemaining: kmRemaining,
      label: `${kmRemaining} km`,
    };
  }

  if (kmRemaining <= 1000) {
    return {
      level: 'warning',
      color: '#FF9500',
      daysRemaining: kmRemaining,
      label: `${kmRemaining} km`,
    };
  }

  if (kmRemaining <= 2000) {
    return {
      level: 'soon',
      color: '#FFCC00',
      daysRemaining: kmRemaining,
      label: `${kmRemaining} km`,
    };
  }

  return {
    level: 'ok',
    color: Colors.success,
    daysRemaining: kmRemaining,
    label: `${kmRemaining} km`,
  };
}

/**
 * Get the most urgent maintenance item from multiple urgency results
 */
export function getMostUrgent(...urgencies: UrgencyResult[]): UrgencyResult {
  const priorityMap: Record<UrgencyLevel, number> = {
    expired: 0,
    critical: 1,
    warning: 2,
    soon: 3,
    ok: 4,
  };

  return urgencies.reduce((mostUrgent, current) => {
    if (priorityMap[current.level] < priorityMap[mostUrgent.level]) {
      return current;
    }
    if (
      priorityMap[current.level] === priorityMap[mostUrgent.level] &&
      current.daysRemaining < mostUrgent.daysRemaining
    ) {
      return current;
    }
    return mostUrgent;
  });
}

/**
 * Format days remaining in a human-readable format
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) {
    return `Έληξε πριν ${Math.abs(days)} ημέρες`;
  }
  if (days === 0) {
    return 'Λήγει σήμερα';
  }
  if (days === 1) {
    return 'Λήγει αύριο';
  }
  if (days <= 30) {
    return `Λήγει σε ${days} ημέρες`;
  }
  if (days <= 60) {
    const weeks = Math.floor(days / 7);
    return `Λήγει σε ${weeks} εβδομάδες`;
  }
  const months = Math.floor(days / 30);
  return `Λήγει σε ${months} μήνες`;
}
