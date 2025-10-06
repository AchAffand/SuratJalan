import React, { useState, useEffect } from 'react';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { ScheduledNotification } from '../types/notificationPreferences';
import { 
  Calendar, Clock, Plus, Edit, Trash2, Play, Pause, 
  Bell, AlertTriangle, CheckCircle, X, Save
} from 'lucide-react';
import dayjs from '../lib/dayjs';

export const ScheduledNotificationManager: React.FC = () => {
  const {
    scheduledNotifications,
    scheduleNotification,
    cancelScheduledNotification,
    checkScheduledNotifications
  } = useNotificationPreferences();

  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    scheduledFor: '',
    recurring: '' as 'daily' | 'weekly' | 'monthly' | '',
    enabled: true
  });

  // Check for notifications that should be triggered
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const toTrigger = checkScheduledNotifications();
      if (toTrigger.length > 0) {
        console.log(`⏰ ${toTrigger.length} scheduled notifications ready to trigger`);
        // Here you would trigger the notifications
        // This would be handled by the notification system
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [checkScheduledNotifications]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.body || !formData.scheduledFor) {
      alert('Harap isi semua field yang diperlukan');
      return;
    }

    const notification: ScheduledNotification = {
      id: editingNotification?.id || `scheduled-${Date.now()}`,
      scheduledFor: new Date(formData.scheduledFor),
      notification: {
        title: formData.title,
        body: formData.body,
        icon: '/icon.svg',
        data: {
          type: 'scheduled',
          category: 'system'
        }
      },
      recurring: formData.recurring || undefined,
      enabled: formData.enabled,
      createdAt: editingNotification?.createdAt || new Date(),
      triggerCount: editingNotification?.triggerCount || 0
    };

    if (editingNotification) {
      // Update existing notification
      cancelScheduledNotification(editingNotification.id);
      scheduleNotification(notification);
      setEditingNotification(null);
    } else {
      // Create new notification
      scheduleNotification(notification);
    }

    // Reset form
    setFormData({
      title: '',
      body: '',
      scheduledFor: '',
      recurring: '',
      enabled: true
    });
    setShowForm(false);
  };

  const handleEdit = (notification: ScheduledNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.notification.title,
      body: notification.notification.body,
      scheduledFor: dayjs(notification.scheduledFor).format('YYYY-MM-DDTHH:mm'),
      recurring: notification.recurring || '',
      enabled: notification.enabled
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus notifikasi terjadwal ini?')) {
      cancelScheduledNotification(id);
    }
  };

  const toggleEnabled = (notification: ScheduledNotification) => {
    const updated = {
      ...notification,
      enabled: !notification.enabled
    };
    cancelScheduledNotification(notification.id);
    scheduleNotification(updated);
  };

  const getRecurringIcon = (recurring?: string) => {
    switch (recurring) {
      case 'daily': return '🔄';
      case 'weekly': return '📅';
      case 'monthly': return '🗓️';
      default: return '⏰';
    }
  };

  const getRecurringText = (recurring?: string) => {
    switch (recurring) {
      case 'daily': return 'Harian';
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      default: return 'Sekali';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Notifikasi Terjadwal</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Notifikasi</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingNotification ? 'Edit Notifikasi' : 'Tambah Notifikasi Terjadwal'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingNotification(null);
                    setFormData({
                      title: '',
                      body: '',
                      scheduledFor: '',
                      recurring: '',
                      enabled: true
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Notifikasi *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan judul notifikasi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pesan Notifikasi *
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan pesan notifikasi"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Terjadwal *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pengulangan
                  </label>
                  <select
                    value={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sekali saja</option>
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm text-gray-700">
                    Aktifkan notifikasi
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingNotification(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingNotification ? 'Update' : 'Simpan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {scheduledNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada notifikasi terjadwal</h3>
            <p className="text-gray-600 mb-4">Buat notifikasi terjadwal untuk mengingatkan Anda tentang hal-hal penting.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buat Notifikasi Pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {scheduledNotifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getRecurringIcon(notification.recurring)}</span>
                      <h4 className="font-medium text-gray-900">{notification.notification.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.enabled ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{notification.notification.body}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{dayjs(notification.scheduledFor).format('DD MMM YYYY HH:mm')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bell className="w-3 h-3" />
                        <span>{getRecurringText(notification.recurring)}</span>
                      </div>
                      {notification.triggerCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Dikirim {notification.triggerCount}x</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleEnabled(notification)}
                      className={`p-2 rounded-lg transition-colors ${
                        notification.enabled
                          ? 'text-green-600 hover:bg-green-100'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={notification.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {notification.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(notification)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
