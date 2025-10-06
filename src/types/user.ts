// User Role Types
export type UserRole = 'administrator' | 'operator' | 'driver' | 'supervisor';

// User Interface
export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Role Permissions
export interface RolePermissions {
  canViewDashboard: boolean;
  canManageDeliveryNotes: boolean;
  canManagePurchaseOrders: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canPrintDocuments: boolean;
  canManageSettings: boolean;
}

// Menu Item Interface
export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  requiredRole: UserRole[];
  description: string;
}

// Login Credentials
export interface LoginCredentials {
  username: string;
  password: string;
  role: UserRole;
}

// Auth State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

