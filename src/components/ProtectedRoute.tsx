import React from 'react';
import { useUser } from '../contexts/UserContext';
import { UserRole } from '../types/user';
import { canAccessRoute } from '../utils/rolePermissions';
import LoginForm from './LoginForm';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallback 
}) => {
  const { isAuthenticated, user, isLoading } = useUser();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  // Check role-based access
  if (requiredRole && !requiredRole.includes(user.role)) {
    return fallback || <AccessDenied userRole={user.role} requiredRoles={requiredRole} />;
  }

  return <>{children}</>;
};

// Access Denied Component
const AccessDenied: React.FC<{ userRole: UserRole; requiredRoles: UserRole[] }> = ({ 
  userRole, 
  requiredRoles 
}) => {
  const { logout } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/30 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-gray-800 mb-4">
            Akses Ditolak
          </h1>

          {/* Message */}
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              Role <strong>{userRole}</strong> tidak memiliki akses ke halaman ini.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-700">Role yang Diperlukan:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredRoles.map(role => (
                  <span 
                    key={role}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={logout}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Login dengan Role Lain
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;

