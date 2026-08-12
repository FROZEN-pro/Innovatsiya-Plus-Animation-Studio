import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store/useStore';
import { logout } from '../lib/firebase';
import { languages, getTranslation } from '../lib/i18n';
import { 
  Tv, Search, Globe, Shield, Download, Sparkles, 
  Crown, LogOut, User as UserIcon, Settings,
  Eye, Type, Send, Smartphone
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuthStore();
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
                INNOVATION<span className="text-orange-500">+</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PRO
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
          
          {/* PWA / Web APK Download Button */}
          <button
            onClick={() => setPwaModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 transition-all"
            title="Install Web APK for Mobile & Desktop"
          >
            <Smartphone size={14} className="text-orange-400" />
            <span className="hidden xl:inline">{t('installApp')}</span>
          </button>

          {/* Telegram Auth Launcher (if not linked) */}
          {!user?.telegramUsername && (
            <button
              onClick={() => setTelegramModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-medium text-sky-400 transition-all"
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

                <div className="space-y-1">
                  <span className="text-[11px] text-white/60 flex items-center gap-1.5"><Type size={12} /> {t('textSize')}</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['normal', 'large', 'xlarge'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setTextSize(size)}
                        className={`py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          textSize === size ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {size === 'normal' ? '100%' : size === 'large' ? '120%' : '140%'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => { setIsLangOpen(!isLangOpen); setIsAccessOpen(false); setIsProfileOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-all"
            >
              <span>{currentLangObj.flag}</span>
              <span className="font-mono text-[11px] uppercase hidden sm:inline">{currentLangObj.code}</span>
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-2 z-50 grid grid-cols-1 gap-1 max-h-64 overflow-y-auto">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setIsLangOpen(false); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      language === l.code ? 'bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30' : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2"><span>{l.flag}</span> {l.name}</span>
                    {language === l.code && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Offline Vault Indicator */}
          <Link
            to="/dashboard?tab=vault"
            className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all"
            title={t('offlineVaultTitle')}
          >
            <Download size={16} className={offlineVault.length > 0 ? 'text-green-400' : 'text-white/60'} />
            {offlineVault.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-lg">
                {offlineVault.length}
              </span>
            )}
          </Link>

          {/* Subscription Upgrade Button */}
          <button
            onClick={() => setSubscriptionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            <Crown size={14} />
            <span className="hidden sm:inline">{t('subscriptionPlan')}</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsLangOpen(false); setIsAccessOpen(false); }}
              className="w-9 h-9 rounded-full border-2 border-orange-500/40 p-0.5 hover:border-orange-500 transition-all"
            >
              <img
                src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                alt={user?.displayName || 'Member'}
                className="w-full h-full rounded-full object-cover"
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-4 z-50 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <img
                    src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt="Member"
                    className="w-10 h-10 rounded-full object-cover border border-orange-500/50"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Valued Member'}</p>
                    <p className="text-[10px] text-white/50 truncate">{user?.email || 'Encrypted Account'}</p>
                    <span className="inline-block text-[9px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded mt-1">
                      {user?.role === 'admin' ? 'Studio Administrator' : 'VIP Member'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all font-medium"
                    >
                      <Settings size={14} />
                      {t('navAdmin')}
                    </Link>
                  )}

                  <button
                    onClick={() => { setBiometricModalOpen(true); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/5 transition-all"
                  >
                    <Shield size={14} className="text-emerald-400" />
                    {t('biometricPass')}
                  </button>

                  <button
                    onClick={() => { setPwaModalOpen(true); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/5 transition-all"
                  >
                    <Smartphone size={14} className="text-sky-400" />
                    {t('installApp')}
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10">
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
    </nav>
  );
}
