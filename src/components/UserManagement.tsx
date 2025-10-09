import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Users, 
  Shield,
  Settings,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { UserRole, User } from '../types/user';
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../utils/rolePermissions';
import { supabase } from '../lib/supabase';

interface UserManagementProps {
  onClose: () => void;
}

interface CustomUser extends User {
  password: string;
  customMenuAccess?: string[];
}

const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<CustomUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'operator' as UserRole,
    customMenuAccess: [] as string[]
  });

  // Available menu options
  const menuOptions = [
    { id: 'dashboard', name: 'Dashboard', description: 'Overview dan statistik' },
    { id: 'print', name: 'Cetak Surat Jalan', description: 'Cetak dan kirim surat jalan' },
    { id: 'analytics', name: 'Analitik', description: 'Analisis data dan tren' },
    { id: 'operational-reports', name: 'Laporan Operasional', description: 'Laporan harian dan bulanan' },
    { id: 'po-reports', name: 'Laporan PO', description: 'Laporan Purchase Order' },
    { id: 'invoice-generator', name: 'Invoice Generator', description: 'Buat dan kelola invoice' },
    { id: 'purchase-orders', name: 'Purchase Order', description: 'Kelola PO dan tracking' },
    { id: 'pengiriman', name: 'Pengiriman', description: 'Kelola alamat dan rekap' }
  ];

  // Load users from Supabase
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, name, role, email, is_active, created_at, password, custom_menu_access')
        .order('created_at', { ascending: false });
      if (!error) {
        const mapped = (data as any[]).map(u => ({...u, customMenuAccess: u.custom_menu_access || []}));
        setUsers(mapped as any);
      }
    };
    load();
  }, []);

  const saveUsers = (newUsers: CustomUser[]) => {
    setUsers(newUsers);
  };

  const resetToDefaultUsers = async () => {
    if (confirm('Yakin ingin mengembalikan ke akun default? Semua akun custom akan hilang!')) {
      const defaults = [
        { username: 'admin', name: 'Administrator', role: 'administrator', password: 'admin123' },
        { username: 'supervisor', name: 'Supervisor Operasional', role: 'supervisor', password: 'supervisor123' },
        { username: 'operator', name: 'Operator Pengiriman', role: 'operator', password: 'operator123' },
        { username: 'driver', name: 'Driver', role: 'driver', password: 'driver123' }
      ];
      await supabase.from('app_users').delete().neq('id', '');
      const { data } = await supabase.from('app_users').insert(defaults).select('*');
      saveUsers((data as any) || []);
    }
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.name || !formData.password) {
      alert('Semua field harus diisi!');
      return;
    }

    // Check if username already exists
    if (users.some(u => u.username === formData.username)) {
      alert('Username sudah ada!');
      return;
    }

    const { data, error } = await supabase
      .from('app_users')
      .insert({ username: formData.username, name: formData.name, role: formData.role, password: formData.password, custom_menu_access: formData.customMenuAccess })
      .select('*')
      .single();
    if (!error && data) {
      const mapped: any = { ...data, customMenuAccess: (data as any).custom_menu_access || [] };
      saveUsers([mapped, ...users]);
    }
    setShowAddForm(false);
    resetForm();
  };

  const handleEditUser = (user: CustomUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      password: user.password,
      role: user.role,
      customMenuAccess: user.customMenuAccess || []
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const { data, error } = await supabase
      .from('app_users')
      .update({ username: formData.username, name: formData.name, role: formData.role, password: formData.password, custom_menu_access: formData.customMenuAccess })
      .eq('id', (editingUser as any).id)
      .select('*')
      .single();
    if (!error && data) {
      const mapped: any = { ...data, customMenuAccess: (data as any).custom_menu_access || [] };
      const updatedUsers = users.map(u => (u.id === (editingUser as any).id ? mapped : u));
      saveUsers(updatedUsers);
    }
    setEditingUser(null);
    resetForm();
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('Tidak bisa menghapus akun sendiri!');
      return;
    }

    if (confirm('Yakin ingin menghapus user ini?')) {
      await supabase.from('app_users').delete().eq('id', userId);
      const updatedUsers = users.filter(u => u.id !== userId);
      saveUsers(updatedUsers);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'operator',
      customMenuAccess: []
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleMenuAccess = (menuId: string) => {
    setFormData(prev => ({
      ...prev,
      customMenuAccess: prev.customMenuAccess.includes(menuId)
        ? prev.customMenuAccess.filter(id => id !== menuId)
        : [...prev.customMenuAccess, menuId]
    }));
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      administrator: 'bg-red-100 text-red-800',
      supervisor: 'bg-blue-100 text-blue-800',
      operator: 'bg-green-100 text-green-800',
      driver: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Manajemen User</h2>
                <p className="text-blue-100">Kelola user dan akses menu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add User Button */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah User Baru</span>
            </button>
            <button
              onClick={resetToDefaultUsers}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Reset ke Default</span>
            </button>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingUser) && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-dashed border-gray-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="supervisor">Supervisor</option>
                    <option value="operator">Operator</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>
              </div>

              {/* Menu Access Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Akses Menu</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {menuOptions.map(menu => (
                    <label key={menu.id} className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.customMenuAccess.includes(menu.id)}
                        onChange={() => toggleMenuAccess(menu.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{menu.name}</div>
                        <div className="text-sm text-gray-500">{menu.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'Update' : 'Simpan'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Batal</span>
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-gray-600">@{user.username}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {ROLE_DISPLAY_NAMES[user.role]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.customMenuAccess?.length || 0} menu akses
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Password Visibility Toggle */}
                    <button
                      onClick={() => togglePasswordVisibility(user.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords[user.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    {/* Password Display */}
                    {showPasswords[user.id] && (
                      <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                        {user.password}
                      </span>
                    )}
                    
                    {/* Action Buttons */}
                    {user.id !== currentUser?.id && (
                      <>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Menu Access Display */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-600 mb-2">Akses Menu:</div>
                  <div className="flex flex-wrap gap-1">
                    {user.customMenuAccess?.map(menuId => {
                      const menu = menuOptions.find(m => m.id === menuId);
                      return menu ? (
                        <span key={menuId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {menu.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
