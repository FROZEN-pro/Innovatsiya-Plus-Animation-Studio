import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, 
  X, RotateCcw, RotateCw, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useStore';

export default function MiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { floatingPlayer, updateFloatingPlayer, closeFloatingPlayer, darkMode } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // If user is currently on the video page for this video, don't show the floating miniplayer
  const isCurrentlyOnVideoPage = 
    floatingPlayer.video && 
    (location.pathname === `/video/${floatingPlayer.video.id}` || location.pathname === `/premiere/${floatingPlayer.video.id}`);

  useEffect(() => {
    if (videoRef.current && floatingPlayer.isOpen && floatingPlayer.video) {
      if (floatingPlayer.currentTime && Math.abs(videoRef.current.currentTime - floatingPlayer.currentTime) > 1) {
        videoRef.current.currentTime = floatingPlayer.currentTime;
      }
      if (floatingPlayer.isPlaying) {
        videoRef.current.play().catch(() => {
          updateFloatingPlayer({ isPlaying: false });
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [floatingPlayer.isOpen, floatingPlayer.video?.id]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setProgress(cur);
      setDuration(dur);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (floatingPlayer.isPlaying) {
      videoRef.current.pause();
      updateFloatingPlayer({ isPlaying: false, currentTime: videoRef.current.currentTime });
    } else {
      videoRef.current.play().catch(() => {});
      updateFloatingPlayer({ isPlaying: true, currentTime: videoRef.current.currentTime });
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !floatingPlayer.isMuted;
    videoRef.current.muted = newMuted;
    updateFloatingPlayer({ isMuted: newMuted });
  };

  const handleSeekDelta = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + delta, duration || 99999));
    videoRef.current.currentTime = newTime;
    updateFloatingPlayer({ currentTime: newTime });
  };

  const handleExpand = () => {
    if (!floatingPlayer.video) return;
    const currTime = videoRef.current ? videoRef.current.currentTime : floatingPlayer.currentTime;
    const targetPath = floatingPlayer.video.isPremiere ? `/premiere/${floatingPlayer.video.id}` : `/video/${floatingPlayer.video.id}`;
    closeFloatingPlayer();
    navigate(targetPath, { state: { resumeTime: currTime } });
  };

  if (!floatingPlayer.isOpen || !floatingPlayer.video || isCurrentlyOnVideoPage) {
    return null;
  }

  const { video } = floatingPlayer;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 300, top: -400, bottom: 200 }}
        dragElastic={0.1}
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-3xl overflow-hidden shadow-2xl border backdrop-blur-xl transition-colors select-none ${
          darkMode 
            ? 'bg-[#0d0d14]/90 border-white/15 text-white shadow-black/80' 
            : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-900/30'
        }`}
        id="floating-mini-player-container"
      >
        {/* Dynamic ambient accent top bar */}
        <div 
          className="h-1 w-full"
          style={{ backgroundColor: video.accentColor || '#f97316' }}
        />

        {/* Video Canvas Container */}
        <div className="relative aspect-video bg-black group overflow-hidden cursor-pointer" onClick={handleExpand}>
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            playsInline
            muted={floatingPlayer.isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => updateFloatingPlayer({ isPlaying: false })}
            className="w-full h-full object-cover"
          />

          {/* Top Floating Controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleExpand(); }}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-105"
              title="Expand to Full Screen"
            >
              <Maximize2 size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeFloatingPlayer(); }}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-red-500/80 text-white backdrop-blur-md transition-all hover:scale-105"
              title="Close Player"
            >
              <X size={13} />
            </button>
          </div>

          {/* Premiere Badge overlay if applicable */}
          {video.isPremiere && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles size={11} />
              Premiere
            </div>
          )}

          {/* Center Play Overlay on hover */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/90 text-black flex items-center justify-center shadow-lg">
              {floatingPlayer.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </div>
          </div>

          {/* Progress Bar inside video */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-orange-500 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mini Player Metadata & Controls Bar */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 cursor-pointer" onClick={handleExpand}>
            <h4 className="text-xs font-bold truncate leading-tight hover:text-orange-500 transition-colors">
              {video.title}
            </h4>
            <p className={`text-[10px] truncate mt-0.5 ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
              {video.author || 'Innovation Studio'}
            </p>
          </div>

          {/* Quick Audio & Playback Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => handleSeekDelta(-10, e)}
              className={`p-1.5 rounded-xl transition-all ${
                darkMode ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Rewind 10s"
            >
              <RotateCcw size={13} />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
              title={floatingPlayer.isPlaying ? 'Pause' : 'Play'}
            >
              {floatingPlayer.isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={(e) => handleSeekDelta(10, e)}
              className={`p-1.5 rounded-xl transition-all ${
                darkMode ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Forward 10s"
            >
              <RotateCw size={13} />
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-xl transition-all ${
                darkMode ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              title={floatingPlayer.isMuted ? 'Unmute' : 'Mute'}
            >
              {floatingPlayer.isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
