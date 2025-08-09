import React, { useState, useMemo } from 'react';
import { DeliveryNote } from '../types';
import { formatWeight, formatCurrency, formatDate } from '../utils/format';
import { 
  FileText, Plus, Edit, Trash2, Eye, 
  TrendingUp, TrendingDown, DollarSign, Package,
  Calendar, MapPin, Truck, Users, BarChart3,
  CheckCircle, AlertCircle, Clock, Filter,
  Download, Printer, Search, Settings, X
} from 'lucide-react';
import dayjs from 'dayjs';

interface PurchaseOrder {
  id: string;
  po_number: string;
  po_date: string;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_email: string;
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
  created_at: string;
  updated_at: string;
}

interface PurchaseOrderManagerProps {
  purchaseOrders: PurchaseOrder[];
  deliveryNotes: DeliveryNote[];
  onCreatePO: (poData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdatePO: (id: string, updates: Partial<PurchaseOrder>) => void;
  onDeletePO: (id: string) => void;
}

export const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({
  purchaseOrders,
  deliveryNotes,
  onCreatePO,
  onUpdatePO,
  onDeletePO,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | undefined>();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | undefined>();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status' | 'supplier'>('date');
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

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(po =>
        po.po_number.toLowerCase().includes(searchLower) ||
        po.supplier_name.toLowerCase().includes(searchLower) ||
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
        case 'supplier':
          comparison = a.supplier_name.localeCompare(b.supplier_name);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [purchaseOrders, filter, searchTerm, sortBy, sortOrder]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Purchase Order</h2>
          <p className="text-gray-600">Kelola dan monitor semua purchase order</p>
        </div>
        <button
          onClick={() => {
            setEditingPO(undefined);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buat PO Baru</span>
        </button>
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Tanggal</option>
              <option value="value">Nilai</option>
              <option value="status">Status</option>
              <option value="supplier">Supplier</option>
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
                  Supplier
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
                const relatedDeliveries = getRelatedDeliveries(po.po_number);
                
                return (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                      <div className="text-sm text-gray-500">{formatDate(po.po_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.supplier_name}</div>
                      <div className="text-sm text-gray-500">{po.supplier_phone}</div>
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
                          onClick={() => {
                            setEditingPO(po);
                            setShowForm(true);
                          }}
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informasi Supplier</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nama Supplier</label>
                      <p className="text-sm text-gray-900">{selectedPO.supplier_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Alamat</label>
                      <p className="text-sm text-gray-900">{selectedPO.supplier_address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telepon</label>
                      <p className="text-sm text-gray-900">{selectedPO.supplier_phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{selectedPO.supplier_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Syarat Pembayaran</label>
                      <p className="text-sm text-gray-900">{selectedPO.payment_terms}</p>
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
    </div>
  );
};
