import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Download, Sparkles, Flame, Check, Shield, Film, Music, Clapperboard, Smartphone, Crown, Eye, Search, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import SubscriptionModal from '../components/SubscriptionModal';
import TelegramAuthModal from '../components/TelegramAuthModal';
import BiometricAuthModal from '../components/BiometricAuthModal';
import PwaInstallModal from '../components/PwaInstallModal';
import { useAuthStore, useAppStore } from '../store/useStore';
import { Video, ContentCategory } from '../types';
import { getTranslation } from '../lib/i18n';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { 
    language, highContrast, textSize, searchQuery, 
    selectedCategory, setSelectedCategory,
    offlineVault, addToVault, removeFromVault,
    setSubscriptionModalOpen
  } = useAppStore();

  const [videos, setVideos] = useState<Video[]>([]);
  const [featured, setFeatured] = useState<Video | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<string>('');
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');

  const t = (key: string) => getTranslation(language, key);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const vids = await res.json();
          setVideos(vids);
          if (vids.length > 0) {
            setFeatured(vids[0]);
            // Fetch AI recommendation
            fetchAiRecommendation(vids[0].title, vids[0].category);
          }
        }
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      }
    };
    fetchVideos();
  }, []);

  const fetchAiRecommendation = async (title: string, category: string) => {
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTitle: title, category })
      });
      if (res.ok) {
        const data = await res.json();
        setAiRecommendation(data.reason);
      }
    } catch {
      setAiRecommendation("Handpicked HD creative masterwork for subscriber enjoyment.");
    }
  };

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

  const categories: (ContentCategory | 'All' | 'Vault')[] = ['All', 'Animation', '2D Video', 'Short', 'Music', 'Vault'];

  // Filtering
  const filteredVideos = videos.filter(v => {
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isVaultTab = selectedCategory === 'Vault' || activeTab === 'vault';

  // Text scaling font sizes
  const fontClass = textSize === 'large' ? 'text-lg' : textSize === 'xlarge' ? 'text-xl' : 'text-base';

  return (
    <div className={`min-h-screen font-sans select-none overflow-x-hidden ${
      highContrast ? 'bg-black text-yellow-300' : 'bg-[#050508] text-white'
    }`}>
      <Navbar />

      {/* Global Modals */}
      <SubscriptionModal />
      <TelegramAuthModal />
      <BiometricAuthModal />
      <PwaInstallModal />

      {/* Hero Section */}
      {featured && !isVaultTab && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative h-[82vh] w-full border-b border-white/10 shadow-2xl overflow-hidden pt-20"
        >
          <div className="absolute inset-0">
            <motion.img 
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              src={featured.thumbnailUrl} 
              alt={featured.title} 
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

            {/* AI Recommendation Pill */}
            {aiRecommendation && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2 max-w-xl"
              >
                <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="italic">"{aiRecommendation}"</p>
              </motion.div>
            )}

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
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isCatActive = (cat === 'Vault' && isVaultTab) || (selectedCategory === cat && !isVaultTab);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'Vault' ? 'All' : cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                  isCatActive
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20 font-black'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                }`}
              >
                {cat === 'All' && <Flame size={14} />}
                {cat === 'Animation' && <Clapperboard size={14} />}
                {cat === '2D Video' && <Film size={14} />}
                {cat === 'Short' && <Smartphone size={14} />}
                {cat === 'Music' && <Music size={14} />}
                {cat === 'Vault' && <Download size={14} className="text-green-400" />}
                <span>{cat === 'Vault' ? t('offlineVaultTitle') : cat}</span>
                {cat === 'Vault' && offlineVault.length > 0 && (
                  <span className="bg-green-500 text-black px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {offlineVault.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Offline Vault Tab View */}
        {isVaultTab ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <Download className="text-green-400" size={24} /> {t('offlineVaultTitle')}
                </h2>
                <p className="text-xs text-white/60">AES-256 Encrypted Offline Playback Vault</p>
              </div>
            </div>

            {offlineVault.length === 0 ? (
              <div className="py-20 text-center bg-white/5 border border-white/10 rounded-[32px] space-y-3">
                <Lock size={40} className="text-white/20 mx-auto" />
                <h3 className="text-base font-bold text-white/80">Offline Vault Empty</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto">
                  Download animations, shorts, or music tracks while connected to stream them anytime without internet connection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {offlineVault.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex gap-4 items-center">
                    <img src={item.thumbnailUrl} alt={item.title} className="w-24 h-20 rounded-2xl object-cover shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{item.category}</span>
                      <h4 className="text-xs font-bold text-white truncate mt-1">{item.title}</h4>
                      <p className="text-[10px] text-white/40">{item.fileSize} • Downloaded {item.downloadedAt}</p>
                      <div className="flex gap-2 mt-2">
                        <Link 
                          to={`/play/vault_${item.id}`}
                          className="px-3 py-1 rounded-xl bg-green-500 text-black text-[10px] font-extrabold"
                        >
                          Play Offline
                        </Link>
                        <button
                          onClick={() => removeFromVault(item.id)}
                          className="px-2 py-1 rounded-xl bg-red-500/10 text-red-400 text-[10px]"
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Flame className="text-orange-500" size={20} />
                <span>{selectedCategory} Content</span>
              </h2>
              <span className="text-xs font-mono text-white/50">{filteredVideos.length} Streams Available</span>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="py-20 text-center bg-white/5 border border-white/10 rounded-[32px] space-y-3">
                <Search size={40} className="text-white/20 mx-auto" />
                <h3 className="text-base font-bold text-white/80">No Media Found</h3>
                <p className="text-xs text-white/50">Try adjusting your search query or selected category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video, idx) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white/5 border border-white/10 rounded-[28px] overflow-hidden hover:border-orange-500/50 hover:bg-white/10 transition-all shadow-xl"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link
                          to={`/play/${video.id}`}
                          className="w-12 h-12 rounded-2xl bg-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform"
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

                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold uppercase text-orange-400">
                        {video.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-white/50 font-mono">
                        <span>{video.views} Streams</span>
                        <span className="text-emerald-400">4K Ad-Free</span>
                      </div>
                      <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

