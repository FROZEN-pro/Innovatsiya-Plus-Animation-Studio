export type Role = 'user' | 'admin';
export type SubscriptionTier = 'free' | 'pro' | 'vip';
export type SubscriptionStatus = 'active' | 'inactive' | 'banned' | 'trial';
export type ContentCategory = 'Animation' | 'Dubbing' | '2D Video' | 'Short' | 'Music' | '3D Art' | 'Vault' | 'Favorites' | 'Premieres' | 'History';
export type LanguageCode = 'en' | 'ru' | 'uz';
export type VisibilityStatus = 'public' | 'unlisted' | 'vip_only' | 'draft' | 'archived';

export interface FavoriteItem {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  category?: string;
  createdAt: number;
}

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
  lastLoginAt?: number;
  loginCount?: number;
  totalWatchDurationSeconds?: number;
  totalWatchTimeMinutes?: number;
  lastActiveAt?: number;
  recentLoginDevice?: string;
  recentLoginMethod?: string;
}

export interface UserLoginLog {
  id: string;
  userId: string;
  timestamp: number;
  method: string;
  device?: string;
  userAgent?: string;
  ip?: string;
}

export interface UserWatchRecord {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  category?: string;
  progressSeconds: number;
  watchDurationSeconds: number;
  lastWatchedAt: number;
  completed: boolean;
  playCount?: number;
}

export interface UserActivityReport extends User {
  loginLogs?: UserLoginLog[];
  watchRecords?: UserWatchRecord[];
}

export type DashboardLayoutTheme = 'grid' | 'list' | 'cinematic';

export interface SubtitleTrack {
  id?: string;
  lang: string; // e.g. 'en', 'uz', 'ru', 'es'
  label: string; // e.g. 'English [CC]', 'O\'zbekcha [CC]'
  url: string; // VTT file URL or data URL
  content?: string; // Optional raw WebVTT content
}

export interface VideoQualityOption {
  quality: '4K' | '1080p' | '720p' | '480p' | '360p' | 'Auto';
  url: string;
  label?: string;
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
  visibility?: VisibilityStatus;
  createdAt?: string;
  author?: string;
  tags?: string[];
  subtitles?: SubtitleTrack[];
  qualities?: VideoQualityOption[];
  audioWaveformData?: number[];
  isPremiere?: boolean;
  premiereTime?: number | string;
  isLiveChatEnabled?: boolean;
  accentColor?: string;
}

export interface PremiereChatMessage {
  id: string;
  videoId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string | null;
  text: string;
  createdAt: number;
  isReaction?: boolean;
  reactionEmoji?: string;
}

export interface FloatingPlayerState {
  isOpen: boolean;
  video: Video | null;
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
}

export interface AppSettings {
  brandName?: string;
  brandTag?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  footerText?: string;
  dashboardLayout?: DashboardLayoutTheme;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ambientGlowDefault?: boolean;
  emptyVaultDesc?: string;
  noMediaDesc?: string;
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

export interface AppNotification {
  id: string;
  type: 'new_video' | 'announcement' | 'system';
  title: string;
  message: string;
  videoId?: string;
  videoTitle?: string;
  thumbnailUrl?: string;
  category?: string;
  author?: string;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}


