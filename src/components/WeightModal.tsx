import React, { useState } from 'react';
import { Scale, Save, X, Truck, AlertTriangle } from 'lucide-react';

interface WeightModalProps {
  currentWeight?: number;
  deliveryNoteNumber: string;
  onSave: (weight: number) => void;
  onClose: () => void;
}

export const WeightModal: React.FC<WeightModalProps> = ({
  currentWeight,
  deliveryNoteNumber,
  onSave,
  onClose,
}) => {
  const [weight, setWeight] = useState(currentWeight?.toString() || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setError('Harap masukkan berat yang valid (lebih dari 0 kg)');
      return;
    }

    if (weightValue > 50000) {
      setError('Berat terlalu besar (maksimal 50,000 kg)');
      return;
    }

    onSave(weightValue);
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 sm:p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white">Input Berat Timbangan</h2>
                <p className="text-emerald-100 text-xs sm:text-sm truncate">
                  Surat Jalan: {deliveryNoteNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start space-x-3">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-800">
                Berat Bersih Kendaraan
              </p>
              <p className="text-xs sm:text-sm text-blue-600">
                Masukkan hasil timbangan kendaraan setelah pengiriman selesai
              </p>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Berat Bersih (kg) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="Contoh: 1500.50"
                className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base sm:text-lg font-mono ${
                  error ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                autoFocus
              />
              <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium text-sm sm:text-base">kg</span>
              </div>
            </div>
            
            {error && (
              <p className="mt-3 text-xs sm:text-sm text-red-600 flex items-center space-x-2">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
            
            <div className="mt-3 text-xs sm:text-sm text-gray-500 space-y-1">
              <p>• Masukkan berat dalam kilogram (kg)</p>
              <p>• Gunakan titik (.) untuk desimal</p>
              <p>• Contoh: 1500.50 untuk 1500,5 kg</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm sm:text-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Simpan Berat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};