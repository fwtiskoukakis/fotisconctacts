import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { ContextAwareFab } from '../components/context-aware-fab';
import { SimpleGlassCard } from '../components/glass-card';
import { SupabaseContractService } from '../services/supabase-contract.service';
import { Contract } from '../models/contract.interface';
import { Colors, Typography, Spacing, Shadows, BorderRadius, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'pickup' | 'dropoff' | 'maintenance' | 'inspection' | 'other';
  contractId?: string;
  carId?: string;
  description?: string;
  isCompleted: boolean;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  async function loadCalendarEvents() {
    try {
      setLoading(true);
      const contracts = await SupabaseContractService.getAllContracts();
      const calendarEvents: CalendarEvent[] = [];

      // Convert contracts to calendar events
      contracts.forEach(contract => {
        // Pickup event
        calendarEvents.push({
          id: `${contract.id}-pickup`,
          title: `Παράλαβη - ${contract.renterInfo.fullName}`,
          date: new Date(contract.rentalPeriod.pickupDate),
          type: 'pickup',
          contractId: contract.id,
          description: `${contract.carInfo.makeModel} • ${contract.carInfo.licensePlate}`,
          isCompleted: contract.status === 'completed',
        });

        // Dropoff event
        calendarEvents.push({
          id: `${contract.id}-dropoff`,
          title: `Επιστροφή - ${contract.renterInfo.fullName}`,
          date: new Date(contract.rentalPeriod.dropoffDate),
          type: 'dropoff',
          contractId: contract.id,
          description: `${contract.carInfo.makeModel} • ${contract.carInfo.licensePlate}`,
          isCompleted: contract.status === 'completed',
        });
      });

      // Sort events by date
      calendarEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης ημερολογίου');
    } finally {
      setLoading(false);
    }
  }

  function getEventTypeColor(type: string) {
    switch (type) {
      case 'pickup': return Colors.success;
      case 'dropoff': return Colors.warning;
      case 'maintenance': return Colors.info;
      case 'inspection': return Colors.secondary;
      default: return Colors.textSecondary;
    }
  }

  function getEventTypeIcon(type: string) {
    switch (type) {
      case 'pickup': return '📥';
      case 'dropoff': return '📤';
      case 'maintenance': return '🔧';
      case 'inspection': return '🔍';
      default: return '📅';
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getTodayEvents(): CalendarEvent[] {
    const today = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === today.toDateString();
    });
  }

  function getUpcomingEvents(): CalendarEvent[] {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= nextWeek && !event.isCompleted;
    });
  }

  function renderEventItem(event: CalendarEvent) {
    return (
      <TouchableOpacity
        key={event.id}
        style={[styles.eventItem, Glass.regular]}
        onPress={() => {
          if (event.contractId) {
            router.push(`/contract-details?contractId=${event.contractId}`);
          }
        }}
      >
        <View style={styles.eventLeft}>
          <View style={[styles.eventTypeIndicator, { backgroundColor: getEventTypeColor(event.type) }]}>
            <Text style={styles.eventTypeIcon}>{getEventTypeIcon(event.type)}</Text>
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {event.description && (
              <Text style={styles.eventDescription}>{event.description}</Text>
            )}
            <Text style={styles.eventTime}>
              {formatDate(event.date)} • {formatTime(event.date)}
            </Text>
          </View>
        </View>
        
        <View style={styles.eventRight}>
          {event.isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          ) : (
            <Ionicons name="time" size={24} color={Colors.warning} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Δεν υπάρχουν γεγονότα</Text>
        <Text style={styles.emptySubtitle}>
          Δημιουργήστε συμβόλαια για να εμφανιστούν στο ημερολόγιο
        </Text>
      </View>
    );
  }

  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Ημερολόγιο" showActions={true} />
      
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={styles.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={styles.breadcrumbCurrent}>Ημερολόγιο</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        {...smoothScrollConfig}
      >
        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Σήμερα ({todayEvents.length})</Text>
            <View style={styles.eventsList}>
              {todayEvents.map(renderEventItem)}
            </View>
          </View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Επερχόμενα ({upcomingEvents.length})</Text>
            <View style={styles.eventsList}>
              {upcomingEvents.slice(0, 10).map(renderEventItem)}
            </View>
          </View>
        )}

        {/* All Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Όλα τα Γεγονότα ({events.length})</Text>
          {events.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.eventsList}>
              {events.map(renderEventItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Context-Aware Floating Action Button */}
      <ContextAwareFab
        onGenerateReport={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία δημιουργίας αναφοράς θα προστεθεί σύντομα');
        }}
        onExportData={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία εξαγωγής δεδομένων θα προστεθεί σύντομα');
        }}
        onScheduleReport={() => {
          Alert.alert('Συνέχεια', 'Η λειτουργία προγραμματισμού αναφορών θα προστεθεί σύντομα');
        }}
      />

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Already iOS color
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 6,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for bottom tab bar and FAB
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventsList: {
    paddingHorizontal: Spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  eventTypeIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventDescription: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventTime: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  eventRight: {
    marginLeft: Spacing.sm,
  },
  completedText: {
    fontSize: 16,
  },
  pendingText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
