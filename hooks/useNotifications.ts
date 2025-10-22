/**
 * useNotifications Hook
 * Easy integration of push notifications into React components
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notification.service';

export function useNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications received while app is in foreground
    notificationListener.current = NotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for user interactions with notifications
    responseListener.current = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  /**
   * Handle notification tap - navigate to relevant screen
   */
  function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    const type = data?.type;

    switch (type) {
      case 'contract_reminder':
        if (data.contractId) {
          router.push(`/contract-details?contractId=${data.contractId}`);
        }
        break;

      case 'damage_report':
        router.push('/new-damage');
        break;

      case 'vehicle_maintenance':
        if (data.vehicleId) {
          router.push(`/vehicle-details?vehicleId=${data.vehicleId}`);
        }
        break;

      case 'payment_due':
        router.push('/(tabs)/');
        break;

      default:
        router.push('/(tabs)/');
    }
  }

  /**
   * Send a test notification
   */
  async function sendTestNotification() {
    try {
      await NotificationService.sendImmediateNotification({
        type: 'general',
        title: 'Test Notification',
        body: 'This is a test notification from FleetOS!',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Schedule a contract reminder
   */
  async function scheduleContractReminder(
    contractId: string,
    licensePlate: string,
    dropoffDate: Date,
    hoursBeforeReminder: number = 2
  ) {
    try {
      return await NotificationService.scheduleContractReminder(
        contractId,
        licensePlate,
        dropoffDate,
        hoursBeforeReminder
      );
    } catch (error) {
      console.error('Error scheduling contract reminder:', error);
      return null;
    }
  }

  /**
   * Schedule a maintenance reminder
   */
  async function scheduleMaintenanceReminder(
    vehicleId: string,
    licensePlate: string,
    maintenanceType: 'kteo' | 'insurance' | 'service',
    dueDate: Date,
    daysBeforeReminder: number = 7
  ) {
    try {
      return await NotificationService.scheduleMaintenanceReminder(
        vehicleId,
        licensePlate,
        maintenanceType,
        dueDate,
        daysBeforeReminder
      );
    } catch (error) {
      console.error('Error scheduling maintenance reminder:', error);
      return null;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async function getScheduledNotifications() {
    return await NotificationService.getScheduledNotifications();
  }

  /**
   * Cancel a notification
   */
  async function cancelNotification(notificationId: string) {
    await NotificationService.cancelNotification(notificationId);
  }

  /**
   * Clear notification badge
   */
  async function clearBadge() {
    await NotificationService.setBadgeCount(0);
  }

  return {
    sendTestNotification,
    scheduleContractReminder,
    scheduleMaintenanceReminder,
    getScheduledNotifications,
    cancelNotification,
    clearBadge,
  };
}

