import React, { useState, useEffect } from 'react';
import { DeliveryNote } from '../types';
import { SuratJalanPrinter } from './SuratJalanPrinter';
import { Printer, Search, Filter, CheckCircle, Clock, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbToDeliveryNote, Database } from '../lib/supabase';

interface PrintSuratJalanProps {
  onClose: () => void;
}

export const PrintSuratJalan: React.FC<PrintSuratJalanProps> = ({ onClose }) => {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<DeliveryNote[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Load delivery notes with status 'menunggu'
  useEffect(() => {
    loadDeliveryNotes();
    loadPurchaseOrders();
  }, []);

  const loadDeliveryNotes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('delivery_notes')
        .select('*')
        .eq('status', 'menunggu')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading delivery notes:', error);
        alert(`Gagal memuat surat jalan: ${error.message}`);
        setDeliveryNotes([]);
        setFilteredNotes([]);
        return;
      }

      // Map DB rows to app shape and validate
      const mapped = (data as Database['public']['Tables']['delivery_notes']['Row'][] | null || [])
        .map(dbToDeliveryNote)
        .filter(n => n && n.id && n.deliveryNoteNumber && n.status === 'menunggu');

      setDeliveryNotes(mapped);
      setFilteredNotes(mapped);
    } catch (error) {
      console.error('Error loading delivery notes:', error);
      alert(`Gagal memuat surat jalan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDeliveryNotes([]);
      setFilteredNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, po_number, buyer_name, buyer_address, buyer_phone, buyer_email')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading purchase orders:', error);
        return;
      }

      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  // Filter notes based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNotes(deliveryNotes);
    } else {
      const filtered = deliveryNotes.filter(note =>
        (note.deliveryNoteNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((note.poNumber || '') as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.vehiclePlate || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  }, [searchTerm, deliveryNotes]);

  const handlePrint = async (note: DeliveryNote) => {
    try {
      setIsPrinting(true);
      
      // Validate note data before proceeding
      if (!note || !note.id || !note.deliveryNoteNumber) {
        throw new Error('Data surat jalan tidak lengkap');
      }
      
      setSelectedNote(note);
      
      // Update status to 'dalam-perjalanan' immediately when print is initiated
      const { error } = await supabase
        .from('delivery_notes')
        .update({ 
          status: 'dalam-perjalanan',
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id);

      if (error) {
        console.error('Error updating status:', error);
        alert(`Gagal mengupdate status surat jalan: ${error.message}`);
        setSelectedNote(null);
        return;
      }

      // Refresh the list to show updated status
      await loadDeliveryNotes();
      
      // Show success message
      console.log(`✅ Status updated to 'dalam-perjalanan' for ${note.deliveryNoteNumber}`);
      
    } catch (error) {
      console.error('Error printing:', error);
      alert(`Gagal mencetak surat jalan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSelectedNote(null);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClosePrinter = () => {
    setSelectedNote(null);
    // Refresh the list when closing printer to show updated status
    loadDeliveryNotes();
  };

  if (selectedNote) {
    return (
      <SuratJalanPrinter
        deliveryNote={selectedNote}
        purchaseOrders={purchaseOrders}
        onClose={handleClosePrinter}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Printer className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cetak Surat Jalan</h2>
              <p className="text-sm text-gray-500">
                Pilih surat jalan yang akan dicetak (Status: Menunggu)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nomor SJ, tujuan, PO, atau driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredNotes.length} surat jalan</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Memuat surat jalan...</p>
              </div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Tidak ada surat jalan yang ditemukan' : 'Tidak ada surat jalan menunggu'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Coba ubah kata kunci pencarian Anda'
                    : 'Semua surat jalan sudah dalam perjalanan atau selesai'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 overflow-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {note.deliveryNoteNumber}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">Menunggu</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">
                          {note.destination}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">PO:</span>
                        <span className="text-xs text-gray-600">{note.poNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Driver:</span>
                        <span className="text-xs text-gray-600">{note.driverName}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePrint(note)}
                      disabled={isPrinting}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isPrinting ? 'Mencetak...' : 'Cetak & Kirim'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <p>• Surat jalan akan otomatis berubah status ke "Dalam Perjalanan" setelah dicetak</p>
              <p>• Format cetak: Epson LX-300 • Kertas: NCR 9.5" x 11"</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
