import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, UserRole, AuthState, LoginCredentials } from '../types/user';
import { hasPermission } from '../utils/rolePermissions';

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

// Mock Users Database (In production, this would be from Supabase)
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrator',
    role: 'administrator',
    email: 'admin@ptsamuderaberkahsentosa.com',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'supervisor',
    name: 'Supervisor Operasional',
    role: 'supervisor',
    email: 'supervisor@ptsamuderaberkahsentosa.com',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    username: 'operator',
    name: 'Operator Pengiriman',
    role: 'operator',
    email: 'operator@ptsamuderaberkahsentosa.com',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    username: 'driver',
    name: 'Driver',
    role: 'driver',
    email: 'driver@ptsamuderaberkahsentosa.com',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

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

      // Check custom users first
      const savedUsers = localStorage.getItem('customUsers');
      let user = null;
      
      if (savedUsers) {
        const customUsers = JSON.parse(savedUsers);
        const customUser = customUsers.find((u: any) => u.username === credentials.username && u.role === credentials.role);
        
        if (customUser && customUser.password === credentials.password) {
          user = {
            id: customUser.id,
            username: customUser.username,
            name: customUser.name,
            role: customUser.role,
            email: customUser.email || '',
            isActive: true,
            createdAt: customUser.createdAt || new Date().toISOString()
          };
        }
      }

      // Fallback to mock users if not found in custom users
      if (!user) {
        user = MOCK_USERS.find(
          u => u.username === credentials.username && u.role === credentials.role
        );

        if (!user) {
          throw new Error('Username atau role tidak ditemukan');
        }

        // Simple password check (in production, use proper authentication)
        const validPasswords: Record<UserRole, string> = {
          administrator: 'admin123',
          supervisor: 'supervisor123',
          operator: 'operator123',
          driver: 'driver123',
        };

        if (credentials.password !== validPasswords[credentials.role]) {
          throw new Error('Password salah');
        }
      }

      if (!user.isActive) {
        throw new Error('Akun tidak aktif');
      }

      // Update last login
      const updatedUser = {
        ...user,
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

