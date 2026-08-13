import { create } from 'zustand';
import { AuthState, User, LanguageCode, ContentCategory, OfflineVaultItem } from '../types';

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
  
  isBiometricModalOpen: boolean;
  setBiometricModalOpen: (open: boolean) => void;
  
  isPwaModalOpen: boolean;
  setPwaModalOpen: (open: boolean) => void;
  appSettings: any;
  setAppSettings: (settings: any) => void;

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

const savedLang = (localStorage.getItem('innovation_plus_lang') as LanguageCode) || 'en';
const savedDarkMode = localStorage.getItem('innovation_plus_darkmode') === 'true';


export const useAppStore = create<AppState>((set, get) => ({
  language: savedLang,
  setLanguage: (lang) => {
    localStorage.setItem('innovation_plus_lang', lang);
    set({ language: lang });
  },
  
  darkMode: savedDarkMode,
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
  
  isBiometricModalOpen: false,
  setBiometricModalOpen: (open) => set({ isBiometricModalOpen: open }),
  
  isPwaModalOpen: false,
  setPwaModalOpen: (open) => set({ isPwaModalOpen: open }),

  appSettings: null,
  setAppSettings: (appSettings) => set({ appSettings }),

}));

