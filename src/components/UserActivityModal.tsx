import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Clock, 
  LogIn, 
  Film, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  Play, 
  Activity,
  Award,
  Crown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { User, UserLoginLog, UserWatchRecord } from '../types';
import { fetchUserLoginLogs, fetchUserWatchHistory, formatDuration, formatRelativeTime } from '../lib/userActivity';
import { Link } from 'react-router-dom';

interface UserActivityModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function UserActivityModal({ user, isOpen, onClose, darkMode }: UserActivityModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'logins' | 'watch'>('logins');
  const [loginLogs, setLoginLogs] = useState<UserLoginLog[]>([]);
  const [watchRecords, setWatchRecords] = useState<UserWatchRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    let isMounted = true;
    const loadUserData = async () => {
      setLoading(true);
      try {
        const [logs, history] = await Promise.all([
          fetchUserLoginLogs(user.uid, 50),
          fetchUserWatchHistory(user.uid)
        ]);
        if (isMounted) {
          setLoginLogs(logs);
          setWatchRecords(history);
        }
      } catch (err) {
        console.error("Error fetching user activity details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUserData();
    return () => { isMounted = false; };
  }, [isOpen, user?.uid]);

  if (!isOpen || !user) return null;

  const totalWatchSec = user.totalWatchDurationSeconds || 
    watchRecords.reduce((acc, curr) => acc + (curr.watchDurationSeconds || 0), 0);

  const completedCount = watchRecords.filter(w => w.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[32px] border ${
          darkMode ? 'bg-[#0a0a10] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        } shadow-2xl overflow-hidden`}
      >
        {/* Header Bar */}
        <div className={`p-6 border-b ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-200 bg-zinc-50/80'} flex items-start justify-between gap-4`}>
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
              alt={user.displayName || 'User'}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/40 shadow-lg shadow-orange-500/10"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold tracking-tight">
                  {user.displayName || 'Anonymous Member'}
                </h3>
                {user.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Crown size={11} /> Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    VIP Member
                  </span>
                )}
                {user.subscriptionStatus === 'banned' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                    Banned
                  </span>
                )}
              </div>
              <p className={`text-xs font-mono mt-0.5 ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>
                {user.email || user.uid}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2.5 rounded-full transition ${
              darkMode ? 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick KPI Overview Banner */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b ${darkMode ? 'border-white/10 bg-black/20' : 'border-zinc-100 bg-zinc-50/50'}`}>
          <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <span className={`text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-zinc-400'}`}>
              <Clock size={12} className="text-orange-400" /> Total Watch Time
            </span>
            <p className="text-base font-extrabold text-orange-400 mt-1">
              {formatDuration(totalWatchSec)}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <span className={`text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-zinc-400'}`}>
              <LogIn size={12} className="text-emerald-400" /> Login Count
            </span>
            <p className="text-base font-extrabold text-emerald-400 mt-1">
              {user.loginCount || loginLogs.length || 1} Logins
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <span className={`text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-zinc-400'}`}>
              <Film size={12} className="text-sky-400" /> Streams Watched
            </span>
            <p className="text-base font-extrabold text-sky-400 mt-1">
              {watchRecords.length} Videos
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <span className={`text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 ${darkMode ? 'text-white/50' : 'text-zinc-400'}`}>
              <Calendar size={12} className="text-purple-400" /> Last Active
            </span>
            <p className="text-xs font-bold text-purple-400 mt-1 truncate">
              {formatRelativeTime(user.lastLoginAt || user.lastActiveAt || user.lastLogin)}
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className={`px-6 pt-4 flex items-center gap-2 border-b ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
          <button
            onClick={() => setActiveSubTab('logins')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeSubTab === 'logins'
                ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn size={14} /> Login Timestamps & Audit Log ({loginLogs.length})
          </button>

          <button
            onClick={() => setActiveSubTab('watch')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeSubTab === 'watch'
                ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film size={14} /> Watch Duration Breakdown ({watchRecords.length})
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[420px] scrollbar-thin">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="animate-spin text-orange-500" />
              <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                Querying secure Firestore activity collection...
              </p>
            </div>
          ) : activeSubTab === 'logins' ? (
            /* Login Audit Logs */
            loginLogs.length === 0 ? (
              <div className={`text-center py-12 rounded-2xl border border-dashed ${darkMode ? 'border-white/10 text-white/40' : 'border-zinc-200 text-zinc-400'}`}>
                <LogIn size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No historical login records logged yet for this user.</p>
                <p className="text-[11px] opacity-60 mt-1">Future sign-ins and session restores will automatically record timestamps here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {loginLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition ${
                      darkMode ? 'bg-white/5 border-white/10 hover:border-orange-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-orange-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                        {log.device?.toLowerCase().includes('mobile') || log.device?.toLowerCase().includes('ios') || log.device?.toLowerCase().includes('android') ? (
                          <Smartphone size={16} />
                        ) : (
                          <Monitor size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {log.device || 'Web Browser'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            {log.method || 'Google Auth'}
                          </span>
                        </div>
                        <p className={`text-[10px] font-mono mt-0.5 truncate ${darkMode ? 'text-white/40' : 'text-zinc-400'}`}>
                          {log.userAgent || 'Standard Secure Client'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {new Date(log.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className={`text-[10px] font-mono ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {formatRelativeTime(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Watch History Records */
            watchRecords.length === 0 ? (
              <div className={`text-center py-12 rounded-2xl border border-dashed ${darkMode ? 'border-white/10 text-white/40' : 'border-zinc-200 text-zinc-400'}`}>
                <Film size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No watch duration recorded yet for this member.</p>
                <p className="text-[11px] opacity-60 mt-1">As they stream videos in Innovation Plus, their seconds watched and progress are tracked in real time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {watchRecords.map((item) => {
                  const watchSec = item.watchDurationSeconds || item.progressSeconds || 0;
                  return (
                    <div
                      key={item.videoId}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition ${
                        darkMode ? 'bg-white/5 border-white/10 hover:border-orange-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-orange-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-14 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                            <Play size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {item.category && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-orange-500/10 text-orange-400">
                                {item.category}
                              </span>
                            )}
                            <h4 className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                              {item.title || `Video #${item.videoId}`}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-mono">
                            <span className="text-orange-400 font-bold flex items-center gap-1">
                              <Clock size={11} /> {formatDuration(watchSec)} watched
                            </span>
                            <span className={darkMode ? 'text-white/40' : 'text-zinc-400'}>
                              Progress: {item.progressSeconds ? `${Math.floor(item.progressSeconds)}s` : '0s'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {item.completed ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono flex items-center gap-1">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono">
                            In Progress
                          </span>
                        )}

                        <Link
                          to={`/play/${item.videoId}`}
                          className={`p-2 rounded-xl text-xs font-bold ${
                            darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900'
                          } transition`}
                          title="Open Video Player"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 px-6 border-t ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-200 bg-zinc-50'} flex items-center justify-between text-xs`}>
          <span className={`text-[11px] font-mono ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>
            Audit ID: {user.uid} • Secure Firestore Encrypted Telemetry
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold uppercase tracking-wider text-xs rounded-xl transition"
          >
            Close Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}
