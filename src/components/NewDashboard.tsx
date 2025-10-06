import React from 'react';
import { DeliveryNote } from '../types';
import { formatWeight } from '../utils/format';
import { PushNotificationManager } from './PushNotificationManager';
import { MainMenu } from './MainMenu';
import { SearchAndFilter } from './SearchAndFilter';
import { DeliveryNoteCard } from './DeliveryNoteCard';

interface DashboardStats {
  total: number;
  menunggu: number;
  dalamPerjalanan: number;
  selesai: number;
  totalWeight: number;
}

interface NewDashboardProps {
  stats: DashboardStats;
  activeStatus: string;
  onStatClick: (status: string) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  onPrintSuratJalan: () => void;
  onNavigateToPengiriman: () => void;
  notes: DeliveryNote[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEditNote: (note: DeliveryNote) => void;
  onDeleteNote: (id: string) => void;
  onAddWeight: (note: DeliveryNote) => void;
}

export const NewDashboard: React.FC<NewDashboardProps> = ({ 
  stats, 
  activeStatus, 
  onStatClick, 
  currentView, 
  onViewChange, 
  onPrintSuratJalan, 
  onNavigateToPengiriman,
  notes,
  searchTerm,
  onSearchChange,
  onEditNote,
  onDeleteNote,
  onAddWeight,
}) => {
  console.log('🆕 NewDashboard rendered with currentView:', currentView);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'menunggu': return 'bg-yellow-500';
      case 'dalam-perjalanan': return 'bg-blue-500';
      case 'selesai': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'menunggu': return 'Menunggu';
      case 'dalam-perjalanan': return 'Dalam Perjalanan';
      case 'selesai': return 'Selesai';
      default: return status;
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend.includes('+')) return 'text-green-600';
    if (trend.includes('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem Surat Jalan</h1>
          <p className="text-gray-600">PT Samudera Berkah Sentosa & CV Mulia Berkah Sentosa</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Server Online
          </div>
        </div>
      </div>

      {/* Main Menu - Hanya Menu Baru */}
      <MainMenu
        key={`main-menu-${currentView}`}
        currentView={currentView}
        onViewChange={onViewChange}
        onPrintSuratJalan={onPrintSuratJalan}
        onNavigateToPengiriman={onNavigateToPengiriman}
      />

      {/* Search & Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        statusFilter={activeStatus}
        onStatusFilterChange={onStatClick}
      />

      {/* Push Notification Manager */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Pengaturan Notifikasi</h2>
          <div className="text-sm text-gray-600">
            Kelola notifikasi realtime untuk update surat jalan
          </div>
        </div>
        <PushNotificationManager />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Pengiriman */}
        <div 
          className={`bg-white rounded-2xl shadow-xl border-2 cursor-pointer transition-all hover:scale-105 ${
            activeStatus === 'all' ? 'border-blue-500 shadow-blue-100' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onStatClick('all')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pengiriman</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${getTrendColor('Aktif +12%')}`}>
                Aktif +12%
              </span>
            </div>
          </div>
        </div>

        {/* Menunggu */}
        <div 
          className={`bg-white rounded-2xl shadow-xl border-2 cursor-pointer transition-all hover:scale-105 ${
            activeStatus === 'menunggu' ? 'border-yellow-500 shadow-yellow-100' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onStatClick('menunggu')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Menunggu</p>
                <p className="text-2xl font-bold text-gray-900">{stats.menunggu}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${getTrendColor('-5%')}`}>
                -5%
              </span>
            </div>
          </div>
        </div>

        {/* Dalam Perjalanan */}
        <div 
          className={`bg-white rounded-2xl shadow-xl border-2 cursor-pointer transition-all hover:scale-105 ${
            activeStatus === 'dalam-perjalanan' ? 'border-blue-500 shadow-blue-100' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onStatClick('dalam-perjalanan')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dalam Perjalanan</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dalamPerjalanan}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${getTrendColor('+8%')}`}>
                +8%
              </span>
            </div>
          </div>
        </div>

        {/* Selesai */}
        <div 
          className={`bg-white rounded-2xl shadow-xl border-2 cursor-pointer transition-all hover:scale-105 ${
            activeStatus === 'selesai' ? 'border-green-500 shadow-green-100' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onStatClick('selesai')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-gray-900">{stats.selesai}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${getTrendColor('+15%')}`}>
                +15%
              </span>
            </div>
          </div>
        </div>

        {/* Total Berat Bersih */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Berat Bersih</p>
                <p className="text-2xl font-bold text-gray-900">{formatWeight(stats.totalWeight)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${getTrendColor('+22%')}`}>
                +22%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Notes List (moved to bottom) */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Daftar Surat Jalan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes
            .filter(n =>
              (activeStatus === 'all' || n.status === (activeStatus as any)) &&
              (
                !searchTerm ||
                n.deliveryNoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.destination?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            )
            .map(note => (
              <DeliveryNoteCard
                key={note.id}
                note={note}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                onAddWeight={onAddWeight}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

