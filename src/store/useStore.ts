import { create } from 'zustand';
import { AuthState, User, LanguageCode, ContentCategory, OfflineVaultItem, DashboardLayoutTheme, FloatingPlayerState, AppSettings, Video } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));

interface AppState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  selectedCategory: ContentCategory | 'All';
  setSelectedCategory: (category: ContentCategory | 'All') => void;
  
  offlineVault: OfflineVaultItem[];
  addToVault: (item: OfflineVaultItem) => void;
  removeFromVault: (id: string) => void;
  clearVault: () => void;
  
  isSubscriptionModalOpen: boolean;
  setSubscriptionModalOpen: (open: boolean) => void;
  
  isTelegramModalOpen: boolean;
  setTelegramModalOpen: (open: boolean) => void;
  
  isPwaModalOpen: boolean;
  setPwaModalOpen: (open: boolean) => void;

  isProfileSettingsModalOpen: boolean;
  setProfileSettingsModalOpen: (open: boolean) => void;
  
  pwaDeferredPrompt: any;
  setPwaDeferredPrompt: (prompt: any) => void;

  appSettings: AppSettings | null;
  setAppSettings: (settings: AppSettings | null) => void;

  activeLayoutTheme: DashboardLayoutTheme | null;
  setActiveLayoutTheme: (theme: DashboardLayoutTheme | null) => void;

  floatingPlayer: FloatingPlayerState;
  openFloatingPlayer: (video: Video, currentTime?: number, isPlaying?: boolean) => void;
  updateFloatingPlayer: (partial: Partial<FloatingPlayerState>) => void;
  closeFloatingPlayer: () => void;
}

// Helper to load offline vault from localStorage
const loadInitialVault = (): OfflineVaultItem[] => {
  try {
    const saved = localStorage.getItem('innovation_plus_vault');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const getInitialDarkMode = (): boolean => {
  try {
    const saved = localStorage.getItem('innovation_plus_darkmode');
    if (saved !== null && saved !== 'system') {
      return saved === 'true';
    }
    // Automatically detect user's system OS theme (light/dark)
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  } catch {
    return false;
  }
};

const savedLang = (localStorage.getItem('innovation_plus_lang') as LanguageCode) || 'en';
const initialDarkMode = getInitialDarkMode();

export const useAppStore = create<AppState>((set, get) => ({
  language: savedLang,
  setLanguage: (lang) => {
    localStorage.setItem('innovation_plus_lang', lang);
    set({ language: lang });
  },
  
  darkMode: initialDarkMode,
  setDarkMode: (dark: boolean) => {
    localStorage.setItem('innovation_plus_darkmode', String(dark));
    set({ darkMode: dark });
  },
  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('innovation_plus_darkmode', String(next));
    set({ darkMode: next });
  },
  
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  selectedCategory: 'All',
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  
  offlineVault: loadInitialVault(),
  addToVault: (item) => {
    const current = get().offlineVault;
    if (current.some((i) => i.id === item.id)) return;
    const updated = [item, ...current];
    localStorage.setItem('innovation_plus_vault', JSON.stringify(updated));
    set({ offlineVault: updated });
  },
  removeFromVault: (id) => {
    const updated = get().offlineVault.filter((i) => i.id !== id);
    localStorage.setItem('innovation_plus_vault', JSON.stringify(updated));
    set({ offlineVault: updated });
  },
  clearVault: () => {
    localStorage.removeItem('innovation_plus_vault');
    set({ offlineVault: [] });
  },
  
  isSubscriptionModalOpen: false,
  setSubscriptionModalOpen: (open) => set({ isSubscriptionModalOpen: open }),
  
  isTelegramModalOpen: false,
  setTelegramModalOpen: (open) => set({ isTelegramModalOpen: open }),
  
  isPwaModalOpen: false,
  setPwaModalOpen: (open) => set({ isPwaModalOpen: open }),

  isProfileSettingsModalOpen: false,
  setProfileSettingsModalOpen: (open) => set({ isProfileSettingsModalOpen: open }),

  pwaDeferredPrompt: null,
  setPwaDeferredPrompt: (pwaDeferredPrompt) => set({ pwaDeferredPrompt }),

  appSettings: null,
  setAppSettings: (appSettings) => set({ appSettings }),

  activeLayoutTheme: null,
  setActiveLayoutTheme: (activeLayoutTheme) => set({ activeLayoutTheme }),

  floatingPlayer: {
    isOpen: false,
    video: null,
    currentTime: 0,
    isPlaying: false,
    isMuted: false,
  },
  openFloatingPlayer: (video, currentTime = 0, isPlaying = true) => {
    set({
      floatingPlayer: {
        isOpen: true,
        video,
        currentTime,
        isPlaying,
        isMuted: false,
      }
    });
  },
  updateFloatingPlayer: (partial) => {
    set((state) => ({
      floatingPlayer: { ...state.floatingPlayer, ...partial }
    }));
  },
  closeFloatingPlayer: () => {
    set((state) => ({
      floatingPlayer: { ...state.floatingPlayer, isOpen: false }
    }));
  },
}));

