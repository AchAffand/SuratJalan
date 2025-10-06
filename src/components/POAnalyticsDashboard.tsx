import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Package, 
  Users, PieChart, Activity, Target, 
  Clock, AlertCircle, CheckCircle, X, Download
} from 'lucide-react';
import dayjs from '../lib/dayjs';

interface POAnalyticsDashboardProps {
  purchaseOrders: any[];
  deliveryNotes: any[];
  onExport: (reportData: any, format: string) => void;
}

interface POAnalyticsData {
  totalPOs: number;
  totalValue: number;
  activePOs: number;
  completedPOs: number;
  overduePOs: number;
  averagePOValue: number;
  totalTonnage: number;
  shippedTonnage: number;
  remainingTonnage: number;
  completionRate: number;
  monthlyTrends: Array<{ month: string; count: number; value: number; tonnage: number }>;
  statusDistribution: { [key: string]: number };
  productDistribution: { [key: string]: { count: number; value: number; tonnage: number } };
  buyerPerformance: Array<{ name: string; count: number; value: number; avgValue: number }>;
  deliveryTimeline: Array<{ date: string; delivered: number; pending: number }>;
  riskAnalysis: Array<{ po: any; risk: 'high' | 'medium' | 'low'; reason: string }>;
  profitAnalysis: Array<{ product: string; margin: number; totalProfit: number }>;
}

