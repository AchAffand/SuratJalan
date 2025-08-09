import React from 'react';
import { DeliveryStats } from '../types';
import { formatWeight } from '../utils/format';
import { Truck, Package, CheckCircle, Clock, Scale, TrendingUp } from 'lucide-react';

interface DashboardProps {
  stats: DeliveryStats;
  activeStatus?: string;
  onStatClick?: (status: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, activeStatus = 'all', onStatClick }) => {
  const statCards = [
    {
      title: 'Total Pengiriman',
      value: stats.total,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      change: '+12%',
      changeColor: 'text-green-600',
      status: 'all',
      interactive: true,
    },
    {
      title: 'Menunggu',
      value: stats.menunggu,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      iconBg: 'bg-amber-500',
      change: '-5%',
      changeColor: 'text-green-600',
      status: 'menunggu',
      interactive: true,
    },
    {
      title: 'Dalam Perjalanan',
      value: stats.dalamPerjalanan,
      icon: Truck,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      change: '+8%',
      changeColor: 'text-green-600',
      status: 'dalam-perjalanan', // perbaiki dari 'dalam perjalanan'
      interactive: true,
    },
    {
      title: 'Selesai',
      value: stats.selesai,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-500',
      change: '+15%',
      changeColor: 'text-green-600',
      status: 'selesai',
      interactive: true,
    },
    {
      title: 'Total Berat Bersih',
      value: stats.totalWeight > 0 ? formatWeight(stats.totalWeight) : '0 kg',
      icon: Scale,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500',
      span: 'sm:col-span-2 lg:col-span-1',
      change: '+22%',
      changeColor: 'text-green-600',
      interactive: false,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => {
          const isActive = stat.status === activeStatus;
          return (
            <div
              key={index}
              className={`relative group ${stat.span || ''} ${stat.bgColor} rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/20 shadow-lg backdrop-blur-sm transition-all duration-300
                ${stat.interactive ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-blue-300 active:scale-100' : ''}
                ${isActive ? 'ring-4 ring-blue-400 border-blue-400 z-10' : ''}
              `}
              onClick={stat.interactive && onStatClick ? () => onStatClick(stat.status || '') : undefined}
              tabIndex={stat.interactive ? 0 : -1}
              aria-pressed={isActive}
              title={stat.interactive ? `Tampilkan ${stat.title}` : undefined}
              style={{ outline: 'none' }}
            >
              {stat.interactive && (
                <span className={`absolute top-2 right-2 text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-300'} transition-colors`}>
                  {isActive ? 'Aktif' : ''}
                </span>
              )}
              <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                <div className={`${stat.iconBg} p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl shadow-lg`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="hidden sm:flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className={`text-xs sm:text-sm font-medium ${stat.changeColor}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};