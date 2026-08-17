import { LanguageCode } from '../types';

export const languages: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  uz: {
    brandName: "Innovation Plus",
    tagline: "Ijodiy Media Uchun Reklamasiz Shaxsiy Striming Platformasi",
    searchPlaceholder: "Animatsiyalar, dublyaj, 2D videolar, shortslar, musiqalarni qidirish...",
    navHome: "Bosh sahifa",
    navAnimations: "Animatsiyalar",
    navDubbing: "Dublyaj",
    navShorts: "Shortslar",
    navMusic: "Musiqa va Audio",
    navOfflineVault: "Oflayn Xotira",
    navAdmin: "Admin Studiya",
    navFavorites: "Saralanganlar",
    navHistory: "Tomosha Tarixi",
    navProfile: "Profil",
    navSupport: "Yordam & Chat",
    navNotifications: "Bildirishnomalar",
    
    // Categories
    catAll: "Barchasi",
    catAnimation: "Animatsiya",
    catDubbing: "Dublyaj",
    cat2DVideo: "2D Video",
    catShorts: "Shortslar",
    catMusic: "Musiqa & Audio",
    catMasterclass: "Masterclass",
    
    // Sort & Filters
    sortLatest: "Eng yangi",
    sortPopular: "Eng mashhur",
    sortMostViewed: "Ko'p ko'rilgan",
    filter4KOnly: "Faqat 4K Ultra HD",
    filterDubbed: "O'zbekcha dublyaj",
    filterSubtitled: "Subtitrli",

    // Hero & Home
    heroTitle: "Shaxsiy Yuqori Sifatli Ijodiy Hub",
    heroSubtitle: "Animatsiyalar, dublyajlar, 2D videolar va musiqalarni shifrlangan hamda reklamasiz muhitda tomosha qiling.",
    watchNow: "Hozir Tomosha Qilish",
    downloadOffline: "Oflayn Saqlash",
    downloading: "Shifrlanmoqda va Yuklanmoqda...",
    downloaded: "Xotiraga Saqlandi",
    recentAdditions: "Saralangan va Yangi Medialar",
    noContent: "Hozircha Media Kontent Yo'q",
    uploadFirst: "Video, animatsiya yoki musiqalarni yuklash uchun Admin Studiyadan foydalaning.",
    views: "marta ko'rildi",
    duration: "Davomiyligi",
    category: "Kategoriya",
    playStream: "Ijro Etish",
    resumePlayback: "Davom ettirish",
    details: "Tafsilotlar",
    similarVideos: "O'xshash videolar",
    comments: "Fikr-mulohazalar",
    addComment: "Fikr qoldirish...",
    postComment: "Yuborish",
    noComments: "Hozircha hech qanday fikr yo'q. Birinchi bo'lib fikr bildiring!",
    like: "Yoqdi",
    share: "Ulashish",
    copiedLink: "Havola nusxalandi!",

    // Player Controls
    playerQuality: "Sifat",
    playerSpeed: "Tezlik",
    playerSubtitles: "Subtitrlar",
    playerSubtitlesOff: "O'chirilgan",
    playerTheaterMode: "Kengaytirilgan rejim",
    playerFullScreen: "To'liq ekran",
    playerPictureInPicture: "Kichik oyna (PiP)",
    playerAutoPlayNext: "Avtomatik keyingi ijro",

    // Offline & Network
    offlineModeActive: "Oflayn rejim faol",
    offlineNoticeDesc: "Internet aloqasi uzildi. Faqat keshdagi va oflayn xotiradagi videolar mavjud.",
    onlineRestored: "Internet aloqasi tiklandi",
    offlineVaultTitle: "Shifrlangan Oflayn Xotirangiz",
    offlineVaultDesc: "Internet ulanishisiz yuklab olingan medialarni tomosha qiling (AES-256 shifrlash).",
    clearVault: "Xotirani Tozalash",
    emptyVault: "Oflayn xotirangiz bo'sh. Videolarni saqlab internet yo'qligida ham tomosha qiling.",

    // Favorites & History
    favoritesTitle: "Saralanganlar va Xatcho'plar",
    favoritesDesc: "Saqlab qo'yilgan video, animatsiya va musiqalaringizga tezkor kirish.",
    emptyFavorites: "Hozircha hech qanday video saralanmagan. Istalgan videodagi yulduzcha yoki xatcho'p tugmasini bosib saqlab qo'ying!",
    savedToFavorites: "Saralanganlarga qo'shildi",
    removedFromFavorites: "Saralanganlardan o'chirildi",
    watchHistoryTitle: "Tomosha Tarixi",
    watchHistoryDesc: "Barcha ko'rilgan videolar, dublyajlar va qolgan joyidan davom ettirish ro'yxati.",
    emptyHistory: "Hozircha tomosha tarixingiz bo'sh. Istalgan videoni tomosha qiling va bu yerda davom ettiring!",
    clearHistory: "Tarixni tozalash",
    historyCleared: "Tomosha tarixi tozalandi.",

    // VIP Subscription
    subscriptionPlan: "VIP Obuna",
    upgradePlan: "VIP ga O'tish",
    vipModalTitle: "VIP Imkoniyatlari",
    vipModalSubtitle: "4K HDR, cheksiz oflayn xotira va reklamasiz oqim",
    selectPayment: "To'lov tizimini tanlang (Click, Payme, Google Pay)",
    securePayment: "Shifrlangan xavfsiz to'lov",
    activeSub: "VIP Faol",
    inactiveSub: "Obuna Nofaol",

    // Profile & Auth
    profileSettings: "Profil Sozlamalari",
    editProfile: "Profilni Tahrirlash",
    signInTelegram: "Telegram orqali kirish",
    signInGoogle: "Google orqali kirish",
    signInEmail: "Email va Parol",
    signOut: "Chiqish",
    highContrast: "Yuqori Kontrast",
    textSize: "Matn Hajmi",
    biometricPass: "Biometrik Kirish",
    installApp: "Web APK O'rnatish",
    privacyEncrypted: "Shifrlangan Xavfsizlik Faol",
    accessibility: "Qulaylik Asboblari",

    // Admin & Studio
    adminDashboard: "Innovation Plus Studio - Boshqaruv Paneli",
    realtimeAnalytics: "Real Vaqtdagi Analitika",
    exportSheets: "Google Sheets-ga Eksport Qilish",
    uploadMedia: "Yangi Media Yuklash",
    manageUsers: "A'zolar va Obunalarni Boshqarish",
    banUser: "Foydalanuvchini Bloklash",
    unbanUser: "Blokdan Chiqarish",
    promoteAdmin: "Admin Huquqini Berish",
    demoteAdmin: "Adminlikni Bekor Qilish",
    generateGemini: "Gemini 3.7 Flash Bilan Tavsif Yaratish",
    geminiGenerating: "Gemini 3.7 Flash AI Tahlil Qilmoqda...",
    systemIntegrations: "Tizim Infratuzilmasi va Bulutli Sinxronizatsiya",
  },
  ru: {
    brandName: "Innovation Plus",
    tagline: "Приватный Стриминг Без Рекламы для Креативного Контента",
    searchPlaceholder: "Поиск анимаций, 2D видео, дубляжа, шортсов, музыки...",
    navHome: "Главная",
    navAnimations: "Анимации",
    navDubbing: "Дубляж",
    navShorts: "Шортсы",
    navMusic: "Музыка и Аудио",
    navOfflineVault: "Офлайн Хранилище",
    navAdmin: "Студия Управления",
    navFavorites: "Избранное",
    navHistory: "История Просмотров",
    navProfile: "Профиль",
    navSupport: "Поддержка и Чат",
    navNotifications: "Уведомления",

    // Categories
    catAll: "Все",
    catAnimation: "Анимация",
    catDubbing: "Дубляж",
    cat2DVideo: "2D Видео",
    catShorts: "Шортсы",
    catMusic: "Музыка и Аудио",
    catMasterclass: "Мастер-классы",

    // Sort & Filters
    sortLatest: "Новые",
    sortPopular: "Популярные",
    sortMostViewed: "Много просмотров",
    filter4KOnly: "Только 4K Ultra HD",
    filterDubbed: "Дублированные",
    filterSubtitled: "С субтитрами",

    // Hero & Home
    heroTitle: "Приватный HD Креативный Стриминг",
    heroSubtitle: "Смотрите анимации, дубляж, 2D ролики, короткие видео и слушайте музыку в защищенной среде без рекламы.",
    watchNow: "Смотреть Сейчас",
    downloadOffline: "Скачать Офлайн",
    downloading: "Шифрование и Загрузка...",
    downloaded: "Сохранено в Хранилище",
    recentAdditions: "Рекомендуемые и Новые Релизы",
    noContent: "Контент Пока Отсутствует",
    uploadFirst: "Используйте Студию Управления для загрузки видео и музыки.",
    views: "просмотров",
    duration: "Длительность",
    category: "Категория",
    playStream: "Воспроизвести",
    resumePlayback: "Продолжить",
    details: "Детали",
    similarVideos: "Похожие видео",
    comments: "Комментарии",
    addComment: "Оставить комментарий...",
    postComment: "Отправить",
    noComments: "Комментариев пока нет. Будьте первым!",
    like: "Нравится",
    share: "Поделиться",
    copiedLink: "Ссылка скопирована!",

    // Player Controls
    playerQuality: "Качество",
    playerSpeed: "Скорость",
    playerSubtitles: "Субтитры",
    playerSubtitlesOff: "Выключены",
    playerTheaterMode: "Режим кинотеатра",
    playerFullScreen: "Во весь экран",
    playerPictureInPicture: "Картинка в картинке",
    playerAutoPlayNext: "Автовоспроизведение следующего",

    // Offline & Network
    offlineModeActive: "Офлайн режим активен",
    offlineNoticeDesc: "Подключение к сети отсутствует. Доступны только кэшированные и офлайн медиа.",
    onlineRestored: "Соединение восстановлено",
    offlineVaultTitle: "Зашифрованное Офлайн Хранилище",
    offlineVaultDesc: "Смотрите скачанные видео и музыку без подключения к интернету (AES-256).",
    clearVault: "Очистить Хранилище",
    emptyVault: "Ваше офлайн хранилище пусто. Скачайте медиа для просмотра без интернета.",

    // Favorites & History
    favoritesTitle: "Избранное и Закладки",
    favoritesDesc: "Быстрый доступ к сохраненным видео, анимациям и музыке.",
    emptyFavorites: "У вас пока нет сохраненных видео. Нажмите значок звезды или закладки на любом видео, чтобы сохранить его здесь!",
    savedToFavorites: "Добавлено в избранное",
    removedFromFavorites: "Удалено из избранного",
    watchHistoryTitle: "История Просмотров",
    watchHistoryDesc: "Продолжайте просмотр ваших любимых видео, дубляжа и стримов.",
    emptyHistory: "История просмотров пуста. Начните просмотр любого видео, чтобы продолжить здесь!",
    clearHistory: "Очистить историю",
    historyCleared: "История просмотров очищена.",

    // VIP Subscription
    subscriptionPlan: "VIP Подписчик",
    upgradePlan: "Оформить VIP",
    vipModalTitle: "Преимущества VIP",
    vipModalSubtitle: "4K HDR, бесконечное офлайн хранилище и просмотр без рекламы",
    selectPayment: "Выберите платежную систему (Click, Payme, Google Pay)",
    securePayment: "Защищенный зашифрованный платеж",
    activeSub: "VIP Активен",
    inactiveSub: "Неактивен",

    // Profile & Auth
    profileSettings: "Настройки Профиля",
    editProfile: "Редактировать Профиль",
    signInTelegram: "Войти через Telegram",
    signInGoogle: "Войти через Google",
    signInEmail: "Email и Пароль",
    signOut: "Выйти",
    highContrast: "Высокий Контраст",
    textSize: "Размер Текста",
    biometricPass: "Биометрический Вход",
    installApp: "Установить Web APK",
    privacyEncrypted: "Сквозное Шифрование Активно",
    accessibility: "Инструменты Доступности",

    // Admin & Studio
    adminDashboard: "Innovation Plus Studio - Главная Панель",
    realtimeAnalytics: "Аналитика в Реальном Времени",
    exportSheets: "Экспорт в Google Таблицы",
    uploadMedia: "Загрузить Новый Контент",
    manageUsers: "Управление Пользователями и Подписками",
    banUser: "Заблокировать",
    unbanUser: "Разблокировать",
    promoteAdmin: "Назначить Админом",
    demoteAdmin: "Снять Админа",
    generateGemini: "Сгенерировать Описание через Gemini",
    geminiGenerating: "Gemini AI Анализирует...",
    systemIntegrations: "Инфраструктура Системы и Синхронизация",
  },
  en: {
    brandName: "Innovation Plus",
    tagline: "Private Ad-Free Streaming for Creative Media",
    searchPlaceholder: "Search animations, 2D videos, shorts, music...",
    navHome: "Home",
    navAnimations: "Animations",
    navDubbing: "Dubbing",
    navShorts: "Shorts",
    navMusic: "Music & Audio",
    navOfflineVault: "Offline Vault",
    navAdmin: "Admin Studio",
    navFavorites: "Favorites",
    navHistory: "Watch History",
    navProfile: "Profile",
    navSupport: "Support & Chat",
    navNotifications: "Notifications",

    // Categories
    catAll: "All",
    catAnimation: "Animation",
    catDubbing: "Dubbing",
    cat2DVideo: "2D Video",
    catShorts: "Shorts",
    catMusic: "Music & Audio",
    catMasterclass: "Masterclasses",

    // Sort & Filters
    sortLatest: "Latest",
    sortPopular: "Popular",
    sortMostViewed: "Most Viewed",
    filter4KOnly: "4K Ultra HD Only",
    filterDubbed: "Dubbed Content",
    filterSubtitled: "With Subtitles",

    // Hero & Home
    heroTitle: "Private High-Definition Creative Hub",
    heroSubtitle: "Stream animations, 2D art, immersive shorts, and original spatial audio in an encrypted, ad-free environment.",
    watchNow: "Watch Stream",
    downloadOffline: "Save Offline",
    downloading: "Encrypting & Downloading...",
    downloaded: "Saved to Vault",
    recentAdditions: "Featured & Recent Releases",
    noContent: "No Media Content Available Yet",
    uploadFirst: "Use Admin Studio to upload creative videos, music, and animations.",
    views: "views",
    duration: "Duration",
    category: "Category",
    playStream: "Play Stream",
    resumePlayback: "Resume Stream",
    details: "Details",
    similarVideos: "Related Media",
    comments: "Comments & Discussions",
    addComment: "Leave a comment...",
    postComment: "Send",
    noComments: "No comments yet. Be the first to share your thoughts!",
    like: "Like",
    share: "Share",
    copiedLink: "Link copied to clipboard!",

    // Player Controls
    playerQuality: "Quality",
    playerSpeed: "Speed",
    playerSubtitles: "Subtitles",
    playerSubtitlesOff: "Off",
    playerTheaterMode: "Theater Mode",
    playerFullScreen: "Fullscreen",
    playerPictureInPicture: "Picture-in-Picture",
    playerAutoPlayNext: "Autoplay Next",

    // Offline & Network
    offlineModeActive: "Offline Mode Active",
    offlineNoticeDesc: "No internet connection detected. Only cached and downloaded media are available.",
    onlineRestored: "Connection Restored",
    offlineVaultTitle: "Your Encrypted Offline Vault",
    offlineVaultDesc: "Watch downloaded content without internet access. Fully encrypted with AES-256.",
    clearVault: "Clear Vault",
    emptyVault: "Your offline vault is empty. Download videos or music to watch offline.",

    // Favorites & History
    favoritesTitle: "Favorites & Bookmarks",
    favoritesDesc: "Quickly access your saved videos, animations, and sound tracks.",
    emptyFavorites: "You haven't bookmarked any favorite content yet. Click the star or bookmark button on any video to save it here!",
    savedToFavorites: "Added to Favorites",
    removedFromFavorites: "Removed from Favorites",
    watchHistoryTitle: "Watch History & Activity",
    watchHistoryDesc: "Resume watching your recently streamed animations, dubbing releases, and music.",
    emptyHistory: "Your watch history is currently empty. Start streaming any media to track your progress here!",
    clearHistory: "Clear Watch History",
    historyCleared: "Watch history has been cleared.",

    // VIP Subscription
    subscriptionPlan: "VIP Subscriber",
    upgradePlan: "Upgrade to VIP",
    vipModalTitle: "VIP Membership Access",
    vipModalSubtitle: "4K HDR, unlimited offline vault and ad-free streaming",
    selectPayment: "Select payment method (Click, Payme, Google Pay)",
    securePayment: "Encrypted Secure Payment",
    activeSub: "Active VIP",
    inactiveSub: "Inactive Plan",

    // Profile & Auth
    profileSettings: "Profile Settings",
    editProfile: "Edit Profile",
    signInTelegram: "Sign in with Telegram",
    signInGoogle: "Sign in with Google",
    signInEmail: "Email & Password",
    signOut: "Sign Out",
    highContrast: "High Contrast",
    textSize: "Text Size",
    biometricPass: "Biometric Quick Pass",
    installApp: "Install Web APK",
    privacyEncrypted: "End-to-End Tokenized Encryption Active",
    accessibility: "Accessibility Tools",

    // Admin & Studio
    adminDashboard: "Innovation Plus Studio - Master Control",
    realtimeAnalytics: "Real-time Engagement & Bandwidth",
    exportSheets: "Export to Google Sheets",
    uploadMedia: "Upload New Creative Media",
    manageUsers: "Member & Subscription Management",
    banUser: "Ban Member",
    unbanUser: "Unban Member",
    promoteAdmin: "Grant Admin",
    demoteAdmin: "Revoke Admin",
    generateGemini: "AI Auto-Generate Description",
    geminiGenerating: "Gemini AI Analyzing...",
    systemIntegrations: "System Infrastructure & Cloud Sync",
  }
};

