import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
    
    // MEMORY LEAK FIX: Listen for permission changes
    const handlePermissionChange = () => {
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    
    // Listen for visibility changes to check permission status
    const handleVisibilityChange = () => {
      if (!document.hidden && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications tidak didukung di browser ini');
    }

    try {
      setIsLoading(true);
      setError(null);

      const registration = await navigator.serviceWorker.register('/sw.js');
      setSwRegistration(registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check if there's an update
      if (registration.waiting) {
        // Notify user about update
        if (confirm('Ada versi baru aplikasi. Update sekarang?')) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }

      return registration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mendaftarkan service worker';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications tidak didukung');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Register service worker if not already registered
        if (!swRegistration) {
          await registerServiceWorker();
        }
      } else {
        throw new Error('Izin notifikasi ditolak');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal meminta izin notifikasi';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, swRegistration, registerServiceWorker]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || !swRegistration) {
      throw new Error('Service worker belum didaftarkan');
    }

    if (permission !== 'granted') {
      throw new Error('Izin notifikasi belum diberikan');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key tidak ditemukan. Silakan tambahkan VITE_VAPID_PUBLIC_KEY di file .env');
      }

      // Convert VAPID key to Uint8Array
      const vapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push manager
      const pushSubscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      // Convert keys to base64 for storage
      const p256dh = arrayBufferToBase64(pushSubscription.getKey('p256dh'));
      const auth = arrayBufferToBase64(pushSubscription.getKey('auth'));

      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        p256dh,
        auth
      };

      // Save subscription to Supabase
      await saveSubscriptionToSupabase(subscriptionData);

      setSubscription(subscriptionData);
      setIsSubscribed(true);

      // Show success notification
      await showLocalNotification({
        title: 'Notifikasi Diaktifkan! 🎉',
        body: 'Anda akan menerima notifikasi realtime untuk update surat jalan',
        icon: '/icon-192.png',
        tag: 'subscription-success',
        requireInteraction: true
      });

      return subscriptionData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal berlangganan push notifications';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, swRegistration, permission]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (!swRegistration) {
      throw new Error('Service worker belum didaftarkan');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get current subscription
      const currentSubscription = await swRegistration.pushManager.getSubscription();
      if (currentSubscription) {
        await currentSubscription.unsubscribe();
      }

      // Remove from Supabase
      if (subscription) {
        await removeSubscriptionFromSupabase(subscription.endpoint);
      }

      setSubscription(null);
      setIsSubscribed(false);

      // Show notification
      await showLocalNotification({
        title: 'Notifikasi Dinonaktifkan',
        body: 'Anda tidak akan lagi menerima notifikasi push',
        icon: '/icon-192.png',
        tag: 'unsubscription-success'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal berhenti berlangganan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, subscription]);

  // Show local notification with retry mechanism
  const showLocalNotification = useCallback(async (payload: NotificationPayload, maxRetries = 3): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      throw new Error('Tidak dapat menampilkan notifikasi');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (swRegistration) {
          await swRegistration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/icon-192.png',
            image: payload.image,
            data: { url: payload.url || '/', ...payload.data },
            tag: payload.tag,
            requireInteraction: payload.requireInteraction || false,
            silent: payload.silent || false,
            vibrate: payload.vibrate || [200, 100, 200],
            actions: payload.actions || [
              {
                action: 'view',
                title: 'Lihat',
                icon: '/icon-192.png'
              },
              {
                action: 'dismiss',
                title: 'Tutup',
                icon: '/icon-192.png'
              }
            ]
          });
        } else {
          // Fallback to browser notification
          new Notification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/icon-192.png'
          });
        }
        
        // Success - log analytics
        console.log(`✅ Notification sent successfully (attempt ${attempt})`);
        return true;
        
      } catch (err) {
        console.error(`❌ Notification attempt ${attempt} failed:`, err);
        
        if (attempt === maxRetries) {
          // Final attempt failed
          console.error('🚨 All notification attempts failed');
          throw new Error(`Gagal mengirim notifikasi setelah ${maxRetries} percobaan: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } else {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying notification in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return false;
  }, [isSupported, permission, swRegistration]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await showLocalNotification({
        title: 'Test Notifikasi 🔔',
        body: 'Ini adalah notifikasi test untuk memastikan sistem berfungsi dengan baik',
        icon: '/icon-192.png',
        tag: 'test-notification',
        requireInteraction: true
      });
    } catch (err) {
      console.error('Error sending test notification:', err);
      throw err;
    }
  }, [showLocalNotification]);

  // Batch similar notifications to avoid spam
  const batchNotifications = useCallback((notifications: NotificationPayload[]): NotificationPayload[] => {
    const grouped = notifications.reduce((acc, notification) => {
      const key = `${notification.data?.category || 'general'}-${notification.data?.priority || 'medium'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(notification);
      return acc;
    }, {} as Record<string, NotificationPayload[]>);

    return Object.entries(grouped).map(([key, items]) => {
      if (items.length === 1) return items[0];
      
      const category = items[0].data?.category || 'general';
      const priority = items[0].data?.priority || 'medium';
      
      return {
        title: `${items.length} ${category} updates`,
        body: `Anda memiliki ${items.length} notifikasi ${category} baru`,
        icon: items[0].icon,
        tag: `batch-${key}-${Date.now()}`,
        data: {
          ...items[0].data,
          batchCount: items.length,
          batchItems: items,
          isBatch: true
        },
        requireInteraction: priority === 'high' || priority === 'critical'
      };
    });
  }, []);

  // Smart notification filtering to prevent spam
  const shouldSendNotification = useCallback((notification: NotificationPayload): boolean => {
    const now = Date.now();
    const lastNotificationKey = `last_notification_${notification.tag}`;
    const lastNotificationTime = localStorage.getItem(lastNotificationKey);
    
    // Rate limiting: max 1 notification per tag per 30 seconds
    if (lastNotificationTime && (now - parseInt(lastNotificationTime)) < 30000) {
      console.log(`🚫 Rate limiting notification: ${notification.tag}`);
      return false;
    }
    
    // Store timestamp for rate limiting
    localStorage.setItem(lastNotificationKey, now.toString());
    
    // Clean up old timestamps (older than 1 hour)
    const oneHourAgo = now - (60 * 60 * 1000);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('last_notification_')) {
        const timestamp = localStorage.getItem(key);
        if (timestamp && parseInt(timestamp) < oneHourAgo) {
          localStorage.removeItem(key);
        }
      }
    });
    
    return true;
  }, []);

  // Send multiple notifications with batching and rate limiting
  const sendBatchNotifications = useCallback(async (notifications: NotificationPayload[]): Promise<{ sent: number; failed: number }> => {
    if (!isSupported || permission !== 'granted') {
      throw new Error('Push notifications tidak didukung atau izin tidak diberikan');
    }

    // Filter notifications
    const filteredNotifications = notifications.filter(shouldSendNotification);
    
    if (filteredNotifications.length === 0) {
      console.log('🚫 No notifications to send after filtering');
      return { sent: 0, failed: 0 };
    }

    // Batch similar notifications
    const batchedNotifications = batchNotifications(filteredNotifications);
    
    let sent = 0;
    let failed = 0;

    for (const notification of batchedNotifications) {
      try {
        await showLocalNotification(notification);
        sent++;
      } catch (err) {
        console.error('Failed to send batched notification:', err);
        failed++;
      }
    }

    console.log(`📊 Batch notification results: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }, [isSupported, permission, showLocalNotification, shouldSendNotification, batchNotifications]);

  // Check current subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!swRegistration) return;

    try {
      const currentSubscription = await swRegistration.pushManager.getSubscription();
      if (currentSubscription) {
        const p256dh = arrayBufferToBase64(currentSubscription.getKey('p256dh'));
        const auth = arrayBufferToBase64(currentSubscription.getKey('auth'));
        
        const subscriptionData: PushSubscription = {
          endpoint: currentSubscription.endpoint,
          p256dh,
          auth
        };

        setSubscription(subscriptionData);
        setIsSubscribed(true);
      } else {
        setSubscription(null);
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('Error checking subscription status:', err);
    }
  }, [swRegistration]);

  // Initialize push notifications
  const initialize = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Register service worker first
      await registerServiceWorker();
      
      // Check subscription status
      await checkSubscriptionStatus();
    } catch (err) {
      console.error('Error initializing push notifications:', err);
    }
  }, [isSupported, registerServiceWorker, checkSubscriptionStatus]);

  // Initialize on mount with cleanup
  useEffect(() => {
    let isMounted = true;
    
    const initializeWithCleanup = async () => {
      if (isMounted) {
        await initialize();
      }
    };
    
    initializeWithCleanup();
    
    // MEMORY LEAK FIX: Cleanup function
    return () => {
      isMounted = false;
      // Cleanup any pending operations
      setIsLoading(false);
      setError(null);
    };
  }, [initialize]);

  // Utility functions
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Save subscription to Supabase
  const saveSubscriptionToSupabase = async (subscriptionData: PushSubscription) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.p256dh,
          auth: subscriptionData.auth,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving subscription to Supabase:', err);
      throw err;
    }
  };

  // Remove subscription from Supabase
  const removeSubscriptionFromSupabase = async (endpoint: string) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing subscription from Supabase:', err);
      throw err;
    }
  };

  return {
    // State
    isSupported,
    permission,
    isSubscribed,
    subscription,
    swRegistration,
    isLoading,
    error,

    // Actions
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showLocalNotification,
    sendTestNotification,
    sendBatchNotifications,
    initialize,
    registerServiceWorker,

    // Advanced Features
    batchNotifications,
    shouldSendNotification,

    // Utilities
    urlBase64ToUint8Array,
    arrayBufferToBase64
  };
};

