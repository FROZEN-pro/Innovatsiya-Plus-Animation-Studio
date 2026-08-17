import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, X, Radio, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppNotification } from '../types';
import { subscribeToNotifications } from '../lib/notifications';
import { useAuthStore, useAppStore } from '../store/useStore';

export function DashboardAlertBanner() {
  const { user } = useAuthStore();
  const { darkMode } = useAppStore();
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('creativestream_dismissed_alerts') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) {
      setLatestNotification(null);
      return;
    }

    const unsubscribe = subscribeToNotifications((notifs) => {
      if (notifs && notifs.length > 0) {
        // Find the newest notification that has not been dismissed
        const currentDismissed = JSON.parse(localStorage.getItem('creativestream_dismissed_alerts') || '[]');
        const activeNotif = notifs.find(n => !currentDismissed.includes(n.id));
        setLatestNotification(activeNotif || null);
      } else {
        setLatestNotification(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('creativestream_dismissed_alerts', JSON.stringify(updated));
    setLatestNotification(null);
  };

  if (!latestNotification || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ duration: 0.4 }}
        className="w-full mb-6"
      >
        <div className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 border shadow-2xl transition-all ${
          darkMode 
            ? 'bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-black/60 border-orange-500/30' 
            : 'bg-gradient-to-r from-orange-50 via-amber-50 to-white border-orange-200 shadow-orange-500/5'
        }`}>
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            
            {/* Left: Thumbnail & Alert Details */}
            <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
              {latestNotification.thumbnailUrl ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-orange-500/30 shadow-md">
                  <img 
                    src={latestNotification.thumbnailUrl} 
                    alt={latestNotification.title} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-amber-400 drop-shadow" />
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black shrink-0 shadow-lg shadow-orange-500/20">
                  <Radio size={24} className="animate-pulse" />
                </div>
              )}

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500 text-black text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                    New Video Alert
                  </span>
                  {latestNotification.category && (
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-white/10 text-white/80' : 'bg-black/5 text-zinc-700'
                    }`}>
                      {latestNotification.category}
                    </span>
                  )}
                  <span className={`text-[10px] font-mono ${darkMode ? 'text-white/40' : 'text-zinc-400'}`}>
                    Real-time broadcast
                  </span>
                </div>

                <h3 className={`text-sm sm:text-base font-extrabold tracking-tight truncate ${
                  darkMode ? 'text-white' : 'text-zinc-900'
                }`}>
                  {latestNotification.videoTitle || latestNotification.title}
                </h3>

                <p className={`text-xs line-clamp-1 ${
                  darkMode ? 'text-white/70' : 'text-zinc-600'
                }`}>
                  {latestNotification.message}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              {latestNotification.videoId && (
                <Link
                  to={`/play/${latestNotification.videoId}`}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                >
                  <Play fill="currentColor" size={14} /> Watch Now <ArrowRight size={13} />
                </Link>
              )}

              <button
                onClick={() => handleDismiss(latestNotification.id)}
                className={`p-2 rounded-2xl border transition-all ${
                  darkMode 
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white' 
                    : 'bg-black/5 hover:bg-black/10 border-black/10 text-zinc-500 hover:text-zinc-900'
                }`}
                title="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
