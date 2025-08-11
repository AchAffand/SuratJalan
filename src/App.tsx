import React, { useState, useMemo, useEffect } from 'react';
import { useDeliveryNotes } from './hooks/useDeliveryNotes';
import { DeliveryNote } from './types';
import { DeliveryNoteForm } from './components/DeliveryNoteForm';
import { WeightModal } from './components/WeightModal';
import { DeliveryNoteCard } from './components/DeliveryNoteCard';
import { Dashboard } from './components/Dashboard';
import { SearchAndFilter } from './components/SearchAndFilter';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ReportGenerator } from './components/ReportGenerator';
import { NotificationCenter } from './components/NotificationCenter';
import { PurchaseOrderManager } from './components/PurchaseOrderManager';
import { Plus, Truck, RefreshCw, FileText, AlertCircle, Wifi, Menu, X, Calendar, BarChart3, Bell, FileSpreadsheet } from 'lucide-react';
import Pengiriman from './components/Pengiriman';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { supabase } from './lib/supabase';

function App() {
  const { notes, loading, error, createNote, updateNote, removeNote, getStats, refreshNotes } = useDeliveryNotes();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<DeliveryNote | undefined>();
  const [weightModal, setWeightModal] = useState<DeliveryNote | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'reports' | 'purchase-orders'>('dashboard');
  const [headerVisible, setHeaderVisible] = useState(true);
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [swReady, setSwReady] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(Notification.permission);
  const location = useLocation();
  const navigate = useNavigate();

  // Listen to global events to toggle header visibility (used by detail view)
  useEffect(() => {
    const hide = () => setHeaderVisible(false);
    const show = () => setHeaderVisible(true);
    window.addEventListener('hideHeader', hide);
    window.addEventListener('showHeader', show);
    return () => {
      window.removeEventListener('hideHeader', hide);
      window.removeEventListener('showHeader', show);
    };
  }, []);

  // Realtime notifications from Supabase for delivery_notes
  useEffect(() => {
    const channel = (window as any).supabaseRealtimeChannel || supabase.channel('realtime-delivery-notes');
    (window as any).supabaseRealtimeChannel = channel;
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_notes' }, (payload: any) => {
      setRealtimeEvents(prev => [{ type: payload.eventType, new: payload.new, old: payload.old, at: Date.now() }, ...prev].slice(0, 50));
    }).subscribe();
    return () => {
      try { channel.unsubscribe(); } catch {}
    };
  }, []);

  // Register Service Worker for Web Push
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => setSwReady(true))
        .catch(() => setSwReady(false));
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    } catch {}
  };

  // Mock purchase orders data - in real app, this would come from a hook
  const [purchaseOrders] = useState([
    {
      id: '1',
      po_number: 'PO/2024/001',
      po_date: '2024-01-15',
      supplier_name: 'PT. Supplier Utama',
      supplier_address: 'Jl. Raya Jakarta No. 123',
      supplier_phone: '+62 21 1234567',
      supplier_email: 'info@supplier.com',
      product_type: 'CPO' as const,
      total_tonnage: 1000,
      price_per_ton: 8500000,
      total_value: 8500000000,
      status: 'Aktif' as const,
      shipped_tonnage: 600,
      remaining_tonnage: 400,
      delivery_deadline: '2024-12-31',
      payment_terms: 'Net 30',
      notes: 'Pengiriman bertahap',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    }
  ]);

  // State untuk filter bulan di dashboard
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  // Ambil semua bulan unik dari notes.date
  const allMonths = Array.from(new Set(notes.map(n => dayjs(n.date).format('MMMM YYYY')))).sort((a, b) => dayjs(b, 'MMMM YYYY').toDate().getTime() - dayjs(a, 'MMMM YYYY').toDate().getTime());
  // Filter notes sesuai bulan yang dipilih (berdasarkan date)
  const filteredNotesByMonth = selectedMonth ? notes.filter(n => dayjs(n.date).format('MMMM YYYY') === selectedMonth) : notes;
  // Group filteredNotesByMonth by month (berdasarkan date)
  const notesByMonth: Record<string, DeliveryNote[]> = {};
  filteredNotesByMonth.forEach(note => {
    const month = dayjs(note.date).format('MMMM YYYY');
    if (!notesByMonth[month]) notesByMonth[month] = [];
    notesByMonth[month].push(note);
  });

  const filteredNotes = useMemo(() => {
    const normalize = (v?: string | null) => (v || '').toString().toLowerCase().trim();
    const tokens = normalize(searchTerm).split(/\s+/).filter(Boolean);

    const matchesTokens = (note: DeliveryNote) => {
      if (tokens.length === 0) return true;
      const haystacks = [
        normalize(note.deliveryNoteNumber),
        normalize(note.driverName),
        normalize(note.vehiclePlate),
        normalize(note.destination),
        normalize(note.poNumber as any),
        normalize(note.status),
      ];
      // Every token must be found in at least one field
      return tokens.every(t => haystacks.some(h => h.includes(t)));
    };

    const result = notes
      .filter(note => !selectedMonth || dayjs(note.date).format('MMMM YYYY') === selectedMonth)
      .filter(note => statusFilter === 'all' || note.status === statusFilter)
      .filter(matchesTokens);
    console.log('filteredNotes', result, searchTerm);
    return result;
  }, [notes, selectedMonth, statusFilter, searchTerm]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filteredNotes]);

  const handleSaveNote = async (noteData: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingNote) {
        await updateNote(editingNote.id, noteData);
        setEditingNote(undefined);
      } else {
        await createNote(noteData);
      }
      setShowForm(false);
    } catch (err) {
      // Error is handled in the hook
    }
  };

  const handleEditNote = (note: DeliveryNote) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus surat jalan ini? Data yang sudah dihapus tidak dapat dikembalikan.')) {
      try {
        await removeNote(id);
      } catch (err) {
        // Error is handled in the hook
      }
    }
  };

  const handleAddWeight = (note: DeliveryNote) => {
    if (note.status !== 'selesai') {
      alert('Berat timbangan hanya bisa diinput setelah status pengiriman menjadi "Selesai"');
      return;
    }
    setWeightModal(note);
  };

  const handleSaveWeight = async (weight: number) => {
    if (weightModal) {
      try {
        await updateNote(weightModal.id, { netWeight: weight });
        setWeightModal(undefined);
      } catch (err) {
        // Error is handled in the hook
      }
    }
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex items-center space-x-4 max-w-sm w-full">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">Memuat Data</h3>
            <p className="text-gray-600 text-sm">Sedang mengambil data surat jalan dari cloud...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Fixed Header (can be hidden by detail pages) */}
      {headerVisible && (
      <div className="fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Sistem Surat Jalan</h1>
                  <div className="hidden sm:flex items-center space-x-1 flex-shrink-0">
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Cloud Sync</span>
                  </div>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                  Kelola pengiriman dan timbangan kendaraan - Tersinkron di semua perangkat
                </p>
              </div>
            </div>
            {/* Header Action Buttons */}
            {location.pathname === '/pengiriman' ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openAddAlamat'))}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Tambah Alamat
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Kembali
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <button
                  onClick={() => {
                    setEditingNote(undefined);
                    setShowForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all items-center space-x-2 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden lg:inline">Buat Surat Jalan</span>
                  <span className="lg:hidden">Buat</span>
                </button>
                <a
                  href="/pengiriman"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all items-center space-x-2 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Pengiriman</span>
                </a>
                <NotificationCenter notes={notes} newEvents={realtimeEvents} />
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="sm:hidden border-t border-gray-200 py-4 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="font-medium">Cloud Sync Aktif</span>
              </div>
              <button
                onClick={() => {
                  setEditingNote(undefined);
                  setShowForm(true);
                  setShowMobileMenu(false);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 font-medium shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Buat Surat Jalan Baru</span>
              </button>
              <a
                href="/pengiriman"
                className="w-full block bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all text-center font-medium shadow-lg hover:shadow-xl mt-2"
                style={{ textDecoration: 'none' }}
                onClick={() => setShowMobileMenu(false)}
              >
                Pengiriman
              </a>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Main Content with top padding for fixed header */}
      <Routes>
        <Route path="/" element={
          <div className="pt-16 sm:pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800">Terjadi Kesalahan</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  <button
                    onClick={refreshNotes}
                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* View Navigation */}
              <div className="mb-6">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'dashboard'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('analytics')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'analytics'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setCurrentView('reports')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'reports'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Reports
                  </button>
                  <button
                    onClick={() => setCurrentView('purchase-orders')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'purchase-orders'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Purchase Orders
                  </button>
                </div>
              </div>

              {/* Content based on current view */}
              {currentView === 'dashboard' && (
                <>
                  <Dashboard stats={stats} activeStatus={statusFilter} onStatClick={setStatusFilter} />
              {/* Dropdown filter bulan modern */}
              <div className="mb-6 flex items-center space-x-3">
                <span className="font-semibold text-gray-700">Pilih Bulan:</span>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="appearance-none bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-blue-200 text-blue-700 font-semibold px-4 py-2 pr-10 rounded-xl shadow hover:from-purple-200 hover:to-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all outline-none cursor-pointer"
                    style={{ minWidth: 160 }}
                  >
                    <option value="" className="text-gray-400">Semua Bulan</option>
                    {allMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                </div>
              </div>
              {/* Main Content */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 flex-shrink-0" />
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Daftar Surat Jalan
                    </h2>
                    <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      {filteredNotes.length} surat jalan
                    </span>
                  </div>
                  <button
                    onClick={refreshNotes}
                    className="self-start sm:self-auto p-2 sm:p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Muat Ulang Data"
                  >
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <SearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="bg-gray-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Truck className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      {notes.length === 0 ? 'Belum Ada Surat Jalan' : 'Tidak Ada Hasil'}
                    </h3>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                      {notes.length === 0
                        ? 'Mulai dengan membuat surat jalan pertama Anda'
                        : 'Tidak ada surat jalan yang sesuai dengan kriteria pencarian'}
                    </p>
                    {notes.length === 0 && (
                      <button
                        onClick={() => {
                          setEditingNote(undefined);
                          setShowForm(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl mx-auto text-sm sm:text-base"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Buat Surat Jalan Pertama</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredNotes.map(note => (
                      <DeliveryNoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onDelete={handleDeleteNote}
                        onAddWeight={handleAddWeight}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
              )}

              {currentView === 'analytics' && (
                <AnalyticsDashboard notes={notes} purchaseOrders={purchaseOrders} />
              )}

              {currentView === 'reports' && (
                <ReportGenerator 
                  notes={notes} 
                  purchaseOrders={purchaseOrders}
                  onExport={(reportData, format) => {
                    console.log('Exporting report:', format, reportData);
                    // Implement export functionality
                    alert(`Report exported as ${format.toUpperCase()}`);
                  }}
                />
              )}

              {currentView === 'purchase-orders' && (
                <PurchaseOrderManager
                  purchaseOrders={purchaseOrders}
                  deliveryNotes={notes}
                  onCreatePO={(poData) => {
                    console.log('Creating PO:', poData);
                    // Implement PO creation
                  }}
                  onUpdatePO={(id, updates) => {
                    console.log('Updating PO:', id, updates);
                    // Implement PO update
                  }}
                  onDeletePO={(id) => {
                    console.log('Deleting PO:', id);
                    // Implement PO deletion
                  }}
                />
              )}
            </div>
          </div>
        } />
        <Route path="/pengiriman" element={<Pengiriman />} />
      </Routes>

      {/* Fixed Mobile FAB (Floating Action Button) */}
      <button
        onClick={() => {
          setEditingNote(undefined);
          setShowForm(true);
        }}
        className="sm:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-110 z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      {showForm && (
        <DeliveryNoteForm
          note={editingNote}
          onSave={handleSaveNote}
          onCancel={() => {
            setShowForm(false);
            setEditingNote(undefined);
          }}
        />
      )}

      {weightModal && (
        <WeightModal
          currentWeight={weightModal.netWeight}
          deliveryNoteNumber={weightModal.deliveryNoteNumber}
          onSave={handleSaveWeight}
          onClose={() => setWeightModal(undefined)}
        />
      )}
    </div>
  );
}

export default App;