import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/app-header';
import { BottomTabBar } from '../components/bottom-tab-bar';
import { SimpleGlassCard } from '../components/glass-card';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/design-system';
import { smoothScrollConfig } from '../utils/animations';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionRoute?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    // Mock notifications - replace with actual API call
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Νέο Συμβόλαιο',
        message: 'Ένα νέο συμβόλαιο ενοικίασης έχει δημιουργηθεί για το όχημα Toyota Corolla',
        type: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        actionRoute: '/contracts',
      },
      {
        id: '2',
        title: 'Επερχόμενη Επιστροφή',
        message: 'Το όχημα BMW X5 πρέπει να επιστραφεί αύριο στις 10:00',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: false,
        actionRoute: '/calendar',
      },
      {
        id: '3',
        title: 'Ζημιά Καταγράφηκε',
        message: 'Νέα ζημιά καταγράφηκε στο όχημα Mercedes C-Class',
        type: 'error',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        read: true,
        actionRoute: '/damage-report',
      },
      {
        id: '4',
        title: 'Συμβόλαιο Ολοκληρώθηκε',
        message: 'Το συμβόλαιο #1234 έχει ολοκληρωθεί επιτυχώς',
        type: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        read: true,
        actionRoute: '/contracts',
      },
      {
        id: '5',
        title: 'Ενημέρωση Συστήματος',
        message: 'Νέες λειτουργίες είναι διαθέσιμες στην εφαρμογή',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
        read: true,
      },
    ];

    setNotifications(mockNotifications);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }

  function markAsRead(notificationId: string) {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handleNotificationPress(notification: Notification) {
    markAsRead(notification.id);
    if (notification.actionRoute) {
      router.push(notification.actionRoute as any);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'success':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'error':
        return Colors.error;
      case 'info':
      default:
        return Colors.info;
    }
  }

  function formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} λεπτά πριν`;
    } else if (diffHours < 24) {
      return `${diffHours} ώρες πριν`;
    } else if (diffDays === 1) {
      return 'Χθες';
    } else {
      return date.toLocaleDateString('el-GR');
    }
  }

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter(n => !n.read)
      : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Ειδοποιήσεις" showBack={true} showActions={true} />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.breadcrumbItem}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={styles.breadcrumbText}>Αρχική</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        <Text style={styles.breadcrumbCurrent}>Ειδοποιήσεις</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Όλες ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Αδιάβαστες ({unreadCount})
          </Text>
        </TouchableOpacity>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
            <Text style={styles.markAllText}>Όλα ως διαβασμένα</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        {...smoothScrollConfig}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Δεν υπάρχουν ειδοποιήσεις</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? 'Όλες οι ειδοποιήσεις έχουν διαβαστεί'
                : 'Θα ειδοποιηθείτε για σημαντικά γεγονότα'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <SimpleGlassCard style={styles.notificationCard}>
                <View style={styles.notificationContent}>
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: getNotificationColor(notification.type) + '15' },
                    ]}
                  >
                    <Ionicons
                      name={getNotificationIcon(notification.type) as any}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>

                  <View style={styles.notificationBody}>
                    <View style={styles.notificationHeader}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.read && styles.notificationTitleUnread,
                        ]}
                      >
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={styles.notificationMessage}>{notification.message}</Text>

                    <Text style={styles.notificationTime}>
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                  </View>

                  {notification.actionRoute && (
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                  )}
                </View>
              </SimpleGlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  filterTabActive: {
    backgroundColor: Colors.primary + '15',
  },
  filterText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    ...Typography.footnote,
    color: Colors.primary,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  notificationCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    ...Typography.subheadline,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginTop: Spacing.md,
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

