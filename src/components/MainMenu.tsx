import React, { useState } from 'react';
import { 
  Printer, 
  BarChart3, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  Package,
  Settings as SettingsIcon,
  Home,
  Truck,
  TrendingUp,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getAccessibleMenus, ROLE_DISPLAY_NAMES } from '../utils/rolePermissions';
import Settings from './Settings';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  isActive?: boolean;
  onClick: () => void;
}

interface MainMenuProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onPrintSuratJalan: () => void;
  onNavigateToPengiriman: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  currentView,
  onViewChange,
  onPrintSuratJalan,
  onNavigateToPengiriman
}) => {
  const { user } = useUser();
  const [showSettings, setShowSettings] = useState(false);
  console.log('📋 MainMenu rendered with currentView:', currentView);
  
  // Get accessible menus based on user role
  const accessibleMenus = user ? getAccessibleMenus(user.role) : [];
  
  // Menu items asli Anda yang sudah berfungsi
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Overview dan statistik pengiriman',
      icon: <Home className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      isActive: currentView === 'dashboard',
      onClick: () => onViewChange('dashboard')
    },
    {
      id: 'print',
      title: 'Cetak Surat Jalan',
      description: 'Cetak dan kirim surat jalan',
      icon: <Printer className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: onPrintSuratJalan
    },
    {
      id: 'analytics',
      title: 'Analitik',
      description: 'Analisis data dan tren pengiriman',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      isActive: currentView === 'analytics',
      onClick: () => onViewChange('analytics')
    },
    {
      id: 'operational-reports',
      title: 'Laporan Operasional',
      description: 'Laporan harian dan bulanan operasional',
      icon: <FileText className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      isActive: currentView === 'operational-reports',
      onClick: () => onViewChange('operational-reports')
    },
    {
      id: 'po-reports',
      title: 'Laporan PO',
      description: 'Laporan Purchase Order dan progress',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      isActive: currentView === 'po-reports',
      onClick: () => onViewChange('po-reports')
    },
    {
      id: 'invoice-generator',
      title: 'Invoice Generator',
      description: 'Buat dan kelola invoice otomatis',
      icon: <Receipt className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      isActive: currentView === 'invoice-generator',
      onClick: () => onViewChange('invoice-generator')
    },
    {
      id: 'purchase-orders',
      title: 'Purchase Order',
      description: 'Kelola Purchase Order dan tracking',
      icon: <Package className="w-6 h-6" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      isActive: currentView === 'purchase-orders',
      onClick: () => onViewChange('purchase-orders')
    },
    {
      id: 'pengiriman',
      title: 'Pengiriman',
      description: 'Kelola alamat tujuan dan rekap pengiriman',
      icon: <Truck className="w-6 h-6" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      isActive: currentView === 'pengiriman',
      onClick: onNavigateToPengiriman
    },
    {
      id: 'settings',
      title: 'Pengaturan',
      description: 'Konfigurasi sistem dan user management',
      icon: <SettingsIcon className="w-6 h-6" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      isActive: currentView === 'settings',
      onClick: () => setShowSettings(true)
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Utama</h2>
        <p className="text-gray-600">Pilih menu untuk mengakses fitur yang diinginkan</p>
        
        {/* User Info */}
        {user && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-700">{user.name}</span>
            </div>
            <div className="text-sm text-blue-600">
              Role: <span className="font-medium">{ROLE_DISPLAY_NAMES[user.role]}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {menuItems
          .filter(item => {
            // Administrator bisa akses semua menu
            if (user?.role === 'administrator') return true;
            
            // Untuk role lain, cek custom menu access
            if (user) {
              // Jika user punya customMenuAccess, gunakan itu
              if (user.customMenuAccess && user.customMenuAccess.length > 0) {
                return user.customMenuAccess.includes(item.id);
              }
              // Fallback ke role-based
              const accessibleMenuIds = accessibleMenus.map(menu => menu.id);
              return accessibleMenuIds.includes(item.id);
            }
            
            return false;
          })
          .map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`group relative p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              item.isActive
                ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-center">
              <div className={`mx-auto w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <div className={item.color}>
                  {item.icon}
                </div>
              </div>
              <h3 className={`text-lg font-bold ${item.color} mb-2`}>{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* System Features */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fitur Sistem</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">24/7</div>
            <div className="text-sm text-gray-600">Akses Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Real-time</div>
            <div className="text-sm text-gray-600">Data Sync</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">Auto</div>
            <div className="text-sm text-gray-600">Backup</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">Secure</div>
            <div className="text-sm text-gray-600">Cloud Storage</div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};