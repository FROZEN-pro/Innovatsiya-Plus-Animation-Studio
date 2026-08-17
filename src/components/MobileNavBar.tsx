import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, Radio, Star, History, MessageSquare, User, Crown, Download } from 'lucide-react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { getTranslation } from '../lib/i18n';

export default function MobileNavBar() {
  const { language, darkMode, setSubscriptionModalOpen, setProfileSettingsModalOpen, setSelectedCategory } = useAppStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab');

  const t = (key: string) => getTranslation(language, key);

  return (
    <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors ${
      darkMode ? 'bg-[#050508]/95 border-white/10 text-white' : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-lg'
    }`}>
      <div className="flex items-center justify-around py-2 px-2">
        
        {/* Home / All */}
        <Link
          to="/dashboard"
          onClick={() => setSelectedCategory('All')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            isDashboard && !activeTab ? 'text-orange-500' : darkMode ? 'text-white/60' : 'text-zinc-500'
          }`}
        >
          <Flame size={20} />
          <span>{t('navHome')}</span>
        </Link>

        {/* Premieres */}
        <Link
          to="/dashboard?tab=Premieres"
          onClick={() => setSelectedCategory('Premieres')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'Premieres' ? 'text-rose-500' : darkMode ? 'text-white/60' : 'text-zinc-500'
          }`}
        >
          <Radio size={20} className={activeTab === 'Premieres' ? 'animate-pulse' : ''} />
          <span>{language === 'uz' ? 'Premyeralar' : language === 'ru' ? 'Премьеры' : 'Premieres'}</span>
        </Link>

        {/* VIP Subscription CTA */}
        <button
          onClick={() => setSubscriptionModalOpen(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-extrabold text-amber-400"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black flex items-center justify-center -mt-3 shadow-lg shadow-orange-500/30">
            <Crown size={16} />
          </div>
          <span>{t('subscriptionPlan')}</span>
        </button>

        {/* Favorites */}
        <Link
          to="/dashboard?tab=Favorites"
          onClick={() => setSelectedCategory('Favorites')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'Favorites' ? 'text-amber-400' : darkMode ? 'text-white/60' : 'text-zinc-500'
          }`}
        >
          <Star size={20} fill={activeTab === 'Favorites' ? 'currentColor' : 'none'} />
          <span>{t('navFavorites')}</span>
        </Link>

        {/* Profile / Settings */}
        <button
          onClick={() => setProfileSettingsModalOpen(true)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            darkMode ? 'text-white/60' : 'text-zinc-500'
          }`}
        >
          <User size={20} />
          <span>{t('navProfile')}</span>
        </button>

      </div>
    </div>
  );
}
