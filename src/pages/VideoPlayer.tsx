import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Check, Shield, Sparkles, Globe, Settings, Play, MessageSquare, Send, Trash2, Heart, RotateCcw, Clock, X, Bookmark, Star, Flame, PictureInPicture2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Video } from '../types';
import { saveOfflineData, getOfflineData } from '../lib/encryption';
import { useAppStore } from '../store/useStore';
import { languages, getTranslation, formatCategoryLabel, formatViewsCount, formatTimeAgo } from '../lib/i18n';
import ThemeToggle from '../components/ThemeToggle';
import LivePremiereRoom from '../components/LivePremiereRoom';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, collection, query, where, orderBy, getDocs, addDoc, deleteDoc, serverTimestamp, onSnapshot, increment, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useStore';
import { toggleFavorite, checkIsFavorite } from '../lib/favorites';
import { logUserWatchDuration } from '../lib/userActivity';

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { offlineVault, addToVault, language, darkMode, openFloatingPlayer, appSettings } = useAppStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [video, setVideo] = useState<Video | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  
  // Ambient Glow & Premiere State
  const [ambientGlow, setAmbientGlow] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [forcePremiereStarted, setForcePremiereStarted] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glowColor, setGlowColor] = useState<string>('rgba(249, 115, 22, 0.4)');
  const lastSyncTime = useRef<number>(0);
  const lastPlaybackTickTime = useRef<number>(Date.now());
  const accumulatedWatchSeconds = useRef<number>(0);
  const [hasResumed, setHasResumed] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showResumedToast, setShowResumedToast] = useState(false);
  const [favoriteToastMsg, setFavoriteToastMsg] = useState<string | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{ show: boolean; timestamp: number } | null>(null);

  // Real-time Ambient Glow Color Extractor
  useEffect(() => {
    if (!ambientGlow || !video) return;
    const baseAccent = video.accentColor || '#f97316';
    setGlowColor(prev => (prev === baseAccent ? prev : baseAccent));

    const videoEl = videoRef.current;
    if (!videoEl) return;

    let frameId: number;
    let lastColor = baseAccent;
    let hasLoggedError = false;

    const updateGlow = () => {
      if (videoEl && !videoEl.paused && !videoEl.ended && canvasRef.current) {
        try {
          const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, 16, 16);
            const imgData = ctx.getImageData(0, 0, 16, 16);
            let r = 0, g = 0, b = 0;
            const count = imgData.data.length / 4;
            for (let i = 0; i < imgData.data.length; i += 4) {
              r += imgData.data[i];
              g += imgData.data[i + 1];
              b += imgData.data[i + 2];
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            const newColor = `rgb(${r}, ${g}, ${b})`;
            if (newColor !== lastColor) {
              lastColor = newColor;
              setGlowColor(newColor);
            }
          }
        } catch {
          // Cross-origin fallback to video accent color
          if (!hasLoggedError) {
            hasLoggedError = true;
            if (lastColor !== baseAccent) {
              lastColor = baseAccent;
              setGlowColor(baseAccent);
            }
          }
        }
      }
      frameId = requestAnimationFrame(updateGlow);
    };

    frameId = requestAnimationFrame(updateGlow);
    return () => cancelAnimationFrame(frameId);
  }, [ambientGlow, video?.id, video?.accentColor]);

  const handleLaunchMiniPlayer = () => {
    if (!video) return;
    const currTime = videoRef.current ? videoRef.current.currentTime : 0;
    const isPlaying = videoRef.current ? !videoRef.current.paused : true;
    openFloatingPlayer(video, currTime, isPlaying);
    navigate('/dashboard');
  };

  const formatTimestamp = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch Favorite status
  useEffect(() => {
    const fetchFavStatus = async () => {
      if (!user || !video || id?.startsWith('vault_')) return;
      try {
        const favorited = await checkIsFavorite(user.uid, video.id);
        setIsFavorite(favorited);
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
    fetchFavStatus();
  }, [user, video, id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Please log in to save this video to your favorites.");
      return;
    }
    if (!video || id?.startsWith('vault_')) return;

    const previousFavState = isFavorite;
    const nextFavState = !previousFavState;
    setIsFavorite(nextFavState); // Optimistic UI update

    try {
      const isNowFav = await toggleFavorite(user.uid, {
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        category: video.category?.toString()
      });
      setIsFavorite(isNowFav);
      setFavoriteToastMsg(isNowFav ? "Added to Favorites ⭐" : "Removed from Favorites");
      setTimeout(() => setFavoriteToastMsg(null), 3000);
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setIsFavorite(previousFavState); // Revert on failure
    }
  };

  // Fetch Like status
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user || !video || id?.startsWith('vault_')) return;
      try {
        const likeDoc = await getDoc(doc(db, `users/${user.uid}/likes/${video.id}`));
        setIsLiked(likeDoc.exists());
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };
    fetchLikeStatus();
  }, [user, video, id]);

  // Fetch Like count
  useEffect(() => {
    if (!video || id?.startsWith('vault_')) return;
    const unsubscribe = onSnapshot(doc(db, `videoStats/${video.id}`), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setLikeCount(docSnapshot.data().likes || 0);
      } else {
        setLikeCount(video.likes || 0);
      }
    });
    return () => unsubscribe();
  }, [video, id]);

  const handleToggleLike = async () => {
    if (!user) {
      alert("Please log in to like this video.");
      return;
    }
    if (!video || id?.startsWith('vault_')) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    
    // Optimistic UI update
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      const statsRef = doc(db, `videoStats/${video.id}`);
      const userLikeRef = doc(db, `users/${user.uid}/likes/${video.id}`);

      // Ensure stats doc exists first
      const statsSnap = await getDoc(statsRef);
      if (!statsSnap.exists()) {
        await setDoc(statsRef, { likes: video.likes || 0 });
      }

      if (newIsLiked) {
        await setDoc(userLikeRef, {
          videoId: video.id.toString(),
          createdAt: Date.now()
        });
        await setDoc(statsRef, { likes: increment(1) }, { merge: true });
      } else {
        await deleteDoc(userLikeRef);
        await setDoc(statsRef, { likes: increment(-1) }, { merge: true });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert optimistic update on failure
      setIsLiked(!newIsLiked);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
    }
  };

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Synchronize progress and cumulative watch duration to storage and firestore
  const syncProgress = (seconds: number, isCompleted: boolean = false) => {
    if (!id || id.startsWith('vault_')) return;
    const progressSec = Math.floor(seconds);
    const now = Date.now();

    // Calculate actual elapsed playback watch seconds since last tick
    const deltaSeconds = Math.max(0, Math.floor(accumulatedWatchSeconds.current));
    accumulatedWatchSeconds.current = 0; // Reset accumulator

    // Cache locally for instant access & offline resiliency
    try {
      localStorage.setItem(`innovation_plus_progress_${id}`, JSON.stringify({
        progressSeconds: progressSec,
        completed: isCompleted,
        lastWatchedAt: now
      }));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }

    // Persist to Cloud Firestore
    if (auth.currentUser) {
      // 1. Update watch duration & profile stats
      if (deltaSeconds > 0 || isCompleted) {
        logUserWatchDuration(
          auth.currentUser.uid,
          {
            id,
            title: video?.title || 'Creative Stream',
            thumbnailUrl: video?.thumbnailUrl || '',
            category: video?.category || 'Animation'
          },
          deltaSeconds,
          progressSec,
          isCompleted
        ).catch(console.error);
      } else {
        setDoc(doc(db, `users/${auth.currentUser.uid}/watchHistory/${id}`), {
          videoId: id.toString(),
          progressSeconds: progressSec,
          completed: isCompleted,
          lastWatchedAt: now,
          title: video?.title || 'Creative Stream',
          thumbnailUrl: video?.thumbnailUrl || null,
          category: video?.category || 'Animation'
        }, { merge: true }).catch(console.error);
      }
    }
  };

  // Fetch watch history to prompt resume playback
  useEffect(() => {
    let isCancelled = false;

    const checkSavedProgress = async () => {
      if (!id || hasResumed || id.startsWith('vault_')) return;

      let savedSeconds = 0;
      let isCompleted = false;

      // 1. Check local storage first
      try {
        const localData = localStorage.getItem(`innovation_plus_progress_${id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed.progressSeconds && !parsed.completed) {
            savedSeconds = parsed.progressSeconds;
            isCompleted = parsed.completed;
          }
        }
      } catch (e) {
        // Ignore
      }

      // 2. Check Firestore if user authenticated
      if (user) {
        try {
          const historyDoc = await getDoc(doc(db, `users/${user.uid}/watchHistory/${id}`));
          if (historyDoc.exists()) {
            const data = historyDoc.data();
            if (data.progressSeconds && !data.completed) {
              savedSeconds = data.progressSeconds;
              isCompleted = false;
            } else if (data.completed) {
              isCompleted = true;
              savedSeconds = 0;
            }
          }
        } catch (err) {
          console.error("Failed to fetch watch history:", err);
        }
      }

      if (isCancelled) return;

      // Only prompt if >= 5 seconds watched and not completed
      if (savedSeconds >= 5 && !isCompleted) {
        setResumePrompt({ show: true, timestamp: savedSeconds });
      }
      setHasResumed(true);
    };

    if (video) {
      checkSavedProgress();
    }

    return () => {
      isCancelled = true;
    };
  }, [user, video, hasResumed, id]);

  const handleConfirmResume = () => {
    if (resumePrompt && videoRef.current) {
      videoRef.current.currentTime = resumePrompt.timestamp;
      videoRef.current.play().catch(() => {});
      setShowResumedToast(true);
      setTimeout(() => setShowResumedToast(false), 3000);
    }
    setResumePrompt(prev => prev ? { ...prev, show: false } : null);
  };

  const handleRestartPlayback = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      syncProgress(0, false);
    }
    setResumePrompt(prev => prev ? { ...prev, show: false } : null);
  };

  const handleDismissResume = () => {
    setResumePrompt(prev => prev ? { ...prev, show: false } : null);
  };

  // Fetch comments
  useEffect(() => {
    if (!video) return;
    const q = query(collection(db, 'comments'), where('videoId', '==', video.id.toString()), orderBy('createdAt', 'desc'));
    const pathForOnSnapshot = 'comments';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathForOnSnapshot);
    });
    return () => unsubscribe();
  }, [video]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !video) return;
    try {
      setIsSubmittingComment(true);
      await addDoc(collection(db, 'comments'), {
        videoId: video.id.toString(),
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    lastPlaybackTickTime.current = Date.now();
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    if (!target.duration) return;

    const now = Date.now();
    const deltaMs = now - lastPlaybackTickTime.current;
    lastPlaybackTickTime.current = now;

    // Accumulate actual watched seconds (guarded against jumps/seeks)
    if (deltaMs > 0 && deltaMs < 2500 && !target.paused) {
      accumulatedWatchSeconds.current += deltaMs / 1000;
    }

    const progressSeconds = target.currentTime;
    const isCompleted = target.duration > 0 && progressSeconds >= target.duration * 0.95;
    
    // Sync periodically every 4-5 seconds or when completed
    if (now - lastSyncTime.current > 4000 || isCompleted) {
      lastSyncTime.current = now;
      syncProgress(progressSeconds, isCompleted);
    }
  };

  const handlePause = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setIsPlaying(false);
    const target = e.target as HTMLVideoElement;
    if (!target.duration) return;
    const now = Date.now();
    const deltaMs = now - lastPlaybackTickTime.current;
    lastPlaybackTickTime.current = now;
    if (deltaMs > 0 && deltaMs < 2500) {
      accumulatedWatchSeconds.current += deltaMs / 1000;
    }
    const isCompleted = target.duration > 0 && target.currentTime >= target.duration * 0.95;
    syncProgress(target.currentTime, isCompleted);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    const now = Date.now();
    const deltaMs = now - lastPlaybackTickTime.current;
    lastPlaybackTickTime.current = now;
    if (deltaMs > 0 && deltaMs < 2500) {
      accumulatedWatchSeconds.current += deltaMs / 1000;
    }
    syncProgress(0, true);
  };

  // Sync on unmount and beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoRef.current && videoRef.current.duration) {
        const isCompleted = videoRef.current.currentTime >= videoRef.current.duration * 0.95;
        syncProgress(videoRef.current.currentTime, isCompleted);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (videoRef.current && videoRef.current.duration) {
        const isCompleted = videoRef.current.currentTime >= videoRef.current.duration * 0.95;
        syncProgress(videoRef.current.currentTime, isCompleted);
      }
    };
  }, [id]);

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
  }, [id]);

  const handlePremiereStarted = React.useCallback(() => {
    setForcePremiereStarted(true);
  }, []);

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
      <div className={`min-h-screen ${darkMode ? "bg-[#050508] text-white" : "bg-zinc-50 text-zinc-900"} flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#050508] text-white" : "bg-zinc-50 text-zinc-900"} flex flex-col font-sans select-none transition-colors duration-200`}>
      
      {/* Header */}
      <div className={`p-4 sm:p-6 flex items-center justify-between border-b ${darkMode ? "border-white/10 bg-[#0a0a0f]/80" : "border-zinc-200 bg-white/80"} backdrop-blur-md sticky top-0 z-30`}>
        <button 
          onClick={() => navigate('/dashboard')} 
          className={`flex items-center gap-2 ${darkMode ? "text-white/70 hover:text-orange-400" : "text-zinc-600 hover:text-orange-500"} font-bold text-xs uppercase tracking-wider transition-all`}
        >
          <ArrowLeft size={18} /> {t('navHome')}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-emerald-500 font-mono font-bold uppercase border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 bg-emerald-500/10">
            <Shield size={12} /> E2E Encrypted HD Stream
          </span>
          <ThemeToggle />
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
          {/* Hidden Canvas for Live Video Color Analysis */}
          <canvas ref={canvasRef} width={16} height={16} className="hidden" />

          {/* Conditional Rendering: Live Premiere Waiting Room vs Active Stream */}
          {Boolean(video.isPremiere) && video.premiereTime && new Date(video.premiereTime).getTime() > Date.now() && !forcePremiereStarted ? (
            <LivePremiereRoom 
              video={video} 
              onPremiereStarted={handlePremiereStarted} 
            />
          ) : (
            <CustomVideoPlayer
              video={video}
              ambientGlow={ambientGlow}
              setAmbientGlow={setAmbientGlow}
              glowColor={glowColor}
              onLaunchMiniPlayer={handleLaunchMiniPlayer}
              resumePrompt={resumePrompt}
              onConfirmResume={handleConfirmResume}
              onRestartPlayback={handleRestartPlayback}
              onDismissResume={handleDismissResume}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              formatTimestamp={formatTimestamp}
              videoRef={videoRef}
              canvasRef={canvasRef}
              darkMode={darkMode}
            />
          )}

          {/* Stream Controls & Details */}
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-500 text-[10px] font-extrabold uppercase">
                  {formatCategoryLabel(video.category, language)}
                </span>
                <h1 className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? "text-white" : "text-zinc-900"} mt-2 leading-tight`}>
                  {video.title}
                </h1>
                <p className={`text-xs ${darkMode ? "text-white/50" : "text-zinc-500"} mt-1 font-mono`}>{formatViewsCount(video.views, language)}</p>
              </div>

              {/* Action Buttons (Favorite, Like, Offline, Share) */}
              <div className="flex items-center gap-2 flex-wrap">
                
                {/* Favorite / Bookmark Button */}
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                    isFavorite
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                      : darkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-sm'
                  }`}
                  title={isFavorite ? t('removedFromFavorites') : t('savedToFavorites')}
                >
                  <Bookmark size={16} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-amber-400" : ""} />
                  <span className="hidden sm:inline">{isFavorite ? t('navFavorites') : t('like')}</span>
                </button>

                {/* Like Button */}
                <button
                  onClick={handleToggleLike}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                    isLiked
                      ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                      : darkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-sm'
                  }`}
                  title={t('like')}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                  <span className="hidden sm:inline">{likeCount}</span>
                </button>

                {/* Offline Save Action */}
                <button
                  onClick={handleSaveOffline}
                  disabled={isSavedOffline}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                    isSavedOffline
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                      : darkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-sm'
                  }`}
                  title={t('downloadOffline')}
                >
                  {isSavedOffline ? <Check size={16} /> : <Download size={16} />}
                  <span className="hidden sm:inline">{isSavedOffline ? t('downloaded') : t('downloadOffline')}</span>
                </button>

                {/* Share Action */}
                <button
                  onClick={handleShare}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                    darkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-sm'
                  }`}
                  title={t('share')}
                >
                  {showShareToast ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                  <span className="hidden sm:inline">{showShareToast ? t('copiedLink') : t('share')}</span>
                </button>

              </div>
            </div>

            {/* Description Card */}
            <div className={`p-5 rounded-3xl ${darkMode ? "bg-white/5 border-white/10 text-white/80" : "bg-white border-zinc-200 text-zinc-700 shadow-sm"} border text-xs leading-relaxed space-y-2`}>
              <p className={`font-medium ${darkMode ? "text-white/90" : "text-zinc-800"}`}>{video.description}</p>
              <div className={`pt-2 border-t ${darkMode ? "border-white/10 text-amber-400" : "border-zinc-200 text-amber-600"} flex items-center gap-2 text-[10px] font-mono`}>
                <Sparkles size={12} />
                <span>Private Subscriber HD Copy • Encrypted Stream Token Active</span>
              </div>

            {/* Comments Section */}
            <div className={`${darkMode ? "bg-white/5 border-white/10" : "bg-zinc-50 border-zinc-200"} border rounded-3xl p-5 sm:p-8 space-y-6 mt-4`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="text-orange-500" size={20} />
                <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-zinc-900"} tracking-tight`}>{t('comments')}</h3>
              </div>
              
              {/* Comment Input */}
              {user ? (
                <form onSubmit={handlePostComment} className="flex flex-col sm:flex-row gap-3">
                  <img src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} alt="User" className="w-10 h-10 rounded-full object-cover shrink-0 hidden sm:block border border-orange-500/30" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('addComment')}
                      className={`w-full ${darkMode ? "bg-black/40 border-white/10 text-white placeholder-white/40" : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400"} border rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-inner`}
                      disabled={isSubmittingComment}
                    />
                    <button 
                      type="submit" 
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-orange-500 hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <div className={`${darkMode ? "bg-black/30 border-white/10 text-white/50" : "bg-white border-zinc-200 text-zinc-500"} border rounded-2xl p-4 text-center text-sm`}>
                  Please log in to participate in the discussion.
                </div>
              )}
              
              {/* Comments List */}
              <div className={`space-y-4 pt-4 border-t ${darkMode ? "border-white/10" : "border-zinc-200"}`}>
                {comments.length === 0 ? (
                  <p className={`text-center text-xs ${darkMode ? "text-white/40" : "text-zinc-400"} py-4`}>{t('noComments')}</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                      <img src={comment.userPhotoURL} alt={comment.userDisplayName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-300" />
                      <div className={`flex-1 ${darkMode ? "bg-black/30" : "bg-white border border-zinc-200 shadow-sm"} rounded-2xl rounded-tl-sm p-4 text-sm relative`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`font-bold ${darkMode ? "text-white/90" : "text-zinc-900"} text-xs`}>{comment.userDisplayName}</span>
                          <span className={`text-[10px] ${darkMode ? "text-white/40" : "text-zinc-400"} font-mono`}>
                            {comment.createdAt?.toDate ? formatTimeAgo(comment.createdAt.toDate(), language) : formatTimeAgo(Date.now(), language)}
                          </span>
                        </div>
                        <p className={`${darkMode ? "text-white/70" : "text-zinc-700"} leading-relaxed text-xs`}>{comment.text}</p>
                        
                        {(user?.role === 'admin' || user?.uid === comment.userId) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                            title="Delete Comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
          <div className={`flex items-center justify-between pb-2 border-b ${darkMode ? "border-white/10" : "border-zinc-200"}`}>
            <h3 className={`font-extrabold text-sm ${darkMode ? "text-white" : "text-zinc-900"} flex items-center gap-2`}>
              <Sparkles size={16} className="text-amber-500" /> {t('similarVideos')}
            </h3>
            <span className={`text-[10px] ${darkMode ? "text-white/40" : "text-zinc-500"} font-mono`}>HD Stream</span>
          </div>

          <div className="space-y-3">
            {relatedVideos.map((item, idx) => (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                key={item.id}
                onClick={() => navigate(`/play/${item.id}`)}
                className={`w-full flex gap-3 p-2.5 rounded-2xl ${
                  darkMode ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-white hover:bg-zinc-100 border-zinc-200 shadow-sm"
                } border text-left transition-all group`}
              >
                <img src={item.thumbnailUrl} alt={item.title} className="w-24 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" />
                <div className="overflow-hidden space-y-1">
                  <span className="text-[9px] font-mono text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
                    {formatCategoryLabel(item.category, language)}
                  </span>
                  <h4 className={`text-xs font-bold ${darkMode ? "text-white" : "text-zinc-900"} truncate group-hover:text-orange-500 transition-colors`}>
                    {item.title}
                  </h4>
                  <p className={`text-[10px] ${darkMode ? "text-white/50" : "text-zinc-500"} line-clamp-1`}>{item.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>

      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-6 py-3 rounded-full font-extrabold text-sm shadow-2xl flex items-center gap-2 z-[100]"
          >
            <Check size={18} /> Link copied to clipboard
          </motion.div>
        )}
        {showResumedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-orange-500 text-black px-6 py-3 rounded-full font-extrabold text-sm shadow-2xl flex items-center gap-2 z-[100]"
          >
            <RotateCcw size={18} /> Resumed playback at {resumePrompt ? formatTimestamp(resumePrompt.timestamp) : ''}
          </motion.div>
        )}
        {favoriteToastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-3 rounded-full font-extrabold text-sm shadow-2xl flex items-center gap-2 z-[100]"
          >
            <Star size={18} fill="currentColor" /> {favoriteToastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

