export interface NotificationPreferences {
  categories: {
    delivery: boolean;
    system: boolean;
    financial: boolean;
    operational: boolean;
    maintenance: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean; // Future
    sms: boolean;   // Future
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  frequency: {
    maxPerHour: number;
    maxPerDay: number;
    batchSimilar: boolean;
  };
  advanced: {
    autoDismiss: boolean;
    autoDismissDelay: number; // seconds
    showPreview: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  categories: {
    delivery: true,
    system: true,
    financial: true,
    operational: true,
    maintenance: false,
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    critical: true,
  },
  channels: {
    inApp: true,
    push: true,
    email: false,
    sms: false,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    timezone: 'Asia/Jakarta',
  },
  frequency: {
    maxPerHour: 10,
    maxPerDay: 50,
    batchSimilar: true,
  },
  advanced: {
    autoDismiss: false,
    autoDismissDelay: 5,
    showPreview: true,
    soundEnabled: true,
    vibrationEnabled: true,
  },
};

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalDismissed: number;
  deliveryRate: number;
  clickRate: number;
  dismissRate: number;
  lastSent: string | null;
  categories: Record<string, {
    sent: number;
    delivered: number;
    clicked: number;
    dismissed: number;
  }>;
  hourlyDistribution: Record<string, number>;
  dailyDistribution: Record<string, number>;
}

export interface ScheduledNotification {
  id: string;
  scheduledFor: Date;
  notification: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  };
  recurring?: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}