export const POAnalyticsDashboard: React.FC<POAnalyticsDashboardProps> = ({
  purchaseOrders,
  deliveryNotes,
  onExport
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | '1year' | 'all'>('30days');
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'performance' | 'risks' | 'profit'>('overview');
  const [showAlerts, setShowAlerts] = useState(true);

  const analyticsData = useMemo((): POAnalyticsData => {
    const now = dayjs();
    let filteredPOs = purchaseOrders;

    // Filter berdasarkan periode
    switch (selectedPeriod) {
      case '7days':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(7, 'day')));
        break;
      case '30days':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(30, 'day')));
        break;
      case '90days':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(90, 'day')));
        break;
      case '1year':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(1, 'year')));
        break;
    }

    // Basic stats
    const totalPOs = filteredPOs.length;
    const totalValue = filteredPOs.reduce((sum, po) => sum + (po.total_value || 0), 0);
    const activePOs = filteredPOs.filter(po => po.status === 'Aktif').length;
    const completedPOs = filteredPOs.filter(po => po.status === 'Selesai').length;
    const overduePOs = filteredPOs.filter(po => 
      po.status === 'Aktif' && dayjs(po.delivery_deadline).isBefore(now, 'day')
    ).length;

    const totalTonnage = filteredPOs.reduce((sum, po) => sum + (po.total_tonnage || 0), 0);
    const shippedTonnage = filteredPOs.reduce((sum, po) => sum + (po.shipped_tonnage || 0), 0);
    const remainingTonnage = filteredPOs.reduce((sum, po) => sum + (po.remaining_tonnage || 0), 0);

    // Monthly trends
    const monthlyStats = filteredPOs.reduce((acc, po) => {
      const month = dayjs(po.po_date).format('MMM YYYY');
      if (!acc[month]) {
        acc[month] = { count: 0, value: 0, tonnage: 0 };
      }
      acc[month].count++;
      acc[month].value += po.total_value || 0;
      acc[month].tonnage += po.total_tonnage || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number; tonnage: number }>);

    const monthlyTrends = Object.entries(monthlyStats)
      .map(([month, stats]) => ({ 
        month, 
        count: (stats as any).count, 
        value: (stats as any).value, 
        tonnage: (stats as any).tonnage 
      }))
      .sort((a, b) => dayjs(a.month, 'MMM YYYY').valueOf() - dayjs(b.month, 'MMM YYYY').valueOf());

    // Status distribution
    const statusDistribution = filteredPOs.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Product distribution
    const productStats = filteredPOs.reduce((acc, po) => {
      const product = po.product_type || 'Unknown';
      if (!acc[product]) {
        acc[product] = { count: 0, value: 0, tonnage: 0 };
      }
      acc[product].count++;
      acc[product].value += po.total_value || 0;
      acc[product].tonnage += po.total_tonnage || 0;
      return acc;
    }, {} as { [key: string]: { count: number; value: number; tonnage: number } });

    // Buyer performance
    const buyerStats = filteredPOs.reduce((acc, po) => {
      const buyer = po.buyer_name || 'Unknown';
      if (!acc[buyer]) {
        acc[buyer] = { count: 0, value: 0 };
      }
      acc[buyer].count++;
      acc[buyer].value += po.total_value || 0;
      return acc;
    }, {} as { [key: string]: { count: number; value: number } });

    const buyerPerformance = Object.entries(buyerStats)
      .map(([name, stats]) => ({
        name,
        count: (stats as any).count,
        value: (stats as any).value,
        avgValue: (stats as any).value / (stats as any).count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Delivery timeline (last 30 days)
    const deliveryTimeline = Array.from({ length: 30 }, (_, i) => {
      const date = now.subtract(i, 'day');
      const delivered = deliveryNotes.filter(note => 
        dayjs(note.date).isSame(date, 'day') && note.status === 'selesai'
      ).length;
      const pending = deliveryNotes.filter(note => 
        dayjs(note.date).isSame(date, 'day') && note.status !== 'selesai'
      ).length;
      return {
        date: date.format('MMM DD'),
        delivered,
        pending
      };
    }).reverse();

    // Risk analysis
    const riskAnalysis = filteredPOs
      .filter(po => po.status === 'Aktif')
      .map(po => {
        const daysToDeadline = dayjs(po.delivery_deadline).diff(now, 'day');
        const completionRate = (po.shipped_tonnage / po.total_tonnage) * 100;
        
        let risk: 'high' | 'medium' | 'low' = 'low';
        let reason = '';
        
        if (daysToDeadline < 0) {
          risk = 'high';
          reason = 'Sudah melewati deadline';
        } else if (daysToDeadline < 7 && completionRate < 50) {
          risk = 'high';
          reason = 'Deadline dekat dengan progress rendah';
        } else if (daysToDeadline < 14 && completionRate < 30) {
          risk = 'medium';
          reason = 'Progress lambat mendekati deadline';
        } else if (completionRate < 20) {
          risk = 'medium';
          reason = 'Progress sangat rendah';
        } else {
          risk = 'low';
          reason = 'Berjalan normal';
        }
        
        return { po, risk, reason };
      })
      .sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.risk] - riskOrder[a.risk];
      });

    // Profit analysis (simplified)
    const profitAnalysis = Object.entries(productStats).map(([product, stats]) => {
      // Simplified profit calculation - in real app, this would use actual cost data
      const statsValue = (stats as any).value;
      const estimatedCost = statsValue * 0.7; // Assume 30% margin
      const totalProfit = statsValue - estimatedCost;
      const margin = (totalProfit / statsValue) * 100;
      
      return {
        product,
        margin: Math.max(0, margin),
        totalProfit: Math.max(0, totalProfit)
      };
    }).sort((a, b) => b.totalProfit - a.totalProfit);

    return {
      totalPOs,
      totalValue,
      activePOs,
      completedPOs,
      overduePOs,
      averagePOValue: totalPOs > 0 ? totalValue / totalPOs : 0,
      totalTonnage,
      shippedTonnage,
      remainingTonnage,
      completionRate: totalTonnage > 0 ? (shippedTonnage / totalTonnage) * 100 : 0,
      monthlyTrends,
      statusDistribution,
      productDistribution: productStats,
      buyerPerformance,
      deliveryTimeline,
      riskAnalysis,
      profitAnalysis
    };
  }, [purchaseOrders, deliveryNotes, selectedPeriod]);

  const getRiskColor = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  const getRiskIcon = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatWeight = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} ton`;
    }
    return `${value.toFixed(0)} kg`;
  };

  const generateAnalyticsReport = () => {
    console.log('📊 Generating PO Analytics Report...');
    
    // Filter purchase orders based on selected period
    const now = dayjs();
    let filteredPOs = purchaseOrders;
    
    switch (selectedPeriod) {
      case '7days':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(7, 'day')));
        break;
      case '30days':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(30, 'day')));
        break;
      case '90days':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(90, 'day')));
        break;
      case '1year':
        filteredPOs = purchaseOrders.filter(po => dayjs(po.po_date).isAfter(now.subtract(1, 'year')));
        break;
    }

    const reportData = {
      metadata: {
        title: 'Laporan Dashboard Analitik PO',
        generatedAt: new Date().toISOString(),
        period: selectedPeriod,
        view: selectedView,
        companyInfo: {
          name: 'PT. SAMUDERA BERKAH SENTOSA',
          address: 'Jl. Raya Industri No. 123, Jakarta 12345',
          phone: '+62 21 1234 5678',
          email: 'info@samudera.com',
          website: 'www.samudera.com'
        }
      },
      purchaseOrders: filteredPOs,
      analytics: analyticsData,
      printableHTML: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PO Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .chart-section { margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Dashboard Analitik PO</h1>
            <p>Dibuat pada ${dayjs().format('DD/MM/YYYY HH:mm')} | Periode: ${selectedPeriod}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total PO</h3>
              <h2>${analyticsData.totalPOs}</h2>
            </div>
            <div class="stat-card">
              <h3>Total Nilai</h3>
              <h2>${formatCurrency(analyticsData.totalValue)}</h2>
            </div>
            <div class="stat-card">
              <h3>PO Aktif</h3>
              <h2>${analyticsData.activePOs}</h2>
            </div>
            <div class="stat-card">
              <h3>Tingkat Penyelesaian</h3>
              <h2>${analyticsData.completionRate.toFixed(1)}%</h2>
            </div>
          </div>
          
          <div class="chart-section">
            <h2>Tren Bulanan</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Jumlah PO</th>
                  <th>Total Nilai</th>
                  <th>Total Tonase</th>
                </tr>
              </thead>
              <tbody>
                ${analyticsData.monthlyTrends.map(trend => `
                  <tr>
                    <td>${trend.month}</td>
                    <td>${trend.count}</td>
                    <td>${formatCurrency(trend.value)}</td>
                    <td>${formatWeight(trend.tonnage)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `
    };

    console.log('📊 Calling onExport with data:', reportData);
    onExport(reportData, 'excel');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">PO Analytics Dashboard</h1>
              <p className="text-blue-100">Advanced analytics and insights for Purchase Orders</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50"
            >
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="90days">90 Hari Terakhir</option>
              <option value="1year">1 Tahun Terakhir</option>
              <option value="all">Semua Data</option>
            </select>
            <button
              onClick={generateAnalyticsReport}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2 font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'performance', label: 'Performance', icon: Target },
            { id: 'risks', label: 'Risk Analysis', icon: AlertCircle },
            { id: 'profit', label: 'Profit Analysis', icon: DollarSign }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                selectedView === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {showAlerts && analyticsData.riskAnalysis.filter(r => r.risk === 'high').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">High Risk PO Alert</h3>
                <p className="text-red-600">
                  {analyticsData.riskAnalysis.filter(r => r.risk === 'high').length} PO memerlukan perhatian segera
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAlerts(false)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total PO</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.totalPOs}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{analyticsData.activePOs} aktif
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalValue)}</p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Avg: {formatCurrency(analyticsData.averagePOValue)}
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
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.completionRate.toFixed(1)}%</p>
                  <p className="text-sm text-purple-600 flex items-center mt-1">
                    <Activity className="w-4 h-4 mr-1" />
                    {formatWeight(analyticsData.shippedTonnage)} / {formatWeight(analyticsData.totalTonnage)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue PO</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overduePOs}</p>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Perlu perhatian
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                Status Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(analyticsData.statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        status === 'Aktif' ? 'bg-green-500' :
                        status === 'Selesai' ? 'bg-blue-500' :
                        status === 'Sebagian' ? 'bg-yellow-500' :
                        status === 'Terlambat' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <span className="font-medium text-gray-900 capitalize">{status}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-600">
                        {((count / analyticsData.totalPOs) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Product Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(analyticsData.productDistribution).map(([product, stats]) => (
                  <div key={product} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full" />
                      <span className="font-medium text-gray-900">{product}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{stats.count} PO</p>
                      <p className="text-sm text-gray-600">{formatCurrency(stats.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {selectedView === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Monthly PO Trends
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tonnage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.monthlyTrends.map((trend) => (
                    <tr key={trend.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trend.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(trend.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatWeight(trend.tonnage)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(trend.value / trend.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {selectedView === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Top Buyers Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.buyerPerformance.map((buyer, index) => (
                    <tr key={buyer.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {buyer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {buyer.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(buyer.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(buyer.avgValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          #{index + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis Tab */}
      {selectedView === 'risks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Risk Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.riskAnalysis.map(({ po, risk, reason }) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {po.po_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {po.buyer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dayjs(po.delivery_deadline).format('DD/MM/YYYY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {((po.shipped_tonnage / po.total_tonnage) * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(risk)}`}>
                          {getRiskIcon(risk)}
                          <span className="ml-1 capitalize">{risk}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Profit Analysis Tab */}
      {selectedView === 'profit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Profit Analysis by Product
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimated Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.profitAnalysis.map((analysis) => (
                    <tr key={analysis.product} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {analysis.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(analysis.totalProfit / (1 - analysis.margin / 100))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(analysis.totalProfit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {analysis.margin.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                analysis.margin > 30 ? 'bg-green-500' :
                                analysis.margin > 20 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, analysis.margin)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            analysis.margin > 30 ? 'text-green-600' :
                            analysis.margin > 20 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {analysis.margin > 30 ? 'Excellent' :
                             analysis.margin > 20 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


