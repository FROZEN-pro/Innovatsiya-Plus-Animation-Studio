import ThemeToggle from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store/useStore';
import { logout } from '../lib/firebase';
import { languages, getTranslation } from '../lib/i18n';
import { 
  Tv, Search, Download, Crown, LogOut, Settings,
  Shield, Smartphone, Send, Bookmark, Star, User as UserIcon, UserCog, Clock, History
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuthStore();
  const { 
    language, setLanguage, 
    darkMode,
    searchQuery, setSearchQuery,
    offlineVault,
    setSubscriptionModalOpen,
    setTelegramModalOpen,
    setPwaModalOpen,
    setProfileSettingsModalOpen,
    appSettings
  } = useAppStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const t = (key: string) => getTranslation(language, key);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#050508]/90 backdrop-blur-xl border-b border-white/10 text-white' 
        : 'bg-white/90 backdrop-blur-xl border-b border-zinc-200 text-zinc-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Tv className="text-black" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold tracking-tight text-lg ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                {appSettings?.brandName || 'INNOVATION'}
                <span className="text-orange-500">{appSettings?.brandTag ? ` ${appSettings.brandTag}` : '+'}</span>
              </span>
            </div>
            <p className={`text-[10px] hidden md:block ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>Ad-Free Creative Hub</p>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block relative">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-white/40' : 'text-zinc-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={`w-full rounded-full pl-10 pr-4 py-2 text-xs transition-all focus:outline-none ${
              darkMode 
                ? 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-orange-500/50 focus:bg-white/10'
                : 'bg-zinc-100 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-orange-500/50 focus:bg-white'
            }`}
          />
        </div>

        {/* Navigation Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real-time Notification Bell */}
          <NotificationCenter />

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* Subscription Upgrade Button */}
          <button
            onClick={() => setSubscriptionModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            <Crown size={14} />
            <span className="hidden md:inline">{t('subscriptionPlan')}</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full border-2 border-orange-500/40 p-0.5 hover:border-orange-500 transition-all flex items-center justify-center focus:outline-none"
              title="Profil menyusi"
            >
              <img
                src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                alt={user?.displayName || 'Member'}
                className="w-full h-full rounded-full object-cover"
              />
            </button>

            {isProfileOpen && (
              <div className={`absolute right-0 mt-3 w-72 rounded-3xl border shadow-2xl p-4 z-50 space-y-3.5 max-h-[85vh] overflow-y-auto scrollbar-thin ${
                darkMode ? 'bg-[#0e0e14] border-white/10' : 'bg-white border-zinc-200'
              }`}>
                {/* User Header */}
                <div className={`flex items-center justify-between gap-3 pb-3 border-b ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <img
                      src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                      alt="Member"
                      className="w-10 h-10 rounded-full object-cover border border-orange-500/50 shrink-0"
                    />
                    <div className="overflow-hidden min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{user?.displayName || 'Valued Member'}</p>
                      <p className={`text-[10px] truncate ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>{user?.email || 'Encrypted Account'}</p>
                      <span className="inline-block text-[9px] font-mono text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full mt-1 font-bold">
                        {user?.role === 'admin' ? 'Studio Administrator' : 'VIP Member'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setProfileSettingsModalOpen(true); setIsProfileOpen(false); }}
                    className={`p-2 rounded-xl border transition-all shrink-0 ${
                      darkMode 
                        ? 'bg-white/5 hover:bg-orange-500/20 text-orange-400 border-white/10' 
                        : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200'
                    }`}
                    title="Edit Profile & Avatar"
                  >
                    <UserCog size={16} />
                  </button>
                </div>

                {/* Primary Nav Items inside Profile */}
                <div className="space-y-1">
                  {/* Shifrlangan Oflayn Xotira */}
                  <Link
                    to="/dashboard?tab=vault"
                    onClick={() => setIsProfileOpen(false)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                      darkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/5' 
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Download size={14} />
                      </div>
                      <div>
                        <p className="font-bold leading-tight">{t('offlineVaultTitle')}</p>
                        <p className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>AES-256 xavfsiz saqlash</p>
                      </div>
                    </div>

                    {offlineVault.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black shadow">
                        {offlineVault.length}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-mono ${darkMode ? 'text-white/40' : 'text-zinc-400'}`}>0</span>
                    )}
                  </Link>

                  {/* Saralanganlar (Favorites) */}
                  <Link
                    to="/dashboard?tab=favorites"
                    onClick={() => setIsProfileOpen(false)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                      darkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/5' 
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Bookmark size={14} />
                      </div>
                      <div>
                        <p className="font-bold leading-tight">{t('navFavorites')}</p>
                        <p className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>Saqlangan videolar</p>
                      </div>
                    </div>
                    <Star size={14} className="text-amber-400" fill="currentColor" />
                  </Link>

                  {/* Tomosha Tarixi (Watch History) */}
                  <Link
                    to="/dashboard?tab=history"
                    onClick={() => setIsProfileOpen(false)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                      darkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/5' 
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="font-bold leading-tight">{t('navHistory')}</p>
                        <p className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>Ko'rilgan videolar va jarayon</p>
                      </div>
                    </div>
                    <History size={14} className="text-orange-400" />
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 transition-all font-bold"
                    >
                      <Settings size={14} />
                      {t('navAdmin')}
                    </Link>
                  )}

                  {!user?.telegramUsername && (
                    <button
                      onClick={() => { setTelegramModalOpen(true); setIsProfileOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                        darkMode ? 'text-sky-400 hover:bg-white/5' : 'text-sky-600 hover:bg-zinc-100'
                      }`}
                    >
                      <Send size={14} />
                      Connect Telegram
                    </button>
                  )}

                  <button
                    onClick={() => { setPwaModalOpen(true); setIsProfileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      darkMode ? 'text-orange-400 hover:bg-orange-500/10' : 'text-orange-600 hover:bg-orange-50'
                    }`}
                    id="navbar-install-apk-btn"
                  >
                    <Smartphone size={15} className="text-orange-500" />
                    <span>{t('installApp')} (Web-APK)</span>
                  </button>
                  
                  <button
                    onClick={() => { setSubscriptionModalOpen(true); setIsProfileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      darkMode ? 'text-white/80 hover:bg-white/5' : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <Crown size={14} className="text-orange-500" />
                    {t('subscriptionPlan')}
                  </button>
                </div>

                {/* Tilni O'zgartirish (Language Selector) */}
                <div className={`pt-2.5 border-t ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                      Til / Language
                    </p>
                    <span className="text-[10px] font-mono font-bold text-orange-500">
                      {currentLangObj.flag} {currentLangObj.code.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {languages.map((l) => {
                      const isActive = language === l.code;
                      return (
                        <button
                          key={l.code}
                          onClick={() => setLanguage(l.code)}
                          className={`flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] transition-all border ${
                            isActive
                              ? 'bg-orange-500/15 text-orange-500 border-orange-500/40 font-bold shadow-sm'
                              : darkMode
                              ? 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          <span className="text-base mb-0.5">{l.flag}</span>
                          <span className="truncate w-full text-center text-[10px] font-medium">{l.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Logout Button */}
                <div className={`pt-2 border-t ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all"
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
    </nav>
  );
}
