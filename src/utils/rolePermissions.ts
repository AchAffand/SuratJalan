import { UserRole, RolePermissions, MenuItem } from '../types/user';

// Role Permissions Configuration
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  administrator: {
    canViewDashboard: true,
    canManageDeliveryNotes: true,
    canManagePurchaseOrders: true,
    canViewReports: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canPrintDocuments: true,
    canManageSettings: true,
  },
  supervisor: {
    canViewDashboard: true,
    canManageDeliveryNotes: true,
    canManagePurchaseOrders: true,
    canViewReports: true,
    canManageUsers: false,
    canViewAnalytics: true,
    canPrintDocuments: true,
    canManageSettings: false,
  },
  operator: {
    canViewDashboard: true,
    canManageDeliveryNotes: true,
    canManagePurchaseOrders: false,
    canViewReports: true,
    canManageUsers: false,
    canViewAnalytics: false,
    canPrintDocuments: true,
    canManageSettings: false,
  },
  driver: {
    canViewDashboard: true,
    canManageDeliveryNotes: false,
    canManagePurchaseOrders: false,
    canViewReports: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canPrintDocuments: false,
    canManageSettings: false,
  },
};

// Menu Configuration
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '🏠',
    path: '/',
    requiredRole: ['administrator', 'supervisor', 'operator', 'driver'],
    description: 'Halaman utama sistem'
  },
  {
    id: 'pengiriman',
    title: 'Dashboard Pengiriman',
    icon: '🚛',
    path: '/pengiriman',
    requiredRole: ['administrator', 'supervisor', 'operator'],
    description: 'Kelola data pengiriman dan surat jalan'
  },
  {
    id: 'surat-jalan',
    title: 'Surat Jalan',
    icon: '📋',
    path: '/surat-jalan',
    requiredRole: ['administrator', 'supervisor', 'operator'],
    description: 'Buat dan kelola surat jalan'
  },
  {
    id: 'purchase-orders',
    title: 'Purchase Orders',
    icon: '📦',
    path: '/purchase-orders',
    requiredRole: ['administrator', 'supervisor'],
    description: 'Kelola data purchase order'
  },
  {
    id: 'laporan',
    title: 'Laporan',
    icon: '📊',
    path: '/laporan',
    requiredRole: ['administrator', 'supervisor', 'operator'],
    description: 'Generate laporan operasional'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: '📈',
    path: '/analytics',
    requiredRole: ['administrator', 'supervisor'],
    description: 'Analisis data dan kinerja'
  },
  {
    id: 'pengaturan',
    title: 'Pengaturan',
    icon: '⚙️',
    path: '/pengaturan',
    requiredRole: ['administrator'],
    description: 'Konfigurasi sistem dan user'
  }
];

// Helper Functions
export const hasPermission = (userRole: UserRole, permission: keyof RolePermissions): boolean => {
  return ROLE_PERMISSIONS[userRole][permission];
};

export const getAccessibleMenus = (userRole: UserRole): MenuItem[] => {
  return MENU_ITEMS.filter(menu => menu.requiredRole.includes(userRole));
};

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  const menu = MENU_ITEMS.find(m => m.path === route);
  return menu ? menu.requiredRole.includes(userRole) : false;
};

// Role Display Names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  administrator: 'Administrator',
  supervisor: 'Supervisor',
  operator: 'Operator',
  driver: 'Driver',
};

// Role Descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  administrator: 'Akses penuh ke semua fitur sistem',
  supervisor: 'Akses ke manajemen operasional dan laporan',
  operator: 'Akses ke pengiriman dan surat jalan',
  driver: 'Akses terbatas untuk melihat dashboard',
};

