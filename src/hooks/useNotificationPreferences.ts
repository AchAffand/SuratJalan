import { useState, useEffect, useCallback } from 'react';
import { 
  NotificationPreferences, 
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationAnalytics,
  ScheduledNotification 
} from '../types/notificationPreferences';

const PREFERENCES_KEY = 'sj_notification_preferences_v1';
const ANALYTICS_KEY = 'sj_notification_analytics_v1';
const SCHEDULED_KEY = 'sj_scheduled_notifications_v1';

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [analytics, setAnalytics] = useState<NotificationAnalytics>({
    totalSent: 0,
    totalDelivered: 0,
    totalClicked: 0,
    totalDismissed: 0,
    deliveryRate: 0,
    clickRate: 0,
    dismissRate: 0,
    lastSent: null,
    categories: {},
    hourlyDistribution: {},
    dailyDistribution: {},
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load analytics from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ANALYTICS_KEY);
      if (stored) {
        setAnalytics(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification analytics:', error);
    }
  }, []);

  // Load scheduled notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCHEDULED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setScheduledNotifications(parsed.map((item: any) => ({
          ...item,
          scheduledFor: new Date(item.scheduledFor),
          createdAt: new Date(item.createdAt),
          lastTriggered: item.lastTriggered ? new Date(item.lastTriggered) : undefined,
        })));
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }, [preferences]);

  // Update analytics
  const updateAnalytics = useCallback((event: 'sent' | 'delivered' | 'clicked' | 'dismissed', category?: string) => {
    setAnalytics(prev => {
      const updated = { ...prev };
      
      switch (event) {
        case 'sent':
          updated.totalSent++;
          updated.lastSent = new Date().toISOString();
          if (category) {
            if (!updated.categories[category]) {
              updated.categories[category] = { sent: 0, delivered: 0, clicked: 0, dismissed: 0 };
            }
            updated.categories[category].sent++;
          }
          break;
        case 'delivered':
          updated.totalDelivered++;
          if (category) {
            if (!updated.categories[category]) {
              updated.categories[category] = { sent: 0, delivered: 0, clicked: 0, dismissed: 0 };
            }
            updated.categories[category].delivered++;
          }
          break;
        case 'clicked':
          updated.totalClicked++;
          if (category) {
            if (!updated.categories[category]) {
              updated.categories[category] = { sent: 0, delivered: 0, clicked: 0, dismissed: 0 };
            }
            updated.categories[category].clicked++;
          }
          break;
        case 'dismissed':
          updated.totalDismissed++;
          if (category) {
            if (!updated.categories[category]) {
              updated.categories[category] = { sent: 0, delivered: 0, clicked: 0, dismissed: 0 };
            }
            updated.categories[category].dismissed++;
          }
          break;
      }

      // Calculate rates
      updated.deliveryRate = updated.totalSent > 0 ? (updated.totalDelivered / updated.totalSent) * 100 : 0;
      updated.clickRate = updated.totalDelivered > 0 ? (updated.totalClicked / updated.totalDelivered) * 100 : 0;
      updated.dismissRate = updated.totalDelivered > 0 ? (updated.totalDismissed / updated.totalDelivered) * 100 : 0;

      // Update hourly distribution
      const hour = new Date().getHours().toString();
      updated.hourlyDistribution[hour] = (updated.hourlyDistribution[hour] || 0) + 1;

      // Update daily distribution
      const today = new Date().toISOString().split('T')[0];
      updated.dailyDistribution[today] = (updated.dailyDistribution[today] || 0) + 1;

      // Save to localStorage
      try {
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notification analytics:', error);
      }

      return updated;
    });
  }, []);

  // Check if notification should be sent based on preferences
  const shouldSendNotification = useCallback((category: string, priority: string): boolean => {
    // Check category preference
    if (!preferences.categories[category as keyof typeof preferences.categories]) {
      return false;
    }

    // Check priority preference
    if (!preferences.priorities[priority as keyof typeof preferences.priorities]) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: preferences.quietHours.timezone 
      }).slice(0, 5);
      
      const start = preferences.quietHours.start;
      const end = preferences.quietHours.end;
      
      // Handle overnight quiet hours (e.g., 22:00 to 07:00)
      if (start > end) {
        if (currentTime >= start || currentTime <= end) {
          return false;
        }
      } else {
        if (currentTime >= start && currentTime <= end) {
          return false;
        }
      }
    }

    // Check frequency limits
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count notifications in last hour
    const hourlyCount = Object.values(analytics.hourlyDistribution)
      .filter((_, hour) => {
        const hourDate = new Date();
        hourDate.setHours(parseInt(Object.keys(analytics.hourlyDistribution)[hour]));
        return hourDate > oneHourAgo;
      })
      .reduce((sum, count) => sum + count, 0);

    if (hourlyCount >= preferences.frequency.maxPerHour) {
      return false;
    }

    // Count notifications in last day
    const dailyCount = Object.values(analytics.dailyDistribution)
      .filter((_, day) => {
        const dayDate = new Date(Object.keys(analytics.dailyDistribution)[day]);
        return dayDate > oneDayAgo;
      })
      .reduce((sum, count) => sum + count, 0);

    if (dailyCount >= preferences.frequency.maxPerDay) {
      return false;
    }

    return true;
  }, [preferences, analytics]);

  // Schedule a notification
  const scheduleNotification = useCallback((notification: ScheduledNotification) => {
    setScheduledNotifications(prev => {
      const updated = [...prev, notification];
      try {
        localStorage.setItem(SCHEDULED_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving scheduled notifications:', error);
      }
      return updated;
    });
  }, []);

  // Cancel a scheduled notification
  const cancelScheduledNotification = useCallback((id: string) => {
    setScheduledNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem(SCHEDULED_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving scheduled notifications:', error);
      }
      return updated;
    });
  }, []);

  // Check and trigger scheduled notifications
  const checkScheduledNotifications = useCallback(() => {
    const now = new Date();
    const toTrigger = scheduledNotifications.filter(n => 
      n.enabled && 
      n.scheduledFor <= now &&
      (!n.recurring || !n.lastTriggered || shouldTriggerRecurring(n))
    );

    return toTrigger;
  }, [scheduledNotifications]);

  // Helper function for recurring notifications
  const shouldTriggerRecurring = (notification: ScheduledNotification): boolean => {
    if (!notification.recurring || !notification.lastTriggered) return true;

    const now = new Date();
    const lastTriggered = notification.lastTriggered;

    switch (notification.recurring) {
      case 'daily':
        return now.getDate() !== lastTriggered.getDate();
      case 'weekly':
        const daysDiff = Math.floor((now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 7;
      case 'monthly':
        return now.getMonth() !== lastTriggered.getMonth() || now.getFullYear() !== lastTriggered.getFullYear();
      default:
        return false;
    }
  };

  // Reset preferences to default
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES));
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
    }
  }, []);

  // Clear analytics
  const clearAnalytics = useCallback(() => {
    const cleared = {
      totalSent: 0,
      totalDelivered: 0,
      totalClicked: 0,
      totalDismissed: 0,
      deliveryRate: 0,
      clickRate: 0,
      dismissRate: 0,
      lastSent: null,
      categories: {},
      hourlyDistribution: {},
      dailyDistribution: {},
    };
    setAnalytics(cleared);
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(cleared));
    } catch (error) {
      console.error('Error clearing notification analytics:', error);
    }
  }, []);

  return {
    preferences,
    analytics,
    scheduledNotifications,
    isLoading,
    savePreferences,
    updateAnalytics,
    shouldSendNotification,
    scheduleNotification,
    cancelScheduledNotification,
    checkScheduledNotifications,
    resetPreferences,
    clearAnalytics,
  };
};
