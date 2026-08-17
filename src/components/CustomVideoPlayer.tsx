import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, Settings, Lightbulb, PictureInPicture2, 
  Clock, X, Sparkles, Check, Subtitles, Sliders, Layers, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, SubtitleTrack } from '../types';
import { loadSubtitleCues, SubtitleCue } from '../lib/subtitles';

export type VideoQuality = '4K' | '1080p' | '720p' | '480p' | '360p' | 'Auto';

export type GlowPreset = 'sync' | 'amber' | 'cyan' | 'purple' | 'emerald' | 'crimson';
export type GlowIntensity = 'soft' | 'normal' | 'vivid';

interface CustomVideoPlayerProps {
  video: Video;
  ambientGlow: boolean;
  setAmbientGlow: (val: boolean) => void;
  glowColor: string;
  onLaunchMiniPlayer: () => void;
  resumePrompt: { show: boolean; timestamp: number } | null;
  onConfirmResume: () => void;
  onRestartPlayback: () => void;
  onDismissResume: () => void;
  onPlay: () => void;
  onPause: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onEnded: () => void;
  formatTimestamp: (secs: number) => string;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  darkMode: boolean;
}

const QUALITY_PRESETS: { key: VideoQuality; label: string; desc: string; filter: string }[] = [
  { key: '4K', label: '4K Ultra HD', desc: 'Maximum bitrate (2160p)', filter: 'contrast(1.05) saturate(1.04) brightness(1.01)' },
  { key: '1080p', label: '1080p Full HD', desc: 'Crisp & High Fidelity', filter: 'contrast(1.02) saturate(1.02)' },
  { key: '720p', label: '720p HD', desc: 'Standard High Definition', filter: 'none' },
  { key: '480p', label: '480p Medium', desc: 'Standard Definition (SD)', filter: 'blur(0.55px) contrast(0.96)' },
  { key: '360p', label: '360p Low', desc: 'Data Saver (Low Bitrate)', filter: 'blur(1.2px) contrast(0.92) brightness(0.98)' },
  { key: 'Auto', label: 'Auto (Dynamic)', desc: 'Adaptive Stream Quality', filter: 'none' },
];

const GLOW_PRESETS: { key: GlowPreset; label: string; desc: string; color: string }[] = [
  { key: 'sync', label: 'Real-time Screen Sync', desc: 'Dynamic Video Ambilight', color: 'sync' },
  { key: 'amber', label: 'Cinematic Amber', desc: 'Warm Golden Glow', color: 'rgba(245, 158, 11, 0.75)' },
  { key: 'cyan', label: 'Cyberpunk Cyan', desc: 'Futuristic Blue/Cyan', color: 'rgba(6, 182, 212, 0.75)' },
  { key: 'purple', label: 'Neon Sunset', desc: 'Deep Violet Atmosphere', color: 'rgba(168, 85, 247, 0.75)' },
  { key: 'emerald', label: 'Aurora Emerald', desc: 'Vibrant Emerald Stream', color: 'rgba(16, 185, 129, 0.75)' },
  { key: 'crimson', label: 'Crimson Flame', desc: 'High Intensity Red', color: 'rgba(239, 68, 68, 0.75)' },
];

