import { useState, useEffect } from 'react';
import { useDeliveryNotes } from './hooks/useDeliveryNotes';
import { DeliveryNote } from './types';
import { DeliveryNoteForm } from './components/DeliveryNoteForm';
import { WeightModal } from './components/WeightModal';
import { SuratJalanPrinter } from './components/SuratJalanPrinter';
import { PrintSuratJalan } from './components/PrintSuratJalan';
import { NewDashboard } from './components/NewDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ReportGenerator } from './components/ReportGenerator';
import { POReportGenerator } from './components/POReportGenerator';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { PurchaseOrderManager } from './components/PurchaseOrderManager';
import { Plus, RefreshCw, AlertCircle, Wifi } from 'lucide-react';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import ReactDOM from 'react-dom/client';
import Pengiriman from './components/Pengiriman';
import { Routes, Route } from 'react-router-dom';
import dayjs from './lib/dayjs';
import { supabase } from './lib/supabase';
import { exportToCSV, exportToExcel, createBasicPDF } from './utils/exporters';
import { exportToExcel as exportPOToExcel } from './utils/poExportUtils';
import { UserProvider, useUser } from './contexts/UserContext';
import LoginForm from './components/LoginForm';

// App Content Component that uses useUser hook
function AppContent() {
  const { isAuthenticated, user, isLoading: authLoading, logout } = useUser();
  const { notes, loading, error, createNote, updateNote, removeNote, getStats, refreshNotes } = useDeliveryNotes();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<DeliveryNote | undefined>();
  const [weightModal, setWeightModal] = useState<DeliveryNote | undefined>();
  const [printModal, setPrintModal] = useState<DeliveryNote | undefined>();
  const [showPrintSuratJalan, setShowPrintSuratJalan] = useState(false);
  const [toast, setToast] = useState<{message: string; type?: 'success' | 'error' | 'info'}|null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'operational-reports' | 'po-reports' | 'invoice-generator' | 'purchase-orders' | 'pengiriman'>('dashboard');
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Persist current view in localStorage
  useEffect(() => {
    // Clear any old cache
    localStorage.removeItem('oldDashboard');
    localStorage.removeItem('cachedView');
    
    const savedView = localStorage.getItem('currentView');
    if (savedView && ['dashboard', 'analytics', 'operational-reports', 'po-reports', 'invoice-generator', 'purchase-orders', 'pengiriman'].includes(savedView)) {
      setCurrentView(savedView as any);
    } else {
      // Ensure dashboard is always the default
      setCurrentView('dashboard');
      localStorage.setItem('currentView', 'dashboard');
    }
    // Force refresh to ensure new menu is displayed
    setForceRefresh(prev => prev + 1);
  }, []);

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);

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

  // Enhanced realtime notifications from Supabase for delivery_notes
  useEffect(() => {
    try {
      // Create new channel each time
      const channel = supabase.channel('realtime-delivery-notes');
      
      // Set up event listeners BEFORE subscribing
      channel.on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'delivery_notes' 
      }, (payload: any) => {
        
        // Add to real-time events with enhanced metadata
        const enhancedEvent = {
          type: payload.eventType,
          new: payload.new,
          old: payload.old,
          at: Date.now(),
          metadata: {
            table: payload.table,
            schema: payload.schema,
            commit_timestamp: payload.commit_timestamp,
            id: payload.new?.id || payload.old?.id
          }
        };
        
        setRealtimeEvents(prev => [enhancedEvent, ...prev].slice(0, 50));
        
        // Enhanced auto-refresh logic
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newData = payload.new;
          const oldData = payload.old;
          
          // Check if this is a completed delivery with weight
          if (newData.status === 'selesai' && newData.netWeight && newData.poNumber) {
            console.log('🔄 Delivery completed with weight, refreshing PO data...', {
              poNumber: newData.poNumber,
              netWeight: newData.netWeight,
              status: newData.status
            });
            // Small delay to ensure database trigger has processed
            setTimeout(() => {
              loadPOs();
              console.log('✅ PO data refreshed after delivery completion');
            }, 1500);
          }
          
          // Also refresh PO when weight is updated (even if status not changed)
          if (oldData && oldData.netWeight !== newData.netWeight && newData.poNumber) {
            console.log('🔄 Weight updated, refreshing PO data...', {
              poNumber: newData.poNumber,
              oldWeight: oldData.netWeight,
              newWeight: newData.netWeight
            });
            setTimeout(() => {
              loadPOs();
              console.log('✅ PO data refreshed after weight update');
            }, 1000);
          }
          
          // Check for status changes that might need notifications
          if (oldData && oldData.status !== newData.status) {}
          
          // Check for weight input
          if (oldData && !oldData.net_weight && newData.net_weight) {}
        }
        
        // Handle deletions
        if (payload.eventType === 'DELETE') {}
      });
      
      // Subscribe and handle status
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time channel error');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Real-time connection timed out');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Real-time channel closed');
        } else if (status === 'LEAVING') {
        }
      });
      
      // Store channel reference
    (window as any).supabaseRealtimeChannel = channel;
      
    return () => {
        try { 
          channel.unsubscribe(); 
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      };
    } catch (error) {
      console.error('❌ Failed to setup real-time subscription:', error);
    }
  }, []);

  // Register Service Worker for Web Push
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    }
  }, []);


  // Purchase Orders state (data nyata dari Supabase)
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const loadPOs = async () => {
    try {
      setPoLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (e) {
      console.error('Gagal memuat PO:', e);
    } finally {
      setPoLoading(false);
    }
  };
  useEffect(() => { loadPOs(); }, []);
  
  // Auto-refresh PO data every 30 seconds to ensure real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing PO data...');
      loadPOs();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);



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

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex items-center space-x-4 max-w-sm w-full">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">Memverifikasi Akses</h3>
            <p className="text-gray-600 text-sm">Sedang memeriksa kredensial...</p>
          </div>
        </div>
      </div>
    );
  }

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
              <img 
                src="/image.png" 
                alt="Logo" 
                className="h-12 w-auto sm:h-14 object-contain rounded-lg shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Sistem Surat Jalan</h1>
                  <div className="hidden sm:flex items-center space-x-1 flex-shrink-0">
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Cloud Sync</span>
                  </div>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                  Kelola pengiriman dan timbangan kendaraan PT SBS & CV MULIA BERKAH SENTOSA
                </p>
                {user && (
                  <div className="text-xs text-blue-600 font-medium">
                    Selamat datang, {user.name} ({user.role})
                  </div>
                )}
              </div>
            </div>
            {/* Header Action Buttons */}
            {currentView === 'pengiriman' ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Desktop buttons */}
                <div className="hidden sm:flex items-center space-x-3">
                  {currentView !== 'dashboard' && (
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="bg-white text-gray-700 border border-gray-300 px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm hover:shadow items-center space-x-2"
                    >
                      <span>Kembali</span>
                    </button>
                  )}
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
                  <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Logout
                  </button>
                  <NotificationCenter notes={notes} newEvents={realtimeEvents} />
                </div>
                
                {/* Mobile buttons */}
                <div className="flex sm:hidden items-center space-x-2">
                  {currentView !== 'dashboard' && (
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all font-medium shadow"
                    >
                      Menu
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingNote(undefined);
                      setShowForm(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all items-center space-x-1 font-medium shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Buat</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
      )}

      {/* Main Content with top padding for fixed header */}
      <Routes>
        <Route path="/" element={
          <div className="pt-20 sm:pt-24">
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


              {/* Content based on current view */}
              {currentView === 'dashboard' && (
                <NewDashboard 
                  key={`new-dashboard-${currentView}-${forceRefresh}`}
                  stats={stats} 
                  activeStatus={statusFilter} 
                  onStatClick={setStatusFilter}
                  currentView={currentView}
                  onViewChange={(view: string) => setCurrentView(view as any)}
                  onPrintSuratJalan={() => setShowPrintSuratJalan(true)}
                  onNavigateToPengiriman={() => setCurrentView('pengiriman')}
                  notes={notes}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onEditNote={(note: DeliveryNote) => { setEditingNote(note); setShowForm(true); }}
                  onDeleteNote={async (id: string) => { try { await removeNote(id); } catch {} }}
                  onAddWeight={(note: DeliveryNote) => setWeightModal(note)}
                />
              )}

              {currentView === 'analytics' && (
                <AnalyticsDashboard notes={notes} purchaseOrders={purchaseOrders} />
              )}

              {currentView === 'operational-reports' && (
                <ReportGenerator 
                  notes={notes} 
                  purchaseOrders={purchaseOrders}
                  onExport={(reportData: any, format: 'pdf' | 'excel' | 'csv' | string) => {
                    console.log('📊 Report Export requested:', { format, reportData });

                    if (format === 'pdf') {
                      // Use enhanced PDF method with proper formatting
                      console.log('📄 Using enhanced PDF generation method');
                      if (reportData.printableHTML) {
                        // Use the properly formatted HTML from ReportGenerator
                        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
                        if (printWindow) {
                          printWindow.document.write(reportData.printableHTML);
                          printWindow.document.close();
                          console.log('✅ Enhanced PDF window opened successfully');
                        } else {
                          alert('Popup diblokir! Silakan izinkan popup untuk ekspor PDF.');
                        }
                      } else {
                        // Fallback to basic PDF
                        createBasicPDF('Laporan Operasional', reportData);
                      }
                    } else if (format === 'excel') {
                      // Excel export with proper HTML table format
                      console.log('📊 Using Excel export method');
                      try {
                        const rows = (reportData?.details?.deliveries || []).map((n: any) => ({
                          tanggal: dayjs(n.date).format('YYYY-MM-DD'),
                          no_surat_jalan: n.deliveryNoteNumber,
                          status: n.status,
                          no_po: n.poNumber || '',
                          tujuan: n.destination,
                          kendaraan: n.vehiclePlate,
                          sopir: n.driverName,
                          berat_bersih: n.netWeight || 0,
                        }));
                        
                        const filename = `laporan-operasional-${dayjs().format('YYYYMMDD-HHmm')}`;
                        
                        exportToExcel(rows, filename)
                          .then(success => {
                            if (success) {
                              console.log('✅ Export Excel laporan operasional berhasil');
                            }
                          })
                          .catch((error: any) => {
                            console.error('❌ Export Excel laporan operasional gagal:', error);
                            alert('Export Excel gagal: ' + error);
                          });
                      } catch (error) {
                        console.error('❌ Excel export failed:', error);
                        alert('Export Excel gagal: ' + error);
                      }
                    } else {
                      // CSV export
                      console.log('📊 Using CSV export method');
                      try {
                        const rows = (reportData?.details?.deliveries || []).map((n: any) => ({
                          tanggal: dayjs(n.date).format('YYYY-MM-DD'),
                          no_surat_jalan: n.deliveryNoteNumber,
                          status: n.status,
                          no_po: n.poNumber || '',
                          tujuan: n.destination,
                          kendaraan: n.vehiclePlate,
                          sopir: n.driverName,
                          berat_bersih: n.netWeight || 0,
                        }));
                        
                        const filename = `laporan-operasional-${dayjs().format('YYYYMMDD-HHmm')}`;
                        
                        exportToCSV(rows, filename)
                          .then(success => {
                            if (success) {
                              console.log('✅ Export CSV laporan operasional berhasil');
                            }
                          })
                          .catch(error => {
                            console.error('❌ Export CSV laporan operasional gagal:', error);
                            alert('Export CSV gagal: ' + error);
                          });
                      } catch (error) {
                        console.error('❌ CSV export failed:', error);
                        alert('Export CSV gagal: ' + error);
                      }
                    }
                  }}
                />
              )}

              {currentView === 'po-reports' && (
                <POReportGenerator 
                  purchaseOrders={purchaseOrders}
                  deliveryNotes={notes}
                  onExport={(reportData: any, format: 'pdf' | 'excel' | 'csv' | string) => {
                    console.log('📊 PO Export requested:', { format, reportData });

                    if (format === 'pdf') {
                      // Use enhanced PDF method with proper formatting
                      console.log('📄 Using enhanced PDF generation method for PO');
                      if (reportData.printableHTML) {
                        // Use the properly formatted HTML from POReportGenerator
                        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
                        if (printWindow) {
                          printWindow.document.write(reportData.printableHTML);
                          printWindow.document.close();
                          console.log('✅ Enhanced PDF window opened successfully for PO');
                        } else {
                          alert('Popup diblokir! Silakan izinkan popup untuk ekspor PDF.');
                        }
                      } else {
                        // Fallback to basic PDF
                        createBasicPDF('Laporan Purchase Order', reportData);
                      }
                    } else if (format === 'excel') {
                      // Use PO export utilities for Excel
                      console.log('📊 Using PO Excel export method');
                      try {
                        const exportData = {
                          purchaseOrders: reportData?.purchaseOrders || [],
                          deliveryNotes: notes || [],
                          metadata: reportData?.metadata || {
                            title: 'Laporan Purchase Order',
                            generatedAt: new Date().toISOString(),
                            period: 'All Data'
                          }
                        };
                        exportPOToExcel(exportData);
                        console.log('✅ PO Excel export completed');
                      } catch (error) {
                        console.error('❌ PO Excel export failed:', error);
                        alert('Export Excel gagal: ' + error);
                      }
                    } else {
                      // CSV export
                      const rows = (reportData?.purchaseOrders || []).map((po: any) => ({
                        no_po: po.po_number,
                        tanggal: dayjs(po.po_date).format('YYYY-MM-DD'),
                        buyer: po.buyer_name || '',
                        produk: po.product_type,
                        tonase_total: po.total_tonnage || 0,
                        tonase_terkirim: po.shipped_tonnage || 0,
                        tonase_sisa: po.remaining_tonnage || 0,
                        nilai_total: po.total_value || 0,
                        status: po.status,
                      }));

                      exportToCSV(rows, `laporan-po-${dayjs().format('YYYYMMDD-HHmm')}`)
                        .then(success => {
                          if (success) {
                            console.log('✅ Export laporan PO berhasil');
                          }
                        })
                        .catch(error => {
                          console.error('❌ Export laporan PO gagal:', error);
                        });
                    }
                  }}
                />
              )}

              {currentView === 'invoice-generator' && (
                <InvoiceGenerator 
                  notes={notes.filter(note => note.status === 'selesai' && note.netWeight)}
                  purchaseOrders={purchaseOrders}
                  onGenerateInvoice={(invoiceData: any) => {
                    // Fallback: tetap simpan CSV sederhana bila dipanggil dari luar
                    const rows = (invoiceData?.deliveries || []).map((d: any) => ({
                      no_surat_jalan: d.deliveryNoteNumber,
                      tanggal: dayjs(d.invoiceDate || d.date).format('YYYY-MM-DD'),
                      no_po: d.poNumber || '',
                      tujuan: d.destination,
                      berat_bersih: d.netWeight || 0,
                      harga_per_ton: d.unitPrice || 0,
                      total_harga: d.totalPrice || 0,
                    }));
                    exportToCSV(rows, `invoice-${dayjs().format('YYYYMMDD-HHmm')}`)
                      .then(success => {
                        if (success) {
                          console.log('✅ Export invoice berhasil');
                        }
                      })
                      .catch(error => {
                        console.error('❌ Export invoice gagal:', error);
                      });
                  }}
                />
              )}

              {currentView === 'purchase-orders' && (
                <>
                  {/* Auto-refresh notification */}
                  {poLoading && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center space-x-3">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Memperbarui PO List
                        </p>
                        <p className="text-xs text-blue-600">
                          Progress pengiriman sedang di-update secara otomatis
                        </p>
                      </div>
                    </div>
                  )}
                  <PurchaseOrderManager
                    purchaseOrders={purchaseOrders}
                    deliveryNotes={notes}
                  onCreatePO={async (poData) => {
                    try {
                      // Sanitize payload: only send columns that exist in DB schema
                      const payload: any = {
                        po_number: poData.po_number,
                        po_date: poData.po_date,
                        buyer_name: (poData as any).buyer_name || null,
                        buyer_address: (poData as any).buyer_address || null,
                        buyer_phone: (poData as any).buyer_phone || null,
                        buyer_email: (poData as any).buyer_email || null,
                        product_type: poData.product_type,
                        total_tonnage: Number(poData.total_tonnage || 0),
                        price_per_ton: Number(poData.price_per_ton || 0),
                        total_value: Number(poData.total_value || (Number(poData.total_tonnage||0) * Number(poData.price_per_ton||0))),
                        shipped_tonnage: Number(poData.shipped_tonnage || 0),
                        remaining_tonnage: Number(
                          (poData.remaining_tonnage != null ? poData.remaining_tonnage : (Number(poData.total_tonnage||0) - Number(poData.shipped_tonnage||0)))
                        ),
                        status: (poData.status as any) || 'Aktif',
                        delivery_deadline: (poData as any).delivery_deadline || null,
                        payment_terms: (poData as any).payment_terms || null,
                        notes: (poData as any).notes || null,
                        ppn_enabled: Boolean((poData as any).ppn_enabled ?? true),
                        ppn_rate: Number((poData as any).ppn_rate ?? 0.11),
                      };

                      const { error } = await supabase
                        .from('purchase_orders')
                        .insert([payload]);
                      if (error) throw error;
                      await loadPOs();
                      setToast({ message: 'PO berhasil dibuat', type: 'success' });
                    } catch (e) {
                      console.error('Gagal membuat PO:', e);
                      setToast({ message: 'Gagal membuat PO', type: 'error' });
                    }
                  }}
                  onUpdatePO={async (id, updates) => {
                    try {
                      // Sanitize updates; kirim hanya kolom yang ada
                      const allowedKeys = [
                        'po_number','po_date','product_type','total_tonnage','price_per_ton','total_value','shipped_tonnage','remaining_tonnage','status',
                        'buyer_name','buyer_address','buyer_phone','buyer_email','delivery_deadline','payment_terms','notes','ppn_enabled','ppn_rate'
                      ];
                      const safeUpdates: any = {};
                      allowedKeys.forEach(k => {
                        if ((updates as any)[k] !== undefined) (safeUpdates as any)[k] = (updates as any)[k];
                      });
                      if (safeUpdates.total_tonnage != null || safeUpdates.shipped_tonnage != null) {
                        const t = Number(safeUpdates.total_tonnage ?? updates.total_tonnage ?? 0);
                        const s = Number(safeUpdates.shipped_tonnage ?? updates.shipped_tonnage ?? 0);
                        safeUpdates.remaining_tonnage = Number(updates.remaining_tonnage ?? (t - s));
                      }

                      const { error } = await supabase
                        .from('purchase_orders')
                        .update(safeUpdates)
                        .eq('id', id);
                      if (error) throw error;
                      await loadPOs();
                      setToast({ message: 'PO berhasil diperbarui', type: 'success' });
                    } catch (e) {
                      console.error('Gagal memperbarui PO:', e);
                      setToast({ message: 'Gagal memperbarui PO', type: 'error' });
                    }
                  }}
                  onRefresh={loadPOs}
                  onDeletePO={async (id) => {
                    // Render confirm dialog elegantly instead of window.confirm
                    const host = document.createElement('div');
                    document.body.appendChild(host);
                    const root = ReactDOM.createRoot(host);
                    const cleanup = () => { try { root.unmount(); document.body.removeChild(host); } catch {} };
                    return new Promise<void>((resolve) => {
                      const handleConfirm = async () => {
                        try {
                          const { error } = await supabase
                            .from('purchase_orders')
                            .delete()
                            .eq('id', id);
                          if (error) throw error;
                          await loadPOs();
                          setToast({ message: 'PO berhasil dihapus', type: 'success' });
                        } catch (e) {
                          console.error('Gagal menghapus PO:', e);
                          setToast({ message: 'Gagal menghapus PO', type: 'error' });
                        } finally {
                          cleanup();
                          resolve();
                        }
                      };
                      const handleCancel = () => { cleanup(); resolve(); };

                      root.render(
                        <ConfirmDialog
                          open={true}
                          title="Hapus Purchase Order"
                          message="Anda yakin ingin menghapus PO ini? Tindakan ini tidak dapat dibatalkan."
                          confirmText="Hapus"
                          cancelText="Batal"
                          onConfirm={handleConfirm}
                          onCancel={handleCancel}
                        />
                      );
                    });
                  }}
                />
                </>
              )}

              {currentView === 'pengiriman' && (
                <Pengiriman />
              )}
            </div>
          </div>
        } />
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

      {printModal && (
        <SuratJalanPrinter
          deliveryNote={printModal}
          onClose={() => setPrintModal(undefined)}
        />
      )}

      {showPrintSuratJalan && (
        <PrintSuratJalan
          onClose={() => setShowPrintSuratJalan(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

// Main App component with UserProvider
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;