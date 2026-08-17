import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sparkles, Film, ExternalLink, Trash2, CheckCheck, Radio, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppNotification } from '../types';
import { subscribeToNotifications, deleteNotificationDoc } from '../lib/notifications';
import { useAuthStore, useAppStore } from '../store/useStore';

export function NotificationCenter() {
  const { user } = useAuthStore();
  const { darkMode } = useAppStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('creativestream_read_notifs') || '[]');
    } catch {
      return [];
    }
  });
  const [liveToast, setLiveToast] = useState<AppNotification | null>(null);
  const isFirstLoadRef = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications((notifs) => {
      setNotifications(notifs);

      // Trigger live toast on new item arrival after initial load
      if (!isFirstLoadRef.current && notifs.length > 0) {
        const newest = notifs[0];
        const currentRead = JSON.parse(localStorage.getItem('creativestream_read_notifs') || '[]');
        if (!currentRead.includes(newest.id)) {
          setLiveToast(newest);
          const timer = setTimeout(() => {
            setLiveToast(null);
          }, 7000);
          return () => clearTimeout(timer);
        }
      }
      isFirstLoadRef.current = false;
    });

    return () => unsubscribe();
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem('creativestream_read_notifs', JSON.stringify(allIds));
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('creativestream_read_notifs', JSON.stringify(updated));
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotificationDoc(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const formatTimeAgo = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (liveToast) setLiveToast(null);
        }}
        className={`relative p-2 rounded-full transition-all ${
          isOpen
            ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
            : darkMode
            ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80'
            : 'bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800'
        }`}
        title="Notifications & New Releases"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-black ring-2 ring-black animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border shadow-2xl z-50 overflow-hidden ${
              darkMode ? 'bg-[#0f0f14] border-white/10' : 'bg-white border-zinc-200'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                  Live Notifications
                </h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-extrabold">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition"
                >
                  <CheckCheck size={13} /> Mark read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <Bell size={28} className={darkMode ? 'text-white/20 mx-auto' : 'text-zinc-300 mx-auto'} />
                  <p className={`text-xs font-bold ${darkMode ? 'text-white/60' : 'text-zinc-600'}`}>No notifications yet</p>
                  <p className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-400'}`}>
                    You'll be alerted here instantly when new 4K streams and masterclasses are published!
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !readIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3.5 transition-colors flex gap-3 relative cursor-pointer ${
                        isUnread
                          ? darkMode
                            ? 'bg-orange-500/10 hover:bg-orange-500/15'
                            : 'bg-orange-50/80 hover:bg-orange-100/60'
                          : darkMode
                          ? 'hover:bg-white/5'
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      {/* Left thumbnail or icon */}
                      {notif.thumbnailUrl ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <img src={notif.thumbnailUrl} alt={notif.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Film size={14} className="text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                          <Sparkles size={16} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 truncate">
                              {notif.category || 'Release Alert'}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono shrink-0 ${darkMode ? 'text-white/40' : 'text-zinc-400'}`}>
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <h5 className={`text-xs font-bold leading-snug truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {notif.videoTitle || notif.title}
                        </h5>

                        <p className={`text-[11px] line-clamp-2 leading-relaxed ${darkMode ? 'text-white/60' : 'text-zinc-600'}`}>
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          {notif.videoId ? (
                            <Link
                              to={`/play/${notif.videoId}`}
                              onClick={() => setIsOpen(false)}
                              className="text-[10px] font-black uppercase text-orange-400 hover:underline flex items-center gap-1"
                            >
                              Watch Stream <ExternalLink size={10} />
                            </Link>
                          ) : (
                            <span />
                          )}

                          {user?.role === 'admin' && (
                            <button
                              onClick={(e) => handleDelete(e, notif.id)}
                              className={`p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition`}
                              title="Delete announcement"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className={`p-2.5 bg-black/20 text-center border-t ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
              <span className={`text-[10px] font-mono flex items-center justify-center gap-1.5 ${darkMode ? 'text-white/40' : 'text-zinc-400'}`}>
                <Radio size={11} className="text-emerald-400 animate-pulse" /> Real-time Firestore Stream Channel Active
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Floating Toast Alert for Live Broadcasts */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full bg-[#121218]/95 border border-orange-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white shadow-orange-500/10"
          >
            <div className="flex items-start gap-3">
              {liveToast.thumbnailUrl ? (
                <img src={liveToast.thumbnailUrl} alt={liveToast.title} className="w-14 h-14 rounded-xl object-cover border border-orange-500/30 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                  <Sparkles size={20} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black text-[9px] font-black uppercase tracking-wider animate-pulse">
                    Just Dropped
                  </span>
                  <button
                    onClick={() => setLiveToast(null)}
                    className="text-white/40 hover:text-white transition p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>

                <h4 className="text-xs font-extrabold text-white truncate mt-1">
                  {liveToast.videoTitle || liveToast.title}
                </h4>
                <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">
                  {liveToast.message}
                </p>

                {liveToast.videoId && (
                  <Link
                    to={`/play/${liveToast.videoId}`}
                    onClick={() => setLiveToast(null)}
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-xl bg-orange-500 text-black text-[10px] font-extrabold uppercase hover:bg-orange-400 transition shadow"
                  >
                    Stream Now <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
