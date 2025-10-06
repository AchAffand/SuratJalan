import React, { useState } from 'react';
import { DeliveryNote } from '../types';
import { formatDateShort, formatWeight, getStatusIcon } from '../utils/format';
import { Edit, Trash2, Scale, MapPin, Truck, User, Calendar, FileText, MoreVertical, Hash, Building } from 'lucide-react';

interface DeliveryNoteCardProps {
  note: DeliveryNote;
  onEdit: (note: DeliveryNote) => void;
  onDelete: (id: string) => void;
  onAddWeight: (note: DeliveryNote) => void;
}

export const DeliveryNoteCard: React.FC<DeliveryNoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onAddWeight,
}) => {
  // Validate note data
  if (!note || !note.id || !note.deliveryNoteNumber) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Data surat jalan tidak valid</p>
        </div>
      </div>
    );
  }

  const canAddWeight = note.status === 'selesai';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 flex-shrink-0" />
              <h3 className="text-sm sm:text-lg font-bold text-white truncate">
                {note.deliveryNoteNumber || 'N/A'}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-2xl">{getStatusIcon(note.status || 'menunggu')}</span>
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                {note.status === 'menunggu' && 'Menunggu'}
                {note.status === 'dalam-perjalanan' && 'Dalam Perjalanan'}
                {note.status === 'selesai' && 'Selesai'}
                {!note.status && 'Menunggu'}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {canAddWeight && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddWeight(note);
                }}
                className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Input Berat Timbangan"
                type="button"
              >
                <Scale className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(note);
              }}
              className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Edit Surat Jalan"
              type="button"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-red-500/30 rounded-lg transition-colors"
              title="Hapus Surat Jalan"
              type="button"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Destination */}
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Tujuan</p>
              <p className="text-sm sm:text-base text-gray-900 font-medium truncate" title={note.destination || 'N/A'}>
                {note.destination || 'N/A'}
              </p>
            </div>
          </div>

          {/* PO Number */}
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg flex-shrink-0">
              <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Nomor PO</p>
              <p className="text-sm sm:text-base text-gray-900 font-mono font-bold truncate" title={note.poNumber || 'N/A'}>
                {note.poNumber || 'N/A'}
              </p>
            </div>
          </div>

        {/* Company */}
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0">
            <Building className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500">Perusahaan</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base text-blue-700 font-bold">
                {note.company === 'sbs' ? 'PT. SBS' : 
                 note.company === 'mbs' ? 'CV. MBS' : 
                 'Perorangan'}
              </span>
            </div>
          </div>
        </div>

        {/* Seal Status */}
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg flex-shrink-0">
            <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500">Seal</p>
            <div className="flex items-center space-x-2">
              {note.hasSeal ? (
                <div className="flex items-center space-x-1">
                  <span className="text-sm sm:text-base text-amber-700 font-bold">
                    {note.sealNumbers?.length || 0} Seal
                  </span>
                  {note.sealNumbers && note.sealNumbers.length > 0 && (
                    <span className="text-xs text-gray-500">
                      ({note.sealNumbers.join(', ')})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm sm:text-base text-gray-500 font-medium">
                  Tanpa Seal
                </span>
              )}
            </div>
          </div>
        </div>

          {/* Vehicle and Driver */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-orange-50 rounded-lg flex-shrink-0">
                <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Kendaraan</p>
                <p className="text-sm sm:text-base text-gray-900 font-mono font-bold">
                  {note.vehiclePlate || note.vehicleNumber || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg flex-shrink-0">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Sopir</p>
                <p className="text-sm sm:text-base text-gray-900 font-medium truncate">
                  {note.driverName || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Date and Weight */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                {formatDateShort(note.date || note.createdAt)}
              </span>
            </div>
            
            {note.netWeight ? (
              <div className="flex items-center space-x-1 sm:space-x-2 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full">
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                <span className="text-xs sm:text-sm font-bold text-emerald-700">
                  {formatWeight(note.netWeight)}
                </span>
              </div>
            ) : canAddWeight ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddWeight(note);
                }}
                className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 hover:bg-blue-100 px-2 sm:px-3 py-1 rounded-full transition-colors"
                type="button"
              >
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-blue-700">
                  Input Berat
                </span>
              </button>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 px-2 sm:px-3 py-1 rounded-full">
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-500">
                  Belum Selesai
                </span>
              </div>
            )}
          </div>


          {/* Notes */}
          {note.notes && (
            <div className="pt-2 sm:pt-3 border-t border-gray-100">
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <p className="text-xs sm:text-sm text-gray-600 italic leading-relaxed">
                  "{note.notes || 'Tidak ada catatan'}"
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};