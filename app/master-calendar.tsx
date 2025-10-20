import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, Shadows, Glass } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';
import { CalendarService, CalendarEvent, CalendarView, VehicleAvailability } from '../services/calendar.service';
import { OrganizationService } from '../services/organization.service';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay, eachDayOfInterval } from 'date-fns';
import { el } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function MasterCalendarScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [calendarView, setCalendarView] = useState<CalendarView | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showVehicleFilter, setShowVehicleFilter] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewType, selectedVehicle]);

  async function loadCalendarData() {
    setLoading(true);
    try {
      const organization = await OrganizationService.getCurrentOrganization();
      if (!organization) {
        Alert.alert('Σφάλμα', 'Δεν βρέθηκε επιχείρηση.');
        router.back();
        return;
      }

      const calendarData = await CalendarService.getCalendarView(
        organization.id,
        viewType,
        currentDate,
        selectedVehicle ? [selectedVehicle] : undefined
      );

      setCalendarView(calendarData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης ημερολογίου.');
    } finally {
      setLoading(false);
    }
  }

  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ημερολόγιο Στόλου</Text>
          <Text style={styles.headerSubtitle}>
            {format(currentDate, 'MMMM yyyy', { locale: el })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowVehicleFilter(!showVehicleFilter)}
        >
          <Ionicons name="filter" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  function renderViewTypeSelector() {
    return (
      <View style={styles.viewTypeContainer}>
        {[
          { type: 'month', label: 'Μήνας', icon: 'calendar-outline' },
          { type: 'week', label: 'Εβδομάδα', icon: 'time-outline' },
          { type: 'day', label: 'Ημέρα', icon: 'today-outline' },
        ].map((view) => (
          <TouchableOpacity
            key={view.type}
            style={[
              styles.viewTypeButton,
              viewType === view.type && styles.viewTypeButtonActive,
            ]}
            onPress={() => setViewType(view.type as any)}
          >
            <Ionicons
              name={view.icon as any}
              size={16}
              color={viewType === view.type ? '#fff' : Colors.textSecondary}
            />
            <Text style={[
              styles.viewTypeText,
              viewType === view.type && styles.viewTypeTextActive,
            ]}>
              {view.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderMonthNavigation() {
    return (
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {format(currentDate, 'MMMM yyyy', { locale: el })}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  function renderMonthView() {
    if (!calendarView) return null;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'];

    return (
      <View style={styles.monthView}>
        {/* Week day headers */}
        <View style={styles.weekHeader}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.weekDayHeader}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((day) => {
            const dayEvents = calendarView.events.filter(event =>
              isSameDay(new Date(event.start), day) || 
              isSameDay(new Date(event.end), day) ||
              (new Date(event.start) <= day && new Date(event.end) >= day)
            );

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.calendarDay,
                  !isSameMonth(day, currentDate) && styles.calendarDayOtherMonth,
                  isSameDay(day, new Date()) && styles.calendarDayToday,
                ]}
                onPress={() => {
                  if (dayEvents.length > 0) {
                    setSelectedEvent(dayEvents[0]);
                  }
                }}
              >
                <Text style={[
                  styles.dayNumber,
                  !isSameMonth(day, currentDate) && styles.dayNumberOtherMonth,
                  isSameDay(day, new Date()) && styles.dayNumberToday,
                ]}>
                  {format(day, 'd')}
                </Text>
                
                {/* Event indicators */}
                <View style={styles.eventIndicators}>
                  {dayEvents.slice(0, 3).map((event, index) => (
                    <View
                      key={event.id}
                      style={[
                        styles.eventIndicator,
                        { backgroundColor: event.color },
                        index > 0 && styles.eventIndicatorStacked,
                      ]}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <Text style={styles.moreEventsText}>
                      +{dayEvents.length - 3}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  function renderWeekView() {
    if (!calendarView) return null;

    const weekStart = new Date(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() - weekStart.getDay() + i);
      return day;
    });

    return (
      <View style={styles.weekView}>
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => {
            const dayEvents = calendarView.events.filter(event =>
              isSameDay(new Date(event.start), day) || 
              isSameDay(new Date(event.end), day) ||
              (new Date(event.start) <= day && new Date(event.end) >= day)
            );

            return (
              <View key={day.toISOString()} style={styles.weekDayColumn}>
                <View style={[
                  styles.weekDayHeader,
                  isSameDay(day, new Date()) && styles.todayHeader,
                ]}>
                  <Text style={[
                    styles.weekDayName,
                    isSameDay(day, new Date()) && styles.todayHeaderText,
                  ]}>
                    {format(day, 'EEE', { locale: el })}
                  </Text>
                  <Text style={[
                    styles.weekDayNumber,
                    isSameDay(day, new Date()) && styles.todayHeaderText,
                  ]}>
                    {format(day, 'd')}
                  </Text>
                </View>
                
                <ScrollView style={styles.weekDayEvents}>
                  {dayEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.weekEvent,
                        { backgroundColor: event.color + '20', borderLeftColor: event.color },
                      ]}
                      onPress={() => setSelectedEvent(event)}
                    >
                      <Text style={styles.weekEventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.weekEventTime} numberOfLines={1}>
                        {format(new Date(event.start), 'HH:mm', { locale: el })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  function renderDayView() {
    if (!calendarView) return null;

    const dayEvents = calendarView.events.filter(event =>
      isSameDay(new Date(event.start), currentDate) || 
      isSameDay(new Date(event.end), currentDate) ||
      (new Date(event.start) <= currentDate && new Date(event.end) >= currentDate)
    );

    return (
      <View style={styles.dayView}>
        <Text style={styles.dayTitle}>
          {format(currentDate, 'EEEE, d MMMM yyyy', { locale: el })}
        </Text>
        
        <ScrollView style={styles.dayEvents}>
          {dayEvents.length === 0 ? (
            <SimpleGlassCard style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyDayTitle}>Καμία δραστηριότητα</Text>
              <Text style={styles.emptyDayDescription}>
                Δεν υπάρχουν ενοικιάσεις ή συντηρήσεις για αυτή την ημέρα
              </Text>
            </SimpleGlassCard>
          ) : (
            dayEvents.map((event) => (
              <SimpleGlassCard key={event.id} style={styles.dayEventCard}>
                <TouchableOpacity onPress={() => setSelectedEvent(event)}>
                  <View style={styles.dayEventHeader}>
                    <View style={[
                      styles.eventTypeIndicator,
                      { backgroundColor: event.color }
                    ]} />
                    <View style={styles.eventInfo}>
                      <Text style={styles.dayEventTitle}>{event.title}</Text>
                      <Text style={styles.dayEventType}>
                        {event.type === 'rental' ? 'Ενοικίαση' :
                         event.type === 'maintenance' ? 'Συντήρηση' :
                         event.type === 'blocked' ? 'Αποκλεισμένο' : 'Διαθέσιμο'}
                      </Text>
                    </View>
                    <View style={styles.eventTime}>
                      <Text style={styles.eventTimeText}>
                        {format(new Date(event.start), 'HH:mm', { locale: el })}
                      </Text>
                      {event.start !== event.end && (
                        <Text style={styles.eventTimeText}>
                          - {format(new Date(event.end), 'HH:mm', { locale: el })}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {event.description && (
                    <Text style={styles.dayEventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                  
                  {event.customerName && (
                    <View style={styles.eventCustomer}>
                      <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.eventCustomerText}>{event.customerName}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </SimpleGlassCard>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  function renderEventModal() {
    if (!selectedEvent) return null;

    return (
      <SimpleGlassCard style={styles.eventModal}>
        <View style={styles.eventModalHeader}>
          <Text style={styles.eventModalTitle}>Λεπτομέρειες Συμβάντος</Text>
          <TouchableOpacity onPress={() => setSelectedEvent(null)}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.eventModalContent}>
          <Text style={styles.eventModalEventTitle}>{selectedEvent.title}</Text>
          <Text style={styles.eventModalType}>
            {selectedEvent.type === 'rental' ? 'Ενοικίαση' :
             selectedEvent.type === 'maintenance' ? 'Συντήρηση' :
             selectedEvent.type === 'blocked' ? 'Αποκλεισμένο' : 'Διαθέσιμο'}
          </Text>
          
          <View style={styles.eventModalDetails}>
            <View style={styles.eventModalDetail}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.eventModalDetailText}>
                {format(new Date(selectedEvent.start), 'dd/MM/yyyy', { locale: el })}
              </Text>
            </View>
            
            <View style={styles.eventModalDetail}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.eventModalDetailText}>
                {format(new Date(selectedEvent.start), 'HH:mm', { locale: el })}
                {selectedEvent.start !== selectedEvent.end && 
                  ` - ${format(new Date(selectedEvent.end), 'HH:mm', { locale: el })}`
                }
              </Text>
            </View>
            
            {selectedEvent.customerName && (
              <View style={styles.eventModalDetail}>
                <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.eventModalDetailText}>{selectedEvent.customerName}</Text>
              </View>
            )}
          </View>
          
          {selectedEvent.description && (
            <Text style={styles.eventModalDescription}>{selectedEvent.description}</Text>
          )}
          
          <View style={styles.eventModalActions}>
            {selectedEvent.contractId && (
              <TouchableOpacity
                style={styles.eventModalAction}
                onPress={() => {
                  setSelectedEvent(null);
                  router.push(`/contract-details?contractId=${selectedEvent.contractId}`);
                }}
              >
                <Text style={styles.eventModalActionText}>Προβολή Συμβολαίου</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.eventModalAction, styles.eventModalActionSecondary]}
              onPress={() => setSelectedEvent(null)}
            >
              <Text style={styles.eventModalActionText}>Κλείσιμο</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SimpleGlassCard>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Φόρτωση ημερολογίου...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} {...smoothScrollConfig}>
        {renderHeader()}
        {renderViewTypeSelector()}
        {renderMonthNavigation()}

        <View style={styles.calendarContainer}>
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'day' && renderDayView()}
        </View>
      </ScrollView>

      {selectedEvent && renderEventModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    padding: Spacing.sm,
  },
  viewTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  viewTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  viewTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  viewTypeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  viewTypeTextActive: {
    color: '#fff',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  navButton: {
    padding: Spacing.sm,
  },
  monthTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  calendarContainer: {
    padding: Spacing.md,
  },
  monthView: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: Spacing.md,
    ...Shadows.md,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekDayHeader: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: width / 7 - 8,
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    margin: 2,
    padding: 4,
    justifyContent: 'space-between',
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dayNumber: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayNumberOtherMonth: {
    opacity: 0.5,
  },
  dayNumberToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  eventIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 1,
  },
  eventIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventIndicatorStacked: {
    marginLeft: -2,
  },
  moreEventsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 8,
  },
  weekView: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: Spacing.md,
    ...Shadows.md,
  },
  weekDayColumn: {
    flex: 1,
    marginHorizontal: 2,
  },
  todayHeader: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  weekDayName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  todayHeaderText: {
    color: '#fff',
  },
  weekDayNumber: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  weekDayEvents: {
    maxHeight: 120,
    marginTop: Spacing.sm,
  },
  weekEvent: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    padding: 4,
    marginBottom: 2,
    borderLeftWidth: 3,
  },
  weekEventTitle: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  weekEventTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  dayView: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: Spacing.md,
    ...Shadows.md,
  },
  dayTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: Spacing.md,
  },
  dayEvents: {
    maxHeight: 400,
  },
  emptyDay: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyDayTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyDayDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  dayEventCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  dayEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  eventTypeIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  dayEventTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  dayEventType: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  eventTime: {
    alignItems: 'flex-end',
  },
  eventTimeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dayEventDescription: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  eventCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  eventCustomerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  eventModal: {
    position: 'absolute',
    top: 100,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.lg,
    zIndex: 1000,
    ...Shadows.lg,
  },
  eventModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  eventModalTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  eventModalContent: {
    flex: 1,
  },
  eventModalEventTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  eventModalType: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  eventModalDetails: {
    marginBottom: Spacing.md,
  },
  eventModalDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  eventModalDetailText: {
    ...Typography.body,
    color: Colors.text,
  },
  eventModalDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  eventModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  eventModalAction: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  eventModalActionSecondary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventModalActionText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
  },
});
