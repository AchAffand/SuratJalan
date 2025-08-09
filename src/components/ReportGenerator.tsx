import React, { useState, useMemo } from 'react';
import { DeliveryNote } from '../types';
import { formatWeight, formatCurrency, formatDate } from '../utils/format';
import { 
  FileText, Download, Printer, Calendar, 
  Filter, BarChart3, PieChart, TrendingUp,
  MapPin, Truck, Users, DollarSign, Clock,
  CheckCircle, AlertCircle, XCircle, Package
} from 'lucide-react';
import dayjs from 'dayjs';

interface ReportGeneratorProps {
  notes: DeliveryNote[];
  purchaseOrders: any[];
  onExport: (reportData: any, format: string) => void;
}

interface ReportData {
  summary: {
    totalDeliveries: number;
    totalWeight: number;
    totalRevenue: number;
    averageDeliveryPerDay: number;
    onTimeDeliveryRate: number;
    topDestinations: Array<{ name: string; count: number; weight: number; revenue: number }>;
    vehicleUtilization: Array<{ plate: string; trips: number; totalWeight: number; efficiency: number }>;
    driverPerformance: Array<{ name: string; trips: number; totalWeight: number; avgWeight: number; rating: string }>;
  };
  details: {
    deliveries: DeliveryNote[];
    monthlyBreakdown: Array<{ month: string; deliveries: number; weight: number; revenue: number }>;
    statusBreakdown: { menunggu: number; dalamPerjalanan: number; selesai: number };
    weightDistribution: { under1Ton: number; oneToFiveTon: number; overFiveTon: number };
  };
  metadata: {
    reportDate: string;
    period: string;
    generatedBy: string;
    companyInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
    };
  };
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ notes, purchaseOrders, onExport }) => {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'financial' | 'operational'>('summary');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [showPreview, setShowPreview] = useState(false);

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(note => {
        const noteDate = dayjs(note.date);
        return noteDate.isAfter(dayjs(dateRange.start)) && noteDate.isBefore(dayjs(dateRange.end));
      });
    }

    // Filter by destinations
    if (selectedDestinations.length > 0) {
      filtered = filtered.filter(note => selectedDestinations.includes(note.destination));
    }

    // Filter by vehicles
    if (selectedVehicles.length > 0) {
      filtered = filtered.filter(note => selectedVehicles.includes(note.vehiclePlate));
    }

    // Filter by drivers
    if (selectedDrivers.length > 0) {
      filtered = filtered.filter(note => selectedDrivers.includes(note.driverName));
    }

    return filtered;
  }, [notes, dateRange, selectedDestinations, selectedVehicles, selectedDrivers]);

  const reportData = useMemo((): ReportData => {
    const totalDeliveries = filteredNotes.length;
    const totalWeight = filteredNotes.reduce((sum, n) => sum + (n.netWeight || 0), 0);
    
    const totalRevenue = filteredNotes.reduce((sum, n) => {
      if (n.poNumber) {
        const po = purchaseOrders.find(p => p.po_number === n.poNumber);
        if (po && n.netWeight) {
          return sum + (n.netWeight * po.price_per_ton);
        }
      }
      return sum;
    }, 0);

    const averageDeliveryPerDay = totalDeliveries / Math.max(1, dayjs().diff(dayjs(filteredNotes[0]?.date || dayjs()), 'day'));
    const onTimeDeliveryRate = (filteredNotes.filter(n => n.status === 'selesai').length / totalDeliveries) * 100;

    // Top destinations with revenue
    const destinationStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.destination]) {
        acc[n.destination] = { count: 0, weight: 0, revenue: 0 };
      }
      acc[n.destination].count++;
      acc[n.destination].weight += n.netWeight || 0;
      
      if (n.poNumber) {
        const po = purchaseOrders.find(p => p.po_number === n.poNumber);
        if (po && n.netWeight) {
          acc[n.destination].revenue += n.netWeight * po.price_per_ton;
        }
      }
      return acc;
    }, {} as Record<string, { count: number; weight: number; revenue: number }>);

    const topDestinations = Object.entries(destinationStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Vehicle utilization with efficiency
    const vehicleStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.vehiclePlate]) {
        acc[n.vehiclePlate] = { trips: 0, totalWeight: 0 };
      }
      acc[n.vehiclePlate].trips++;
      acc[n.vehiclePlate].totalWeight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { trips: number; totalWeight: number }>);

    const vehicleUtilization = Object.entries(vehicleStats)
      .map(([plate, stats]) => ({
        plate,
        ...stats,
        efficiency: (stats.totalWeight / stats.trips) / 5000 * 100 // Assuming 5 ton capacity
      }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10);

    // Driver performance with rating
    const driverStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.driverName]) {
        acc[n.driverName] = { trips: 0, totalWeight: 0 };
      }
      acc[n.driverName].trips++;
      acc[n.driverName].totalWeight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { trips: number; totalWeight: number }>);

    const driverPerformance = Object.entries(driverStats)
      .map(([name, stats]) => {
        const avgWeight = stats.totalWeight / stats.trips;
        let rating = 'Good';
        if (avgWeight > 4000) rating = 'Excellent';
        else if (avgWeight < 2000) rating = 'Needs Improvement';
        
        return {
          name,
          ...stats,
          avgWeight,
          rating
        };
      })
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10);

    // Monthly breakdown
    const monthlyStats = filteredNotes.reduce((acc, n) => {
      const month = dayjs(n.date).format('MMM YYYY');
      if (!acc[month]) {
        acc[month] = { deliveries: 0, weight: 0, revenue: 0 };
      }
      acc[month].deliveries++;
      acc[month].weight += n.netWeight || 0;
      
      if (n.poNumber) {
        const po = purchaseOrders.find(p => p.po_number === n.poNumber);
        if (po && n.netWeight) {
          acc[month].revenue += n.netWeight * po.price_per_ton;
        }
      }
      return acc;
    }, {} as Record<string, { deliveries: number; weight: number; revenue: number }>);

    const monthlyBreakdown = Object.entries(monthlyStats)
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => dayjs(a.month, 'MMM YYYY').valueOf() - dayjs(b.month, 'MMM YYYY').valueOf());

    // Status breakdown
    const statusBreakdown = {
      menunggu: filteredNotes.filter(n => n.status === 'menunggu').length,
      dalamPerjalanan: filteredNotes.filter(n => n.status === 'dalam-perjalanan').length,
      selesai: filteredNotes.filter(n => n.status === 'selesai').length,
    };

    // Weight distribution
    const weightDistribution = {
      under1Ton: filteredNotes.filter(n => (n.netWeight || 0) < 1000).length,
      oneToFiveTon: filteredNotes.filter(n => (n.netWeight || 0) >= 1000 && (n.netWeight || 0) < 5000).length,
      overFiveTon: filteredNotes.filter(n => (n.netWeight || 0) >= 5000).length,
    };

    return {
      summary: {
        totalDeliveries,
        totalWeight,
        totalRevenue,
        averageDeliveryPerDay,
        onTimeDeliveryRate,
        topDestinations,
        vehicleUtilization,
        driverPerformance,
      },
      details: {
        deliveries: filteredNotes,
        monthlyBreakdown,
        statusBreakdown,
        weightDistribution,
      },
      metadata: {
        reportDate: dayjs().format('DD MMMM YYYY'),
        period: dateRange.start && dateRange.end 
          ? `${dayjs(dateRange.start).format('DD MMM YYYY')} - ${dayjs(dateRange.end).format('DD MMM YYYY')}`
          : 'All Time',
        generatedBy: 'Sistem Surat Jalan',
        companyInfo: {
          name: 'PT. SAMUDERA BERKAH SEJAHTERA',
          address: 'Jl. Raya Surabaya-Malang KM. 48, Sidoarjo, Jawa Timur',
          phone: '+62 31 1234567',
          email: 'info@sbs.com',
        },
      },
    };
  }, [filteredNotes, purchaseOrders, dateRange]);

  const handleExport = () => {
    onExport(reportData, exportFormat);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'summary': return 'Executive Summary Report';
      case 'detailed': return 'Detailed Delivery Report';
      case 'financial': return 'Financial Performance Report';
      case 'operational': return 'Operational Efficiency Report';
      default: return 'Delivery Report';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report Generator</h2>
              <p className="text-gray-600">Generate professional business reports</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="summary">Executive Summary</option>
              <option value="detailed">Detailed Report</option>
              <option value="financial">Financial Report</option>
              <option value="operational">Operational Report</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-blue-600" />
          Advanced Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Destinations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destinations</label>
            <select
              multiple
              value={selectedDestinations}
              onChange={(e) => setSelectedDestinations(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from(new Set(notes.map(n => n.destination))).map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          {/* Vehicles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicles</label>
            <select
              multiple
              value={selectedVehicles}
              onChange={(e) => setSelectedVehicles(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from(new Set(notes.map(n => n.vehiclePlate))).map(plate => (
                <option key={plate} value={plate}>{plate}</option>
              ))}
            </select>
          </div>

          {/* Drivers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drivers</label>
            <select
              multiple
              value={selectedDrivers}
              onChange={(e) => setSelectedDrivers(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from(new Set(notes.map(n => n.driverName))).map(driver => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
          
          {/* Report Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{getReportTitle()}</h1>
              <p className="text-gray-600 mt-2">{reportData.metadata.period}</p>
              <p className="text-sm text-gray-500 mt-1">Generated on {reportData.metadata.reportDate}</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Deliveries</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.summary.totalDeliveries}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Weight</p>
                  <p className="text-2xl font-bold text-green-900">{formatWeight(reportData.summary.totalWeight)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-yellow-900">{formatCurrency(reportData.summary.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">On-Time Rate</p>
                  <p className="text-2xl font-bold text-purple-900">{reportData.summary.onTimeDeliveryRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Top Destinations */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Top Destinations
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.summary.topDestinations.slice(0, 5).map((dest, index) => (
                    <tr key={dest.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dest.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dest.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatWeight(dest.weight)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(dest.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-orange-600" />
                Status Distribution
              </h4>
              <div className="space-y-2">
                {Object.entries(reportData.details.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'menunggu' ? 'bg-amber-500' :
                        status === 'dalam-perjalanan' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">{status.replace('-', ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                Weight Distribution
              </h4>
              <div className="space-y-2">
                {Object.entries(reportData.details.weightDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium capitalize">{range.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