export const getTranslation = (lang: LanguageCode, key: string): string => {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
};

// Helper: Translate category labels across languages while leaving content title untouched
export const formatCategoryLabel = (category: string, lang: LanguageCode): string => {
  if (!category) return '';
  const catLower = category.toLowerCase().trim();
  
  if (catLower.includes('anim')) return getTranslation(lang, 'catAnimation');
  if (catLower.includes('dub')) return getTranslation(lang, 'catDubbing');
  if (catLower.includes('2d')) return getTranslation(lang, 'cat2DVideo');
  if (catLower.includes('short')) return getTranslation(lang, 'catShorts');
  if (catLower.includes('music') || catLower.includes('audio') || catLower.includes('musiqa')) return getTranslation(lang, 'catMusic');
  if (catLower.includes('master') || catLower.includes('dars')) return getTranslation(lang, 'catMasterclass');
  
  return category;
};

// Helper: Format relative time in chosen language (e.g. 5 daqiqa oldin / 5 минут назад / 5 mins ago)
export const formatTimeAgo = (timestamp: number | string | Date, lang: LanguageCode): string => {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 60) {
    if (lang === 'uz') return 'hozirgina';
    if (lang === 'ru') return 'только что';
    return 'just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    if (lang === 'uz') return `${diffMin} daqiqa oldin`;
    if (lang === 'ru') return `${diffMin} мин. назад`;
    return `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    if (lang === 'uz') return `${diffHour} soat oldin`;
    if (lang === 'ru') return `${diffHour} ч. назад`;
    return `${diffHour}h ago`;
  }

  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 30) {
    if (lang === 'uz') return `${diffDays} kun oldin`;
    if (lang === 'ru') return `${diffDays} дн. назад`;
    return `${diffDays}d ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    if (lang === 'uz') return `${diffMonths} oy oldin`;
    if (lang === 'ru') return `${diffMonths} мес. назад`;
    return `${diffMonths}mo ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  if (lang === 'uz') return `${diffYears} yil oldin`;
  if (lang === 'ru') return `${diffYears} г. назад`;
  return `${diffYears}y ago`;
};

// Helper: Format view counts (e.g. 1.2K ko'rildi / 1.2K просмотров / 1.2K views)
export const formatViewsCount = (count: number = 0, lang: LanguageCode): string => {
  let numStr = count.toString();
  if (count >= 1000000) {
    numStr = (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    numStr = (count / 1000).toFixed(1) + 'K';
  }
  return `${numStr} ${getTranslation(lang, 'views')}`;
};
