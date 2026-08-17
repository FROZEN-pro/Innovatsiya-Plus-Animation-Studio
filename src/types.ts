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
  showHeroBanner?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  footerText?: string;
  footerAbout?: string;
  supportEmail?: string;
  supportPhone?: string;
  socialTelegram?: string;
  socialYoutube?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialGithub?: string;
  dashboardLayout?: DashboardLayoutTheme;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ambientGlowDefault?: boolean;
  emptyVaultDesc?: string;
  noMediaDesc?: string;
  
  // VIP Subscription & Pricing Settings (Admin Managed)
  enableClick?: boolean;
  enablePayme?: boolean;
  enableGooglePay?: boolean;
  proPlanTitle?: string;
  proPlanPriceUzs?: string;
  proPlanPriceNum?: number;
  proPlanFeature1?: string;
  proPlanFeature2?: string;
  vipPlanTitle?: string;
  vipPlanPriceUzs?: string;
  vipPlanPriceNum?: number;
  vipPlanFeature1?: string;
  vipPlanFeature2?: string;
  vipYearlyTitle?: string;
  vipYearlyPriceUzs?: string;
  vipYearlyPriceNum?: number;
  vipYearlyDiscountBadge?: string;
  vipYearlyFeature1?: string;
  vipYearlyFeature2?: string;
  vipCurrency?: string;
  
  // Payment Integration Settings
  clickMerchantId?: string;
  clickServiceId?: string;
  clickSecretKey?: string;
  hasClickSecret?: boolean;
  paymeMerchantId?: string;
  paymeSecretKey?: string;
  hasPaymeSecret?: boolean;
  googlePayMerchantId?: string;
  googlePayGateway?: string;
  googlePayEnvironment?: 'TEST' | 'PRODUCTION';
}

export interface SupportMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string | null;
  senderRole: 'user' | 'admin';
  text: string;
  imageUrl?: string;
  createdAt: number;
  read?: boolean;
}

export interface SupportChat {
  id: string; // usually user.uid
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string | null;
  lastMessageText: string;
  lastMessageTime: number;
  lastSenderRole: 'user' | 'admin';
  status: 'open' | 'closed';
  unreadAdminCount: number;
  unreadUserCount: number;
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

export type AdminActionCategory = 'all' | 'content' | 'subscription' | 'settings' | 'users' | 'broadcast';

export interface AdminActivityLog {
  id: string;
  timestamp: number;
  adminEmail: string;
  adminUid: string;
  adminName?: string;
  actionType: 
    | 'CONTENT_CREATED' 
    | 'CONTENT_UPDATED' 
    | 'CONTENT_DELETED' 
    | 'CONTENT_BULK_UPDATED' 
    | 'CONTENT_BULK_DELETED' 
    | 'SUBSCRIPTION_PLAN_CHANGED' 
    | 'PAYMENT_GATEWAY_CHANGED' 
    | 'SETTINGS_UPDATED' 
    | 'USER_ROLE_CHANGED' 
    | 'USER_SUBSCRIPTION_CHANGED' 
    | 'USER_BANNED' 
    | 'BROADCAST_SENT' 
    | string;
  category: 'content' | 'subscription' | 'settings' | 'users' | 'broadcast';
  summary: string;
  details?: string;
  targetId?: string;
  targetName?: string;
  changes?: Record<string, { from?: any; to?: any }>;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

export interface SubscriptionEventRecord {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName?: string;
  planTier: SubscriptionTier;
  planTitle: string;
  amountUzs: number;
  paymentProvider: 'click' | 'payme' | 'gpay' | 'card' | 'admin_grant';
  status: 'active' | 'renewed' | 'cancelled' | 'expired';
  timestamp: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}


