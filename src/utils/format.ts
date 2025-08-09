export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatWeight = (weight: number): string => {
  return `${weight.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'menunggu':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'dalam-perjalanan':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'selesai':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'menunggu':
      return 'Menunggu';
    case 'dalam-perjalanan':
      return 'Dalam Perjalanan';
    case 'selesai':
      return 'Selesai';
    default:
      return status;
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'menunggu':
      return '⏳';
    case 'dalam-perjalanan':
      return '🚛';
    case 'selesai':
      return '✅';
    default:
      return '📋';
  }
};

export const shouldAutoUpdateStatus = (deliveryDate: string): boolean => {
  const today = new Date();
  const delivery = new Date(deliveryDate);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  delivery.setHours(0, 0, 0, 0);
  
  return delivery.getTime() <= today.getTime();
};