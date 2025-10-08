import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { 
  Bell, BellOff, Settings, CheckCircle, XCircle, 
  AlertTriangle, RefreshCw, Zap, Shield, Info,
  Smartphone, Desktop, Wifi, WifiOff
} from 'lucide-react';

export const PushNotificationManager: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  } = usePushNotifications();

  const [showSettings, setShowSettings] = useState(false);
  const [showTestResult, setShowTestResult] = useState<string | null>(null);

  const handleEnableNotifications = async () => {
    try {
      await requestPermission();
      if (permission === 'granted') {
        await subscribeToPush();
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await unsubscribeFromPush();
    } catch (err) {
      console.error('Error disabling notifications:', err);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      setShowTestResult('success');
      setTimeout(() => setShowTestResult(null), 3000);
    } catch (err) {
      setShowTestResult('error');
      setTimeout(() => setShowTestResult(null), 3000);
    }
  };

  const getStatusColor = () => {
    if (!isSupported) return 'text-red-600';
    if (permission === 'granted' && isSubscribed) return 'text-green-600';
    if (permission === 'granted') return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Tidak Didukung';
    if (permission === 'granted' && isSubscribed) return 'Aktif';
    if (permission === 'granted') return 'Izin Diberikan';
    if (permission === 'denied') return 'Ditolak';
    return 'Belum Diizinkan';
  };

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle className="w-5 h-5" />;
    if (permission === 'granted' && isSubscribed) return <CheckCircle className="w-5 h-5" />;
    if (permission === 'granted') return <AlertTriangle className="w-5 h-5" />;
    if (permission === 'denied') return <XCircle className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Push Notifications Tidak Didukung</h3>
            <p className="text-sm text-red-600">
              Browser Anda tidak mendukung push notifications. Gunakan browser modern seperti Chrome, Firefox, atau Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getStatusColor().replace('text-', 'bg-').replace('-600', '-100')}`}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Status Notifikasi</h3>
              <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Pengaturan Notifikasi"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {permission === 'granted' && (
              <button
                onClick={handleTestNotification}
                disabled={isLoading}
                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                title="Test Notifikasi"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Pengaturan Notifikasi</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Permission Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Izin Browser</p>
                  <p className="text-xs text-gray-600">
                    {permission === 'granted' ? 'Diberikan' : 
                     permission === 'denied' ? 'Ditolak' : 'Belum diminta'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                permission === 'granted' ? 'bg-green-100 text-green-800' :
                permission === 'denied' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {permission === 'granted' ? '✓ Aktif' : 
                 permission === 'denied' ? '✗ Ditolak' : '? Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Subscription</p>
                  <p className="text-xs text-gray-600">
                    {isSubscribed ? 'Berlangganan aktif' : 'Belum berlangganan'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isSubscribed ? '✓ Aktif' : '○ Nonaktif'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {permission !== 'granted' && (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                <span>Aktifkan Notifikasi</span>
              </button>
            )}

            {permission === 'granted' && !isSubscribed && (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Berlangganan Push Notifications</span>
              </button>
            )}

            {isSubscribed && (
              <button
                onClick={handleDisableNotifications}
                disabled={isLoading}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
                <span>Nonaktifkan Notifikasi</span>
              </button>
            )}

            {permission === 'granted' && (
              <button
                onClick={handleTestNotification}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Test Notifikasi</span>
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* VAPID Key Status */}
          {!import.meta.env.VITE_VAPID_PUBLIC_KEY && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Mode Lokal Aktif</p>
                  <p className="text-xs mt-1">
                    Notifikasi lokal berfungsi. Untuk push notifications dari server, 
                    tambahkan VAPID keys di file .env:
                  </p>
                  <code className="text-xs bg-yellow-100 px-1 rounded mt-1 block">
                    VITE_VAPID_PUBLIC_KEY=your_key_here
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Tentang Push Notifications</p>
                <p className="text-xs mt-1">
                  Anda akan menerima notifikasi realtime untuk update surat jalan, 
                  status pengiriman, dan informasi penting lainnya, bahkan ketika aplikasi tidak terbuka.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Result Toast */}
      {showTestResult && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          showTestResult === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {showTestResult === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {showTestResult === 'success' 
                ? 'Test notifikasi berhasil dikirim!' 
                : 'Gagal mengirim test notifikasi'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

