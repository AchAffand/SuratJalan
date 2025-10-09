import React, { useState, useEffect } from 'react';
import { DeliveryNote } from '../types';
// Removed shouldAutoUpdateStatus import - no more automatic status updates
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
    hasSeal: note?.hasSeal || false,
    sealNumbers: note?.sealNumbers || [],
    company: note?.company || 'sbs',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [purchaseOrders, setPurchaseOrders] = useState<{
    id: string;
    po_number: string;
    total_tonnage: number;
    remaining_tonnage: number;
    status: string;
    buyer_name?: string | null;
    buyer_address?: string | null;
  }[]>([]);
  const [poLoading, setPoLoading] = useState(true);
  const [poError, setPoError] = useState<string | null>(null);

  // State untuk daftar alamat tujuan dari Supabase
  const [destinationOptions, setDestinationOptions] = useState<string[]>([]);
  const [destinationLoading, setDestinationLoading] = useState(true);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [newSealInput, setNewSealInput] = useState('');

  useEffect(() => {
    setPoLoading(true);
    getPurchaseOrdersFromSupabase()
      .then((data) => setPurchaseOrders(data))
      .catch(() => setPoError('Gagal memuat daftar PO'))
      .finally(() => setPoLoading(false));

    // Fetch destinations from Supabase
    setDestinationLoading(true);
    supabase
      .from('destinations')
      .select('name')
      .then(({ data, error }) => {
        if (error) {
          setDestinationError('Gagal memuat alamat tujuan');
        } else {
          setDestinationOptions((data || []).map((d: { name: string }) => d.name));
        }
        setDestinationLoading(false);
      });
  }, []);

  // Update formData when note prop changes (for edit mode)
  useEffect(() => {
    if (note) {
      console.log('🔄 Updating form data for edit mode:', {
        noteId: note.id,
        date: note.date,
        destination: note.destination,
        poNumber: note.poNumber
      });
      
      setFormData({
        date: note.date || new Date().toISOString().split('T')[0],
        vehiclePlate: note.vehiclePlate || '',
        driverName: note.driverName || '',
        deliveryNoteNumber: note.deliveryNoteNumber || '',
        destination: note.destination || '',
        poNumber: note.poNumber || '',
        status: note.status || 'menunggu',
        notes: note.notes || '',
        netWeight: note.netWeight || undefined,
        hasSeal: note.hasSeal || false,
        sealNumbers: note.sealNumbers || [],
        company: note.company || 'sbs',
      });
    }
  }, [note]);



  // Removed unused DESTINATIONS constant - now using dynamic data from Supabase
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
      // Pastikan poNumber null jika Tanpa PO
      const poNumberToSave = formData.poNumber === '-' ? null : formData.poNumber;

      const dataToSave = { ...formData, poNumber: poNumberToSave };
      
      console.log('💾 Saving delivery note data:', {
        noteId: note?.id || 'new',
        date: dataToSave.date,
        destination: dataToSave.destination,
        poNumber: dataToSave.poNumber,
        status: dataToSave.status
      });

      // Pertahankan status yang dipilih user (jangan paksa 'menunggu')
      onSave(dataToSave);
    }
  };

  const handleChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
          {/* Removed auto-status notification - no more automatic status updates */}

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
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange('poNumber', value);
                  // Only auto-fill destination if it's currently empty or if user is creating new note
                  if (value && value !== '-' && (!formData.destination || !note)) {
                    const found = purchaseOrders.find(p => p.po_number === value);
                    if (found && found.buyer_address) {
                      handleChange('destination', found.buyer_address);
                    }
                  }
                }}
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
                onChange={(e) => handleChange('netWeight', e.target.value ? parseFloat(e.target.value) : 0)}
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
                onFocus={() => {
                  // Only set destinationSearch if it's empty and we have a destination
                  if (!destinationSearch && formData.destination) {
                    setDestinationSearch(formData.destination);
                  }
                }}
                onBlur={() => setTimeout(() => setDestinationSearch(''), 200)}
                disabled={destinationLoading}
              />
              {destinationSearch && (
                <div className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-auto">
                  {destinationLoading ? (
                    <div className="px-4 py-2 text-gray-400 text-sm">Memuat...</div>
                  ) : destinationError ? (
                    <div className="px-4 py-2 text-red-400 text-sm">{destinationError}</div>
                  ) : filteredDestinations.length > 0 ? (
                    filteredDestinations.map((dest) => (
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

          {/* Company Selection */}
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pilih Perusahaan
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-100">
                <input
                  type="radio"
                  name="company"
                  value="sbs"
                  checked={formData.company === 'sbs'}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">PT. SBS</div>
                  <div className="text-xs text-gray-500">Samudera Berkah Sentosa</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-100">
                <input
                  type="radio"
                  name="company"
                  value="mbs"
                  checked={formData.company === 'mbs'}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">CV. MBS</div>
                  <div className="text-xs text-gray-500">Mulia Berkah Sentosa</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-100">
                <input
                  type="radio"
                  name="company"
                  value="perorangan"
                  checked={formData.company === 'perorangan'}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Perorangan</div>
                  <div className="text-xs text-gray-500">Personal Shipment</div>
                </div>
              </label>
            </div>
          </div>

          {/* Seal System */}
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Sistem Seal
            </label>
            
            {/* Seal Option */}
            <div className="mb-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasSeal"
                    checked={!formData.hasSeal}
                    onChange={() => handleChange('hasSeal', false)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Tanpa Seal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasSeal"
                    checked={formData.hasSeal}
                    onChange={() => handleChange('hasSeal', true)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Menggunakan Seal</span>
                </label>
              </div>
            </div>

            {/* Seal Numbers Input */}
            {formData.hasSeal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Seal
                </label>
                {/* Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {(formData.sealNumbers || []).map((seal, idx) => (
                    <span key={`${seal}-${idx}`} className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs sm:text-sm">
                      <span className="font-mono">{seal}</span>
                      <button
                        type="button"
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          const next = (formData.sealNumbers || []).filter((_, i) => i !== idx);
                          handleChange('sealNumbers', next);
                        }}
                        aria-label="Hapus seal"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Input + Add */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9,;\n ]*"
                    value={newSealInput}
                    onChange={(e) => setNewSealInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const parts = (newSealInput || '')
                          .split(/[\n,;\s]+/)
                          .map(s => s.replace(/[^\d]/g, '').trim())
                          .filter(Boolean);
                        if (parts.length > 0) {
                          const merged = [
                            ...(formData.sealNumbers || []),
                            ...parts,
                          ];
                          // remove empty and dedupe
                          const unique = Array.from(new Set(merged.filter(Boolean)));
                          handleChange('sealNumbers', unique);
                          setNewSealInput('');
                        }
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text') || '';
                      const parts = pasted
                        .split(/[\n,;\s]+/)
                        .map(s => s.replace(/[^\d]/g, '').trim())
                        .filter(Boolean);
                      if (parts.length > 0) {
                        const merged = [
                          ...(formData.sealNumbers || []),
                          ...parts,
                        ];
                        const unique = Array.from(new Set(merged.filter(Boolean)));
                        handleChange('sealNumbers', unique);
                      }
                    }}
                    placeholder="Ketik atau tempel: 123, 456 lalu Enter"
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm sm:text-base hover:bg-blue-700"
                    onClick={() => {
                      const parts = (newSealInput || '')
                        .split(/[\n,;\s]+/)
                        .map(s => s.replace(/[^\d]/g, '').trim())
                        .filter(Boolean);
                      if (parts.length > 0) {
                        const merged = [
                          ...(formData.sealNumbers || []),
                          ...parts,
                        ];
                        const unique = Array.from(new Set(merged.filter(Boolean)));
                        handleChange('sealNumbers', unique);
                        setNewSealInput('');
                      }
                    }}
                  >
                    Tambah
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Pisahkan dengan koma, spasi, baris baru, atau tempel dari Excel.</p>
              </div>
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