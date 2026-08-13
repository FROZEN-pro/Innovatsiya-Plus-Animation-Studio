import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Check, Shield, Sparkles, Globe, Settings, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { Video } from '../types';
import { saveOfflineData, getOfflineData } from '../lib/encryption';
import { useAppStore } from '../store/useStore';
import { languages } from '../lib/i18n';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { offlineVault, addToVault, language } = useAppStore();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'4K' | '1080p' | '720p'>('4K');
  const [subtitleLang, setSubtitleLang] = useState<string>('en');
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  
  const lastSyncTime = useRef<number>(0);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    const progressSeconds = target.currentTime;
    const isCompleted = target.currentTime >= target.duration * 0.9; // 90% watched = complete
    
    const now = Date.now();
    // Only sync every 10 seconds to save Firestore writes
    if (now - lastSyncTime.current > 10000 || isCompleted) {
      lastSyncTime.current = now;
      if (auth.currentUser && id && !id.startsWith('vault_')) {
        setDoc(doc(db, `users/${auth.currentUser.uid}/watchHistory/${id}`), {
          videoId: id,
          progressSeconds: Math.floor(progressSeconds),
          completed: isCompleted,
          lastWatchedAt: now
        }, { merge: true }).catch(console.error);
      }
    }
  };

  useEffect(() => {
    if (!id) return;

    // Check if vault item
    if (id.startsWith('vault_')) {
      const foundVault = offlineVault.find(item => item.id === id);
      if (foundVault) {
        setVideo({
          id: 0,
          title: foundVault.title,
          description: "Offline Vault Stream (Encrypted AES-256 Cached Local Asset)",
          videoUrl: foundVault.encryptedBlobUrl,
          thumbnailUrl: foundVault.thumbnailUrl,
          category: foundVault.category,
          views: 1
        });
        setIsSavedOffline(true);
        return;
      }
    }

    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${id}`);
        if (res.ok) {
          const vData = await res.json();
          setVideo(vData);
          
          const local = getOfflineData(id);
          if (local) setIsSavedOffline(true);
        } else {
          throw new Error('Video not found');
        }
      } catch {
        const offlineData = getOfflineData(id);
        if (offlineData) {
          setVideo(offlineData);
          setIsSavedOffline(true);
        }
      }
    };

    const fetchRelated = async () => {
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const all = await res.json();
          setRelatedVideos(all.filter((v: Video) => String(v.id) !== String(id)));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchVideo();
    fetchRelated();
  }, [id, offlineVault]);

  useEffect(() => {
    // Generate AI simulated live subtitles based on selected subtitle language
    const currentLangObj = languages.find(l => l.code === subtitleLang);
    if (video) {
      setSubtitleText(`[${currentLangObj?.name || 'English'} Subtitles] - "Experience high definition ad-free streaming on Innovation Plus."`);
    }
  }, [subtitleLang, video]);

  const handleSaveOffline = () => {
    if (!video || !id) return;
    saveOfflineData(String(video.id), video);
    addToVault({
      id: `vault_${video.id}`,
      title: video.title,
      category: video.category as any,
      encryptedBlobUrl: video.videoUrl,
      downloadedAt: new Date().toLocaleDateString(),
      fileSize: '48.2 MB',
      thumbnailUrl: video.thumbnailUrl
    });
    setIsSavedOffline(true);
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col font-sans select-none">
      
      {/* Header */}
      <div className={`p-4 sm:p-6 flex items-center justify-between border-b ${darkMode ? "border-white/10" : "border-black/10"} bg-[#0a0a0f]/80 backdrop-blur-md`}>
        <button 
          onClick={() => navigate('/dashboard')} 
          className={`flex items-center gap-2 ${darkMode ? "text-white/60" : "text-black/60"} hover:text-orange-400 font-bold text-xs uppercase tracking-wider transition-all`}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 bg-emerald-500/10">
            <Shield size={12} /> E2E Encrypted HD Stream
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Stream Player & Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 space-y-6"
        >
          
          {/* Cinema Player Container */}
          <div className={`aspect-video w-full bg-black rounded-[32px] overflow-hidden shadow-2xl border ${darkMode ? "border-white/10" : "border-black/10"} relative group`}>
            <video 
              controls 
              autoPlay 
              src={video.videoUrl} 
              poster={video.thumbnailUrl}
              className="w-full h-full object-contain"
              controlsList="nodownload"
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Live Subtitle Overlay */}
            {subtitleText && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-xl border ${darkMode ? "border-white/10" : "border-black/10"} text-xs sm:text-sm text-yellow-300 font-medium text-center max-w-lg pointer-events-none`}
              >
                {subtitleText}
              </motion.div>
            )}
          </div>

          {/* Stream Controls & Details */}
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-extrabold uppercase">
                  {video.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-tight">
                  {video.title}
                </h1>
                <p className="text-xs text-white/50 mt-1 font-mono">{video.views} Members Streaming</p>
              </div>

              {/* Quality & Subtitle Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                
                {/* Quality Picker */}
                <div className={`flex items-center gap-1 ${darkMode ? "bg-white/5" : "bg-black/5"} border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl p-1 text-xs`}>
                  {(['4K', '1080p', '720p'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuality(q)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all ${
                        selectedQuality === q ? 'bg-orange-500 text-black' : (darkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Subtitle Language Switcher */}
                <div className={`flex items-center gap-1.5 ${darkMode ? "bg-white/5" : "bg-black/5"} border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-3 py-1 text-xs`}>
                  <Globe size={14} className="text-amber-400" />
                  <select
                    value={subtitleLang}
                    onChange={(e) => setSubtitleLang(e.target.value)}
                    className="bg-transparent text-white/80 focus:outline-none text-xs cursor-pointer"
                  >
                    {languages.map(l => (
                      <option key={l.code} value={l.code} className="bg-[#0a0a0f] text-white">
                        Subtitles: {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Offline Save Action */}
                <button
                  onClick={handleSaveOffline}
                  disabled={isSavedOffline}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                    isSavedOffline
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                  title="Save Encrypted Stream for Offline Playback"
                >
                  {isSavedOffline ? <Check size={16} /> : <Download size={16} />}
                  <span className="hidden sm:inline">{isSavedOffline ? 'In Vault' : 'Offline'}</span>
                </button>

              </div>
            </div>

            {/* Description Card */}
            <div className={`p-5 rounded-3xl ${darkMode ? "bg-white/5" : "bg-black/5"} border ${darkMode ? "border-white/10" : "border-black/10"} text-xs ${darkMode ? "text-white/80" : "text-black/80"} leading-relaxed space-y-2`}>
              <p className="font-medium text-white/90">{video.description}</p>
              <div className={`pt-2 border-t ${darkMode ? "border-white/10" : "border-black/10"} flex items-center gap-2 text-[10px] font-mono text-amber-400`}>
                <Sparkles size={12} />
                <span>Private Subscriber HD Copy • Encrypted Stream Token Active</span>
              </div>
            </div>

          </div>

        </motion.div>

        {/* AI Recommendations Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className={`flex items-center justify-between pb-2 border-b ${darkMode ? "border-white/10" : "border-black/10"}`}>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" /> Related VIP Streams
            </h3>
            <span className="text-[10px] text-white/40 font-mono">AI Curated</span>
          </div>

          <div className="space-y-3">
            {relatedVideos.map((item, idx) => (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                key={item.id}
                onClick={() => navigate(`/play/${item.id}`)}
                className={`w-full flex gap-3 p-2.5 rounded-2xl ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} border ${darkMode ? "border-white/10" : "border-black/10"} text-left transition-all group`}
              >
                <img src={item.thumbnailUrl} alt={item.title} className="w-24 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" />
                <div className="overflow-hidden space-y-1">
                  <span className="text-[9px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-white/50 line-clamp-1">{item.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