export default function CustomVideoPlayer({
  video,
  ambientGlow,
  setAmbientGlow,
  glowColor,
  onLaunchMiniPlayer,
  resumePrompt,
  onConfirmResume,
  onRestartPlayback,
  onDismissResume,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  formatTimestamp,
  videoRef,
  canvasRef,
  darkMode
}: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Settings & Menus
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showGlowMenu, setShowGlowMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('1080p');
  const [qualityToast, setQualityToast] = useState<string | null>(null);

  // Ambient Glow Real-time State & Presets
  const [glowPreset, setGlowPreset] = useState<GlowPreset>('sync');
  const [glowIntensity, setGlowIntensity] = useState<GlowIntensity>('normal');
  const [dynamicExtractedColor, setDynamicExtractedColor] = useState<string>(
    video.accentColor || glowColor || 'rgba(245, 158, 11, 0.75)'
  );

  // Real-time Video Frame Color Extraction for Ambient Glow
  useEffect(() => {
    if (!ambientGlow || glowPreset !== 'sync') return;

    let animId: number;
    let lastSampleTime = 0;
    let lastCalculatedRgb = dynamicExtractedColor;

    const sampleVideoFrameColor = (timestamp: number) => {
      const vid = videoRef.current;
      const canvas = canvasRef?.current || internalCanvasRef.current;

      // Sample every 120ms to keep UI silky smooth and CPU lightweight
      if (vid && !vid.paused && !vid.ended && canvas && timestamp - lastSampleTime > 120) {
        lastSampleTime = timestamp;
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx && vid.videoWidth > 0 && vid.videoHeight > 0) {
            ctx.drawImage(vid, 0, 0, 16, 16);
            const imgData = ctx.getImageData(0, 0, 16, 16);
            const data = imgData.data;
            let r = 0, g = 0, b = 0;
            const totalPixels = data.length / 4;

            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }

            r = Math.round(r / totalPixels);
            g = Math.round(g / totalPixels);
            b = Math.round(b / totalPixels);

            // Enhance cinematic luminescence: boost saturation and prevent completely dark grey/black
            const maxVal = Math.max(r, g, b);
            const brightness = (r + g + b) / 3;

            // If frame is too dark, tastefully boost minimum ambient luminance
            if (brightness < 35) {
              const boostFactor = 35 / Math.max(1, brightness);
              r = Math.min(255, Math.round(r * boostFactor + 15));
              g = Math.min(255, Math.round(g * boostFactor + 12));
              b = Math.min(255, Math.round(b * boostFactor + 18));
            }

            // Saturation pop for vibrant ambient backlighting
            if (maxVal > 0) {
              const satBoost = 1.25;
              r = Math.min(255, Math.round(r * satBoost));
              g = Math.min(255, Math.round(g * satBoost));
              b = Math.min(255, Math.round(b * satBoost));
            }

            const calculated = `rgba(${r}, ${g}, ${b}, 0.8)`;
            if (calculated !== lastCalculatedRgb) {
              lastCalculatedRgb = calculated;
              setDynamicExtractedColor(calculated);
            }
          }
        } catch {
          // If cross-origin restricts canvas pixel export, fallback to video accent or warm amber
          const fallback = video.accentColor || 'rgba(245, 158, 11, 0.75)';
          if (fallback !== lastCalculatedRgb) {
            lastCalculatedRgb = fallback;
            setDynamicExtractedColor(fallback);
          }
        }
      }

      animId = requestAnimationFrame(sampleVideoFrameColor);
    };

    animId = requestAnimationFrame(sampleVideoFrameColor);
    return () => cancelAnimationFrame(animId);
  }, [ambientGlow, glowPreset, videoRef, canvasRef, video.accentColor]);

  // Compute the current effective glow color based on selected preset
  const currentEffectiveGlowColor = useMemo(() => {
    if (glowPreset === 'sync') {
      return dynamicExtractedColor;
    }
    const preset = GLOW_PRESETS.find(p => p.key === glowPreset);
    return preset ? preset.color : dynamicExtractedColor;
  }, [glowPreset, dynamicExtractedColor]);

  // Subtitles state
  const [activeSubtitleLang, setActiveSubtitleLang] = useState<string>('off');
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [currentActiveCueText, setCurrentActiveCueText] = useState<string>('');

  // Scrubbing & Hover Preview State
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPositionX, setHoverPositionX] = useState<number>(0);
  
  // Center play/pause flash indicator
  const [centerAnimation, setCenterAnimation] = useState<'play' | 'pause' | 'skip-back' | 'skip-forward' | null>(null);

  // Subtitles List: from video metadata (memoized stably to prevent re-render cascading)
  const availableSubtitles: SubtitleTrack[] = useMemo(() => {
    return (video.subtitles && Array.isArray(video.subtitles)) ? video.subtitles : [];
  }, [video.subtitles]);

  // Load Subtitle Cues when selected language changes
  useEffect(() => {
    if (activeSubtitleLang === 'off') {
      setSubtitleCues(prev => (prev.length === 0 ? prev : []));
      setCurrentActiveCueText(prev => (prev === '' ? prev : ''));
      return;
    }

    const track = availableSubtitles.find(s => s.lang === activeSubtitleLang || s.label === activeSubtitleLang);
    if (track) {
      loadSubtitleCues(track.url, track.content).then(cues => {
        setSubtitleCues(cues);
      }).catch(err => {
        console.warn("Could not load cues for track:", track, err);
        setSubtitleCues(prev => (prev.length === 0 ? prev : []));
      });
    } else {
      setSubtitleCues(prev => (prev.length === 0 ? prev : []));
      setCurrentActiveCueText(prev => (prev === '' ? prev : ''));
    }
  }, [activeSubtitleLang, availableSubtitles]);

  // Sync active subtitle text with current playback timestamp
  useEffect(() => {
    if (activeSubtitleLang === 'off' || subtitleCues.length === 0) {
      setCurrentActiveCueText(prev => (prev === '' ? prev : ''));
      return;
    }

    const matchedCue = subtitleCues.find(
      cue => currentTime >= cue.start && currentTime <= cue.end
    );

    const targetText = matchedCue && matchedCue.text.trim() ? matchedCue.text : '';
    setCurrentActiveCueText(prev => (prev === targetText ? prev : targetText));
  }, [currentTime, activeSubtitleLang, subtitleCues]);

  // Determine active video source based on selected quality
  const getActiveVideoSrc = useCallback(() => {
    if (video.qualities && video.qualities.length > 0) {
      const matched = video.qualities.find(q => q.quality === selectedQuality);
      if (matched && matched.url) {
        return matched.url;
      }
    }
    return video.videoUrl;
  }, [video, selectedQuality]);

  // Current visual filter for realistic quality rendering
  const activeQualityPreset = QUALITY_PRESETS.find(p => p.key === selectedQuality) || QUALITY_PRESETS[1];

  // Handle Quality Change
  const handleSelectQuality = (quality: VideoQuality) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);

    const preset = QUALITY_PRESETS.find(p => p.key === quality);
    setQualityToast(preset ? `${preset.label} - ${preset.desc}` : `${quality} Mode`);
    setTimeout(() => setQualityToast(null), 3000);

    // If alternate source URL is provided for this quality, switch stream smoothly
    if (video.qualities && videoRef.current) {
      const matched = video.qualities.find(q => q.quality === quality);
      if (matched && matched.url && videoRef.current.src !== matched.url) {
        const savedTime = videoRef.current.currentTime;
        const wasPaused = videoRef.current.paused;
        videoRef.current.src = matched.url;
        videoRef.current.currentTime = savedTime;
        if (!wasPaused) {
          videoRef.current.play().catch(() => {});
        }
      }
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update duration when video metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  // Internal time update to sync custom slider
  const handleInternalTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
      
      // Update buffered range
      const buf = videoRef.current.buffered;
      if (buf.length > 0 && videoRef.current.duration > 0) {
        const bufferedEnd = buf.end(buf.length - 1);
        setBufferedPercent((bufferedEnd / videoRef.current.duration) * 100);
      }
    }
    onTimeUpdate(e);
  };

  const triggerCenterAnimation = (type: 'play' | 'pause' | 'skip-back' | 'skip-forward') => {
    setCenterAnimation(type);
    setTimeout(() => {
      setCenterAnimation(null);
    }, 550);
  };

  // Toggle Play/Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      triggerCenterAnimation('play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerCenterAnimation('pause');
    }
  }, [videoRef]);

  // Handle Seek Delta (10s rewind / forward)
  const handleSeekDelta = (delta: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + delta, duration || 999999));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    triggerCenterAnimation(delta > 0 ? 'skip-forward' : 'skip-back');
  };

  // Volume Handlers
  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted || volume === 0) {
      const restore = prevVolume > 0 ? prevVolume : 0.8;
      videoRef.current.muted = false;
      videoRef.current.volume = restore;
      setIsMuted(false);
      setVolume(restore);
    } else {
      setPrevVolume(volume);
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Playback Speed Setter
  const handleSetPlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSettingsMenu(false);
  };

  // Control Visibility Hide Timer on Idle
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying && !isHoveringPlayer && !isScrubbing && !showSettingsMenu && !showQualityMenu && !showSubtitlesMenu) {
        setShowControls(false);
      }
    }, 3200);
  };

  const handleMouseMove = () => {
    resetHideTimer();
  };

  // Scrubber Mouse Move
  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = pos / rect.width;
    setHoverTime(percent * duration);
    setHoverPositionX(pos);
  };

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null);
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    setIsScrubbing(true);
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetTime = (pos / rect.width) * duration;
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  // Global Scrubber Mouse Drag Handler
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isScrubbing && progressBarRef.current && duration > 0) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const targetTime = (pos / rect.width) * duration;
        setCurrentTime(targetTime);
        if (videoRef.current) {
          videoRef.current.currentTime = targetTime;
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isScrubbing, duration, videoRef]);

  // Keyboard Shortcuts (Space, F, M, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.code === 'Space' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        // Toggle subtitles shortcut
        setActiveSubtitleLang(prev => {
          if (prev === 'off') {
            return availableSubtitles.length > 0 ? (availableSubtitles[0].lang || availableSubtitles[0].label) : 'off';
          }
          return 'off';
        });
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setAmbientGlow(!ambientGlow);
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        handleSeekDelta(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        handleSeekDelta(10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, isMuted, duration, availableSubtitles, ambientGlow, setAmbientGlow]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative isolate w-full">
      {/* Hidden Canvas for Live Video Color Analysis */}
      <canvas ref={internalCanvasRef} width={16} height={16} className="hidden" />

      {/* Dynamic Cinema Ambient Glow Halo */}
      {ambientGlow && (
        <>
          {/* Deep Outer Atmospheric Bloom Layer */}
          <div 
            className={`absolute -inset-4 sm:-inset-12 rounded-[56px] blur-3xl pointer-events-none z-0 transition-all duration-700 ease-out ${
              glowIntensity === 'vivid' ? 'opacity-85 scale-105' : glowIntensity === 'soft' ? 'opacity-40 scale-95' : 'opacity-70'
            }`}
            style={{
              backgroundColor: currentEffectiveGlowColor,
              boxShadow: `0 0 160px 60px ${currentEffectiveGlowColor}`
            }}
          />

          {/* Inner Radiant Core Halo */}
          <div 
            className={`absolute -inset-1 sm:-inset-4 rounded-[36px] blur-xl pointer-events-none z-0 transition-all duration-300 ease-out ${
              glowIntensity === 'vivid' ? 'opacity-65' : glowIntensity === 'soft' ? 'opacity-25' : 'opacity-45'
            }`}
            style={{
              backgroundColor: currentEffectiveGlowColor,
              boxShadow: `0 0 50px 15px ${currentEffectiveGlowColor}`
            }}
          />
        </>
      )}

      {/* Main Cinema Player Container */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => { setIsHoveringPlayer(true); resetHideTimer(); }}
        onMouseLeave={() => { 
          setIsHoveringPlayer(false); 
          if (isPlaying && !showSettingsMenu && !showQualityMenu && !showSubtitlesMenu && !showGlowMenu) {
            setShowControls(false); 
          }
        }}
        className={`relative z-10 aspect-video w-full bg-black rounded-[32px] overflow-hidden shadow-2xl border group select-none ${
          isFullscreen ? 'rounded-none border-none' : darkMode ? 'border-white/10' : 'border-zinc-300'
        }`}
        id="custom-brand-video-player"
      >
        {/* Real Video Element with Dynamic Visual Quality Simulation */}
        <video 
          ref={videoRef}
          autoPlay 
          src={getActiveVideoSrc()} 
          poster={video.thumbnailUrl}
          playsInline
          crossOrigin="anonymous"
          className="w-full h-full object-contain cursor-pointer transition-all duration-300"
          style={{
            filter: activeQualityPreset.filter
          }}
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => { setIsPlaying(true); onPlay(); }}
          onPause={(e) => { setIsPlaying(false); onPause(e); }}
          onTimeUpdate={handleInternalTimeUpdate}
          onEnded={() => { setIsPlaying(false); onEnded(); }}
        />

        {/* Quality Switch Toast Notification */}
        <AnimatePresence>
          {qualityToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/40 text-amber-300 text-xs font-bold font-mono shadow-2xl flex items-center gap-2"
            >
              <Sliders size={14} className="text-amber-400" />
              <span>{qualityToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Play/Pause/Seek Ripple Animation Overlay */}
        <AnimatePresence>
          {centerAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <div className="w-20 h-20 rounded-full bg-black/70 backdrop-blur-md border border-[#f59e0b]/40 shadow-2xl flex items-center justify-center text-[#f59e0b]">
                {centerAnimation === 'play' && <Play size={36} fill="#f59e0b" className="ml-1" />}
                {centerAnimation === 'pause' && <Pause size={36} fill="#f59e0b" />}
                {centerAnimation === 'skip-back' && <RotateCcw size={32} />}
                {centerAnimation === 'skip-forward' && <RotateCw size={32} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Floating In-Player Controls (Glow ON/OFF & Mini-Player PiP) */}
        <AnimatePresence>
          {(showControls || !isPlaying || isHoveringPlayer) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-4 z-30 flex items-center gap-2"
            >
              {/* Ambient Glow Toggle */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setAmbientGlow(!ambientGlow); }}
                className={`px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-200 flex items-center gap-1.5 text-xs font-bold shadow-lg hover:scale-105 active:scale-95 ${
                  ambientGlow
                    ? 'bg-[#f59e0b]/25 border-[#f59e0b] text-[#f59e0b] shadow-[#f59e0b]/20 hover:bg-[#f59e0b]/35'
                    : 'bg-black/60 border-white/20 text-white/70 hover:text-white hover:bg-black/80 hover:border-white/40'
                }`}
                title={ambientGlow ? "Ambient Glow Enabled (G)" : "Ambient Glow Disabled (G)"}
              >
                <Lightbulb size={14} className={ambientGlow ? "text-[#f59e0b] fill-[#f59e0b] animate-pulse" : "text-white/60"} />
                <span>{ambientGlow ? "Glow ON" : "Glow"}</span>
                {ambientGlow && (
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-white/50 inline-block shadow-sm transition-colors duration-500"
                    style={{ backgroundColor: currentEffectiveGlowColor }}
                  />
                )}
              </button>

              {/* Mini-Player PiP Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onLaunchMiniPlayer(); }}
                className="px-3 py-1.5 rounded-xl border border-white/20 bg-black/60 hover:bg-[#f59e0b] hover:border-[#f59e0b] hover:text-black text-white/90 backdrop-blur-md transition-all duration-200 flex items-center gap-1.5 text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
                title="Picture-in-Picture Mini-Player"
              >
                <PictureInPicture2 size={14} />
                <span>Mini-Player</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean, Non-Disturbing Timed Subtitle Cue Display */}
        {activeSubtitleLang !== 'off' && currentActiveCueText && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl px-4 pointer-events-none z-25 text-center"
          >
            <div className="inline-block bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-white font-medium text-xs sm:text-sm md:text-base leading-relaxed tracking-wide shadow-2xl drop-shadow-md">
              {currentActiveCueText}
            </div>
          </motion.div>
        )}

        {/* Resume Watching Floating Prompt Overlay */}
        <AnimatePresence>
          {resumePrompt && resumePrompt.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 z-40 bg-[#0c0c14]/95 backdrop-blur-xl border border-[#f59e0b]/40 rounded-2xl p-4 shadow-2xl max-w-sm sm:w-88"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/30 flex items-center justify-center shrink-0 text-[#f59e0b]">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#f59e0b] flex items-center gap-1.5">
                      <span>Resume Playback?</span>
                    </h4>
                    <button 
                      type="button"
                      onClick={onDismissResume} 
                      className="text-white/40 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-white/80 mt-1">
                    You stopped watching at <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded text-[11px] border border-white/10">{formatTimestamp(resumePrompt.timestamp)}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-3.5">
                    <button
                      type="button"
                      onClick={onConfirmResume}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 text-black font-extrabold text-xs py-2 px-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#f59e0b]/25"
                    >
                      <Play size={13} fill="currentColor" />
                      Resume ({formatTimestamp(resumePrompt.timestamp)})
                    </button>
                    <button
                      type="button"
                      onClick={onRestartPlayback}
                      className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 text-xs font-semibold py-2 px-3 rounded-xl transition-all duration-200 border border-white/10"
                    >
                      <RotateCcw size={12} />
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CUSTOM VIDEO PLAYER CONTROLS OVERLAY BAR */}
        <AnimatePresence>
          {(showControls || !isPlaying || isHoveringPlayer || isScrubbing) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 z-30 pt-16 pb-3 px-4 sm:px-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col justify-end gap-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* PROGRESS BAR & SCRUBBER */}
              <div 
                ref={progressBarRef}
                onMouseMove={handleProgressBarMouseMove}
                onMouseLeave={handleProgressBarMouseLeave}
                onMouseDown={handleProgressBarMouseDown}
                className="relative group/progress h-5 flex items-center cursor-pointer select-none"
              >
                {/* Hover Timestamp Tooltip */}
                {hoverTime !== null && (
                  <div 
                    className="absolute bottom-6 -translate-x-1/2 bg-[#12121a]/95 text-white text-[11px] font-mono font-bold px-2 py-1 rounded-lg border border-[#f59e0b]/40 shadow-xl pointer-events-none z-40 flex items-center gap-1"
                    style={{ left: `${hoverPositionX}px` }}
                  >
                    <span className="text-[#f59e0b] font-mono">{formatTimestamp(hoverTime)}</span>
                  </div>
                )}

                {/* Progress Track Background */}
                <div className="w-full h-1.5 group-hover/progress:h-2.5 rounded-full bg-white/20 overflow-hidden relative transition-all duration-150">
                  {/* Buffered Bar */}
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-white/30 rounded-full transition-all duration-300"
                    style={{ width: `${bufferedPercent}%` }}
                  />
                  {/* Active Played Bar */}
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#d97706] to-[#f59e0b] rounded-full shadow-[0_0_12px_#f59e0b]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Scrubber Thumb */}
                <div 
                  className="absolute w-3.5 h-3.5 rounded-full bg-[#f59e0b] border-2 border-white shadow-lg -translate-x-1/2 scale-0 group-hover/progress:scale-100 transition-transform duration-150 pointer-events-none"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>

              {/* BOTTOM CONTROLS ROW */}
              <div className="flex items-center justify-between gap-2 sm:gap-4 text-white">
                {/* LEFT CONTROLS: Play/Pause, 10s Rewind/Forward, Volume, Time */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {/* Play / Pause Toggle Button */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-2xl bg-[#f59e0b] hover:bg-[#fbbf24] active:scale-95 text-black flex items-center justify-center shadow-lg shadow-[#f59e0b]/25 transition-all duration-200 hover:scale-105"
                    title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                  >
                    {isPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  {/* 10s Rewind Button */}
                  <button
                    type="button"
                    onClick={() => handleSeekDelta(-10)}
                    className="p-2 rounded-xl text-white/80 hover:text-[#f59e0b] hover:bg-[#f59e0b]/15 hover:scale-110 active:scale-95 transition-all duration-200"
                    title="10s Rewind (J / ←)"
                  >
                    <RotateCcw size={18} />
                  </button>

                  {/* 10s Fast-Forward Button */}
                  <button
                    type="button"
                    onClick={() => handleSeekDelta(10)}
                    className="p-2 rounded-xl text-white/80 hover:text-[#f59e0b] hover:bg-[#f59e0b]/15 hover:scale-110 active:scale-95 transition-all duration-200"
                    title="10s Forward (L / →)"
                  >
                    <RotateCw size={18} />
                  </button>

                  {/* VOLUME CONTROL WITH EXPANDABLE SLIDER */}
                  <div className="flex items-center group/vol">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-2 rounded-xl text-white/80 hover:text-[#f59e0b] hover:bg-[#f59e0b]/15 hover:scale-110 active:scale-95 transition-all duration-200"
                      title={isMuted ? "Unmute (M)" : "Mute (M)"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX size={19} className="text-red-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 size={19} />
                      ) : (
                        <Volume2 size={19} />
                      )}
                    </button>

                    {/* Expandable Slider */}
                    <div className="w-0 group-hover/vol:w-20 sm:group-hover/vol:w-24 overflow-hidden transition-all duration-300 flex items-center pl-1 pr-2">
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#f59e0b] hover:accent-[#fbbf24] transition-all"
                        title={`Volume: ${Math.round(volume * 100)}%`}
                      />
                    </div>
                  </div>

                  {/* TIME DISPLAY */}
                  <div className="text-xs font-mono font-bold tracking-tight text-white/90 ml-1 flex items-center gap-1 select-none">
                    <span className="text-[#f59e0b]">{formatTimestamp(currentTime)}</span>
                    <span className="text-white/40">/</span>
                    <span className="text-white/70">{formatTimestamp(duration)}</span>
                  </div>
                </div>

                {/* RIGHT CONTROLS: Subtitles (CC), Quality, Speed, Fullscreen */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  
                  {/* SUBTITLES / CC BUTTON INSIDE VIDEO PLAYER */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubtitlesMenu(!showSubtitlesMenu);
                        setShowQualityMenu(false);
                        setShowSettingsMenu(false);
                        setShowGlowMenu(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                        activeSubtitleLang !== 'off'
                          ? 'bg-[#f59e0b] text-black border-[#f59e0b] shadow-lg shadow-[#f59e0b]/30'
                          : 'bg-white/10 border-white/15 text-white/80 hover:text-white hover:bg-white/20 hover:border-white/30'
                      }`}
                      title="Subtitles & Closed Captions (C)"
                    >
                      <Subtitles size={14} className={activeSubtitleLang !== 'off' ? "text-black" : "text-white/80"} />
                      <span className="font-mono text-[11px] uppercase">
                        {activeSubtitleLang !== 'off' ? (availableSubtitles.find(s => s.lang === activeSubtitleLang)?.lang.toUpperCase() || 'CC') : 'CC'}
                      </span>
                    </button>

                    {/* Subtitles Popover Menu */}
                    <AnimatePresence>
                      {showSubtitlesMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-12 right-0 w-52 rounded-2xl bg-[#0e0e18]/95 backdrop-blur-xl border border-[#f59e0b]/30 shadow-2xl p-2 z-50 text-xs"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-extrabold text-[#f59e0b] uppercase tracking-wider border-b border-white/10 mb-1.5 flex items-center justify-between">
                            <span>Subtitles / Audio Track</span>
                            <Subtitles size={11} />
                          </div>

                          {/* Off Option */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubtitleLang('off');
                              setShowSubtitlesMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-semibold transition-colors ${
                              activeSubtitleLang === 'off'
                                ? 'bg-[#f59e0b] text-black font-bold'
                                : 'text-white/80 hover:bg-white/10 hover:text-[#f59e0b]'
                            }`}
                          >
                            <span>Off (No Subtitles)</span>
                            {activeSubtitleLang === 'off' && <Check size={13} strokeWidth={3} />}
                          </button>

                          {/* Available Subtitle Tracks added by Admin */}
                          {availableSubtitles.length > 0 ? (
                            availableSubtitles.map((track) => (
                              <button
                                key={track.id || track.lang || track.label}
                                type="button"
                                onClick={() => {
                                  setActiveSubtitleLang(track.lang || track.label);
                                  setShowSubtitlesMenu(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-semibold transition-colors mt-0.5 ${
                                  activeSubtitleLang === track.lang || activeSubtitleLang === track.label
                                    ? 'bg-[#f59e0b] text-black font-bold'
                                    : 'text-white/80 hover:bg-white/10 hover:text-[#f59e0b]'
                                }`}
                              >
                                <span className="truncate">{track.label || track.lang}</span>
                                {(activeSubtitleLang === track.lang || activeSubtitleLang === track.label) && <Check size={13} strokeWidth={3} />}
                              </button>
                            ))
                          ) : (
                            <div className="p-2 text-[10px] text-white/50 text-center italic">
                              No additional subtitles uploaded by Admin
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* REAL VIDEO QUALITY SELECTOR BUTTON */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQualityMenu(!showQualityMenu);
                        setShowSubtitlesMenu(false);
                        setShowSettingsMenu(false);
                        setShowGlowMenu(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 ${
                        showQualityMenu || selectedQuality === '4K' || selectedQuality === '1080p'
                          ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]'
                          : 'bg-white/10 border-white/15 text-white/80 hover:text-white hover:bg-white/20 hover:border-white/30'
                      }`}
                      title="Video Quality Selection"
                    >
                      <Layers size={13} className="text-[#f59e0b]" />
                      <span>{selectedQuality}</span>
                    </button>

                    {/* Quality Popover Menu */}
                    <AnimatePresence>
                      {showQualityMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-12 right-0 w-56 rounded-2xl bg-[#0e0e18]/95 backdrop-blur-xl border border-[#f59e0b]/30 shadow-2xl p-2 z-50 text-xs"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-extrabold text-[#f59e0b] uppercase tracking-wider border-b border-white/10 mb-1.5 flex items-center justify-between">
                            <span>Video Stream Quality</span>
                            <Sliders size={11} />
                          </div>

                          {QUALITY_PRESETS.map((preset) => (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => handleSelectQuality(preset.key)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors mb-0.5 ${
                                selectedQuality === preset.key
                                  ? 'bg-[#f59e0b] text-black font-bold'
                                  : 'text-white/80 hover:bg-white/10 hover:text-[#f59e0b]'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-xs">{preset.label}</span>
                                <span className={`text-[10px] ${selectedQuality === preset.key ? 'text-black/70' : 'text-white/40'}`}>
                                  {preset.desc}
                                </span>
                              </div>
                              {selectedQuality === preset.key && <Check size={14} strokeWidth={3} className="shrink-0 ml-2" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* AMBIENT GLOW STUDIO BUTTON */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGlowMenu(!showGlowMenu);
                        setShowSubtitlesMenu(false);
                        setShowQualityMenu(false);
                        setShowSettingsMenu(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                        ambientGlow
                          ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b] shadow-md shadow-[#f59e0b]/20'
                          : 'bg-white/10 border-white/15 text-white/70 hover:text-white hover:bg-white/20'
                      }`}
                      title="Cinema Ambient Glow Studio"
                    >
                      <Lightbulb size={13} className={ambientGlow ? "text-[#f59e0b] fill-[#f59e0b]" : ""} />
                      <span className="hidden sm:inline">Glow</span>
                      {ambientGlow && (
                        <span 
                          className="w-2 h-2 rounded-full border border-white/40 inline-block shadow-sm"
                          style={{ backgroundColor: currentEffectiveGlowColor }}
                        />
                      )}
                    </button>

                    {/* Ambient Glow Popover Menu */}
                    <AnimatePresence>
                      {showGlowMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-12 right-0 w-60 rounded-2xl bg-[#0e0e18]/95 backdrop-blur-xl border border-[#f59e0b]/30 shadow-2xl p-3 z-50 text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span className="text-[10px] font-extrabold text-[#f59e0b] uppercase tracking-wider flex items-center gap-1">
                              <Palette size={12} /> Ambient Halo Studio
                            </span>
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => setAmbientGlow(!ambientGlow)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono transition ${
                                ambientGlow ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/50'
                              }`}
                            >
                              {ambientGlow ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          {/* Glow Mood Presets */}
                          <div>
                            <span className="text-[9px] uppercase font-bold text-white/50 block mb-1">Color Ambilight Mode</span>
                            <div className="space-y-1">
                              {GLOW_PRESETS.map((preset) => (
                                <button
                                  key={preset.key}
                                  type="button"
                                  onClick={() => {
                                    setGlowPreset(preset.key);
                                    if (!ambientGlow) setAmbientGlow(true);
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                                    glowPreset === preset.key
                                      ? 'bg-[#f59e0b] text-black font-bold'
                                      : 'text-white/80 hover:bg-white/10 hover:text-[#f59e0b]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm"
                                      style={{ backgroundColor: preset.key === 'sync' ? dynamicExtractedColor : preset.color }}
                                    />
                                    <span className="text-xs font-semibold">{preset.label}</span>
                                  </div>
                                  {glowPreset === preset.key && <Check size={12} strokeWidth={3} />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Glow Intensity Selector */}
                          <div className="pt-1.5 border-t border-white/10">
                            <span className="text-[9px] uppercase font-bold text-white/50 block mb-1">Halo Intensity</span>
                            <div className="grid grid-cols-3 gap-1">
                              {(['soft', 'normal', 'vivid'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => setGlowIntensity(lvl)}
                                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase transition text-center ${
                                    glowIntensity === lvl
                                      ? 'bg-white/20 text-[#f59e0b] border border-[#f59e0b]/50'
                                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                                  }`}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Playback Speed Pill Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsMenu(!showSettingsMenu);
                        setShowQualityMenu(false);
                        setShowSubtitlesMenu(false);
                        setShowGlowMenu(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 ${
                        playbackSpeed !== 1 || showSettingsMenu
                          ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]'
                          : 'bg-white/10 border-white/15 text-white/80 hover:text-white hover:bg-white/20 hover:border-white/30'
                      }`}
                      title="Playback Speed"
                    >
                      <Settings size={13} className={showSettingsMenu ? "rotate-90 text-[#f59e0b] transition-transform duration-200" : "transition-transform duration-200"} />
                      <span>{playbackSpeed}x</span>
                    </button>

                    {/* Speed Popover Menu */}
                    <AnimatePresence>
                      {showSettingsMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-12 right-0 w-44 rounded-2xl bg-[#0e0e18]/95 backdrop-blur-xl border border-[#f59e0b]/30 shadow-2xl p-2 z-50 text-xs"
                        >
                          <div className="px-2 py-1 text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
                            <span>Playback Speed</span>
                            <Sparkles size={10} />
                          </div>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleSetPlaybackSpeed(s)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-mono transition-colors ${
                                playbackSpeed === s 
                                  ? 'bg-[#f59e0b] text-black font-bold' 
                                  : 'text-white/80 hover:bg-white/10 hover:text-[#f59e0b]'
                              }`}
                            >
                              <span>{s}x</span>
                              {playbackSpeed === s && <Check size={13} strokeWidth={3} />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 rounded-xl text-white/80 hover:text-[#f59e0b] hover:bg-[#f59e0b]/15 hover:scale-110 active:scale-95 transition-all duration-200"
                    title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
                  >
                    {isFullscreen ? (
                      <Minimize size={19} />
                    ) : (
                      <Maximize size={19} />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
