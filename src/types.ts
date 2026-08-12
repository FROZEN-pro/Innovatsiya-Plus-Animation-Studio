export type Role = 'user' | 'admin';
export type SubscriptionTier = 'free' | 'pro' | 'vip';
export type SubscriptionStatus = 'active' | 'inactive' | 'banned' | 'trial';
export type ContentCategory = 'Animation' | '2D Video' | 'Short' | 'Music' | '3D Art' | 'Vault';
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ru' | 'uz';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
  subscriptionStatus: SubscriptionStatus;
  subscriptionTier?: SubscriptionTier;
  isBanned?: boolean;
  telegramUsername?: string;
  biometricEnabled?: boolean;
  language?: LanguageCode;
  createdAt?: string;
  lastLogin?: string;
  totalWatchTimeMinutes?: number;
}

export interface Video {
  id: string | number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: ContentCategory | string;
  views: number;
  likes?: number;
  duration?: string;
  isHd?: boolean;
  isEncrypted?: boolean;
  createdAt?: string;
  author?: string;
  tags?: string[];
  subtitles?: { lang: string; url: string }[];
  audioWaveformData?: number[];
}

export interface OfflineVaultItem {
  id: string;
  title: string;
  category: ContentCategory | string;
  thumbnailUrl: string;
  videoUrl?: string;
  downloadedAt: string;
  encryptedBlobKey?: string;
  encryptedBlobUrl?: string;
  fileSizeBytes?: number;
  fileSize?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  tier: SubscriptionTier;
  popular?: boolean;
}

export interface AnalyticsMetric {
  day: string;
  views: number;
  activeSubscribers: number;
  watchHours: number;
  bandwidthGb: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}


