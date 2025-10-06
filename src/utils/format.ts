export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return 'Tanggal tidak tersedia';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Tanggal tidak valid';
    }
    
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Tanggal tidak valid';
  }
};

export const formatDateShort = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date short:', error);
    return 'N/A';
  }
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'N/A';
  }
};

export const formatWeight = (weight: number | undefined | null): string => {
  if (weight === undefined || weight === null || isNaN(weight)) {
    return '0 kg';
  }
  return `${weight.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`;
};

export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rp 0';
  }
  
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return 'Rp 0';
  }
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

// Removed shouldAutoUpdateStatus - status updates now only happen when printing