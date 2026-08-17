import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, X, RefreshCw, HardDriveDownload } from 'lucide-react';
import { useAppStore } from '../store/useStore';

export default function NetworkStatusToast() {
  const { darkMode } = useAppStore();
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showToast, setShowToast] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [toastType, setToastType] = useState<'offline' | 'restored' | null>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : null;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setToastType('restored');
    setShowToast(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setToastType('offline');
    setShowToast(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOnline(false);
      setToastType('offline');
      setShowToast(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Auto-dismiss the "restored" toast after 3.5 seconds
  useEffect(() => {
    if (toastType === 'restored' && showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastType, showToast]);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Fast probe to check internet connectivity
      await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
      setIsOnline(true);
      setToastType('restored');
      setShowToast(true);
    } catch {
      setIsOnline(false);
      setToastType('offline');
      setShowToast(true);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <aside aria-label="Network Status Notifications">
      <AnimatePresence>
        {showToast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-auto sm:min-w-[380px] sm:max-w-md p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3.5 transition-colors ${
              toastType === 'offline'
                ? darkMode
                  ? 'bg-zinc-900/90 border-amber-500/30 text-white shadow-amber-500/10'
                  : 'bg-white/95 border-amber-500/40 text-zinc-900 shadow-zinc-400/30'
                : darkMode
                  ? 'bg-zinc-900/90 border-emerald-500/30 text-white shadow-emerald-500/10'
                  : 'bg-white/95 border-emerald-500/40 text-zinc-900 shadow-zinc-400/30'
            }`}
          >
            {/* Status Icon Indicator */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                toastType === 'offline'
                  ? 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30'
              }`}
            >
              {toastType === 'offline' ? (
                <WifiOff className="w-5 h-5 animate-pulse" />
              ) : (
                <Wifi className="w-5 h-5" />
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    toastType === 'offline' ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                >
                  {toastType === 'offline' ? "Oflayn rejim" : "Aloqa tiklandi"}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    darkMode ? 'bg-white/10 text-white/60' : 'bg-black/5 text-zinc-500'
                  }`}
                >
                  {toastType === 'offline' ? 'Offline' : 'Online'}
                </span>
              </div>

              <p
                className={`text-xs mt-0.5 leading-relaxed ${
                  darkMode ? 'text-white/80' : 'text-zinc-700'
                }`}
              >
                {toastType === 'offline' ? (
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span>Faqat keshda saqlangan va yuklangan media mavjud.</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                      <HardDriveDownload size={12} className="shrink-0" />
                      (Cached only)
                    </span>
                  </span>
                ) : (
                  <span>Internet ulanishi tiklandi. Barcha xizmatlar to'liq faol.</span>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {toastType === 'offline' && (
                <button
                  type="button"
                  onClick={checkConnection}
                  disabled={isChecking}
                  title="Qayta tekshirish"
                  aria-label="Check Connection"
                  className={`p-2 rounded-xl transition-all ${
                    darkMode
                      ? 'hover:bg-white/10 text-white/70 hover:text-white'
                      : 'hover:bg-black/5 text-zinc-600 hover:text-black'
                  }`}
                >
                  <RefreshCw
                    size={15}
                    className={`${isChecking ? 'animate-spin text-amber-500' : ''}`}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowToast(false)}
                title="Yopish"
                aria-label="Dismiss Notification"
                className={`p-2 rounded-xl transition-all ${
                  darkMode
                    ? 'hover:bg-white/10 text-white/50 hover:text-white'
                    : 'hover:bg-black/5 text-zinc-400 hover:text-black'
                }`}
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
