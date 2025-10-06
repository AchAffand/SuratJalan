import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import UserManagement from './UserManagement';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('users');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const tabs = [
    { id: 'users', name: 'Manajemen User', icon: <Users className="w-5 h-5" />, description: 'Kelola user dan akses' },
    { id: 'system', name: 'Sistem', icon: <Database className="w-5 h-5" />, description: 'Pengaturan sistem' },
    { id: 'notifications', name: 'Notifikasi', icon: <Bell className="w-5 h-5" />, description: 'Pengaturan notifikasi' },
    { id: 'appearance', name: 'Tampilan', icon: <Palette className="w-5 h-5" />, description: 'Kustomisasi tampilan' }
  ];

  const handleSaveSettings = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleRefreshSystem = () => {
    // Simulate system refresh
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Pengaturan Sistem</h2>
                <p className="text-indigo-100">Konfigurasi dan manajemen sistem</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <div>
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-gray-500">{tab.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Manajemen User</h3>
                    <p className="text-gray-600">Kelola user, role, dan akses menu</p>
                  </div>
                  <button
                    onClick={() => setShowUserManagement(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <Users className="w-5 h-5" />
                    <span>Kelola User</span>
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-blue-900">Role-Based Access Control</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Sistem RBAC memungkinkan Anda mengatur akses menu untuk setiap user berdasarkan role mereka.
                        Anda bisa membuat user baru dan menentukan menu mana saja yang bisa mereka akses.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Fitur User Management</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Tambah user baru dengan role custom</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Edit informasi user dan password</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Atur akses menu per user</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Hapus user yang tidak diperlukan</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Role yang Tersedia</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Administrator</span>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Full Access</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Supervisor</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Management</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Operator</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Operations</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Driver</span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Limited</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pengaturan Sistem</h3>
                  <p className="text-gray-600">Konfigurasi sistem dan database</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Database</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status Koneksi</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last Sync</span>
                        <span className="text-sm text-gray-500">2 menit yang lalu</span>
                      </div>
                      <button
                        onClick={handleRefreshSystem}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh System</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Backup & Restore</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Auto Backup</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Enabled</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last Backup</span>
                        <span className="text-sm text-gray-500">Hari ini 08:00</span>
                      </div>
                      <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Buat Backup Manual
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pengaturan Notifikasi</h3>
                  <p className="text-gray-600">Konfigurasi notifikasi sistem</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Jenis Notifikasi</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Email Notifications</div>
                        <div className="text-sm text-gray-600">Kirim notifikasi via email</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Push Notifications</div>
                        <div className="text-sm text-gray-600">Notifikasi real-time</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">SMS Notifications</div>
                        <div className="text-sm text-gray-600">Notifikasi via SMS</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pengaturan Tampilan</h3>
                  <p className="text-gray-600">Kustomisasi tampilan aplikasi</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Tema Warna</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Tema Saat Ini</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Sea & Blue</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="w-full h-12 bg-blue-500 rounded-lg border-2 border-blue-600"></button>
                        <button className="w-full h-12 bg-green-500 rounded-lg border border-gray-300"></button>
                        <button className="w-full h-12 bg-purple-500 rounded-lg border border-gray-300"></button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Layout</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Mode Tampilan</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Responsive</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Density</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Compact</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
                <CheckCircle className="w-5 h-5" />
                <span>Pengaturan berhasil disimpan!</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{user?.name}</span> ({user?.role})
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSaveSettings}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan</span>
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
    </div>
  );
};

export default Settings;
