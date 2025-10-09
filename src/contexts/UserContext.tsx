import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, UserRole, AuthState, LoginCredentials } from '../types/user';
import { hasPermission } from '../utils/rolePermissions';
import { supabase } from '../lib/supabase';

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Context Type
interface UserContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasPermission: (permission: keyof import('../types/user').RolePermissions) => boolean;
}

// Create Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Removed MOCK_USERS. Users are now managed in Supabase table app_users

// User Provider Component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Authenticate against Supabase app_users
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, name, role, email, is_active, created_at, password, custom_menu_access')
        .eq('username', credentials.username)
        .eq('role', credentials.role)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Username atau role tidak ditemukan');
      if (!data.is_active) throw new Error('Akun tidak aktif');
      if (credentials.password !== data.password) throw new Error('Password salah');

      const updatedUser: User = {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role as UserRole,
        email: data.email || '',
        isActive: data.is_active,
        createdAt: data.created_at,
        lastLogin: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Login gagal',
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Permission check function
  const checkPermission = (permission: keyof import('../types/user').RolePermissions): boolean => {
    if (!state.user) return false;
    return hasPermission(state.user.role, permission);
  };

  const value: UserContextType = {
    ...state,
    login,
    logout,
    clearError,
    hasPermission: checkPermission,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

