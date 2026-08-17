import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Play, Download, Sparkles, Flame, Check, Shield, Film, Music, 
  Clapperboard, Smartphone, Crown, Eye, Search, Lock, Clock, 
  Bookmark, Star, Trash2, LayoutGrid, List, Layers, Radio,
  Mic, Headphones, History, RotateCcw
} from 'lucide-react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import Navbar from '../components/Navbar';
import { DashboardAlertBanner } from '../components/DashboardAlertBanner';
import SubscriptionModal from '../components/SubscriptionModal';
import TelegramAuthModal from '../components/TelegramAuthModal';
import PwaInstallModal from '../components/PwaInstallModal';
import Footer from '../components/Footer';
import MobileNavBar from '../components/MobileNavBar';
import SupportChatWidget from '../components/SupportChatWidget';
import { useAuthStore, useAppStore } from '../store/useStore';
import { Video, ContentCategory, FavoriteItem, UserWatchRecord } from '../types';
import VideoThumbnailPreview from '../components/VideoThumbnailPreview';
import { getTranslation, formatCategoryLabel, formatViewsCount, formatTimeAgo } from '../lib/i18n';
import { subscribeToFavorites, toggleFavorite } from '../lib/favorites';
import { 
  subscribeToWatchHistory, 
  deleteWatchHistoryItem, 
  clearUserWatchHistory, 
  formatDuration, 
  formatRelativeTime 
} from '../lib/userActivity';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { 
    language, darkMode, appSettings, searchQuery, setSearchQuery, 
    selectedCategory, setSelectedCategory,
    offlineVault, addToVault, removeFromVault,
    setSubscriptionModalOpen
  } = useAppStore();

  const [videos, setVideos] = useState<Video[]>([]);
  const [featured, setFeatured] = useState<Video | null>(null);

  const [fullWatchHistory, setFullWatchHistory] = useState<UserWatchRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list' | 'cinematic'>('grid');
  const [historyToastMsg, setHistoryToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (appSettings?.dashboardLayout) {
      setLayoutMode(appSettings.dashboardLayout as 'grid' | 'list' | 'cinematic');
    }
  }, [appSettings?.dashboardLayout]);

  // Real-time Watch History subscription from Firestore
  useEffect(() => {
    if (!user) {
      setFullWatchHistory([]);
      return;
    }
    const unsubscribe = subscribeToWatchHistory(user.uid, (records) => {
      setFullWatchHistory(records);
    });
    return () => unsubscribe();
  }, [user]);

  // Subscribe to real-time Favorites from Firestore
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    const unsubscribe = subscribeToFavorites(user.uid, (favItems) => {
      setFavorites(favItems);
    });
    return () => unsubscribe();
  }, [user]);

  const continueWatchingVideos = fullWatchHistory
    .map(wh => {
      const vid = videos.find(v => v.id.toString() === wh.videoId);
      return vid ? { ...vid, progressSeconds: wh.progressSeconds, completed: wh.completed } : null;
    })
    .filter(v => v !== null && !v.completed) as (Video & { progressSeconds: number })[];

  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');

  const t = (key: string) => getTranslation(language, key);

  const handleDeleteHistory = async (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteWatchHistoryItem(user.uid, videoId);
      setHistoryToastMsg(t('removedFromFavorites'));
      setTimeout(() => setHistoryToastMsg(null), 3000);
    } catch (err) {
      console.error("Failed to delete watch history record:", err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!user) return;
    if (!window.confirm("Tomosha tarixini butunlay tozalamoqchimisiz? / Are you sure you want to clear your watch history?")) return;
    try {
      await clearUserWatchHistory(user.uid);
      setHistoryToastMsg(t('historyCleared'));
      setTimeout(() => setHistoryToastMsg(null), 3000);
    } catch (err) {
      console.error("Failed to clear watch history:", err);
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const vids = await res.json();
          setVideos(vids);
          if (vids.length > 0) {
            setFeatured(vids[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      }
    };
    fetchVideos();
  }, []);

  const handleDownloadOffline = (video: Video) => {
    addToVault({
      id: `vault_${video.id}`,
      title: video.title,
      category: video.category as ContentCategory,
      encryptedBlobUrl: video.videoUrl,
      downloadedAt: new Date().toLocaleDateString(),
      fileSize: '48.2 MB',
      thumbnailUrl: video.thumbnailUrl
    });
  };

  const handleToggleCardFavorite = async (e: React.MouseEvent, video: Video) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to save favorites.");
      return;
    }
    await toggleFavorite(user.uid, {
      id: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      category: video.category?.toString()
    });
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, favId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await toggleFavorite(user.uid, { id: favId });
  };

  const categories: (ContentCategory | 'All' | 'Vault' | 'Favorites' | 'Premieres' | 'History')[] = [
    'All', 'Premieres', 'Favorites', 'History', 'Animation', 'Dubbing', '2D Video', 'Short', 'Music', 'Vault'
  ];

  // Filtering
  const filteredVideos = videos.filter(v => {
    const matchesCategory = 
      selectedCategory === 'All' || 
      (selectedCategory === 'Premieres' ? Boolean(v.isPremiere) : v.category === selectedCategory);
    const matchesSearch = searchQuery === '' || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isVaultTab = selectedCategory === 'Vault' || activeTab === 'vault';
  const isFavoritesTab = selectedCategory === 'Favorites' || activeTab === 'favorites';
  const isHistoryTab = selectedCategory === 'History' || activeTab === 'history';

  return (
    <div className={`min-h-screen font-sans select-none overflow-x-hidden ${darkMode ? "bg-[#050505] text-white" : "bg-gray-50 text-black"} transition-colors duration-300`}>
      <Navbar />

      {/* Global Modals */}
      <SubscriptionModal />
      <TelegramAuthModal />
      <PwaInstallModal />

      {/* Toast message */}
      <AnimatePresence>
        {historyToastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 px-4 py-2.5 rounded-2xl bg-orange-500 text-black font-bold text-xs shadow-2xl flex items-center gap-2"
          >
            <Check size={16} />
            <span>{historyToastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      {featured && !isVaultTab && !isFavoritesTab && !isHistoryTab && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className={`relative h-[82vh] w-full border-b ${darkMode ? "border-white/10" : "border-black/10"} shadow-2xl overflow-hidden pt-20`}
        >
          <div className="absolute inset-0">
            <motion.img 
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              src={appSettings?.heroImageUrl || featured.thumbnailUrl} 
              alt={appSettings?.heroTitle || featured.title} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/70 to-transparent" />
          </div>

          <div className="absolute bottom-12 left-6 sm:left-12 max-w-3xl z-20 space-y-4">
            
            {/* Category Tag & AI Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-[11px] uppercase tracking-wider">
                {featured.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" /> 4K Ultra HD
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <Shield size={12} /> Encrypted Stream
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
            >
              {featured.title}
            </motion.h1>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-white/70 text-xs sm:text-sm line-clamp-2 max-w-2xl leading-relaxed"
            >
              {featured.description}
            </motion.p>

            {/* Hero Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Link 
                to={`/play/${featured.id}`} 
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-violet-600 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-orange-500/20 hover:scale-105 transition-all"
              >
                <Play fill="currentColor" size={18} /> {t('playStream')}
              </Link>

              <button
                onClick={() => handleDownloadOffline(featured)}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Download size={16} className="text-green-400" /> {t('downloadOffline')}
              </button>
            </motion.div>

          </div>
        </motion.div>
      )}

            {/* Content Hub Section */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20 space-y-8 ${featured && !isVaultTab ? '-mt-16' : 'pt-28'}`}>
        
        {/* Real-time Video Release Alert Banner */}
        <DashboardAlertBanner />

        {/* Global Dashboard Search */}
        {!isVaultTab && (
          <div className="relative max-w-2xl mx-auto w-full z-30 mb-8 mt-2">
            <Search size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-white/40' : 'text-black/40'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams by title, category, or keyword..."
              className={`w-full rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-xl transition-all focus:outline-none ${
                darkMode 
                  ? 'bg-[#121216] border border-white/10 text-white placeholder-white/40 focus:border-orange-500/50 focus:bg-[#1a1a20]'
                  : 'bg-white border border-black/10 text-black placeholder-black/40 focus:border-orange-500/50 focus:bg-gray-50'
              }`}
            />
          </div>
        )}
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isCatActive = 
              (cat === 'Vault' && isVaultTab) || 
              (cat === 'Favorites' && isFavoritesTab) ||
              (cat === 'History' && isHistoryTab) ||
              (selectedCategory === cat && !isVaultTab && !isFavoritesTab && !isHistoryTab);

            const handleCatClick = () => {
              if (cat === 'Vault') {
                setSelectedCategory('Vault');
              } else if (cat === 'Favorites') {
                setSelectedCategory('Favorites');
              } else if (cat === 'History') {
                setSelectedCategory('History');
              } else {
                setSelectedCategory(cat);
              }
            };

            return (
              <button
                key={cat}
                onClick={handleCatClick}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 border ${
                  isCatActive
                    ? 'bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/20 font-black'
                    : darkMode 
                      ? 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10' 
                      : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm'
                }`}
              >
                {cat === 'All' && <Flame size={14} />}
                {cat === 'Premieres' && <Radio size={14} className="text-rose-500 animate-pulse" />}
                {cat === 'Favorites' && <Star size={14} className={isCatActive ? "text-black fill-current" : "text-amber-400 fill-amber-400"} />}
                {cat === 'History' && <History size={14} className={isCatActive ? "text-black" : "text-orange-400"} />}
                {cat === 'Animation' && <Clapperboard size={14} />}
                {cat === 'Dubbing' && <Headphones size={14} className={isCatActive ? "text-black" : "text-purple-400"} />}
                {cat === '2D Video' && <Film size={14} />}
                {cat === 'Short' && <Smartphone size={14} />}
                {cat === 'Music' && <Music size={14} />}
                {cat === 'Vault' && <Download size={14} className={isCatActive ? "text-black" : "text-green-400"} />}
                <span>
                  {cat === 'Vault' 
                    ? t('offlineVaultTitle') 
                    : cat === 'Favorites' 
                    ? t('navFavorites') 
                    : cat === 'History' 
                    ? t('navHistory') 
                    : cat === 'Premieres' 
                    ? (language === 'uz' ? 'Premyeralar' : language === 'ru' ? 'Премьеры' : 'Premieres') 
                    : cat === 'All'
                    ? t('catAll')
                    : formatCategoryLabel(cat, language)}
                </span>
                {cat === 'Favorites' && favorites.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isCatActive ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'}`}>
                    {favorites.length}
                  </span>
                )}
                {cat === 'History' && fullWatchHistory.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isCatActive ? 'bg-black text-orange-400' : 'bg-orange-500 text-black'}`}>
                    {fullWatchHistory.length}
                  </span>
                )}
                {cat === 'Vault' && offlineVault.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isCatActive ? 'bg-black text-green-400' : 'bg-green-500 text-black'}`}>
                    {offlineVault.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Favorites Tab View */}
        {isFavoritesTab ? (
          <div className="space-y-6">
            <div className={`flex justify-between items-center pb-4 border-b ${darkMode ? "border-white/10" : "border-zinc-200"}`} >
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <Star className="text-amber-400 fill-amber-400" size={24} /> {t('favoritesTitle')}
                </h2>
                <p className={`text-xs ${darkMode ? "text-white/60" : "text-zinc-500"}`} >{t('favoritesDesc')}</p>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 font-bold">
                {favorites.length} Bookmarks
              </span>
            </div>

            {favorites.length === 0 ? (
              <div className={`py-20 text-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200 shadow-sm"} border rounded-[32px] space-y-4 max-w-2xl mx-auto p-8`} >
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/5">
                  <Bookmark size={32} />
                </div>
                <h3 className={`text-lg font-extrabold ${darkMode ? "text-white" : "text-zinc-900"}`} >No Favorites Saved Yet</h3>
                <p className={`text-xs ${darkMode ? "text-white/60" : "text-zinc-500"} leading-relaxed max-w-md mx-auto`} >
                  {t('emptyFavorites')}
                </p>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <Play size={14} fill="currentColor" /> Browse All Streams
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map((fav, idx) => {
                  const matchedVideo = videos.find(v => v.id.toString() === fav.videoId);
                  const title = fav.title || matchedVideo?.title || 'Saved Stream';
                  const thumbnail = fav.thumbnailUrl || matchedVideo?.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                  const category = fav.category || matchedVideo?.category || 'Media';

                  return (
                    <motion.div
                      key={fav.videoId}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`group ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm"} border rounded-[28px] overflow-hidden hover:border-amber-500/50 transition-all shadow-xl flex flex-col`}
                    >
                      <VideoThumbnailPreview
                        thumbnailUrl={thumbnail}
                        videoUrl={matchedVideo?.videoUrl}
                        title={title}
                        category={category}
                        aspectRatio="aspect-video"
                      >
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                          <Link
                            to={`/play/${fav.videoId}`}
                            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform"
                            title="Play Video"
                          >
                            <Play fill="currentColor" size={20} className="ml-0.5" />
                          </Link>
                          <button
                            onClick={(e) => handleRemoveFavorite(e, fav.videoId)}
                            className="w-10 h-10 rounded-2xl bg-red-500/30 hover:bg-red-500/50 text-red-300 border border-red-500/40 flex items-center justify-center transition-all"
                            title="Remove from Favorites"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold uppercase text-amber-400 flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> {category}
                        </span>

                        <button
                          onClick={(e) => handleRemoveFavorite(e, fav.videoId)}
                          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/40 flex items-center justify-center text-amber-400 hover:text-red-400 transition-colors"
                          title="Remove bookmark"
                        >
                          <Star size={14} fill="currentColor" />
                        </button>
                      </VideoThumbnailPreview>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className={`flex justify-between items-center text-[10px] ${darkMode ? "text-white/50" : "text-zinc-500"} font-mono mb-1`} >
                            <span>Saved {new Date(fav.createdAt).toLocaleDateString()}</span>
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <Star size={10} fill="currentColor" /> Favorited
                            </span>
                          </div>
                          <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-zinc-900"} line-clamp-1 group-hover:text-amber-400 transition-colors`}>
                            {title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <Link
                            to={`/play/${fav.videoId}`}
                            className="flex-1 py-2 text-center rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black font-extrabold text-[11px] uppercase transition-all"
                          >
                            Watch Stream
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : isHistoryTab ? (
          /* Watch History Tab View */
          <div className="space-y-6">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${darkMode ? "border-white/10" : "border-zinc-200"}`}>
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <History className="text-orange-500" size={24} /> {t('watchHistoryTitle')}
                </h2>
                <p className={`text-xs ${darkMode ? "text-white/60" : "text-zinc-500"} mt-0.5`}>{t('watchHistoryDesc')}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 font-bold">
                  {fullWatchHistory.length} Videos Streamed
                </span>
                {fullWatchHistory.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="px-3.5 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>{t('clearHistory')}</span>
                  </button>
                )}
              </div>
            </div>

            {fullWatchHistory.length === 0 ? (
              <div className={`py-20 text-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200 shadow-sm"} border rounded-[32px] space-y-4 max-w-2xl mx-auto p-8`}>
                <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400 shadow-xl shadow-orange-500/5">
                  <History size={32} />
                </div>
                <h3 className={`text-lg font-extrabold ${darkMode ? "text-white" : "text-zinc-900"}`}>{t('watchHistoryTitle')}</h3>
                <p className={`text-xs ${darkMode ? "text-white/60" : "text-zinc-500"} leading-relaxed max-w-md mx-auto`}>
                  {t('emptyHistory')}
                </p>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <Play size={14} fill="currentColor" /> Browse All Streams
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {fullWatchHistory.map((item, idx) => {
                  const matchedVideo = videos.find(v => v.id.toString() === item.videoId);
                  const title = item.title || matchedVideo?.title || 'Watched Stream';
                  const thumbnail = item.thumbnailUrl || matchedVideo?.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                  const category = item.category || matchedVideo?.category || 'Stream';
                  const progressSec = item.progressSeconds || 0;
                  const durationSec = matchedVideo ? 300 : 300; // estimated fallback
                  const percent = Math.min(100, Math.max(5, Math.round((progressSec / durationSec) * 100)));

                  return (
                    <motion.div
                      key={item.videoId}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`group ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm"} border rounded-[28px] overflow-hidden hover:border-orange-500/50 transition-all shadow-xl flex flex-col`}
                    >
                      <VideoThumbnailPreview
                        thumbnailUrl={thumbnail}
                        videoUrl={matchedVideo?.videoUrl}
                        title={title}
                        category={category}
                        aspectRatio="aspect-video"
                      >
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                          <Link
                            to={`/play/${item.videoId}`}
                            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform"
                            title="Resume Video"
                          >
                            <Play fill="currentColor" size={20} className="ml-0.5" />
                          </Link>
                          <button
                            onClick={(e) => handleDeleteHistory(e, item.videoId)}
                            className="w-10 h-10 rounded-2xl bg-red-500/30 hover:bg-red-500/50 text-red-300 border border-red-500/40 flex items-center justify-center transition-all"
                            title="Remove from Watch History"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold uppercase text-orange-400 flex items-center gap-1">
                          <Clock size={10} /> {category}
                        </span>

                        {item.completed ? (
                          <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-emerald-500/90 text-black font-extrabold text-[9px] uppercase shadow">
                            Completed
                          </span>
                        ) : (
                          <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-white/90">
                            {formatDuration(item.progressSeconds)}
                          </span>
                        )}

                        {/* Progress Bar overlay */}
                        {!item.completed && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 z-10">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-500" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                      </VideoThumbnailPreview>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className={`flex justify-between items-center text-[10px] ${darkMode ? "text-white/50" : "text-zinc-500"} font-mono mb-1`}>
                            <span>{formatRelativeTime(item.lastWatchedAt)}</span>
                            {item.playCount && item.playCount > 1 ? (
                              <span className="text-orange-400 font-bold">{item.playCount}x watched</span>
                            ) : null}
                          </div>
                          <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-zinc-900"} line-clamp-1 group-hover:text-orange-400 transition-colors`}>
                            {title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <Link
                            to={`/play/${item.videoId}`}
                            className="flex-1 py-2 text-center rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black font-extrabold text-[11px] uppercase transition-all flex items-center justify-center gap-1.5"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>{t('resumePlayback')}</span>
                          </Link>
                          <button
                            onClick={(e) => handleDeleteHistory(e, item.videoId)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                            title="O'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : isVaultTab ? (
          <div className="space-y-6">
            <div className={`flex justify-between items-center pb-4 border-b ${darkMode ? "border-white/10" : "border-zinc-200"}`} >
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <Download className="text-green-400" size={24} /> {t('offlineVaultTitle')}
                </h2>
                <p className={`text-xs ${darkMode ? "text-white/60" : "text-zinc-500"}`} >AES-256 Encrypted Offline Playback Vault</p>
              </div>
            </div>

            {offlineVault.length === 0 ? (
              <div className={`py-20 text-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200 shadow-sm"} border rounded-[32px] space-y-3`} >
                <Lock size={40} className={darkMode ? "text-white/20 mx-auto" : "text-zinc-300 mx-auto"} />
                <h3 className={`text-base font-bold ${darkMode ? "text-white/80" : "text-zinc-800"}`} >Offline Vault Empty</h3>
                <p className={`text-xs ${darkMode ? "text-white/50" : "text-zinc-500"} max-w-md mx-auto`} >
                  {appSettings?.emptyVaultDesc || "Download animations, shorts, or music tracks while connected to stream them anytime without internet connection."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {offlineVault.map((item) => (
                  <div key={item.id} className={`${darkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200 shadow-sm"} border rounded-3xl p-4 flex gap-4 items-center`} >
                    <img src={item.thumbnailUrl} alt={item.title} className="w-24 h-20 rounded-2xl object-cover shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{item.category}</span>
                      <h4 className={`text-xs font-bold ${darkMode ? "text-white" : "text-zinc-900"} truncate mt-1`}>{item.title}</h4>
                      <p className={`text-[10px] ${darkMode ? "text-white/40" : "text-zinc-500"}`} >{item.fileSize} • Downloaded {item.downloadedAt}</p>
                      <div className="flex gap-2 mt-2">
                        <Link 
                          to={`/play/vault_${item.id}`}
                          className="px-3 py-1 rounded-xl bg-green-500 text-black text-[10px] font-extrabold hover:bg-green-400 transition-colors"
                        >
                          Play Offline
                        </Link>
                        <button
                          onClick={() => removeFromVault(item.id)}
                          className="px-2 py-1 rounded-xl bg-red-500/10 text-red-500 text-[10px] hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          
          /* Main Video Grid */
          <div className="space-y-6">
            {/* Hero Banner Container - ONLY shown when enabled in Admin Panel and title is provided */}
            {appSettings?.showHeroBanner && appSettings?.heroTitle?.trim() && (
              <div className={`p-6 md:p-10 mb-8 rounded-3xl ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200 shadow-sm"} border flex flex-col justify-center items-center text-center shadow-lg`}>
                <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-zinc-900"} mb-4`}>
                  {appSettings.heroTitle}
                </h1>
                {appSettings.heroSubtitle && (
                  <p className={`text-sm md:text-base max-w-2xl ${darkMode ? "text-white/70" : "text-zinc-600"}`}>
                    {appSettings.heroSubtitle}
                  </p>
                )}
              </div>
            )}


            {/* Continue Watching Section */}
            {continueWatchingVideos.length > 0 && selectedCategory === 'All' && !searchQuery && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-bold tracking-tight ${darkMode ? "text-white" : "text-zinc-900"} flex items-center gap-2`}>
                    <Clock className="text-orange-500" size={20} />
                    <span>Continue Watching</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {continueWatchingVideos.map((video, idx) => {
                    return (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`group ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm"} border rounded-[28px] overflow-hidden hover:border-orange-500/50 transition-all shadow-xl`}
                      >
                        <VideoThumbnailPreview
                          thumbnailUrl={video.thumbnailUrl}
                          videoUrl={video.videoUrl}
                          title={video.title}
                          category={video.category}
                          aspectRatio="aspect-video"
                        >
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                            <Link
                              to={`/play/${video.id}`}
                              className="w-12 h-12 rounded-2xl bg-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform"
                            >
                              <Play fill="currentColor" size={20} className="ml-0.5" />
                            </Link>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
                            <div className="h-full bg-orange-500 w-1/2 rounded-r"></div>
                          </div>
                          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold uppercase text-orange-400">
                            {video.category}
                          </span>
                        </VideoThumbnailPreview>
                        <div className="p-4 space-y-2">
                          <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-zinc-900"} line-clamp-1 group-hover:text-orange-500 transition-colors`}>
                            {video.title}
                          </h3>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold tracking-tight ${darkMode ? "text-white" : "text-zinc-900"} flex items-center gap-2`}>
                  {selectedCategory === 'Premieres' ? (
                    <Radio className="text-rose-500 animate-pulse" size={20} />
                  ) : (
                    <Flame className="text-orange-500" size={20} />
                  )}
                  <span>{selectedCategory} Content</span>
                </h2>
                <span className={`text-xs font-mono ${darkMode ? "text-white/50" : "text-zinc-500"}`}>({filteredVideos.length})</span>
              </div>

              {/* Layout Switcher Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <div className={`p-1 rounded-2xl border flex items-center gap-1 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200 shadow-sm"}`}>
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      layoutMode === 'grid'
                        ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                        : darkMode ? 'text-white/60 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Grid Ko'rinishi (Grid Layout)"
                  >
                    <LayoutGrid size={14} />
                    <span className="hidden md:inline text-[11px]">Grid</span>
                  </button>

                  <button
                    onClick={() => setLayoutMode('list')}
                    className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      layoutMode === 'list'
                        ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                        : darkMode ? 'text-white/60 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Ro'yxat Ko'rinishi (List Layout)"
                  >
                    <List size={14} />
                    <span className="hidden md:inline text-[11px]">Ro'yxat</span>
                  </button>

                  <button
                    onClick={() => setLayoutMode('cinematic')}
                    className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      layoutMode === 'cinematic'
                        ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                        : darkMode ? 'text-white/60 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Kinematik Ko'rinish (Cinematic Slider Layout)"
                  >
                    <Layers size={14} />
                    <span className="hidden md:inline text-[11px]">Kinematik</span>
                  </button>
                </div>
              </div>
            </div>

            {filteredVideos.length === 0 ? (
              <div className={`py-20 text-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200 shadow-sm"} border rounded-[32px] space-y-3`}>
                <Search size={40} className={darkMode ? "text-white/20 mx-auto" : "text-zinc-300 mx-auto"} />
                <h3 className={`text-base font-bold ${darkMode ? "text-white/80" : "text-zinc-800"}`}>No Media Found</h3>
                <p className={`text-xs ${darkMode ? "text-white/50" : "text-zinc-500"}`}>{appSettings?.noMediaDesc || "Try adjusting your search query or selected category filter."}</p>
              </div>
            ) : layoutMode === 'grid' ? (
              /* GRID LAYOUT */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video, idx) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`group ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm"} border rounded-[28px] overflow-hidden hover:border-orange-500/50 transition-all shadow-xl`}
                    style={{
                      borderColor: video.accentColor ? `${video.accentColor}33` : undefined
                    }}
                  >
                    <VideoThumbnailPreview
                      thumbnailUrl={video.thumbnailUrl}
                      videoUrl={video.videoUrl}
                      title={video.title}
                      category={video.category}
                      isPremiere={Boolean(video.isPremiere)}
                      aspectRatio="aspect-video"
                    >
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <Link
                          to={`/play/${video.id}`}
                          className="w-12 h-12 rounded-2xl bg-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: video.accentColor || undefined
                          }}
                        >
                          <Play fill="currentColor" size={20} className="ml-0.5" />
                        </Link>
                        <button
                          onClick={() => handleDownloadOffline(video)}
                          className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all"
                          title={t('downloadOffline')}
                        >
                          <Download size={18} />
                        </button>
                      </div>

                      {/* Live Premiere Badge */}
                      {Boolean(video.isPremiere) && (
                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-rose-500/30 backdrop-blur-md">
                          <Radio size={10} className="animate-ping" /> PREMYERA
                        </span>
                      )}

                      {!video.isPremiere && (
                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold uppercase text-orange-400">
                          {formatCategoryLabel(video.category, language)}
                        </span>
                      )}

                      {/* Card Favorite Button */}
                      <button
                        onClick={(e) => handleToggleCardFavorite(e, video)}
                        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                          favorites.some(f => f.videoId === video.id.toString())
                            ? 'bg-black/80 border border-amber-500/50 text-amber-400 shadow-md'
                            : 'bg-black/40 border border-white/20 text-white/70 hover:text-amber-400 hover:bg-black/70'
                        }`}
                        title={favorites.some(f => f.videoId === video.id.toString()) ? "Remove from Favorites" : "Save to Favorites"}
                      >
                        <Star size={14} fill={favorites.some(f => f.videoId === video.id.toString()) ? "currentColor" : "none"} />
                      </button>
                    </VideoThumbnailPreview>

                    <div className="p-4 space-y-2">
                      <div className={`flex justify-between items-center text-[10px] ${darkMode ? "text-white/50" : "text-zinc-500"} font-mono`}>
                        <span>{formatViewsCount(video.views, language)}</span>
                        <span className="text-emerald-500 font-semibold">4K HDR</span>
                      </div>
                      <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-zinc-900"} line-clamp-1 group-hover:text-orange-500 transition-colors`}>
                        {video.title}
                      </h3>
                      <p className={`text-xs ${darkMode ? "text-white/60" : "text-zinc-600"} line-clamp-2 leading-relaxed`}>
                        {video.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : layoutMode === 'list' ? (
              /* LIST LAYOUT */
              <div className="space-y-4">
                {filteredVideos.map((video, idx) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`group ${darkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm"} border rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-orange-500/40`}
                    style={{
                      borderLeftWidth: '6px',
                      borderLeftColor: video.accentColor || '#f97316'
                    }}
                  >
                    <div className="relative w-full sm:w-56 aspect-video rounded-2xl overflow-hidden shrink-0">
                      <VideoThumbnailPreview
                        thumbnailUrl={video.thumbnailUrl}
                        videoUrl={video.videoUrl}
                        title={video.title}
                        category={video.category}
                        isPremiere={Boolean(video.isPremiere)}
                        aspectRatio="aspect-video"
                        className="rounded-2xl"
                      >
                        {Boolean(video.isPremiere) && (
                          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase">
                            PREMYERA
                          </span>
                        )}
                      </VideoThumbnailPreview>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase">
                          {formatCategoryLabel(video.category, language)}
                        </span>
                        <span className={`text-[11px] font-mono ${darkMode ? "text-white/50" : "text-zinc-500"}`}>
                          {formatViewsCount(video.views, language)} • 4K HDR
                        </span>
                        {video.isPremiere && video.premiereTime && (
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            {new Date(video.premiereTime).toLocaleDateString()} {new Date(video.premiereTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-bold text-base ${darkMode ? "text-white" : "text-zinc-900"} truncate`}>
                        {video.title}
                      </h3>
                      <p className={`text-xs ${darkMode ? "text-white/60" : "text-zinc-600"} line-clamp-2 leading-relaxed`}>
                        {video.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0">
                      <Link
                        to={`/play/${video.id}`}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
                        style={{
                          backgroundColor: video.accentColor || undefined
                        }}
                      >
                        <Play size={14} fill="currentColor" /> {t('watchNow')}
                      </Link>
                      <button
                        onClick={(e) => handleToggleCardFavorite(e, video)}
                        className={`p-2.5 rounded-2xl border transition-all ${
                          favorites.some(f => f.videoId === video.id.toString())
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : darkMode ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                        }`}
                        title="Favorite"
                      >
                        <Star size={16} fill={favorites.some(f => f.videoId === video.id.toString()) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* CINEMATIC SHOWCASE LAYOUT */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredVideos.map((video, idx) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative rounded-[36px] overflow-hidden border shadow-2xl transition-all duration-500 ${
                      darkMode ? "bg-black/90 border-white/15" : "bg-white border-zinc-200"
                    }`}
                  >
                    {/* Dynamic Ambient Blur Glow behind card */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-25 blur-xl scale-110 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
                      style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
                    />
                    <div className={`absolute inset-0 ${darkMode ? "bg-gradient-to-t from-black via-black/80 to-transparent" : "bg-gradient-to-t from-white via-white/80 to-transparent"} pointer-events-none`} />

                    <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between min-h-[340px]">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            {Boolean(video.isPremiere) ? (
                              <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
                                <Radio size={12} className="animate-pulse" /> Jonli Premyera
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-extrabold uppercase tracking-wider">
                                {video.category}
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${darkMode ? "bg-white/10 text-white/70" : "bg-zinc-100 text-zinc-600"}`}>
                              4K Stream
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleToggleCardFavorite(e, video)}
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                              favorites.some(f => f.videoId === video.id.toString())
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : darkMode ? 'bg-white/10 text-white/60 hover:text-white' : 'bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-200'
                            }`}
                          >
                            <Star size={16} fill={favorites.some(f => f.videoId === video.id.toString()) ? "currentColor" : "none"} />
                          </button>
                        </div>

                        <h3 className={`text-xl sm:text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"} mb-2 leading-tight`}>
                          {video.title}
                        </h3>
                        <p className={`text-xs sm:text-sm ${darkMode ? "text-white/70" : "text-zinc-600"} line-clamp-3 leading-relaxed max-w-xl`}>
                          {video.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-6 mt-4 border-t border-white/10">
                        <div className={`text-xs font-mono ${darkMode ? "text-white/60" : "text-zinc-500"}`}>
                          <span>{video.views} viewers • Encrypted HD</span>
                        </div>

                        <Link
                          to={`/play/${video.id}`}
                          className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl shadow-orange-500/25"
                          style={{
                            backgroundColor: video.accentColor || undefined
                          }}
                        >
                          <Play size={16} fill="currentColor" /> {video.isPremiere ? "Premyeraga Kirish" : "Tomosha Qilish"}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Rich Footer with Admin Details & Social Links */}
      <Footer />

      {/* Real-time 24/7 Support Chat with Admin */}
      <SupportChatWidget />

      {/* Mobile Sticky Navigation Bar */}
      <MobileNavBar />
    </div>
  );
}

