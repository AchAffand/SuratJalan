import React, { useState, useMemo } from 'react';
import { DeliveryNote } from '../types';
import { formatWeight, formatCurrency } from '../utils/format';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Calendar, MapPin, Truck, Users, BarChart3, 
  PieChart, Activity, Target, Award, Clock,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import dayjs from 'dayjs';

interface AnalyticsDashboardProps {
  notes: DeliveryNote[];
  purchaseOrders: any[];
}

interface AnalyticsData {
  totalDeliveries: number;
  totalWeight: number;
  totalRevenue: number;
  averageDeliveryPerDay: number;
  topDestinations: Array<{ name: string; count: number; weight: number }>;
  monthlyTrends: Array<{ month: string; deliveries: number; weight: number }>;
  vehicleUtilization: Array<{ plate: string; trips: number; totalWeight: number }>;
  driverPerformance: Array<{ name: string; trips: number; totalWeight: number; avgWeight: number }>;
  statusDistribution: { menunggu: number; dalamPerjalanan: number; selesai: number };
  weightDistribution: { under1Ton: number; oneToFiveTon: number; overFiveTon: number };
  onTimeDelivery: number;
  delayedDelivery: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ notes, purchaseOrders }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'comparison'>('overview');

  const analyticsData = useMemo((): AnalyticsData => {
    const now = dayjs();
    let filteredNotes = notes;

    // Filter berdasarkan periode
    switch (selectedPeriod) {
      case '7days':
        filteredNotes = notes.filter(n => dayjs(n.date).isAfter(now.subtract(7, 'day')));
        break;
      case '30days':
        filteredNotes = notes.filter(n => dayjs(n.date).isAfter(now.subtract(30, 'day')));
        break;
      case '90days':
        filteredNotes = notes.filter(n => dayjs(n.date).isAfter(now.subtract(90, 'day')));
        break;
      case '1year':
        filteredNotes = notes.filter(n => dayjs(n.date).isAfter(now.subtract(1, 'year')));
        break;
    }

    // Hitung total deliveries dan weight
    const totalDeliveries = filteredNotes.length;
    const totalWeight = filteredNotes.reduce((sum, n) => sum + (n.netWeight || 0), 0);

    // Hitung revenue (estimasi berdasarkan PO)
    const totalRevenue = filteredNotes.reduce((sum, n) => {
      if (n.poNumber) {
        const po = purchaseOrders.find(p => p.po_number === n.poNumber);
        if (po && n.netWeight) {
          return sum + (n.netWeight * po.price_per_ton);
        }
      }
      return sum;
    }, 0);

    // Top destinations
    const destinationStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.destination]) {
        acc[n.destination] = { count: 0, weight: 0 };
      }
      acc[n.destination].count++;
      acc[n.destination].weight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { count: number; weight: number }>);

    const topDestinations = Object.entries(destinationStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly trends
    const monthlyStats = filteredNotes.reduce((acc, n) => {
      const month = dayjs(n.date).format('MMM YYYY');
      if (!acc[month]) {
        acc[month] = { deliveries: 0, weight: 0 };
      }
      acc[month].deliveries++;
      acc[month].weight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { deliveries: number; weight: number }>);

    const monthlyTrends = Object.entries(monthlyStats)
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => dayjs(a.month, 'MMM YYYY').valueOf() - dayjs(b.month, 'MMM YYYY').valueOf());

    // Vehicle utilization
    const vehicleStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.vehiclePlate]) {
        acc[n.vehiclePlate] = { trips: 0, totalWeight: 0 };
      }
      acc[n.vehiclePlate].trips++;
      acc[n.vehiclePlate].totalWeight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { trips: number; totalWeight: number }>);

    const vehicleUtilization = Object.entries(vehicleStats)
      .map(([plate, stats]) => ({ plate, ...stats }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10);

    // Driver performance
    const driverStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.driverName]) {
        acc[n.driverName] = { trips: 0, totalWeight: 0 };
      }
      acc[n.driverName].trips++;
      acc[n.driverName].totalWeight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { trips: number; totalWeight: number }>);

    const driverPerformance = Object.entries(driverStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        avgWeight: stats.totalWeight / stats.trips
      }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10);

    // Status distribution
    const statusDistribution = {
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

    // On-time delivery calculation (simplified)
    const onTimeDelivery = filteredNotes.filter(n => n.status === 'selesai').length;
    const delayedDelivery = filteredNotes.filter(n => n.status === 'dalam-perjalanan').length;

    const averageDeliveryPerDay = totalDeliveries / Math.max(1, dayjs().diff(dayjs(filteredNotes[0]?.date || now), 'day'));

    return {
      totalDeliveries,
      totalWeight,
      totalRevenue,
      averageDeliveryPerDay,
      topDestinations,
      monthlyTrends,
      vehicleUtilization,
      driverPerformance,
      statusDistribution,
      weightDistribution,
      onTimeDelivery,
      delayedDelivery,
    };
  }, [notes, purchaseOrders, selectedPeriod]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (current < previous) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['overview', 'detailed', 'comparison'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedView === view
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalDeliveries}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% from last period
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
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="text-2xl font-bold text-gray-900">{formatWeight(analyticsData.totalWeight)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8.3% from last period
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15.2% from last period
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Daily Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.averageDeliveryPerDay.toFixed(1)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5.7% from last period
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      {selectedView === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Destinations */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Top Destinations
            </h3>
            <div className="space-y-3">
              {analyticsData.topDestinations.map((dest, index) => (
                <div key={dest.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dest.name}</p>
                      <p className="text-sm text-gray-600">{dest.count} deliveries</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatWeight(dest.weight)}</p>
                    <p className="text-sm text-gray-600">{((dest.weight / analyticsData.totalWeight) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Utilization */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-green-600" />
              Vehicle Utilization
            </h3>
            <div className="space-y-3">
              {analyticsData.vehicleUtilization.map((vehicle, index) => (
                <div key={vehicle.plate} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-mono font-medium text-gray-900">{vehicle.plate}</p>
                      <p className="text-sm text-gray-600">{vehicle.trips} trips</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatWeight(vehicle.totalWeight)}</p>
                    <p className="text-sm text-gray-600">{(vehicle.totalWeight / vehicle.trips).toFixed(0)} kg/trip</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Driver Performance
            </h3>
            <div className="space-y-3">
              {analyticsData.driverPerformance.map((driver, index) => (
                <div key={driver.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.trips} trips</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatWeight(driver.totalWeight)}</p>
                    <p className="text-sm text-gray-600">Avg: {formatWeight(driver.avgWeight)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-orange-600" />
              Status Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(analyticsData.statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      status === 'menunggu' ? 'bg-amber-500' :
                      status === 'dalam-perjalanan' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <span className="font-medium text-gray-900 capitalize">{status.replace('-', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600">
                      {((count / analyticsData.totalDeliveries) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Trends Chart */}
      {selectedView === 'comparison' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
            Monthly Trends
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Deliveries per Month</h4>
              <div className="space-y-3">
                {analyticsData.monthlyTrends.map((trend, index) => (
                  <div key={trend.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{trend.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(trend.deliveries / Math.max(...analyticsData.monthlyTrends.map(t => t.deliveries))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{trend.deliveries}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Weight per Month</h4>
              <div className="space-y-3">
                {analyticsData.monthlyTrends.map((trend, index) => (
                  <div key={trend.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{trend.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(trend.weight / Math.max(...analyticsData.monthlyTrends.map(t => t.weight))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatWeight(trend.weight)}</span>
                    </div>
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
