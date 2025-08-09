import React, { useState, useEffect } from 'react';
import { DeliveryNote } from '../types';
import { shouldAutoUpdateStatus } from '../utils/format';
import { X, Save, Truck, AlertCircle } from 'lucide-react';
import { getPurchaseOrdersFromSupabase } from '../utils/supabaseStorage';
import { supabase } from '../lib/supabase';

interface DeliveryNoteFormProps {
  note?: DeliveryNote;
  onSave: (noteData: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const DeliveryNoteForm: React.FC<DeliveryNoteFormProps> = ({
  note,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    date: note?.date || new Date().toISOString().split('T')[0],
    vehiclePlate: note?.vehiclePlate || '',
    driverName: note?.driverName || '',
    deliveryNoteNumber: note?.deliveryNoteNumber || '',
    destination: note?.destination || '',
    poNumber: note?.poNumber || '',
    status: note?.status || 'menunggu' as const,
    notes: note?.notes || '',
    netWeight: note?.netWeight || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [purchaseOrders, setPurchaseOrders] = useState<{
    id: string;
    po_number: string;
    total_tonnage: number;
    remaining_tonnage: number;
    status: string;
  }[]>([]);
  const [poLoading, setPoLoading] = useState(true);
  const [poError, setPoError] = useState<string | null>(null);

  // State untuk daftar alamat tujuan dari Supabase
  const [destinationOptions, setDestinationOptions] = useState<string[]>([]);
  const [destinationLoading, setDestinationLoading] = useState(true);
  const [destinationError, setDestinationError] = useState<string | null>(null);

  useEffect(() => {
    setPoLoading(true);
    getPurchaseOrdersFromSupabase()
      .then((data) => setPurchaseOrders(data))
      .catch((err) => setPoError('Gagal memuat daftar PO'))
      .finally(() => setPoLoading(false));

    // Fetch destinations from Supabase
    setDestinationLoading(true);
    supabase
      .from('destinations')
      .select('name')
      .then(({ data, error }) => {
        if (error) setDestinationError('Gagal memuat alamat tujuan');
        else setDestinationOptions((data || []).map((d: any) => d.name));
      })
      .finally(() => setDestinationLoading(false));
  }, []);

  const DESTINATIONS = [
    'NewHope Sidoarjo',
    'NewHope Mojokerto',
    'NewHope Demak',
    'NewHope Cirebon',
    'PT. Panca Patriot Prima',
    'PT. Sidoagunt Farm',
  ];
  // Searchable dropdown logic
  const [destinationSearch, setDestinationSearch] = useState('');
  const filteredDestinations = destinationOptions.filter(d => d.toLowerCase().includes(destinationSearch.toLowerCase()));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Tanggal pengiriman wajib diisi';
    if (!formData.vehiclePlate.trim()) newErrors.vehiclePlate = 'Plat nomor kendaraan wajib diisi';
    if (!formData.driverName.trim()) newErrors.driverName = 'Nama sopir wajib diisi';
    if (!formData.deliveryNoteNumber.trim()) newErrors.deliveryNoteNumber = 'Nomor surat jalan wajib diisi';
    if (!formData.poNumber || formData.poNumber === '') newErrors.poNumber = 'Nomor PO wajib diisi, atau pilih Tanpa PO';
    if (!formData.destination.trim()) newErrors.destination = 'Alamat tujuan wajib diisi';

    // Validate vehicle plate format (basic Indonesian format)
    const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i;
    if (formData.vehiclePlate.trim() && !plateRegex.test(formData.vehiclePlate.trim())) {
      newErrors.vehiclePlate = 'Format plat nomor tidak valid (contoh: B 1234 ABC)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Auto-update status if delivery date is today or past
      let finalStatus = formData.status;
      if (finalStatus === 'menunggu' && shouldAutoUpdateStatus(formData.date)) {
        finalStatus = 'dalam-perjalanan';
      }
      // Pastikan poNumber null jika Tanpa PO
      const poNumberToSave = formData.poNumber === '-' ? null : formData.poNumber;
      onSave({ ...formData, status: finalStatus, poNumber: poNumberToSave });
    }
  };

  const handleChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isDeliveryToday = shouldAutoUpdateStatus(formData.date);
  const canEditWeight = formData.status === 'selesai';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white">
                  {note ? 'Edit Surat Jalan' : 'Buat Surat Jalan Baru'}
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm">
                  {note ? 'Perbarui informasi pengiriman' : 'Isi detail pengiriman dengan lengkap'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Auto-status notification */}
          {isDeliveryToday && formData.status === 'menunggu' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-800">
                  Status Otomatis Diperbarui
                </p>
                <p className="text-xs sm:text-sm text-blue-600">
                  Karena tanggal pengiriman adalah hari ini atau sudah lewat, status akan otomatis berubah menjadi "Dalam Perjalanan"
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Pengiriman *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base ${
                  errors.date ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{errors.date}</span>
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status Pengiriman
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-gray-300 text-sm sm:text-base"
              >
                <option value="menunggu">⏳ Menunggu</option>
                <option value="dalam-perjalanan">🚛 Dalam Perjalanan</option>
                <option value="selesai">✅ Selesai</option>
              </select>
            </div>

            {/* Vehicle Plate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Plat Nomor Kendaraan *
              </label>
              <input
                type="text"
                value={formData.vehiclePlate}
                onChange={(e) => handleChange('vehiclePlate', e.target.value.toUpperCase())}
                placeholder="B 1234 ABC"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm sm:text-base ${
                  errors.vehiclePlate ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              {errors.vehiclePlate && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{errors.vehiclePlate}</span>
                </p>
              )}
            </div>

            {/* Driver Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Sopir *
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => handleChange('driverName', e.target.value)}
                placeholder="Budi Santoso"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base ${
                  errors.driverName ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              {errors.driverName && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{errors.driverName}</span>
                </p>
              )}
            </div>

            {/* Delivery Note Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Surat Jalan *
              </label>
              <input
                type="text"
                value={formData.deliveryNoteNumber}
                onChange={(e) => handleChange('deliveryNoteNumber', e.target.value)}
                placeholder="SJ/2024/001"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm sm:text-base ${
                  errors.deliveryNoteNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              {errors.deliveryNoteNumber && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{errors.deliveryNoteNumber}</span>
                </p>
              )}
            </div>

            {/* PO Number Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor PO *
              </label>
              <select
                value={formData.poNumber}
                onChange={(e) => handleChange('poNumber', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm sm:text-base ${
                  errors.poNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                required
              >
                <option value="">-- Pilih PO --</option>
                <option value="-">Tanpa PO</option>
                {poLoading ? (
                  <option>Memuat...</option>
                ) : poError ? (
                  <option disabled>{poError}</option>
                ) : (
                  purchaseOrders.map((po) => (
                    <option key={po.id} value={po.po_number}>
                      {po.po_number} (Sisa: {po.remaining_tonnage} / {po.total_tonnage} ton, Status: {po.status})
                    </option>
                  ))
                )}
              </select>
              {errors.poNumber && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{errors.poNumber}</span>
                </p>
              )}
            </div>

            {/* Net Weight */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Berat Bersih Timbangan (kg)
                {!canEditWeight && (
                  <span className="text-amber-600 text-xs ml-2">
                    (Hanya bisa diisi saat status "Selesai")
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.netWeight || ''}
                onChange={(e) => handleChange('netWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={canEditWeight ? "1500.50" : "Selesaikan pengiriman dulu"}
                disabled={!canEditWeight}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base ${
                  !canEditWeight 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              {!canEditWeight && (
                <p className="mt-2 text-xs sm:text-sm text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Berat timbangan hanya bisa diinput setelah pengiriman selesai</span>
                </p>
              )}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alamat Tujuan Lengkap *
            </label>
            <div className="relative">
              <input
                type="text"
                value={destinationSearch || formData.destination}
                onChange={e => {
                  setDestinationSearch(e.target.value);
                  handleChange('destination', e.target.value);
                }}
                placeholder={destinationLoading ? 'Memuat daftar alamat...' : 'Cari atau pilih alamat tujuan...'}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base ${
                  errors.destination ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                autoComplete="off"
                onFocus={e => setDestinationSearch(formData.destination)}
                onBlur={e => setTimeout(() => setDestinationSearch(''), 200)}
                disabled={destinationLoading}
              />
              {destinationSearch && (
                <div className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-auto">
                  {destinationLoading ? (
                    <div className="px-4 py-2 text-gray-400 text-sm">Memuat...</div>
                  ) : destinationError ? (
                    <div className="px-4 py-2 text-red-400 text-sm">{destinationError}</div>
                  ) : filteredDestinations.length > 0 ? (
                    filteredDestinations.map((dest, idx) => (
                      <div
                        key={dest}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                        onMouseDown={() => {
                          handleChange('destination', dest);
                          setDestinationSearch('');
                        }}
                      >
                        {dest}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-400 text-sm">Tidak ada hasil, tekan Enter untuk input manual</div>
                  )}
                </div>
              )}
            </div>
            {errors.destination && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{errors.destination}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catatan Tambahan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Catatan khusus untuk pengiriman ini (opsional)..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-gray-300 resize-none text-sm sm:text-base"
            />
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm sm:text-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{note ? 'Perbarui' : 'Buat'} Surat Jalan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};