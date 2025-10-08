import React, { useState, useEffect } from 'react';
import { DeliveryNote } from '../types';
import { formatWeight, formatDate } from '../utils/format';
import { supabase } from '../lib/supabase';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { 
  Bell, AlertTriangle, CheckCircle, Clock, 
  Truck, MapPin, Users, DollarSign, X,
  Settings, Filter, Search, Eye, EyeOff,
  RefreshCw, Volume2, VolumeX, Zap, Smartphone,
  BarChart3, Calendar, Timer, Shield, Star,
  TrendingUp, Activity, Target, Award
} from 'lucide-react';
import dayjs from '../lib/dayjs';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'delivery' | 'system' | 'financial' | 'operational' | 'maintenance';
  actionUrl?: string;
  metadata?: any;
}

interface NotificationCenterProps {
  notes: DeliveryNote[];
  onNotificationAction?: (notification: Notification) => void;
  newEvents?: Array<{ type: string; new?: any; old?: any; at: number }>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notes, onNotificationAction, newEvents = [] }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCenter, setShowCenter] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'delivery'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [lastSnapshotKey, setLastSnapshotKey] = useState<string>('');
  const [showPushSettings, setShowPushSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const DISMISSED_KEY = 'sj_notifications_dismissed_v1';
  const READ_KEY = 'sj_notifications_read_v1';
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')); } catch { return new Set(); }
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
  });

  // Push notifications hook
  const { 
    isSupported: pushSupported, 
    permission: pushPermission, 
    isSubscribed: pushSubscribed,
    showLocalNotification,
    sendBatchNotifications
  } = usePushNotifications();

  // Notification preferences hook
  const {
    preferences,
    analytics,
    scheduledNotifications,
    savePreferences,
    updateAnalytics,
    shouldSendNotification,
    checkScheduledNotifications
  } = useNotificationPreferences();

  // Helpers for Web Push subscription
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  };

  const enableWebPush = async () => {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        alert('Browser tidak mendukung Web Push.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
      if (!vapid) {
        console.warn('VAPID public key belum dikonfigurasi. Menggunakan mode lokal saja.');
        // Show local notification instead
        reg.showNotification('Notifikasi Diaktifkan (Mode Lokal)', { 
          body: 'Notifikasi lokal aktif! Untuk push notifications dari server, tambahkan VAPID keys di .env file.', 
          data: { url: '/pengiriman' } 
        });
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid)
      });
      const keyToBase64 = (key: ArrayBuffer | null) => (key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '');
      const p256dh = keyToBase64(sub.getKey('p256dh'));
      const auth = keyToBase64(sub.getKey('auth'));
      await supabase.from('push_subscriptions').upsert({ endpoint: sub.endpoint, p256dh, auth });
      // Preview a notification
      reg.showNotification('Notifikasi Diaktifkan', { body: 'Anda akan menerima notifikasi realtime.', data: { url: '/pengiriman' } });
    } catch (err) {
      console.error('Enable web push error', err);
    }
  };

  // Generate notifications based on delivery data
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Check for newly created deliveries (created within last 24 hours)
    const yesterday = dayjs().subtract(1, 'day');
    const newDeliveries = notes.filter(note => 
      dayjs(note.createdAt).isAfter(yesterday)
    );
    
    if (newDeliveries.length > 0) {
      newNotifications.push({
        id: 'new-deliveries',
        type: 'success',
        title: 'Surat Jalan Baru Dibuat',
        message: `${newDeliveries.length} surat jalan baru telah dibuat dalam 24 jam terakhir`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        category: 'delivery',
        metadata: { newDeliveries }
      });
    }

    // Add a default system notification if no other notifications
    if (newNotifications.length === 0) {
      newNotifications.push({
        id: 'welcome-notification',
        type: 'info',
        title: 'Selamat Datang di Sistem Surat Jalan',
        message: 'Sistem notifikasi aktif. Anda akan menerima update realtime tentang pengiriman.',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'low',
        category: 'system'
      });
    }

    // Check for overdue deliveries
    const today = dayjs();
    notes.forEach(note => {
      if (note.status === 'menunggu' && dayjs(note.date).isBefore(today, 'day')) {
        newNotifications.push({
          id: `overdue-${note.id}`,
          type: 'warning',
          title: 'Pengiriman Terlambat',
          message: `Surat jalan ${note.deliveryNoteNumber} untuk ${note.destination} sudah melewati tanggal pengiriman`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'high',
          category: 'delivery',
          actionUrl: `/delivery/${note.id}`,
          metadata: { noteId: note.id }
        });
      }
    });

    // Check for deliveries without weight input
    notes.forEach(note => {
      if (note.status === 'selesai' && !note.netWeight) {
        newNotifications.push({
          id: `no-weight-${note.id}`,
          type: 'alert',
          title: 'Berat Timbangan Belum Diinput',
          message: `Surat jalan ${note.deliveryNoteNumber} sudah selesai tetapi berat timbangan belum diinput`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          category: 'operational',
          actionUrl: `/delivery/${note.id}`,
          metadata: { noteId: note.id }
        });
      }
    });

    // Check for newly added weight inputs
    const recentWeightInputs = notes.filter(note => 
      note.netWeight && dayjs(note.updatedAt).isAfter(yesterday)
    );
    
    if (recentWeightInputs.length > 0) {
      newNotifications.push({
        id: 'new-weight-inputs',
        type: 'success',
        title: 'Berat Timbangan Baru Diinput',
        message: `${recentWeightInputs.length} berat timbangan baru telah diinput`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        category: 'operational',
        metadata: { weightInputs: recentWeightInputs }
      });
    }

    // Check for status changes (deliveries that changed status recently)
    const recentStatusChanges = notes.filter(note => 
      dayjs(note.updatedAt).isAfter(yesterday) && note.status !== 'menunggu'
    );
    
    if (recentStatusChanges.length > 0) {
      const statusCounts = recentStatusChanges.reduce((acc, note) => {
        acc[note.status] = (acc[note.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        const statusText = status === 'dalam-perjalanan' ? 'Dalam Perjalanan' : 'Selesai';
        newNotifications.push({
          id: `status-change-${status}`,
          type: 'info',
          title: `Status Pengiriman Diperbarui`,
          message: `${count} surat jalan berubah status menjadi "${statusText}"`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          category: 'delivery',
          metadata: { status, count }
        });
      });
    }

    // Check for high-value deliveries
    const highValueDeliveries = notes.filter(note => 
      note.netWeight && note.netWeight > 5000 && note.status === 'dalam-perjalanan'
    );
    if (highValueDeliveries.length > 0) {
      newNotifications.push({
        id: 'high-value-deliveries',
        type: 'info',
        title: 'Pengiriman Nilai Tinggi',
        message: `${highValueDeliveries.length} pengiriman dengan berat > 5 ton sedang dalam perjalanan`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        category: 'financial',
        metadata: { deliveries: highValueDeliveries }
      });
    }

    // Check for driver performance
    const driverStats = notes.reduce((acc, note) => {
      if (!acc[note.driverName]) {
        acc[note.driverName] = { trips: 0, totalWeight: 0 };
      }
      acc[note.driverName].trips++;
      acc[note.driverName].totalWeight += note.netWeight || 0;
      return acc;
    }, {} as Record<string, { trips: number; totalWeight: number }>);

    Object.entries(driverStats).forEach(([driver, stats]) => {
      const avgWeight = stats.totalWeight / stats.trips;
      if (avgWeight < 2000 && stats.trips >= 5) {
        newNotifications.push({
          id: `driver-performance-${driver}`,
          type: 'warning',
          title: 'Performa Sopir Perlu Perhatian',
          message: `Sopir ${driver} memiliki rata-rata muatan ${formatWeight(avgWeight)} per trip`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          category: 'operational',
          metadata: { driver, avgWeight, trips: stats.trips }
        });
      }
    });

    // Check for system health
    const totalDeliveries = notes.length;
    const completedDeliveries = notes.filter(n => n.status === 'selesai').length;
    const completionRate = (completedDeliveries / totalDeliveries) * 100;

    if (completionRate < 80 && totalDeliveries > 10) {
      newNotifications.push({
        id: 'low-completion-rate',
        type: 'error',
        title: 'Tingkat Penyelesaian Rendah',
        message: `Tingkat penyelesaian pengiriman hanya ${completionRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'critical',
        category: 'operational',
        metadata: { completionRate, totalDeliveries, completedDeliveries }
      });
    }

    // Add system health notification only if there are other notifications
    if (newNotifications.length > 0) {
      newNotifications.push({
        id: 'system-health',
        type: 'success',
        title: 'Sistem Berjalan Normal',
        message: 'Semua layanan berfungsi dengan baik',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'low',
        category: 'system'
      });
    }

    // Apply persistence: filter out dismissed and mark read as stored
    const afterDismiss = newNotifications
      .filter(n => !dismissedIds.has(n.id))
      .map(n => ({ ...n, read: readIds.has(n.id) || n.read }));

    const snapshotKey = afterDismiss.map(n => n.id).sort().join('|');
    setLastSnapshotKey(snapshotKey);
    // Merge snapshot-driven notifications with existing realtime (rt-*) items
    setNotifications(prev => {
      // Keep realtime notifications that were appended from Supabase events
      const realtimeItems = prev.filter(n => n.id.startsWith('rt-') && !dismissedIds.has(n.id));
      // Avoid duplicates between realtime and snapshot lists
      const merged = [
        ...realtimeItems,
        ...afterDismiss.filter(n => !realtimeItems.some(r => r.id === n.id)),
      ];
      return merged;
    });
  }, [notes, dismissedIds, readIds]);

  // Realtime append notifications
  useEffect(() => {
    console.log('🔄 Real-time events received:', newEvents);
    if (!newEvents || newEvents.length === 0) return;
    
    setNotifications(prev => {
      const next = [...prev];
      newEvents.forEach(ev => {
        const id = `rt-${ev.type}-${ev.new?.id || ev.old?.id || ev.at}`;
        if (dismissedIds.has(id)) return;
        if (next.some(n => n.id === id)) return;
        
        let notification;
        if (ev.type === 'INSERT') {
          notification = {
            id,
            type: 'success' as const,
            title: 'Surat Jalan Baru Dibuat',
            message: `${ev.new?.delivery_note_number || 'Surat Jalan baru'} berhasil dibuat`,
            timestamp: new Date(ev.at).toISOString(),
            read: false,
            priority: 'medium' as const,
            category: 'delivery' as const,
            actionUrl: '/pengiriman',
            metadata: { note: ev.new }
          };
        } else if (ev.type === 'UPDATE') {
          const newObj = ev.new || {};
          const oldObj = ev.old || {};
          const changedKeys = Object.keys(newObj).filter(k => newObj[k] !== oldObj[k]);

          // Skip push/local notif for net weight-only updates
          if (changedKeys.length === 1 && (changedKeys[0] === 'net_weight' || changedKeys[0] === 'netWeight')) {
            return; // do not create nor push
          }

          // If status becomes 'selesai', send completion notification with netto
          if (changedKeys.includes('status') && newObj.status === 'selesai') {
            const netto = newObj.net_weight ?? newObj.netWeight;
            const nettoText = typeof netto === 'number' ? `${netto.toLocaleString('id-ID')} kg` : '—';
            notification = {
              id,
              type: 'success' as const,
              title: 'Surat Jalan Selesai',
              message: `${newObj.delivery_note_number || 'Surat Jalan'} telah selesai, netto ${nettoText}`,
              timestamp: new Date(ev.at).toISOString(),
              read: false,
              priority: 'medium' as const,
              category: 'delivery' as const,
              actionUrl: '/pengiriman',
              metadata: { note: ev.new, old: ev.old }
            };
          } else if (changedKeys.includes('status') && newObj.status !== oldObj.status) {
            // More specific message when status changes to other states
            notification = {
              id,
              type: 'info' as const,
              title: 'Status Pengiriman Diperbarui',
              message: `${newObj.delivery_note_number || 'Surat Jalan'} berubah status menjadi "${newObj.status}"`,
              timestamp: new Date(ev.at).toISOString(),
              read: false,
              priority: 'medium' as const,
              category: 'delivery' as const,
              actionUrl: '/pengiriman',
              metadata: { note: ev.new, old: ev.old }
            };
          } else {
            // Generic update (exclude trivial fields above)
            notification = {
              id,
              type: 'info' as const,
              title: 'Surat Jalan Diperbarui',
              message: `${newObj.delivery_note_number || 'Surat Jalan'} diperbarui`,
              timestamp: new Date(ev.at).toISOString(),
              read: false,
              priority: 'low' as const,
              category: 'delivery' as const,
              actionUrl: '/pengiriman',
              metadata: { note: ev.new, old: ev.old }
            };
          }
        }
        
        if (notification) {
          next.unshift(notification);
          
          // Send push notification if enabled and subscribed
          if (pushSupported && pushPermission === 'granted' && pushSubscribed) {
            console.log('📱 Sending push notification for:', notification.title);
            sendPushNotification(notification);
          } else {
            console.log('❌ Push notification skipped:', {
              pushSupported,
              pushPermission,
              pushSubscribed,
              title: notification.title
            });
          }
        }
      });
      return next;
    });
  }, [newEvents, dismissedIds, pushSupported, pushPermission, pushSubscribed]);

  // Enhanced function to send push notifications with preferences and analytics
  const sendPushNotification = async (notification: Notification) => {
    try {
      // Check if notification should be sent based on preferences
      if (!shouldSendNotification(notification.category, notification.priority)) {
        console.log(`🚫 Notification blocked by preferences: ${notification.id}`);
        return;
      }

      // Check if push notifications are enabled for this category
      if (!preferences.channels.push) {
        console.log(`🚫 Push notifications disabled in preferences`);
        return;
      }

      const payload = {
        title: notification.title,
        body: notification.message,
        icon: '/icon.svg',
        url: notification.actionUrl || '/',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
        vibrate: preferences.advanced.vibrationEnabled 
          ? (notification.priority === 'critical' ? [300, 100, 300, 100, 300] : [200, 100, 200])
          : undefined,
        silent: !preferences.advanced.soundEnabled,
        data: {
          notificationId: notification.id,
          category: notification.category,
          priority: notification.priority,
          metadata: notification.metadata
        }
      };

      await showLocalNotification(payload);
      
      // Update analytics
      updateAnalytics('sent', notification.category);
      
      console.log(`✅ Push notification sent: ${notification.id}`);
    } catch (err) {
      console.error('Error sending push notification:', err);
      // Update analytics for failed delivery
      updateAnalytics('dismissed', notification.category);
    }
  };

  // Auto refresh by listening to page visibility and timer (simulated here by toggling state)
  useEffect(() => {
    if (!autoRefresh) return;
    let timer: any = null;
    const tick = () => {
      // Trigger re-evaluation by toggling a no-op state via time-dependence
      setLastSnapshotKey(k => k);
      timer = setTimeout(tick, 30000); // every 30s
    };
    timer = setTimeout(tick, 30000);
    const onVisible = () => tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [autoRefresh]);

  // Mark all as read when center opened
  useEffect(() => {
    if (showCenter) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // Persist all as read
      setReadIds(prev => {
        const next = new Set(prev);
        notifications.forEach(n => next.add(n.id));
        return next;
      });
    }
  }, [showCenter]);

  // Persist sets
  useEffect(() => {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(dismissedIds))); } catch {}
  }, [dismissedIds]);
  useEffect(() => {
    try { localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readIds))); } catch {}
  }, [readIds]);

  // Helpers to mark as read / delete that persist
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setReadIds(prev => { const next = new Set(prev); next.add(id); return next; });
  };
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setDismissedIds(prev => { const next = new Set(prev); next.add(id); return next; });
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'critical' && notification.priority !== 'critical') return false;
    if (filter === 'delivery' && notification.category !== 'delivery') return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.category.toLowerCase().includes(searchLower) ||
        notification.priority.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  const showNotificationDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    markAsRead(notification.id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'alert': return <Zap className="w-5 h-5 text-orange-600" />;
      default: return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Helper functions for status display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'menunggu': return 'bg-yellow-100 text-yellow-800';
      case 'dalam-perjalanan': return 'bg-blue-100 text-blue-800';
      case 'selesai': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'menunggu': return 'Menunggu';
      case 'dalam-perjalanan': return 'Dalam Perjalanan';
      case 'selesai': return 'Selesai';
      default: return status;
    }
  };

  const renderNotificationDetail = () => {
    if (!selectedNotification) return null;

    const { metadata, type, title, message } = selectedNotification;

    switch (selectedNotification.id) {
      case 'new-deliveries':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Surat Jalan Baru Dibuat</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">{message}</p>
              <div className="space-y-2">
                {metadata.newDeliveries?.map((note: DeliveryNote, index: number) => (
                  <div key={note.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{note.deliveryNoteNumber}</p>
                        <p className="text-sm text-gray-600">{note.destination}</p>
                        <p className="text-xs text-gray-500">Driver: {note.driverName} | Kendaraan: {note.vehiclePlate}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                        {getStatusText(note.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'new-weight-inputs':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Berat Timbangan Baru Diinput</h3>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-3">{message}</p>
              <div className="space-y-2">
                {metadata.weightInputs?.map((note: DeliveryNote, index: number) => (
                  <div key={note.id} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{note.deliveryNoteNumber}</p>
                        <p className="text-sm text-gray-600">{note.destination}</p>
                        <p className="text-xs text-gray-500">Driver: {note.driverName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatWeight(note.netWeight || 0)}</p>
                        <p className="text-xs text-gray-500">{formatDate(note.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'status-change-dalam-perjalanan':
      case 'status-change-selesai':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Status Pengiriman Diperbarui</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">{message}</p>
              <div className="space-y-2">
                {notes.filter(note => 
                  note.status === metadata.status && dayjs(note.updatedAt).isAfter(dayjs().subtract(1, 'day'))
                ).map((note: DeliveryNote, index: number) => (
                  <div key={note.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{note.deliveryNoteNumber}</p>
                        <p className="text-sm text-gray-600">{note.destination}</p>
                        <p className="text-xs text-gray-500">Driver: {note.driverName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                          {getStatusText(note.status)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(note.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'high-value-deliveries':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pengiriman Nilai Tinggi</h3>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-800 mb-3">{message}</p>
              <div className="space-y-2">
                {metadata.deliveries?.map((note: DeliveryNote, index: number) => (
                  <div key={note.id} className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{note.deliveryNoteNumber}</p>
                        <p className="text-sm text-gray-600">{note.destination}</p>
                        <p className="text-xs text-gray-500">Driver: {note.driverName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{formatWeight(note.netWeight || 0)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                          {getStatusText(note.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        // Better presentation for generic UPDATE with metadata.note
        const note = (metadata && (metadata.note || metadata.new)) || null;
        const oldNote = metadata && metadata.old ? metadata.old : null;
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-800 mb-3">{message}</p>
              {note ? (
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{note.delivery_note_number}</p>
                      <p className="text-sm text-gray-600">{note.destination}</p>
                      <p className="text-xs text-gray-500">Driver: {note.driver_name} | Kendaraan: {note.vehicle_plate}</p>
                    </div>
                    <div className="text-right">
                      {note.status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                          {getStatusText(note.status)}
                        </span>
                      )}
                      {typeof note.net_weight === 'number' && (
                        <p className="mt-1 text-xs text-gray-600">Netto: {formatWeight(note.net_weight)}</p>
                      )}
                    </div>
                  </div>
                  {oldNote && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">Sebelum</p>
                        <p>Status: {getStatusText(oldNote.status)}</p>
                        {typeof oldNote.net_weight === 'number' && (
                          <p>Netto: {formatWeight(oldNote.net_weight)}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">Sesudah</p>
                        <p>Status: {getStatusText(note.status)}</p>
                        {typeof note.net_weight === 'number' && (
                          <p>Netto: {formatWeight(note.net_weight)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                metadata && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600">Detail:</p>
                    <pre className="text-xs text-gray-800 mt-1 overflow-auto">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                )
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowCenter(!showCenter)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {criticalCount > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            !
          </span>
        )}
      </button>

      {/* Notification Center */}
      {showCenter && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
              <div className="flex items-center space-x-2">
                {/* Analytics Button */}
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Analytics Notifikasi"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                
                {/* Preferences Button */}
                <button
                  onClick={() => setShowPreferences(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Pengaturan Notifikasi"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                {/* Push Notification Status */}
                {pushSupported && (
                  <button
                    onClick={() => setShowPushSettings(!showPushSettings)}
                    className={`p-1 rounded transition-colors ${
                      pushSubscribed 
                        ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title={pushSubscribed ? 'Push notifications aktif' : 'Push notifications nonaktif'}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                )}
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-1 rounded ${autoRefresh ? 'text-blue-600 bg-blue-100' : 'text-gray-500'}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCenter(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari notifikasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua</option>
                  <option value="unread">Belum Dibaca</option>
                  <option value="critical">Kritis</option>
                  <option value="delivery">Pengiriman</option>
                </select>
                <button
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    setReadIds(prev => {
                      const next = new Set(prev);
                      notifications.forEach(n => next.add(n.id));
                      return next;
                    });
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Tandai Semua Dibaca
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {notifications.length === 0 
                    ? 'Tidak ada notifikasi' 
                    : `Tidak ada notifikasi yang sesuai dengan filter "${filter}"`
                  }
                </p>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setFilter('all')}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Tampilkan semua notifikasi
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                                 {filteredNotifications.map((notification) => (
                   <div
                     key={notification.id}
                     className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 transition-colors cursor-pointer ${
                       !notification.read ? 'bg-white' : 'bg-gray-50'
                     }`}
                     onClick={() => showNotificationDetail(notification)}
                   >
                     <div className="flex items-start space-x-3">
                       <div className="flex-shrink-0 mt-0.5">
                         {getNotificationIcon(notification.type)}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                             {notification.title}
                           </p>
                           <div className="flex items-center space-x-1">
                             <span className="text-xs text-gray-500">
                               {dayjs(notification.timestamp).fromNow()}
                             </span>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 deleteNotification(notification.id);
                               }}
                               className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                         </div>
                         <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                         <div className="flex items-center justify-between mt-2">
                           <span className="text-xs text-blue-600 font-medium">
                             Klik untuk melihat detail →
                           </span>
                           {!notification.read && (
                             <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          {/* Push Notification Settings Panel */}
          {showPushSettings && (
            <div className="border-t border-gray-200 p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-900">Push Notifications</h4>
                <button
                  onClick={() => setShowPushSettings(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Tutup
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-700">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pushSubscribed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pushSubscribed ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                
                {pushSupported && pushPermission !== 'granted' && (
                  <button
                    onClick={async () => {
                      try {
                        await enableWebPush();
                        setShowPushSettings(false);
                      } catch (err) {
                        console.error('Error enabling push notifications:', err);
                      }
                    }}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-700 transition-colors"
                  >
                    Aktifkan Push Notifications
                  </button>
                )}
                
                {pushSubscribed && (
                  <p className="text-xs text-blue-600 text-center">
                    ✓ Anda akan menerima notifikasi realtime
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredNotifications.length} notifikasi</span>
              <span>{unreadCount} belum dibaca</span>
            </div>
          </div>
                 </div>
       )}

       {/* Detail Modal */}
       {showDetailModal && selectedNotification && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
             {/* Modal Header */}
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                 {getNotificationIcon(selectedNotification.type)}
                 <div>
                   <h2 className="text-xl font-bold text-gray-900">Detail Notifikasi</h2>
                   <p className="text-sm text-gray-600">
                     {dayjs(selectedNotification.timestamp).format('DD MMMM YYYY HH:mm')}
                   </p>
                 </div>
               </div>
               <button
                 onClick={closeDetailModal}
                 className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Modal Content */}
             <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
               {renderNotificationDetail()}
             </div>

             {/* Modal Footer */}
             <div className="p-6 border-t border-gray-200 bg-gray-50">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedNotification.priority)}`}>
                     {selectedNotification.priority.toUpperCase()}
                   </span>
                   <span className="text-xs text-gray-500">
                     {selectedNotification.category}
                   </span>
                 </div>
                 <button
                   onClick={closeDetailModal}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                 >
                   Tutup
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Analytics Modal */}
       {showAnalytics && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-gray-900 flex items-center">
                   <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                   Analytics Notifikasi
                 </h3>
                 <button
                   onClick={() => setShowAnalytics(false)}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   <X className="w-5 h-5 text-gray-500" />
                 </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 <div className="bg-blue-50 p-4 rounded-lg">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-blue-700">Total Dikirim</p>
                       <p className="text-2xl font-bold text-blue-900">{analytics.totalSent}</p>
                     </div>
                     <Activity className="w-8 h-8 text-blue-600" />
                   </div>
                 </div>
                 
                 <div className="bg-green-50 p-4 rounded-lg">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-green-700">Tingkat Pengiriman</p>
                       <p className="text-2xl font-bold text-green-900">{analytics.deliveryRate.toFixed(1)}%</p>
                     </div>
                     <Target className="w-8 h-8 text-green-600" />
                   </div>
                 </div>
                 
                 <div className="bg-yellow-50 p-4 rounded-lg">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-yellow-700">Tingkat Klik</p>
                       <p className="text-2xl font-bold text-yellow-900">{analytics.clickRate.toFixed(1)}%</p>
                     </div>
                     <TrendingUp className="w-8 h-8 text-yellow-600" />
                   </div>
                 </div>
                 
                 <div className="bg-purple-50 p-4 rounded-lg">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-purple-700">Tingkat Dismiss</p>
                       <p className="text-2xl font-bold text-purple-900">{analytics.dismissRate.toFixed(1)}%</p>
                     </div>
                     <Award className="w-8 h-8 text-purple-600" />
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h4 className="font-semibold text-gray-900 mb-3">Kategori Notifikasi</h4>
                   <div className="space-y-2">
                     {Object.entries(analytics.categories).map(([category, stats]) => (
                       <div key={category} className="flex justify-between items-center">
                         <span className="text-sm text-gray-600 capitalize">{category}</span>
                         <div className="flex space-x-2 text-sm">
                           <span className="text-blue-600">{stats.sent}</span>
                           <span className="text-green-600">{stats.delivered}</span>
                           <span className="text-yellow-600">{stats.clicked}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h4 className="font-semibold text-gray-900 mb-3">Distribusi Harian</h4>
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                     {Object.entries(analytics.dailyDistribution)
                       .sort(([a], [b]) => b.localeCompare(a))
                       .slice(0, 7)
                       .map(([date, count]) => (
                       <div key={date} className="flex justify-between items-center">
                         <span className="text-sm text-gray-600">{dayjs(date).format('DD MMM')}</span>
                         <span className="text-sm font-medium text-gray-900">{count}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Preferences Modal */}
       {showPreferences && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-gray-900 flex items-center">
                   <Settings className="w-6 h-6 mr-2 text-blue-600" />
                   Pengaturan Notifikasi
                 </h3>
                 <button
                   onClick={() => setShowPreferences(false)}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   <X className="w-5 h-5 text-gray-500" />
                 </button>
               </div>
               
               <div className="space-y-6">
                 {/* Categories */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Kategori Notifikasi</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {Object.entries(preferences.categories).map(([category, enabled]) => (
                       <label key={category} className="flex items-center space-x-2">
                         <input
                           type="checkbox"
                           checked={enabled}
                           onChange={(e) => savePreferences({
                             categories: { ...preferences.categories, [category]: e.target.checked }
                           })}
                           className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                         />
                         <span className="text-sm text-gray-700 capitalize">{category}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Priorities */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Prioritas Notifikasi</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {Object.entries(preferences.priorities).map(([priority, enabled]) => (
                       <label key={priority} className="flex items-center space-x-2">
                         <input
                           type="checkbox"
                           checked={enabled}
                           onChange={(e) => savePreferences({
                             priorities: { ...preferences.priorities, [priority]: e.target.checked }
                           })}
                           className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                         />
                         <span className="text-sm text-gray-700 capitalize">{priority}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Channels */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Saluran Notifikasi</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {Object.entries(preferences.channels).map(([channel, enabled]) => (
                       <label key={channel} className="flex items-center space-x-2">
                         <input
                           type="checkbox"
                           checked={enabled}
                           onChange={(e) => savePreferences({
                             channels: { ...preferences.channels, [channel]: e.target.checked }
                           })}
                           className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                         />
                         <span className="text-sm text-gray-700 capitalize">{channel}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Quiet Hours */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Jam Tenang</h4>
                   <div className="space-y-3">
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={preferences.quietHours.enabled}
                         onChange={(e) => savePreferences({
                           quietHours: { ...preferences.quietHours, enabled: e.target.checked }
                         })}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">Aktifkan jam tenang</span>
                     </label>
                     
                     {preferences.quietHours.enabled && (
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
                           <input
                             type="time"
                             value={preferences.quietHours.start}
                             onChange={(e) => savePreferences({
                               quietHours: { ...preferences.quietHours, start: e.target.value }
                             })}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
                           <input
                             type="time"
                             value={preferences.quietHours.end}
                             onChange={(e) => savePreferences({
                               quietHours: { ...preferences.quietHours, end: e.target.value }
                             })}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           />
                         </div>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Advanced Settings */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Pengaturan Lanjutan</h4>
                   <div className="space-y-3">
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={preferences.advanced.soundEnabled}
                         onChange={(e) => savePreferences({
                           advanced: { ...preferences.advanced, soundEnabled: e.target.checked }
                         })}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">Suara notifikasi</span>
                     </label>
                     
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={preferences.advanced.vibrationEnabled}
                         onChange={(e) => savePreferences({
                           advanced: { ...preferences.advanced, vibrationEnabled: e.target.checked }
                         })}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">Getar notifikasi</span>
                     </label>
                     
                     <label className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={preferences.frequency.batchSimilar}
                         onChange={(e) => savePreferences({
                           frequency: { ...preferences.frequency, batchSimilar: e.target.checked }
                         })}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">Gabungkan notifikasi serupa</span>
                     </label>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };
