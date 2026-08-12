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
  
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  textSize: 'normal' | 'large' | 'xlarge';
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
  
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
const savedContrast = localStorage.getItem('innovation_plus_contrast') === 'true';
const savedTextSize = (localStorage.getItem('innovation_plus_textsize') as 'normal' | 'large' | 'xlarge') || 'normal';

export const useAppStore = create<AppState>((set, get) => ({
  language: savedLang,
  setLanguage: (lang) => {
    localStorage.setItem('innovation_plus_lang', lang);
    set({ language: lang });
  },
  
  highContrast: savedContrast,
  toggleHighContrast: () => {
    const next = !get().highContrast;
    localStorage.setItem('innovation_plus_contrast', String(next));
    set({ highContrast: next });
  },
  
  textSize: savedTextSize,
  setTextSize: (size) => {
    localStorage.setItem('innovation_plus_textsize', size);
    set({ textSize: size });
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
}));

