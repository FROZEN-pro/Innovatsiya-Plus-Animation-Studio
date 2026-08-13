import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store/useStore';
import { logout } from '../lib/firebase';
import { languages, getTranslation } from '../lib/i18n';
import { 
  Tv, Search, Globe, Shield, Download, Sparkles, 
  Crown, LogOut, User as UserIcon, Settings,
  Eye, Type, Send, Smartphone, Menu, X
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuthStore();
  const { appSettings } = useAppStore();
  const { 
    language, setLanguage, 
    highContrast, toggleHighContrast,
    textSize, setTextSize,
    searchQuery, setSearchQuery,
    offlineVault,
    setSubscriptionModalOpen,
    setTelegramModalOpen,
    setBiometricModalOpen,
    setPwaModalOpen
  } = useAppStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const t = (key: string) => getTranslation(language, key);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
      highContrast 
        ? 'bg-black border-b-2 border-yellow-400 text-yellow-400' 
        : 'bg-[#050508]/80 backdrop-blur-xl border-b border-white/10 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-violet-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Tv className="text-white" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-white via-white to-orange-400 bg-clip-text text-transparent">
                {appSettings?.brandName || 'INNOVATION+'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {appSettings?.brandTag || 'PRO'}
              </span>
            </div>
            <p className="text-[10px] text-white/50 hidden md:block">Ad-Free Creative Hub</p>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Navigation Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <div className="hidden md:flex items-center gap-2">
            {/* PWA / Web APK Download Button */}
            <button
              onClick={() => setPwaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 transition-all"
              title="Install Web APK for Mobile & Desktop"
            >
              <Smartphone size={14} className="text-orange-400" />
              <span className="hidden xl:inline">{t('installApp')}</span>
            </button>

            {/* Telegram Auth Launcher (if not linked) */}
            {!user?.telegramUsername && (
              <button
                onClick={() => setTelegramModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-medium text-sky-400 transition-all"
                title="Connect Telegram Account"
              >
                <Send size={14} />
                <span className="hidden xl:inline">Telegram</span>
              </button>
            )}

            {/* Accessibility Controls Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setIsAccessOpen(!isAccessOpen); setIsLangOpen(false); setIsProfileOpen(false); }}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all"
                title={t('accessibility')}
              >
                <Eye size={16} className={highContrast ? 'text-yellow-400' : 'text-orange-400'} />
              </button>

              {isAccessOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-3 z-50 space-y-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">{t('accessibility')}</p>
                  
                  <button
                    onClick={toggleHighContrast}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white transition-all"
                  >
                    <span className="flex items-center gap-2"><Eye size={14} /> {t('highContrast')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${highContrast ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'}`}>
                      {highContrast ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsAccessOpen(false); setIsLangOpen(false); }}
                className="flex items-center gap-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <img src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} alt="user" className="w-7 h-7 rounded-full object-cover" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-3 z-50">
                  <div className="flex items-center gap-3 px-2 pb-3 mb-2 border-b border-white/10">
                    <img src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} alt="user" className="w-10 h-10 rounded-full object-cover" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{user?.displayName || 'User'}</p>
                      <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                      >
                        <Settings size={14} />
                        {t('navAdmin')}
                      </Link>
                    )}

                    {!user?.telegramUsername && (
                      <button
                        onClick={() => { setTelegramModalOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-sky-400 hover:bg-white/5"
                      >
                        <Send size={14} />
                        Connect Telegram
                      </button>
                    )}

                    <button
                      onClick={() => { setBiometricModalOpen(true); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-white/80 hover:bg-white/5"
                    >
                      <Shield size={14} className="text-emerald-500" />
                      {t('biometricPass')}
                    </button>

                    <button
                      onClick={() => { setPwaModalOpen(true); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-white/80 hover:bg-white/5"
                    >
                      <Smartphone size={14} className="text-orange-500" />
                      {t('installApp')}
                    </button>
                    
                    <button
                      onClick={() => { setSubscriptionModalOpen(true); setIsProfileOpen(false); }}
                      className="sm:hidden w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-white/80 hover:bg-white/5"
                    >
                      <Crown size={14} className="text-amber-500" />
                      {t('subscriptionPlan')}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/10 mt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
