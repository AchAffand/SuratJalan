import React, { useState } from 'react';
import { Search, Download, FileText, ArrowUpDown } from 'lucide-react';
import dayjs from '../lib/dayjs';
import { DeliveryNote } from '../types';
import { exportToCSV, exportToExcel } from '../utils/exporters';

interface DeliveryRecapProps {
  deliveryNotes: DeliveryNote[];
  onRefresh: () => void;
}

type DeliveryStatus = 'all' | DeliveryNote['status'];
type SortField = 'date' | 'createdAt' | 'deliveryNoteNumber' | 'poNumber' | 'destination' | 'status';
type SortDirection = 'asc' | 'desc';

export const DeliveryRecap: React.FC<DeliveryRecapProps> = ({ deliveryNotes, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus>('all');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'detail' | 'monthly' | 'destination'>('detail');

  const filteredNotes = deliveryNotes
    .filter(n => {
      const s = searchTerm.toLowerCase();
      const matchSearch =
        (n.deliveryNoteNumber || '').toLowerCase().includes(s) ||
        (n.poNumber || '').toLowerCase().includes(s) ||
        (n.destination || '').toLowerCase().includes(s) ||
        (n.driverName || '').toLowerCase().includes(s);

      const matchStatus = statusFilter === 'all' || n.status === statusFilter;

      const d = dayjs(n.date || n.createdAt);
      const matchDate = d.isAfter(dayjs(startDate).subtract(1, 'day')) && d.isBefore(dayjs(endDate).add(1, 'day'));

      return matchSearch && matchStatus && matchDate;
    })
    .sort((a, b) => {
      let av: any = (a as any)[sortField] || (sortField === 'date' ? a.createdAt : '');
      let bv: any = (b as any)[sortField] || (sortField === 'date' ? b.createdAt : '');
      if (sortField === 'date' || sortField === 'createdAt') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      } else {
        av = String(av || '').toLowerCase();
        bv = String(bv || '').toLowerCase();
      }
      return sortDirection === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  // Aggregations for Rekap Per Bulan and Per Alamat (clean tables)
  const monthlyMap: Record<string, { total: number; weight: number; destinations: Set<string> }> = {};
  const destinationMap: Record<string, { total: number; weight: number; months: Set<string> }> = {};
  filteredNotes.forEach(n => {
    const m = dayjs(n.date || n.createdAt).format('MMMM YYYY');
    if (!monthlyMap[m]) monthlyMap[m] = { total: 0, weight: 0, destinations: new Set() };
    monthlyMap[m].total += 1;
    monthlyMap[m].weight += Number((n as any).netWeight || 0);
    if (n.destination) monthlyMap[m].destinations.add(n.destination);

    const d = n.destination || '-';
    if (!destinationMap[d]) destinationMap[d] = { total: 0, weight: 0, months: new Set() };
    destinationMap[d].total += 1;
    destinationMap[d].weight += Number((n as any).netWeight || 0);
    destinationMap[d].months.add(m);
  });
  const monthlyRows = Object.entries(monthlyMap)
    .map(([month, v]) => ({
      month,
      destinations: v.destinations.size,
      total: v.total,
      weight: v.weight,
    }))
    .sort((a, b) => dayjs(b.month, 'MMMM YYYY').valueOf() - dayjs(a.month, 'MMMM YYYY').valueOf())
    .filter(r => r.month.toLowerCase().includes(searchTerm.toLowerCase()));
  const destinationRows = Object.entries(destinationMap)
    .map(([dest, v]) => ({
      destination: dest,
      months: v.months.size,
      total: v.total,
      weight: v.weight,
    }))
    .sort((a, b) => a.destination.localeCompare(b.destination))
    .filter(r => r.destination.toLowerCase().includes(searchTerm.toLowerCase()));

  const exportExcel = () => {
    const rows = filteredNotes.map(n => ({
      'No. Surat Jalan': n.deliveryNoteNumber,
      'Tanggal': dayjs(n.date || n.createdAt).format('DD/MM/YYYY'),
      'No. PO': n.poNumber,
      'Alamat': n.destination,
      'Driver': n.driverName,
      'No. Polisi': (n as any).vehiclePlate,
      'Status': n.status,
      'Perusahaan': n.company === 'sbs' ? 'PT. SBS' : n.company === 'mbs' ? 'CV. MBS' : 'Perorangan',
    }));
    exportToExcel(rows as any, `rekap-pengiriman-${dayjs().format('YYYYMMDD')}`)
      .then(success => {
        if (success) {
          console.log('✅ Export Excel rekap pengiriman berhasil');
        }
      })
      .catch(error => {
        console.error('❌ Export Excel rekap pengiriman gagal:', error);
      });
  };

  const exportCsv = () => {
    const rows = filteredNotes.map(n => ({
      no_sj: n.deliveryNoteNumber,
      tanggal: dayjs(n.date || n.createdAt).format('YYYY-MM-DD'),
      no_po: n.poNumber,
      alamat: n.destination,
      driver: n.driverName,
      nopol: (n as any).vehiclePlate,
      status: n.status,
      perusahaan: n.company,
    }));
    exportToCSV(rows as any, `rekap-pengiriman-${dayjs().format('YYYYMMDD')}`)
      .then(success => {
        if (success) {
          console.log('✅ Export CSV rekap pengiriman berhasil');
        }
      })
      .catch(error => {
        console.error('❌ Export CSV rekap pengiriman gagal:', error);
      });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 rounded-2xl shadow-2xl border border-white/40 p-6 backdrop-blur-xl">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Rekap Pengiriman</h1>
          <p className="text-gray-600">Daftar lengkap semua surat jalan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari: No SJ / PO / Alamat / Driver"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode==='detail'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:text-gray-800'}`}
            >Detail</button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode==='monthly'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:text-gray-800'}`}
            >Per Bulan</button>
            <button
              onClick={() => setViewMode('destination')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode==='destination'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:text-gray-800'}`}
            >Per Alamat</button>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as DeliveryStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="dalam-perjalanan">Dalam Perjalanan</option>
            <option value="selesai">Selesai</option>
          </select>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <div className="flex items-center space-x-2 lg:justify-end">
            <button onClick={exportExcel} className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"><Download className="w-4 h-4" /><span>Excel</span></button>
            <button onClick={exportCsv} className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"><FileText className="w-4 h-4" /><span>CSV</span></button>
          </div>
        </div>
      </div>

      {/* Switchable views */}
      {viewMode === 'monthly' ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah Alamat</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Pengiriman</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Berat (kg)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyRows.map(r => (
                  <tr key={r.month} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-800">{r.month}</td>
                    <td className="px-6 py-3 text-gray-700">{r.destinations}</td>
                    <td className="px-6 py-3 text-gray-700">{r.total}</td>
                    <td className="px-6 py-3 text-gray-800">{r.weight.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {monthlyRows.length === 0 && (
            <div className="text-center py-12"><p className="text-gray-600">Tidak ada data untuk filter saat ini.</p></div>
          )}
        </div>
      ) : viewMode === 'destination' ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alamat</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Pengiriman</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Berat (kg)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {destinationRows.map(r => (
                  <tr key={r.destination} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-800" title={r.destination}>{r.destination}</td>
                    <td className="px-6 py-3 text-gray-700">{r.months}</td>
                    <td className="px-6 py-3 text-gray-700">{r.total}</td>
                    <td className="px-6 py-3 text-gray-800">{r.weight.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {destinationRows.length === 0 && (
            <div className="text-center py-12"><p className="text-gray-600">Tidak ada data untuk filter saat ini.</p></div>
          )}
        </div>
      ) : (
      	<div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        	<div className="overflow-x-auto">
          	<table className="min-w-full text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-white sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer" onClick={()=>handleSort('date')}>
                  <div className="inline-flex items-center space-x-1"><span>Tanggal</span><ArrowUpDown className="w-4 h-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer" onClick={()=>handleSort('deliveryNoteNumber')}>
                  <div className="inline-flex items-center space-x-1"><span>No. Surat Jalan</span><ArrowUpDown className="w-4 h-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer" onClick={()=>handleSort('poNumber')}>
                  <div className="inline-flex items-center space-x-1"><span>No. PO</span><ArrowUpDown className="w-4 h-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer" onClick={()=>handleSort('destination')}>
                  <div className="inline-flex items-center space-x-1"><span>Alamat Tujuan</span><ArrowUpDown className="w-4 h-4" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Perusahaan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotes.map(n => (
                <tr key={n.id} className="hover:bg-gray-50/80 even:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-gray-700">{dayjs(n.date || n.createdAt).format('DD/MM/YYYY')}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{n.deliveryNoteNumber}</td>
                  <td className="px-6 py-3 text-gray-700">{n.poNumber}</td>
                  <td className="px-6 py-3 text-gray-700 max-w-xs truncate" title={n.destination}>{n.destination}</td>
                  <td className="px-6 py-3 text-gray-700">{n.driverName}</td>
                  <td className="px-6 py-3 text-gray-800">{n.status}</td>
                  <td className="px-6 py-3 text-gray-800">{n.company === 'sbs' ? 'PT. SBS' : n.company === 'mbs' ? 'CV. MBS' : 'Perorangan'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Tidak ada data untuk rentang tanggal/status yang dipilih.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};