import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Check, X, Loader2, ArrowLeft, Eye, Truck, User, Package, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import dayjs from '../lib/dayjs';
import { formatWeight, formatDate, getStatusColor, getStatusText, getStatusIcon } from '../utils/format';

interface Destination {
  id: string;
  name: string;
  created_at: string;
  total_pengiriman: number;
  total_tonase: number;
  bulan?: string;
}

interface DeliveryDetail {
  id: string;
  date: string;
  vehiclePlate: string;
  driverName: string;
  deliveryNoteNumber: string;
  poNumber: string | null; // FIX: Konsisten dengan DeliveryNote interface
  destination: string;
  netWeight?: number;
  status: 'menunggu' | 'dalam-perjalanan' | 'selesai';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// FIX: Add proper database row type
interface DatabaseDeliveryNote {
  id: string;
  date: string | null;
  vehicle_plate: string | null;
  driver_name: string | null;
  delivery_note_number: string | null;
  no_po: string | null;
  destination: string | null;
  net_weight: number | null;
  status: 'menunggu' | 'dalam-perjalanan' | 'selesai' | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const Pengiriman: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selected, setSelected] = useState<Destination | null>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // State untuk filter bulan
  // State untuk detail view
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedDestinationMonth, setSelectedDestinationMonth] = useState<string>('');
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  // State untuk search dan view mode
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'monthly' | 'destination'>('monthly');

  // Fetch destinations and delivery_notes, then group per alamat & bulan
  const fetchDestinations = async () => {
    setLoading(true);
    setError('');
    const { data: dests, error: err1 } = await supabase
      .from('destinations')
      .select('id, name, created_at');
    const { data: notes, error: err2 } = await supabase
      .from('delivery_notes')
      .select('destination, date, net_weight');
    if (err1 || err2) {
      setError('Gagal memuat data');
      setLoading(false);
      return;
    }
    
    console.log('🏢 Destinations data:', dests);
    console.log('📋 Notes data:', notes);
    
    // Group delivery_notes per alamat & bulan
    const rekap: Array<{
      alamat: string;
      bulan: string;
      total_pengiriman: number;
      total_tonase: number;
    }> = [];
    const group: Record<string, Record<string, { pengiriman: number; tonase: number }>> = {};
    
    console.log('🔍 Processing notes for grouping...');
    (notes || []).forEach((n: any, index: number) => {
      if (!n.destination || !n.date) {
        console.log(`⚠️ Skipping note ${index}: missing destination or date`, n);
        return;
      }
      const bulan = dayjs(n.date).format('MMMM YYYY');
      console.log(`📅 Note ${index}: ${n.destination} - ${n.date} -> ${bulan}`);
      
      if (!group[n.destination]) group[n.destination] = {};
      if (!group[n.destination][bulan]) group[n.destination][bulan] = { pengiriman: 0, tonase: 0 };
      group[n.destination][bulan].pengiriman += 1;
      group[n.destination][bulan].tonase += Number(n.net_weight) || 0;
    });
    console.log('📊 Grouped data structure:', group);
    Object.entries(group).forEach(([alamat, perBulan]) => {
      console.log(`📍 Processing destination: ${alamat}`);
      Object.entries(perBulan).forEach(([bulan, data]) => {
        console.log(`  📅 Month: ${bulan} -> ${data.pengiriman} deliveries, ${data.tonase} kg`);
        rekap.push({
          alamat,
          bulan,
          total_pengiriman: data.pengiriman,
          total_tonase: data.tonase,
        });
      });
    });
    // Urutkan: alamat, bulan terbaru dulu
    rekap.sort((a, b) => {
      if (a.alamat < b.alamat) return -1;
      if (a.alamat > b.alamat) return 1;
      return dayjs(b.bulan, 'MMMM YYYY').toDate().getTime() - dayjs(a.bulan, 'MMMM YYYY').toDate().getTime();
    });
    
    console.log('📊 Grouped data:', group);
    console.log('📈 Final rekap:', rekap);
    
    setDestinations(
      rekap.map(r => ({
        id: r.alamat + r.bulan,
        name: r.alamat,
        created_at: '',
        total_pengiriman: r.total_pengiriman,
        total_tonase: r.total_tonase,
        bulan: r.bulan,
      }))
    );
    setLoading(false);
  };

  // Fetch delivery details for specific destination and month
  const fetchDeliveryDetails = async (destination: string, month: string) => {
    setLoadingDetails(true);
    setError('');
    
    const startDate = dayjs(month, 'MMMM YYYY').startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs(month, 'MMMM YYYY').endOf('month').format('YYYY-MM-DD');
    
    console.log('🔍 Fetching details for:', { destination, month, startDate, endDate });
    
    // First, let's check what data exists for this destination
    const { data: allNotesForDestination, error: checkError } = await supabase
      .from('delivery_notes')
      .select('*')
      .eq('destination', destination);
    
    console.log('🔍 All notes for destination:', allNotesForDestination);
    console.log('🔍 Check error:', checkError);
    
    if (checkError) {
      console.error('❌ Error checking destination data:', checkError);
      setError('Gagal memeriksa data pengiriman');
      setLoadingDetails(false);
      return;
    }
    
    // Now filter by date range
    const { data: notes, error } = await supabase
      .from('delivery_notes')
      .select('*')
      .eq('destination', destination)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching delivery details:', error);
      setError('Gagal memuat detail pengiriman');
      setLoadingDetails(false);
      return;
    }

    console.log('📦 Raw notes data:', notes);
    console.log('📊 Number of notes found:', notes?.length || 0);
    
    // Debug: Check if there are any notes with dates in August
    if (notes && notes.length === 0) {
      console.log('⚠️ No notes found for date range. Checking all notes for this destination...');
      const { data: allNotes } = await supabase
        .from('delivery_notes')
        .select('date, destination')
        .eq('destination', destination);
      console.log('📅 All dates for this destination:', allNotes?.map(n => ({ date: n.date, destination: n.destination })));
    }

    // Map database fields to interface fields
    const mappedNotes: DeliveryDetail[] = (notes || []).map((note: DatabaseDeliveryNote, index: number) => {
      // Handle case where date might be null or invalid
      const noteDate = note.date || new Date().toISOString().split('T')[0];
      const mapped = {
        id: note.id || '',
        date: noteDate,
        vehiclePlate: note.vehicle_plate || '',
        driverName: note.driver_name || '',
        deliveryNoteNumber: note.delivery_note_number || `SJ-${dayjs(noteDate).format('YYYYMMDD')}-${String(index + 1).padStart(3, '0')}`,
        poNumber: note.no_po || null, // FIX: Konsisten dengan type definition
        destination: note.destination || '',
        netWeight: note.net_weight || 0,
        status: note.status || 'menunggu',
        createdAt: note.created_at || '',
        updatedAt: note.updated_at || '',
        notes: note.notes || '',
      };
      console.log(`📝 Mapped note ${index + 1}:`, mapped);
      return mapped;
    });

    console.log('✅ Final mapped notes:', mappedNotes);
    
    // If no notes found with date filter, try with client-side filtering
    if (mappedNotes.length === 0) {
      console.log('🔄 No notes found with date filter, trying client-side filtering...');
      const { data: allNotesForDestination, error: fallbackError } = await supabase
        .from('delivery_notes')
        .select('*')
        .eq('destination', destination)
        .order('date', { ascending: true });
      
      if (fallbackError) {
        console.error('❌ Fallback query error:', fallbackError);
      } else {
        console.log('📦 All notes for destination found:', allNotesForDestination?.length || 0);
        
        // Filter by month on client side
        const filteredNotes = (allNotesForDestination || []).filter((note: DatabaseDeliveryNote) => {
          if (!note.date) return false;
          const noteMonth = dayjs(note.date).format('MMMM YYYY');
          const isCorrectMonth = noteMonth === month;
          console.log(`🔍 Checking note date: ${note.date} -> ${noteMonth} vs ${month} = ${isCorrectMonth}`);
          return isCorrectMonth;
        });
        
        console.log('📊 Filtered notes for month:', filteredNotes.length);
        
        const fallbackMappedNotes: DeliveryDetail[] = filteredNotes.map((note: DatabaseDeliveryNote, index: number) => {
          const noteDate = note.date || new Date().toISOString().split('T')[0];
          return {
            id: note.id || '',
            date: noteDate,
            vehiclePlate: note.vehicle_plate || '',
            driverName: note.driver_name || '',
            deliveryNoteNumber: note.delivery_note_number || `SJ-${dayjs(noteDate).format('YYYYMMDD')}-${String(index + 1).padStart(3, '0')}`,
            poNumber: note.no_po || null, // FIX: Konsisten dengan type definition
            destination: note.destination || '',
            netWeight: note.net_weight || 0,
            status: note.status || 'menunggu',
            createdAt: note.created_at || '',
            updatedAt: note.updated_at || '',
            notes: note.notes || '',
          };
        });
        setDeliveryDetails(fallbackMappedNotes);
        setLoadingDetails(false);
        return;
      }
    }
    
    setDeliveryDetails(mappedNotes);
    setLoadingDetails(false);
  };

  const handleShowDetail = async (destination: string, month: string) => {
    console.log('🎯 handleShowDetail called with:', { destination, month });
    console.log('📅 Month parameter type:', typeof month);
    console.log('📅 Month parameter value:', month);
    setSelectedDestination(destination);
    setSelectedDestinationMonth(month);
    setShowDetail(true);
    // Hide global header while in detail view
    window.dispatchEvent(new Event('hideHeader'));
    await fetchDeliveryDetails(destination, month);
  };

  useEffect(() => {
    fetchDestinations();
    // Listener untuk tombol header
    const handler = () => openAddModal();
    window.addEventListener('openAddAlamat', handler);
    return () => window.removeEventListener('openAddAlamat', handler);
  }, []);

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setInput('');
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setInput('');
    setError('');
  };

  const handleSave = async () => {
    if (!input.trim()) {
      setError('Nama alamat tidak boleh kosong');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('destinations')
          .insert([{ name: input.trim() }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('destinations')
          .update({ name: input.trim() })
          .eq('id', selected?.id);
        if (error) throw error;
      }
      closeModal();
      fetchDestinations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan alamat');
    } finally {
      setSaving(false);
    }
  };


  // Ambil semua bulan unik dari data rekap
  const allMonths = Array.from(new Set(destinations.map(d => d.bulan))).sort((a, b) => dayjs(b, 'MMMM YYYY').toDate().getTime() - dayjs(a, 'MMMM YYYY').toDate().getTime());
  
  // Group data per bulan
  const monthlyData = allMonths.map(month => ({
    month,
    destinations: destinations.filter(d => d.bulan === month),
    totalDeliveries: destinations.filter(d => d.bulan === month).reduce((sum, d) => sum + d.total_pengiriman, 0),
    totalWeight: destinations.filter(d => d.bulan === month).reduce((sum, d) => sum + d.total_tonase, 0),
  }));
  
  // Group data per alamat
  const destinationData = Array.from(new Set(destinations.map(d => d.name))).map(destName => ({
    name: destName,
    months: destinations.filter(d => d.name === destName),
    totalDeliveries: destinations.filter(d => d.name === destName).reduce((sum, d) => sum + d.total_pengiriman, 0),
    totalWeight: destinations.filter(d => d.name === destName).reduce((sum, d) => sum + d.total_tonase, 0),
  }));
  
  // Filter data sesuai search term
  const filteredMonthlyData = monthlyData.filter(data => 
    (data.month || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.destinations.some(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredDestinationData = destinationData.filter(data => 
    data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.months.some(d => (d.bulan || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );
  

  // Calculate summary statistics for detail view
  const detailStats = {
    totalDeliveries: deliveryDetails.length,
    totalWeight: deliveryDetails.reduce((sum, d) => sum + (d.netWeight || 0), 0),
    completedDeliveries: deliveryDetails.filter(d => d.status === 'selesai').length,
    inProgressDeliveries: deliveryDetails.filter(d => d.status === 'dalam-perjalanan').length,
    pendingDeliveries: deliveryDetails.filter(d => d.status === 'menunggu').length,
    uniqueDrivers: new Set(deliveryDetails.map(d => d.driverName)).size,
    uniqueVehicles: new Set(deliveryDetails.map(d => d.vehiclePlate)).size,
  };

  // Get most frequent driver and vehicle
  const getMostFrequentDriver = () => {
    const driverCounts = deliveryDetails.reduce((acc, d) => {
      acc[d.driverName] = (acc[d.driverName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostFrequentDriver = Object.entries(driverCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return mostFrequentDriver ? mostFrequentDriver[0] : '-';
  };

  const getMostFrequentVehicle = () => {
    const vehicleCounts = deliveryDetails.reduce((acc, d) => {
      acc[d.vehiclePlate] = (acc[d.vehiclePlate] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostFrequentVehicle = Object.entries(vehicleCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return mostFrequentVehicle ? mostFrequentVehicle[0] : '-';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-50 py-10 px-2 sm:px-0">
      <div className="max-w-7xl mx-auto">
                 {/* Detail View */}
         {showDetail ? (
           <div className="space-y-6 mt-6">
              {/* Hero Header + Stats Wrapper */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 border border-white/60 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">Detail Pengiriman</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">
                      {selectedDestination} • {selectedDestinationMonth}
                    </p>
                  </div>
                  {/* Kembali ke menu sebelumnya - posisi kanan */}
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setSelectedDestination('');
                      setSelectedDestinationMonth('');
                      setDeliveryDetails([]);
                      setSearchTerm('');
                      setViewMode('monthly');
                      // Show global header again
                      window.dispatchEvent(new Event('showHeader'));
                    }}
                    className="px-5 py-2.5 bg-white/80 text-gray-800 border border-white/60 rounded-xl shadow-sm hover:bg-white backdrop-blur-md transition-all flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                    <span className="font-medium">Kembali</span>
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">{detailStats.totalDeliveries}</p>
                      </div>
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Berat Total</p>
                        <p className="text-xl font-bold text-gray-900">{formatWeight(detailStats.totalWeight)}</p>
                      </div>
                      <Truck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Selesai</p>
                        <p className="text-xl font-bold text-blue-600">{detailStats.completedDeliveries}</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Dalam Perjalanan</p>
                        <p className="text-xl font-bold text-blue-600">{detailStats.inProgressDeliveries}</p>
                      </div>
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Menunggu</p>
                        <p className="text-xl font-bold text-amber-600">{detailStats.pendingDeliveries}</p>
                      </div>
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Driver</p>
                        <p className="text-lg font-bold text-gray-900 truncate" title={getMostFrequentDriver()}>
                          {getMostFrequentDriver()}
                        </p>
                      </div>
                      <User className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl p-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Kendaraan</p>
                        <p className="text-lg font-bold text-gray-900 font-mono truncate" title={getMostFrequentVehicle()}>
                          {getMostFrequentVehicle()}
                        </p>
                      </div>
                      <Truck className="w-6 h-6 text-orange-600 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details Table */}
              <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Daftar Surat Jalan</h2>
                  <p className="text-gray-500 mt-1">Detail pengiriman untuk {selectedDestination}</p>
                </div>
                {loadingDetails ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
                  </div>
                ) : deliveryDetails.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada data pengiriman untuk periode ini</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gradient-to-b from-gray-50 to-white sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            No. Urut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            Tanggal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            No. Surat Jalan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            Driver
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            Nopol Kendaraan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            PO Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            Berat (kg)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {deliveryDetails.map((delivery, index) => {
                          console.log(`🔄 Rendering delivery ${index + 1}:`, delivery);
                          return (
                            <tr key={delivery.id} className="hover:bg-gray-50/80 even:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-b border-gray-100">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                                {formatDate(delivery.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 border-b border-gray-100">
                                {delivery.deliveryNoteNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{delivery.driverName || '-'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                                <div className="flex items-center space-x-2">
                                  <Truck className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium font-mono">{delivery.vehiclePlate || '-'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                                {delivery.poNumber || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                                {delivery.netWeight ? formatWeight(delivery.netWeight) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                  {getStatusIcon(delivery.status)} {getStatusText(delivery.status)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
          </div>
        ) : (
                     /* Main List View */
           <>
             <div className="relative mb-12">
               {/* Background Pattern */}
               <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-indigo-50/30 rounded-3xl blur-3xl"></div>
               <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
               
               {/* Content */}
               <div className="relative z-10 flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                   {/* Icon */}
                   <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                   </div>
                   
                   {/* Title */}
                   <div>
                     <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                       Dashboard Pengiriman
                     </h1>
                     <p className="text-lg text-gray-600 font-medium mt-2">Analisis dan monitoring pengiriman real-time</p>
                   </div>
                 </div>
                 
                 {/* Stats Badge */}
                 <div className="hidden lg:flex items-center space-x-4">
                   <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border border-blue-200">
                     <div className="text-center">
                       <div className="text-2xl font-bold text-blue-600">{destinations.length}</div>
                       <div className="text-sm text-gray-600 font-medium">Total Alamat</div>
                     </div>
                   </div>
                   <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border border-cyan-200">
                     <div className="text-center">
                       <div className="text-2xl font-bold text-cyan-600">{destinations.length}</div>
                       <div className="text-sm text-gray-600 font-medium">Total Destinasi</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Control Panel */}
             <div className="relative mb-8">
               {/* Background */}
               <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"></div>
               
               {/* Content */}
               <div className="relative z-10 p-6">
                 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0 lg:space-x-8">
                   {/* View Mode Toggle */}
                   <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                       <span className="font-bold text-gray-800 text-lg">Tampilan:</span>
                     </div>
                     <div className="flex bg-gradient-to-r from-blue-100/80 to-cyan-100/80 rounded-2xl p-1.5 border border-blue-200/50 backdrop-blur-sm">
                       <button
                         onClick={() => setViewMode('monthly')}
                         className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform ${
                           viewMode === 'monthly' 
                             ? 'bg-white text-blue-700 shadow-xl border border-blue-200 scale-105' 
                             : 'text-blue-600 hover:text-blue-800 hover:bg-white/60 hover:scale-105'
                         }`}
                       >
                         📅 Per Bulan
                       </button>
                       <button
                         onClick={() => setViewMode('destination')}
                         className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform ${
                           viewMode === 'destination' 
                             ? 'bg-white text-blue-700 shadow-xl border border-blue-200 scale-105' 
                             : 'text-blue-600 hover:text-blue-800 hover:bg-white/60 hover:scale-105'
                         }`}
                       >
                         🏢 Per Alamat
                       </button>
                     </div>
                   </div>
                   
                   {/* Search Bar */}
                   <div className="flex-1 max-w-lg">
                     <div className="relative group">
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                       <div className="relative">
                         <input
                           type="text"
                           placeholder="🔍 Cari bulan atau alamat..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full pl-12 pr-6 py-4 border-2 border-blue-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 bg-white/90 backdrop-blur-sm text-lg font-medium placeholder-gray-500 shadow-lg hover:shadow-xl"
                         />
                         <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

              {/* Konten Utama */}
              <div className="relative">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blue-50/30 to-cyan-50/30 rounded-3xl blur-2xl"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tr from-cyan-300/10 to-indigo-300/10 rounded-full blur-3xl"></div>
                
                {/* Content */}
                <div className="relative z-10 bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/30">
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
                ) : error ? (
                  <div className="text-red-600 text-center py-8">{error}</div>
                ) : (
                  <>
                    {/* Monthly View */}
                    {viewMode === 'monthly' && (
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3 mb-8">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-gray-900">Rekap Per Bulan</h2>
                            <p className="text-gray-600 font-medium">Analisis pengiriman berdasarkan periode bulanan</p>
                          </div>
                        </div>
                        {filteredMonthlyData.length === 0 ? (
                          <div className="text-gray-400 text-center py-8">
                            Tidak ada data untuk pencarian ini.<br />
                            <span className="block mt-2">Coba kata kunci lain.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMonthlyData.map((monthData, index) => (
                              <div key={monthData.month} className="group relative">
                                {/* Card Background Effects */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-blue-50/30 rounded-3xl border border-white/40 shadow-2xl group-hover:shadow-3xl transition-all duration-500"></div>
                                
                                {/* Card Content */}
                                <div className="relative z-10 overflow-hidden rounded-3xl">
                                  {/* Header */}
                                  <div className="relative p-6 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-500">
                                    {/* Header Background Pattern */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                                    
                                    {/* Header Content */}
                                    <div className="relative z-10">
                                      <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-black text-white drop-shadow-lg">{monthData.month}</h3>
                                        <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                          <span className="text-white text-sm font-bold">#{index + 1}</span>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                          <div className="text-2xl font-black text-blue-100">{monthData.destinations.length}</div>
                                          <div className="text-xs text-blue-200 font-medium uppercase tracking-wide">Alamat</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-2xl font-black text-blue-100">{monthData.totalDeliveries}</div>
                                          <div className="text-xs text-blue-200 font-medium uppercase tracking-wide">Pengiriman</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="p-6 bg-white/80 backdrop-blur-sm">
                                    <div className="space-y-4">
                                      {monthData.destinations.map((dest) => (
                                        <div key={dest.id} className="group/item relative">
                                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                                          <div className="relative z-10 flex items-center justify-between p-4 rounded-2xl border border-gray-100 group-hover/item:border-blue-200 transition-all duration-300">
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-gray-900 text-sm truncate group-hover/item:text-blue-700 transition-colors duration-300">
                                                {dest.name}
                                              </h4>
                                              <p className="text-xs text-gray-600 font-medium mt-1">
                                                {dest.total_pengiriman} pengiriman • {formatWeight(dest.total_tonase)}
                                              </p>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                              <button
                                                onClick={() => handleShowDetail(dest.name, dest.bulan || '')}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-300 transform hover:scale-110 group-hover/item:shadow-lg"
                                                title="Lihat Detail"
                                              >
                                                <Eye className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Summary */}
                                    <div className="mt-6 pt-6 border-t border-gradient-to-r from-blue-200 to-cyan-200">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-700">Total Berat:</span>
                                        <span className="text-lg font-black text-blue-600">{formatWeight(monthData.totalWeight)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Destination View */}
                    {viewMode === 'destination' && (
                      <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Rekap Per Alamat</h2>
                        {filteredDestinationData.length === 0 ? (
                          <div className="text-gray-400 text-center py-8">
                            Tidak ada data untuk pencarian ini.<br />
                            <span className="block mt-2">Coba kata kunci lain.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDestinationData.map((destData) => (
                              <div key={destData.name} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-4">
                                  <h3 className="text-lg font-bold text-white">{destData.name}</h3>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-green-100 text-sm">
                                      {destData.months.length} Bulan
                                    </span>
                                    <span className="text-green-100 text-sm">
                                      {destData.totalDeliveries} Pengiriman
                                    </span>
                                  </div>
                                </div>
                                {/* Content */}
                                <div className="p-4">
                                  <div className="space-y-3">
                                    {destData.months.map((month) => (
                                      <div key={month.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{month.bulan}</p>
                                          <p className="text-sm text-gray-600">
                                            {month.total_pengiriman} pengiriman • {formatWeight(month.total_tonase)}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleShowDetail(month.name, month.bulan || '')}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Lihat Detail"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Summary */}
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-600">Total Berat:</span>
                                      <span className="text-lg font-bold text-blue-600">
                                        {formatWeight(destData.totalWeight)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                </div>
              </div>
            </>
          )}
      </div>
      
      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fadeInUp">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {modalMode === 'add' ? 'Tambah Alamat Tujuan' : 'Edit Alamat Tujuan'}
            </h2>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg mb-4"
              placeholder="Nama alamat tujuan..."
              autoFocus
              disabled={saving}
            />
            {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center space-x-2"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : modalMode === 'add' ? <Plus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{modalMode === 'add' ? 'Tambah' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pengiriman; 