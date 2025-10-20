/**
 * Calendar & Availability Service
 * Handles vehicle availability, booking conflicts, and calendar management
 */

import { supabase } from '../utils/supabase';
import { addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format, addMonths, subMonths } from 'date-fns';
import { el } from 'date-fns/locale';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'rental' | 'maintenance' | 'blocked' | 'available';
  vehicleId: string;
  contractId?: string;
  customerName?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  color: string;
  description?: string;
  allDay?: boolean;
}

export interface VehicleAvailability {
  vehicleId: string;
  vehicleName: string;
  date: string;
  status: 'available' | 'rented' | 'maintenance' | 'blocked';
  contractId?: string;
  customerName?: string;
  pickupTime?: string;
  returnTime?: string;
  color: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
  events: CalendarEvent[];
}

export interface AvailabilityConflict {
  vehicleId: string;
  vehicleName: string;
  conflictType: 'double_booking' | 'maintenance_overlap' | 'invalid_dates';
  conflictingEvents: CalendarEvent[];
  suggestedResolution?: string;
}

export class CalendarService {
  /**
   * Get calendar events for a date range
   */
  static async getCalendarEvents(
    organizationId: string,
    startDate: string,
    endDate: string,
    vehicleIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('contracts')
        .select(`
          id,
          pickup_date,
          dropoff_date,
          renter_full_name,
          car_license_plate,
          car_make_model,
          status,
          aade_status,
          cars!inner(id, make, model, category, status)
        `)
        .eq('organization_id', organizationId)
        .gte('pickup_date', startDate)
        .lte('pickup_date', endDate);

      if (vehicleIds && vehicleIds.length > 0) {
        query = query.in('car_license_plate', vehicleIds);
      }

      const { data: contracts, error } = await query;

      if (error) throw error;

      const events: CalendarEvent[] = [];

      // Convert contracts to calendar events
      contracts?.forEach(contract => {
        const event: CalendarEvent = {
          id: `rental-${contract.id}`,
          title: `${contract.cars?.make} ${contract.cars?.model} - ${contract.renter_full_name}`,
          start: contract.pickup_date,
          end: contract.dropoff_date,
          type: 'rental',
          vehicleId: contract.cars?.id,
          contractId: contract.id,
          customerName: contract.renter_full_name,
          status: this.mapContractStatusToEventStatus(contract.status),
          color: this.getEventColor('rental', contract.status),
          description: `Ενοικίαση: ${contract.renter_full_name}`,
        };
        events.push(event);
      });

      // Get maintenance events
      const maintenanceEvents = await this.getMaintenanceEvents(organizationId, startDate, endDate, vehicleIds);
      events.push(...maintenanceEvents);

      // Get blocked dates
      const blockedEvents = await this.getBlockedDates(organizationId, startDate, endDate, vehicleIds);
      events.push(...blockedEvents);

      return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw error;
    }
  }

  /**
   * Get maintenance events
   */
  private static async getMaintenanceEvents(
    organizationId: string,
    startDate: string,
    endDate: string,
    vehicleIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('maintenance_records')
        .select(`
          id,
          car_id,
          maintenance_type,
          description,
          performed_at,
          next_due_date,
          cars!inner(id, make, model, organization_id)
        `)
        .eq('cars.organization_id', organizationId)
        .gte('performed_at', startDate)
        .lte('performed_at', endDate);

      if (vehicleIds && vehicleIds.length > 0) {
        query = query.in('car_id', vehicleIds);
      }

      const { data: maintenance, error } = await query;

      if (error) throw error;

      return maintenance?.map(record => ({
        id: `maintenance-${record.id}`,
        title: `${record.cars?.make} ${record.cars?.model} - ${this.getMaintenanceTypeLabel(record.maintenance_type)}`,
        start: record.performed_at,
        end: record.performed_at, // Single day event
        type: 'maintenance' as const,
        vehicleId: record.car_id,
        status: 'confirmed' as const,
        color: this.getEventColor('maintenance'),
        description: record.description,
      })) || [];
    } catch (error) {
      console.error('Error getting maintenance events:', error);
      return [];
    }
  }

  /**
   * Get blocked dates
   */
  private static async getBlockedDates(
    organizationId: string,
    startDate: string,
    endDate: string,
    vehicleIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      // For now, return empty array. In a real implementation, you might have a blocked_dates table
      return [];
    } catch (error) {
      console.error('Error getting blocked dates:', error);
      return [];
    }
  }

  /**
   * Check vehicle availability for a date range
   */
  static async checkVehicleAvailability(
    organizationId: string,
    vehicleId: string,
    startDate: string,
    endDate: string,
    excludeContractId?: string
  ): Promise<{
    isAvailable: boolean;
    conflicts: CalendarEvent[];
    availabilityStatus: 'available' | 'rented' | 'maintenance' | 'blocked';
  }> {
    try {
      // Get all events for the vehicle in the date range
      const events = await this.getCalendarEvents(
        organizationId,
        startDate,
        endDate,
        [vehicleId]
      );

      // Filter out the contract we're excluding (for updates)
      const relevantEvents = events.filter(event => 
        event.vehicleId === vehicleId && event.contractId !== excludeContractId
      );

      // Check for conflicts
      const conflicts = relevantEvents.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const requestedStart = new Date(startDate);
        const requestedEnd = new Date(endDate);

        return (
          (eventStart <= requestedStart && eventEnd >= requestedStart) ||
          (eventStart <= requestedEnd && eventEnd >= requestedEnd) ||
          (eventStart >= requestedStart && eventEnd <= requestedEnd)
        );
      });

      const isAvailable = conflicts.length === 0;
      const availabilityStatus = conflicts.length > 0 
        ? this.determineAvailabilityStatus(conflicts[0])
        : 'available';

      return {
        isAvailable,
        conflicts,
        availabilityStatus,
      };
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      throw error;
    }
  }

  /**
   * Get vehicle availability for multiple vehicles
   */
  static async getVehiclesAvailability(
    organizationId: string,
    startDate: string,
    endDate: string,
    vehicleIds?: string[]
  ): Promise<VehicleAvailability[]> {
    try {
      const events = await this.getCalendarEvents(organizationId, startDate, endDate, vehicleIds);
      const availability: VehicleAvailability[] = [];

      // Create availability for each day in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = eachDayOfInterval({ start, end });

      // Get all vehicles
      let vehiclesQuery = supabase
        .from('cars')
        .select('id, make, model')
        .eq('organization_id', organizationId);

      if (vehicleIds && vehicleIds.length > 0) {
        vehiclesQuery = vehiclesQuery.in('id', vehicleIds);
      }

      const { data: vehicles, error: vehiclesError } = await vehiclesQuery;
      if (vehiclesError) throw vehiclesError;

      vehicles?.forEach(vehicle => {
        days.forEach(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          
          // Find events for this vehicle on this day
          const dayEvents = events.filter(event => 
            event.vehicleId === vehicle.id &&
            isSameDay(new Date(event.start), day)
          );

          let status: 'available' | 'rented' | 'maintenance' | 'blocked' = 'available';
          let contractId: string | undefined;
          let customerName: string | undefined;
          let pickupTime: string | undefined;
          let returnTime: string | undefined;
          let color = '#28a745'; // Green for available

          if (dayEvents.length > 0) {
            const primaryEvent = dayEvents[0];
            status = this.mapEventTypeToAvailabilityStatus(primaryEvent.type);
            contractId = primaryEvent.contractId;
            customerName = primaryEvent.customerName;
            color = primaryEvent.color;
          }

          availability.push({
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.make} ${vehicle.model}`,
            date: dayStr,
            status,
            contractId,
            customerName,
            pickupTime,
            returnTime,
            color,
          });
        });
      });

      return availability;
    } catch (error) {
      console.error('Error getting vehicles availability:', error);
      throw error;
    }
  }

  /**
   * Create a calendar view for a specific month/week/day
   */
  static async getCalendarView(
    organizationId: string,
    viewType: 'month' | 'week' | 'day',
    date: Date,
    vehicleIds?: string[]
  ): Promise<CalendarView> {
    try {
      let startDate: Date;
      let endDate: Date;

      switch (viewType) {
        case 'month':
          startDate = startOfMonth(date);
          endDate = endOfMonth(date);
          break;
        case 'week':
          startDate = new Date(date);
          endDate = addDays(date, 6);
          break;
        case 'day':
          startDate = new Date(date);
          endDate = new Date(date);
          break;
      }

      const events = await this.getCalendarEvents(
        organizationId,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        vehicleIds
      );

      return {
        type: viewType,
        date,
        events,
      };
    } catch (error) {
      console.error('Error getting calendar view:', error);
      throw error;
    }
  }

  /**
   * Detect availability conflicts
   */
  static async detectConflicts(
    organizationId: string,
    startDate: string,
    endDate: string,
    vehicleIds?: string[]
  ): Promise<AvailabilityConflict[]> {
    try {
      const events = await this.getCalendarEvents(organizationId, startDate, endDate, vehicleIds);
      const conflicts: AvailabilityConflict[] = [];

      // Group events by vehicle
      const eventsByVehicle = new Map<string, CalendarEvent[]>();
      events.forEach(event => {
        if (!eventsByVehicle.has(event.vehicleId)) {
          eventsByVehicle.set(event.vehicleId, []);
        }
        eventsByVehicle.get(event.vehicleId)!.push(event);
      });

      // Check for conflicts in each vehicle
      eventsByVehicle.forEach((vehicleEvents, vehicleId) => {
        const sortedEvents = vehicleEvents.sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );

        for (let i = 0; i < sortedEvents.length - 1; i++) {
          const currentEvent = sortedEvents[i];
          const nextEvent = sortedEvents[i + 1];

          if (new Date(currentEvent.end) > new Date(nextEvent.start)) {
            // Conflict detected
            conflicts.push({
              vehicleId,
              vehicleName: currentEvent.title.split(' - ')[0],
              conflictType: 'double_booking',
              conflictingEvents: [currentEvent, nextEvent],
              suggestedResolution: 'Αναπρογραμματισμός ενός από τα συμβόλαια',
            });
          }
        }
      });

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  }

  /**
   * Block dates for maintenance
   */
  static async blockDatesForMaintenance(
    organizationId: string,
    vehicleId: string,
    startDate: string,
    endDate: string,
    reason: string
  ): Promise<void> {
    try {
      // In a real implementation, you would insert into a blocked_dates table
      // For now, we'll create a maintenance record
      await supabase.from('maintenance_records').insert({
        organization_id: organizationId,
        car_id: vehicleId,
        maintenance_type: 'blocked',
        description: reason,
        performed_at: startDate,
        next_due_date: endDate,
      });
    } catch (error) {
      console.error('Error blocking dates for maintenance:', error);
      throw error;
    }
  }

  /**
   * Get next available date for a vehicle
   */
  static async getNextAvailableDate(
    organizationId: string,
    vehicleId: string,
    fromDate: string,
    duration: number // days
  ): Promise<string | null> {
    try {
      const from = new Date(fromDate);
      const to = addDays(from, 30); // Search up to 30 days ahead

      const events = await this.getCalendarEvents(
        organizationId,
        format(from, 'yyyy-MM-dd'),
        format(to, 'yyyy-MM-dd'),
        [vehicleId]
      );

      const vehicleEvents = events.filter(event => event.vehicleId === vehicleId);

      // Sort events by start date
      vehicleEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      // Find the first available slot
      let currentDate = from;
      while (currentDate <= to) {
        const currentDateStr = format(currentDate, 'yyyy-MM-dd');
        const endDate = addDays(currentDate, duration - 1);
        const endDateStr = format(endDate, 'yyyy-MM-dd');

        // Check if this period is available
        const availability = await this.checkVehicleAvailability(
          organizationId,
          vehicleId,
          currentDateStr,
          endDateStr
        );

        if (availability.isAvailable) {
          return currentDateStr;
        }

        currentDate = addDays(currentDate, 1);
      }

      return null;
    } catch (error) {
      console.error('Error getting next available date:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private static mapContractStatusToEventStatus(contractStatus: string): 'confirmed' | 'pending' | 'cancelled' | 'completed' {
    switch (contractStatus) {
      case 'active': return 'confirmed';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  private static getEventColor(type: string, status?: string): string {
    switch (type) {
      case 'rental':
        switch (status) {
          case 'active': return '#007AFF';
          case 'completed': return '#28a745';
          case 'cancelled': return '#dc3545';
          default: return '#6c757d';
        }
      case 'maintenance': return '#ffc107';
      case 'blocked': return '#dc3545';
      case 'available': return '#28a745';
      default: return '#6c757d';
    }
  }

  private static determineAvailabilityStatus(event: CalendarEvent): 'available' | 'rented' | 'maintenance' | 'blocked' {
    switch (event.type) {
      case 'rental': return 'rented';
      case 'maintenance': return 'maintenance';
      case 'blocked': return 'blocked';
      default: return 'available';
    }
  }

  private static mapEventTypeToAvailabilityStatus(type: string): 'available' | 'rented' | 'maintenance' | 'blocked' {
    switch (type) {
      case 'rental': return 'rented';
      case 'maintenance': return 'maintenance';
      case 'blocked': return 'blocked';
      default: return 'available';
    }
  }

  private static getMaintenanceTypeLabel(type: string): string {
    switch (type) {
      case 'routine': return 'Συνηθισμένη Συντήρηση';
      case 'repair': return 'Επισκευή';
      case 'inspection': return 'Επιθεώρηση';
      case 'emergency': return 'Επείγουσα';
      default: return 'Συντήρηση';
    }
  }

  /**
   * Get calendar statistics
   */
  static async getCalendarStats(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageUtilization: number;
    peakDays: string[];
    lowUtilizationDays: string[];
  }> {
    try {
      const events = await this.getCalendarEvents(organizationId, startDate, endDate);
      const rentalEvents = events.filter(event => event.type === 'rental');

      const totalBookings = rentalEvents.length;
      
      // Get revenue from contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select('total_cost')
        .eq('organization_id', organizationId)
        .gte('pickup_date', startDate)
        .lte('pickup_date', endDate);

      const totalRevenue = contracts?.reduce((sum, contract) => sum + contract.total_cost, 0) || 0;

      // Calculate utilization (simplified)
      const days = eachDayOfInterval({ 
        start: new Date(startDate), 
        end: new Date(endDate) 
      });
      const averageUtilization = totalBookings / days.length;

      // Find peak and low utilization days
      const dailyBookings = new Map<string, number>();
      rentalEvents.forEach(event => {
        const dateStr = format(new Date(event.start), 'yyyy-MM-dd');
        dailyBookings.set(dateStr, (dailyBookings.get(dateStr) || 0) + 1);
      });

      const sortedDays = Array.from(dailyBookings.entries())
        .sort((a, b) => b[1] - a[1]);

      const peakDays = sortedDays.slice(0, 3).map(([date]) => date);
      const lowUtilizationDays = sortedDays.slice(-3).map(([date]) => date);

      return {
        totalBookings,
        totalRevenue,
        averageUtilization,
        peakDays,
        lowUtilizationDays,
      };
    } catch (error) {
      console.error('Error getting calendar stats:', error);
      throw error;
    }
  }
}
