import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserRole } from '../types/user';
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../utils/rolePermissions';
import { Loader2, Eye, EyeOff, Shield, Users, Truck } from 'lucide-react';

const LoginForm: React.FC = () => {
  const { login, isLoading, error, clearError } = useUser();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    role: 'administrator' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(credentials);
  };

  const handleInputChange = (field: keyof typeof credentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const roleIcons: Record<UserRole, React.ReactNode> = {
    administrator: <Shield className="w-5 h-5" />,
    supervisor: <Users className="w-5 h-5" />,
    operator: <Truck className="w-5 h-5" />,
    driver: <Truck className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-cyan-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-10 -right-10 w-32 h-32 bg-gradient-to-br from-cyan-200/40 to-indigo-300/30 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute -bottom-10 left-1/3 w-24 h-24 bg-gradient-to-br from-indigo-200/50 to-blue-300/40 rounded-full blur-xl animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Sistem Surat Jalan
            </h1>
            <p className="text-gray-600 font-medium">
              PT. Samudera Berkah Sentosa
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Pilih Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(ROLE_DISPLAY_NAMES).map(([role, displayName]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleInputChange('role', role)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      credentials.role === role
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {roleIcons[role as UserRole]}
                      <span className="text-sm font-bold">{displayName}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {ROLE_DESCRIPTIONS[credentials.role]}
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 bg-white/90 backdrop-blur-sm"
                placeholder="Masukkan username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
  };

export default LoginForm;
