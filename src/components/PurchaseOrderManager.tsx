import React, { useState, useMemo } from 'react';
import { DeliveryNote } from '../types';
import { formatWeight, formatCurrency, formatDate } from '../utils/format';
import { 
  FileText, Plus, Edit, Trash2, Eye, 
  TrendingUp, DollarSign, Package,
  BarChart3,
  CheckCircle, AlertCircle, Clock,
  Search, X, RefreshCw
} from 'lucide-react';
import dayjs from '../lib/dayjs';

interface PurchaseOrder {
  id: string;
  po_number: string;
  po_date: string;
  buyer_name: string;
  buyer_address: string;
  buyer_phone: string;
  buyer_email: string;
  product_type: 'CPO' | 'UCO' | 'Minyak Ikan';
  total_tonnage: number;
  price_per_ton: number;
  total_value: number;
  status: 'Aktif' | 'Selesai' | 'Sebagian' | 'Terlambat' | 'Dibatalkan';
  shipped_tonnage: number;
  remaining_tonnage: number;
  delivery_deadline: string;
  payment_terms: string;
  notes: string;
  ppn_enabled?: boolean;
  ppn_rate?: number; // 0.11 for 11%
  created_at: string;
  updated_at: string;
}

interface PurchaseOrderManagerProps {
  purchaseOrders: PurchaseOrder[];
  deliveryNotes: DeliveryNote[];
  onCreatePO: (poData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdatePO: (id: string, updates: Partial<PurchaseOrder>) => void;
  onDeletePO: (id: string) => void;
  onRefresh?: () => void;
}

export const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({
  purchaseOrders,
  deliveryNotes,
  onCreatePO,
  onUpdatePO,
  onDeletePO,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | undefined>();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | undefined>();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [ppnFilter, setPpnFilter] = useState<'all' | 'with-ppn' | 'without-ppn'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status' | 'buyer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredPOs = useMemo(() => {
    let filtered = purchaseOrders;

    // Filter by status
    switch (filter) {
      case 'active':
        filtered = filtered.filter(po => po.status === 'Aktif');
        break;
      case 'completed':
        filtered = filtered.filter(po => po.status === 'Selesai');
        break;
      case 'overdue':
        filtered = filtered.filter(po => 
          po.status === 'Aktif' && dayjs(po.delivery_deadline).isBefore(dayjs(), 'day')
        );
        break;
    }

    // Filter by PPN status
    switch (ppnFilter) {
      case 'with-ppn':
        filtered = filtered.filter(po => po.ppn_enabled === true);
        break;
      case 'without-ppn':
        filtered = filtered.filter(po => po.ppn_enabled === false);
        break;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(po =>
        po.po_number.toLowerCase().includes(searchLower) ||
        (po.buyer_name || '').toLowerCase().includes(searchLower) ||
        po.product_type.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = dayjs(a.po_date).valueOf() - dayjs(b.po_date).valueOf();
          break;
        case 'value':
          comparison = a.total_value - b.total_value;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'buyer':
          comparison = (a.buyer_name || '').localeCompare(b.buyer_name || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [purchaseOrders, filter, ppnFilter, searchTerm, sortBy, sortOrder]);

  const poStats = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const activePOs = purchaseOrders.filter(po => po.status === 'Aktif').length;
    const completedPOs = purchaseOrders.filter(po => po.status === 'Selesai').length;
    const overduePOs = purchaseOrders.filter(po => 
      po.status === 'Aktif' && dayjs(po.delivery_deadline).isBefore(dayjs(), 'day')
    ).length;

    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total_value, 0);
    const activeValue = purchaseOrders
      .filter(po => po.status === 'Aktif')
      .reduce((sum, po) => sum + po.remaining_tonnage * po.price_per_ton, 0);

    const totalShipped = purchaseOrders.reduce((sum, po) => sum + po.shipped_tonnage, 0);
    const totalRemaining = purchaseOrders.reduce((sum, po) => sum + po.remaining_tonnage, 0);

    return {
      totalPOs,
      activePOs,
      completedPOs,
      overduePOs,
      totalValue,
      activeValue,
      totalShipped,
      totalRemaining,
      completionRate: (completedPOs / totalPOs) * 100,
    };
  }, [purchaseOrders]);

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800 border-green-200';
      case 'Selesai': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sebagian': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Terlambat': return 'bg-red-100 text-red-800 border-red-200';
      case 'Dibatalkan': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Aktif': return <CheckCircle className="w-4 h-4" />;
      case 'Selesai': return <CheckCircle className="w-4 h-4" />;
      case 'Sebagian': return <Clock className="w-4 h-4" />;
      case 'Terlambat': return <AlertCircle className="w-4 h-4" />;
      case 'Dibatalkan': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getDeliveryProgress = (po: PurchaseOrder) => {
    const progress = (po.shipped_tonnage / po.total_tonnage) * 100;
    let color = 'bg-green-500';
    if (progress < 50) color = 'bg-red-500';
    else if (progress < 80) color = 'bg-yellow-500';
    
    return { progress, color };
  };

  const getRelatedDeliveries = (poNumber: string) => {
    return deliveryNotes.filter(note => note.poNumber === poNumber);
  };

  // --- Form state ---
  type POForm = Partial<PurchaseOrder> & { po_number: string; po_date: string; total_tonnage: number; price_per_ton: number; product_type: string };
  const emptyForm: POForm = {
    po_number: '',
    po_date: new Date().toISOString().slice(0,10),
    buyer_name: '',
    buyer_address: '',
    buyer_phone: '',
    buyer_email: '',
    product_type: 'CPO',
    total_tonnage: 0,
    price_per_ton: 0,
    total_value: 0,
    shipped_tonnage: 0,
    remaining_tonnage: 0,
    delivery_deadline: '',
    payment_terms: '',
    notes: '',
    ppn_enabled: true,
    ppn_rate: 0.11
  } as any;
  const [form, setForm] = useState<POForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string,string>>({});

  const openCreate = () => {
    setEditingPO(undefined);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setForm({ ...po } as any);
    setShowForm(true);
  };

  const computeTotal = (total_tonnage?: number, price_per_ton?: number) => {
    const t = Number(total_tonnage || form.total_tonnage || 0);
    const p = Number(price_per_ton || form.price_per_ton || 0);
    return t * p;
  };

  const handleFormChange = (key: keyof POForm, value: any) => {
    const next = { ...form, [key]: value } as POForm;
    if (key === 'total_tonnage' || key === 'price_per_ton') {
      next.total_value = computeTotal(next.total_tonnage, next.price_per_ton);
      next.remaining_tonnage = Number(next.total_tonnage || 0) - Number(next.shipped_tonnage || 0);
    }
    setForm(next);
  };

  const validateForm = (): boolean => {
    const e: Record<string,string> = {};
    if (!form.po_number) e.po_number = 'Nomor PO wajib diisi';
    if (!form.po_date) e.po_date = 'Tanggal PO wajib diisi';
    if (!form.product_type) e.product_type = 'Produk wajib diisi';
    if (!form.total_tonnage || form.total_tonnage <= 0) e.total_tonnage = 'Total tonase harus > 0';
    if (!form.price_per_ton || form.price_per_ton <= 0) e.price_per_ton = 'Harga per ton harus > 0';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    const payload: any = {
      po_number: form.po_number,
      po_date: form.po_date,
      buyer_name: form.buyer_name || null,
      buyer_address: form.buyer_address || null,
      buyer_phone: form.buyer_phone || null,
      buyer_email: form.buyer_email || null,
      product_type: form.product_type,
      total_tonnage: Number(form.total_tonnage || 0),
      price_per_ton: Number(form.price_per_ton || 0),
      total_value: computeTotal(),
      shipped_tonnage: Number(form.shipped_tonnage || 0),
      remaining_tonnage: Number(form.remaining_tonnage || (Number(form.total_tonnage||0) - Number(form.shipped_tonnage||0))),
      delivery_deadline: form.delivery_deadline || null,
      payment_terms: form.payment_terms || null,
      notes: form.notes || null,
      ppn_enabled: Boolean(form.ppn_enabled),
      ppn_rate: form.ppn_rate ?? 0.11,
      status: form.status || 'Aktif'
    };
    if (editingPO) {
      await onUpdatePO(editingPO.id, payload);
    } else {
      await onCreatePO(payload);
    }
    setShowForm(false);
    setEditingPO(undefined);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Purchase Order</h2>
          <p className="text-gray-600">Kelola dan monitor semua purchase order</p>
        </div>
        <div className="flex items-center space-x-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              title="Refresh data PO"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          )}
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PO Baru</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total PO</p>
              <p className="text-2xl font-bold text-gray-900">{poStats.totalPOs}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{poStats.activePOs} aktif
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nilai Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(poStats.totalValue)}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <DollarSign className="w-4 h-4 mr-1" />
                {formatCurrency(poStats.activeValue)} aktif
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tonase Terkirim</p>
              <p className="text-2xl font-bold text-gray-900">{formatWeight(poStats.totalShipped)}</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <Package className="w-4 h-4 mr-1" />
                {formatWeight(poStats.totalRemaining)} tersisa
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tingkat Penyelesaian</p>
              <p className="text-2xl font-bold text-gray-900">{poStats.completionRate.toFixed(1)}%</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <AlertCircle className="w-4 h-4 mr-1" />
                {poStats.overduePOs} terlambat
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nomor PO, supplier, atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="completed">Selesai</option>
              <option value="overdue">Terlambat</option>
            </select>
            <select
              value={ppnFilter}
              onChange={(e) => setPpnFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua PPN</option>
              <option value="with-ppn">Dengan PPN</option>
              <option value="without-ppn">Tanpa PPN</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Tanggal</option>
              <option value="value">Nilai</option>
              <option value="status">Status</option>
              <option value="buyer">Pembeli</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* PO List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nomor PO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pembeli
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PPN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPOs.map((po) => {
                const progress = getDeliveryProgress(po);
                
                return (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                      <div className="text-sm text-gray-500">{formatDate(po.po_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.buyer_name}</div>
                      <div className="text-sm text-gray-500">{po.buyer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.product_type}</div>
                      <div className="text-sm text-gray-500">{formatWeight(po.total_tonnage)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(po.total_value)}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(po.price_per_ton)}/ton</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${progress.color}`}
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{progress.progress.toFixed(0)}%</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatWeight(po.shipped_tonnage)} / {formatWeight(po.total_tonnage)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        po.ppn_enabled 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {po.ppn_enabled ? '✓ PPN' : '✗ Tanpa PPN'}
                        {po.ppn_enabled && po.ppn_rate && (
                          <span className="ml-1">({(po.ppn_rate * 100).toFixed(0)}%)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(po.status)}`}>
                        {getStatusIcon(po.status)}
                        <span className="ml-1">{po.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(po.delivery_deadline)}</div>
                      {dayjs(po.delivery_deadline).isBefore(dayjs(), 'day') && po.status === 'Aktif' && (
                        <div className="text-sm text-red-600">Terlambat</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedPO(po)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(po)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit PO"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePO(po.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Hapus PO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Detail Purchase Order</h3>
                <button
                  onClick={() => setSelectedPO(undefined)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* PO Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informasi PO</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nomor PO</label>
                      <p className="text-sm text-gray-900">{selectedPO.po_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tanggal PO</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedPO.po_date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Produk</label>
                      <p className="text-sm text-gray-900">{selectedPO.product_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Tonase</label>
                      <p className="text-sm text-gray-900">{formatWeight(selectedPO.total_tonnage)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Harga per Ton</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPO.price_per_ton)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Nilai</label>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedPO.total_value)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pembeli</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nama Pembeli</label>
                      <p className="text-sm text-gray-900">{selectedPO.buyer_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Alamat</label>
                      <p className="text-sm text-gray-900">{selectedPO.buyer_address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telepon</label>
                      <p className="text-sm text-gray-900">{selectedPO.buyer_phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{selectedPO.buyer_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Syarat Pembayaran</label>
                      <p className="text-sm text-gray-900">{selectedPO.payment_terms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">PPN</label>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedPO.ppn_enabled 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {selectedPO.ppn_enabled ? '✓ Dengan PPN' : '✗ Tanpa PPN'}
                        </span>
                        {selectedPO.ppn_enabled && selectedPO.ppn_rate && (
                          <span className="text-sm text-gray-900">
                            ({(selectedPO.ppn_rate * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress and Status */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Progress Pengiriman</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-gray-900">
                      {((selectedPO.shipped_tonnage / selectedPO.total_tonnage) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div 
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${(selectedPO.shipped_tonnage / selectedPO.total_tonnage) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-bold text-gray-900">{formatWeight(selectedPO.total_tonnage)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Terkirim</p>
                      <p className="text-lg font-bold text-green-600">{formatWeight(selectedPO.shipped_tonnage)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tersisa</p>
                      <p className="text-lg font-bold text-orange-600">{formatWeight(selectedPO.remaining_tonnage)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Deliveries */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Surat Jalan Terkait</h4>
                {getRelatedDeliveries(selectedPO.po_number).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">No. Surat Jalan</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tanggal</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Berat</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getRelatedDeliveries(selectedPO.po_number).map((delivery) => (
                          <tr key={delivery.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{delivery.deliveryNoteNumber}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatDate(delivery.date)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatWeight(delivery.netWeight || 0)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{delivery.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Belum ada surat jalan untuk PO ini</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{editingPO ? 'Edit Purchase Order' : 'Buat Purchase Order'}</h3>
              <button onClick={() => { setShowForm(false); setEditingPO(undefined); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor PO</label>
                  <input value={form.po_number || ''} onChange={e=>handleFormChange('po_number', e.target.value)} className={`w-full border rounded-lg px-3 py-2 ${formErrors.po_number?'border-red-400':'border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal PO</label>
                  <input type="date" value={form.po_date?.slice(0,10) || ''} onChange={e=>handleFormChange('po_date', e.target.value)} className={`w-full border rounded-lg px-3 py-2 ${formErrors.po_date?'border-red-400':'border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
                  <select value={form.product_type || ''} onChange={e=>handleFormChange('product_type', e.target.value)} className={`w-full border rounded-lg px-3 py-2 ${formErrors.product_type?'border-red-400':'border-gray-300'}`}>
                    <option value="CPO">CPO</option>
                    <option value="UCO">UCO</option>
                    <option value="Minyak Ikan">Minyak Ikan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Tonase (kg)</label>
                  <input type="number" value={form.total_tonnage ?? ''} onChange={e=>handleFormChange('total_tonnage', e.target.value===''?undefined:Number(e.target.value))} placeholder="0" className={`w-full border rounded-lg px-3 py-2 ${formErrors.total_tonnage?'border-red-400':'border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Kg (Rp)</label>
                  <input type="number" value={form.price_per_ton ?? ''} onChange={e=>handleFormChange('price_per_ton', e.target.value===''?undefined:Number(e.target.value))} placeholder="0" className={`w-full border rounded-lg px-3 py-2 ${formErrors.price_per_ton?'border-red-400':'border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input type="date" value={form.delivery_deadline?.slice(0,10) || ''} onChange={e=>handleFormChange('delivery_deadline', e.target.value)} className="w-full border rounded-lg px-3 py-2 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PPN</label>
                  <select
                    value={form.ppn_enabled ? 'with' : 'without'}
                    onChange={e=>handleFormChange('ppn_enabled', e.target.value === 'with')}
                    className="w-full border rounded-lg px-3 py-2 border-gray-300"
                  >
                    <option value="with">Dengan PPN</option>
                    <option value="without">Tanpa PPN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pembeli</label>
                  <input value={form.buyer_name || ''} onChange={e=>handleFormChange('buyer_name', e.target.value)} className="w-full border rounded-lg px-3 py-2 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon Pembeli</label>
                  <input value={form.buyer_phone || ''} onChange={e=>handleFormChange('buyer_phone', e.target.value)} className="w-full border rounded-lg px-3 py-2 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarif PPN</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="1" 
                    value={form.ppn_rate ?? 0.11} 
                    onChange={e=>handleFormChange('ppn_rate', e.target.value===''?undefined:Number(e.target.value))} 
                    disabled={!form.ppn_enabled}
                    className={`w-full border rounded-lg px-3 py-2 ${!form.ppn_enabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300'}`} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Contoh: 0.11 untuk 11%</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pembeli</label>
                  <input value={form.buyer_address || ''} onChange={e=>handleFormChange('buyer_address', e.target.value)} className="w-full border rounded-lg px-3 py-2 border-gray-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Pembeli</label>
                  <input value={form.buyer_email || ''} onChange={e=>handleFormChange('buyer_email', e.target.value)} className="w-full border rounded-lg px-3 py-2 border-gray-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Syarat Pembayaran</label>
                  <input value={form.payment_terms || ''} onChange={e=>handleFormChange('payment_terms', e.target.value)} className="w-full border rounded-lg px-3 py-2 border-gray-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <textarea value={form.notes || ''} onChange={e=>handleFormChange('notes', e.target.value)} className="w-full border rounded-lg px-3 py-2 border-gray-300" rows={3} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Total Nilai: <span className="font-bold text-gray-900">{formatCurrency(computeTotal())}</span></div>
                <div className="space-x-2">
                  <button onClick={()=>{setShowForm(false); setEditingPO(undefined);}} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
                  <button onClick={submitForm} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{editingPO ? 'Perbarui PO' : 'Simpan PO'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
