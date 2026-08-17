import React, { useState, useRef, useEffect } from 'react';
import { Play, VolumeX, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoThumbnailPreviewProps {
  thumbnailUrl: string;
  videoUrl?: string;
  title: string;
  category?: string;
  isPremiere?: boolean;
  aspectRatio?: string;
  className?: string;
  children?: React.ReactNode;
  showHoverPlayButton?: boolean;
  onPlayClick?: () => void;
}

export default function VideoThumbnailPreview({
  thumbnailUrl,
  videoUrl,
  title,
  category,
  isPremiere = false,
  aspectRatio = 'aspect-video',
  className = '',
  children,
  showHoverPlayButton = false,
  onPlayClick
}: VideoThumbnailPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if videoUrl is a direct playable media stream (mp4, webm, local /uploads/ or blob)
  const isDirectMedia = Boolean(
    videoUrl &&
    !videoUrl.includes('youtube.com') &&
    !videoUrl.includes('youtu.be') &&
    !videoUrl.includes('vimeo.com') &&
    (videoUrl.startsWith('/uploads/') ||
     videoUrl.startsWith('blob:') ||
     videoUrl.endsWith('.mp4') ||
     videoUrl.endsWith('.webm') ||
     videoUrl.endsWith('.mov') ||
     videoUrl.includes('firebasestorage.googleapis.com') ||
     videoUrl.includes('.mp4?') ||
     videoUrl.includes('commondatastorage.googleapis.com'))
  );

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Debounce preview playback by 220ms so rapid mouse cursor movements don't trigger playback
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && isDirectMedia && !hasVideoError) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsVideoLoaded(true);
            })
            .catch(() => {
              // Browser autoplay policy or media error fallback
              setHasVideoError(true);
            });
        }
      }
    }, 220);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsVideoLoaded(false);
    setPreviewProgress(0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setPreviewProgress(progress);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div
      className={`relative ${aspectRatio} w-full overflow-hidden bg-black/40 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* High-Resolution Static Thumbnail */}
      <img
        src={thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
        alt={title}
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${
          isHovered
            ? 'scale-108 brightness-105 contrast-[1.02]'
            : 'scale-100 brightness-100'
        }`}
        loading="lazy"
      />

      {/* Video Hover Stream Preview */}
      {isDirectMedia && !hasVideoError && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          loop
          preload="none"
          onTimeUpdate={handleTimeUpdate}
          onError={() => setHasVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out pointer-events-none ${
            isHovered && isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Cinematic Ambient Gradient / Hover Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-90' : 'opacity-40'
        }`}
      />

      {/* Live Preview Indicator Badge */}
      <AnimatePresence>
        {isHovered && isVideoLoaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-orange-500/40 text-orange-400 text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-orange-500/10 pointer-events-none"
          >
            <VolumeX size={11} className="text-orange-400" />
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-1.5 bg-orange-500 rounded-full animate-pulse delay-150" />
            </span>
            <span className="ml-0.5">Preview</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shimmer / Transition Flash for non-video or initial hover */}
      {isHovered && !isVideoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] pointer-events-none" />
      )}

      {/* Live Progress Scrubber Bar on Hover */}
      {isHovered && isVideoLoaded && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-150"
            style={{ width: `${previewProgress}%` }}
          />
        </div>
      )}

      {/* Children Overlays (Badges, Buttons, Action Bars) */}
      {children}
    </div>
  );
}
