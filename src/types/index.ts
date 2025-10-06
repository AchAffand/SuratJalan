export interface DeliveryNote {
  id: string;
  date: string;
  vehiclePlate: string;
  driverName: string;
  deliveryNoteNumber: string;
  poNumber: string | null; // Boleh null jika tanpa PO
  destination: string;
  netWeight?: number;
  status: 'menunggu' | 'dalam-perjalanan' | 'selesai';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  // Seal system
  hasSeal: boolean;
  sealNumbers?: string[]; // Array of seal numbers like ["123", "456", "789"]
  // Company variant
  company: 'sbs' | 'mbs' | 'perorangan';
}

export interface DeliveryStats {
  total: number;
  menunggu: number;
  dalamPerjalanan: number;
  selesai: number;
  totalWeight: number;
}

// Enhanced notification types
export interface EnhancedNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'delivery' | 'system' | 'financial' | 'operational' | 'maintenance';
  actionUrl?: string;
  metadata?: any;
  isBatch?: boolean;
  batchCount?: number;
  batchItems?: EnhancedNotification[];
}

// Real-time event types
export interface RealtimeEvent {
  type: string;
  new?: any;
  old?: any;
  at: number;
  metadata?: {
    table: string;
    schema: string;
    commit_timestamp: string;
    id: string;
  };
}