import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, BarChart3, DollarSign, Package, Truck, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import dayjs from '../lib/dayjs';
import { POAnalyticsDashboard } from './POAnalyticsDashboard';
import { exportToExcel, exportToJSON, exportToXML, exportToPDF, exportToCSV, exportToMultipleFormats } from '../utils/poExportUtils';

interface POReportGeneratorProps {
  purchaseOrders: any[];
  deliveryNotes: any[];
  onExport: (reportData: any, format: string) => void;
}

export const POReportGenerator: React.FC<POReportGeneratorProps> = ({
  purchaseOrders,
  deliveryNotes,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf' | 'csv' | 'json' | 'xml'>('excel');
  const [bulkExport, setBulkExport] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['excel', 'pdf']);
  const [dateRange, setDateRange] = useState<'all' | 'this-month' | 'last-month' | 'this-year' | 'custom'>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aktif' | 'Selesai' | 'Dibatalkan'>('all');
  const [poNumberFilter, setPoNumberFilter] = useState('');
  const [viewMode, setViewMode] = useState<'reports' | 'analytics'>('reports');
  // Debug modal removed

  // Filter PO berdasarkan kriteria yang dipilih
  const filteredPOs = useMemo(() => {
    let filtered = [...purchaseOrders];

    // Filter berdasarkan status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.status === statusFilter);
    }

    // Filter berdasarkan nomor PO
    if (poNumberFilter) {
      filtered = filtered.filter(po => 
        po.po_number?.toLowerCase().includes(poNumberFilter.toLowerCase())
      );
    }

    // Filter berdasarkan tanggal
    if (dateRange !== 'all') {
      const now = dayjs();
      let startDate: dayjs.Dayjs;
      let endDate: dayjs.Dayjs;

      switch (dateRange) {
        case 'this-month':
          startDate = now.startOf('month');
          endDate = now.endOf('month');
          break;
        case 'last-month':
          startDate = now.subtract(1, 'month').startOf('month');
          endDate = now.subtract(1, 'month').endOf('month');
          break;
        case 'this-year':
          startDate = now.startOf('year');
          endDate = now.endOf('year');
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = dayjs(customStartDate);
            endDate = dayjs(customEndDate);
          } else {
            return filtered;
          }
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter(po => {
        const poDate = dayjs(po.po_date);
        return poDate.isBetween(startDate, endDate, 'day', '[]');
      });
    }

    return filtered;
  }, [purchaseOrders, dateRange, customStartDate, customEndDate, statusFilter, poNumberFilter]);

  // Hitung statistik PO
  const stats = useMemo(() => {
    const total = filteredPOs.length;
    const active = filteredPOs.filter(po => po.status === 'Aktif').length;
    const completed = filteredPOs.filter(po => po.status === 'Selesai').length;
    const cancelled = filteredPOs.filter(po => po.status === 'Dibatalkan').length;
    
    const totalValue = filteredPOs.reduce((sum, po) => sum + (po.total_value || 0), 0);
    const totalTonnage = filteredPOs.reduce((sum, po) => sum + (po.total_tonnage || 0), 0);
    const shippedTonnage = filteredPOs.reduce((sum, po) => sum + (po.shipped_tonnage || 0), 0);
    const remainingTonnage = filteredPOs.reduce((sum, po) => sum + (po.remaining_tonnage || 0), 0);

    return {
      total,
      active,
      completed,
      cancelled,
      totalValue,
      totalTonnage,
      shippedTonnage,
      remainingTonnage,
      completionRate: total > 0 ? ((shippedTonnage / totalTonnage) * 100).toFixed(1) : '0'
    };
  }, [filteredPOs]);

  // Enhanced export function
  const handleExport = () => {
    const reportData = {
      purchaseOrders: filteredPOs,
      deliveryNotes: deliveryNotes.filter(note => 
        filteredPOs.some(po => po.po_number === note.poNumber)
      ),
      metadata: {
        title: 'Laporan Detail Purchase Order',
        generatedAt: new Date().toISOString(),
        period: dateRange,
        filters: {
          dateRange,
          customStartDate,
          customEndDate,
          statusFilter,
          poNumberFilter
        }
      }
    };

    if (bulkExport) {
      exportToMultipleFormats(reportData, selectedFormats);
    } else {
      switch (selectedFormat) {
        case 'excel':
          exportToExcel(reportData);
          break;
        case 'csv':
          exportToCSV(reportData);
          break;
        case 'json':
          exportToJSON(reportData);
          break;
        case 'xml':
          exportToXML(reportData);
          break;
        case 'pdf':
          exportToPDF(reportData);
          break;
        default:
          onExport(reportData, selectedFormat);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laporan Purchase Order</h1>
              <p className="text-gray-600">Laporan detail dan analisis PO </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('reports')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                viewMode === 'reports'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Laporan</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                viewMode === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            {/* Alerts view removed */}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setBulkExport(false);
                setSelectedFormat('excel');
                handleExport();
              }}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors flex items-center space-x-1"
            >
              <Zap className="w-3 h-3" />
              <span>Quick Excel</span>
            </button>
            <button
              onClick={() => {
                setBulkExport(false);
                setSelectedFormat('pdf');
                handleExport();
              }}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center space-x-1"
            >
              <Zap className="w-3 h-3" />
              <span>Quick PDF</span>
            </button>
            <button
              onClick={() => {
                setBulkExport(true);
                setSelectedFormats(['excel', 'pdf', 'csv']);
                handleExport();
              }}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors flex items-center space-x-1"
            >
              <Zap className="w-3 h-3" />
              <span>Export All</span>
            </button>
            {/* Debug button removed */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total PO</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Aktif</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Selesai</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Total Nilai</span>
            </div>
            <p className="text-lg font-bold text-orange-900">
              Rp {(stats.totalValue / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress Pengiriman</span>
            <span className="text-sm font-medium text-gray-700">{stats.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{stats.shippedTonnage.toFixed(1)} ton terkirim</span>
            <span>{stats.remainingTonnage.toFixed(1)} ton tersisa</span>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {viewMode === 'analytics' && (
        <POAnalyticsDashboard
          purchaseOrders={purchaseOrders}
          deliveryNotes={deliveryNotes}
          onExport={onExport}
        />
      )}

      {/* Alerts view removed */}

      {/* Traditional Reports */}
      {viewMode === 'reports' && (
        <>
          {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span>Filter Laporan</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Export Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Mode</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!bulkExport}
                  onChange={() => setBulkExport(false)}
                  className="mr-2"
                />
                <span className="text-sm">Single Format</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={bulkExport}
                  onChange={() => setBulkExport(true)}
                  className="mr-2"
                />
                <span className="text-sm">Bulk Export</span>
              </label>
            </div>
          </div>

          {/* Format Export */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {bulkExport ? 'Select Formats' : 'Export Format'}
            </label>
            {bulkExport ? (
              <div className="space-y-2">
                {[
                  { id: 'excel', label: 'Excel (.xlsx)', icon: '📊' },
                  { id: 'pdf', label: 'PDF', icon: '📄' },
                  { id: 'csv', label: 'CSV', icon: '📋' },
                  { id: 'json', label: 'JSON', icon: '🔧' },
                  { id: 'xml', label: 'XML', icon: '📝' }
                ].map(({ id, label, icon }) => (
                  <label key={id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFormats([...selectedFormats, id]);
                        } else {
                          setSelectedFormats(selectedFormats.filter(f => f !== id));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{icon} {label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="excel">📊 Excel (.xlsx)</option>
                <option value="pdf">📄 PDF</option>
                <option value="csv">📋 CSV</option>
                <option value="json">🔧 JSON</option>
                <option value="xml">📝 XML</option>
              </select>
            )}
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Tanggal</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Tanggal</option>
              <option value="this-month">Bulan Ini</option>
              <option value="last-month">Bulan Lalu</option>
              <option value="this-year">Tahun Ini</option>
              <option value="custom">Kustom</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status PO</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* PO Number Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Nomor PO</label>
            <input
              type="text"
              value={poNumberFilter}
              onChange={(e) => setPoNumberFilter(e.target.value)}
              placeholder="Cari nomor PO..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview Data */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Preview Data PO</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2 font-medium"
            >
              <Download className="w-4 h-4" />
              <span>{bulkExport ? 'Export All' : 'Export Report'}</span>
            </button>
            {bulkExport && (
              <div className="text-sm text-gray-600">
                {selectedFormats.length} format(s) selected
              </div>
            )}
          </div>
        </div>

        {filteredPOs.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada data PO yang sesuai dengan filter yang dipilih</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomor PO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pembeli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total (Kg)
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terkirim (Kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sisa (Kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nilai Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {po.po_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(po.po_date).format('DD/MM/YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.buyer_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.product_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.total_tonnage?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {po.shipped_tonnage?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {po.remaining_tonnage?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {(po.total_value / 1000000).toFixed(1)}M
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        po.status === 'Aktif' ? 'bg-green-100 text-green-800' :
                        po.status === 'Selesai' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}
      
      {/* Debug modal removed */}
    </div>
  );
};
