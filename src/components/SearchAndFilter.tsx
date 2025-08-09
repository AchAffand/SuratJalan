import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          placeholder="Cari berdasarkan nomor surat jalan, nama sopir, plat nomor, atau tujuan..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-gray-300 text-sm sm:text-base"
        />
      </div>
      
      <div className="relative">
        <Filter className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-8 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white hover:border-gray-300 font-medium text-sm sm:text-base"
        >
          <option value="all">🔍 Semua Status</option>
          <option value="menunggu">⏳ Menunggu</option>
          <option value="dalam-perjalanan">🚛 Dalam Perjalanan</option>
          <option value="selesai">✅ Selesai</option>
        </select>
      </div>
    </div>
  );
};