import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, Search, RefreshCw, Download, Trash2, Filter, 
  Film, DollarSign, Settings, Users, AlertCircle, 
  CheckCircle2, Info, ChevronDown, ChevronUp, UserCheck, 
  Lock, Sparkles, Tag, ShieldCheck, ArrowRight
} from 'lucide-react';
import { AdminActivityLog, AdminActionCategory } from '../types';
import { fetchActivityLogs, exportActivityLogsToCSV } from '../lib/activityLogs';
import { auth } from '../lib/firebase';
import { formatRelativeTime } from '../lib/userActivity';

interface Props {
  darkMode: boolean;
}

export default function AdminActivityLogViewer({ darkMode }: Props) {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminActionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchActivityLogs(selectedCategory, searchQuery, 150);
      setLogs(data);
    } catch (err) {
      console.warn('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear the audit trail activity log?')) return;
    setIsClearing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/admin/activity-logs', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      await loadLogs();
    } catch (err) {
      console.error('Clear logs error:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return <Film size={15} className="text-orange-400" />;
      case 'subscription':
        return <DollarSign size={15} className="text-emerald-400" />;
      case 'settings':
        return <Settings size={15} className="text-sky-400" />;
      case 'users':
        return <Users size={15} className="text-purple-400" />;
      default:
        return <History size={15} className="text-zinc-400" />;
    }
  };

  const getActionBadge = (actionType: string, severity?: string) => {
    let colorClass = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    if (actionType.includes('CREATED') || actionType.includes('GRANT') || severity === 'success') {
      colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    } else if (actionType.includes('UPDATED') || actionType.includes('CHANGED') || actionType.includes('PAYMENT')) {
      colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else if (actionType.includes('DELETED') || actionType.includes('BANNED') || actionType.includes('CLEARED') || severity === 'critical') {
      colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    } else if (actionType.includes('ROLE') || actionType.includes('USER')) {
      colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }

    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${colorClass}`}>
        {actionType.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className={`p-6 rounded-[28px] border shadow-xl ${
        darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <History size={18} />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Admin Activity & Audit Trail
              </h2>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>
              Accountability logs tracking content uploads, video edits, deletions, subscription pricing changes, and payment gateway updates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadLogs}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                darkMode 
                  ? 'bg-white/10 hover:bg-white/15 text-white' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
              }`}
              title="Refresh Activity Log"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => exportActivityLogsToCSV(logs)}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
              title="Export Log to CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearLogs}
              disabled={isClearing || logs.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
              title="Clear activity log history"
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Sub-bar */}
        <div className="mt-6 pt-6 border-t flex flex-col md:flex-row md:items-center justify-between gap-4 border-white/5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'content', 'subscription', 'settings', 'users'] as AdminActionCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                    : darkMode
                    ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                }`}
              >
                {cat === 'all' && <Filter size={12} />}
                {cat === 'content' && <Film size={12} />}
                {cat === 'subscription' && <DollarSign size={12} />}
                {cat === 'settings' && <Settings size={12} />}
                {cat === 'users' && <Users size={12} />}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search logs by keyword or admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${
                darkMode
                  ? 'bg-black/30 border border-white/10 text-white focus:border-orange-500/50'
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:border-orange-500'
              }`}
            />
          </form>
        </div>
      </div>

      {/* Log Feed List */}
      <div className="space-y-3">
        {loading ? (
          <div className={`p-12 text-center rounded-[28px] border ${
            darkMode ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-zinc-200 text-zinc-500'
          }`}>
            <RefreshCw size={24} className="animate-spin mx-auto text-orange-500 mb-2" />
            <p className="text-xs font-semibold">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className={`p-12 text-center rounded-[28px] border ${
            darkMode ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-zinc-200 text-zinc-500'
          }`}>
            <Info size={32} className="mx-auto text-orange-500/50 mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">No Activity Logs Found</h4>
            <p className="text-xs max-w-sm mx-auto">
              No matching administrative changes were recorded for this filter query. New actions made to content, subscriptions, or settings will automatically appear here.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const hasChanges = log.changes && Object.keys(log.changes).length > 0;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 hover:border-white/20' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Column: Icon + Summary + Details */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      darkMode ? 'bg-white/5 border border-white/10' : 'bg-zinc-100 border border-zinc-200'
                    }`}>
                      {getCategoryIcon(log.category)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.actionType, log.severity)}
                        <span className={`text-[11px] font-mono ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                          {formatRelativeTime(log.timestamp)}
                        </span>
                        <span className={`text-[10px] hidden sm:inline ${darkMode ? 'text-white/30' : 'text-zinc-400'}`}>
                          • {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {log.summary}
                      </h4>

                      {log.details && (
                        <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-zinc-600'}`}>
                          {log.details}
                        </p>
                      )}

                      {/* Admin Performer Meta */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-orange-400/90">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={12} />
                          <span>{log.adminEmail || 'admin'}</span>
                        </span>
                        {log.targetName && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ${
                            darkMode ? 'bg-white/5 text-white/70' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            Target: {log.targetName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Diff Toggle Button */}
                  {hasChanges && (
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 self-start ${
                        darkMode ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Changes' : 'View Changes'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>

                {/* Expanded Parameter Diff Viewer */}
                <AnimatePresence>
                  {isExpanded && log.changes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-4 pt-3 border-t text-xs space-y-2 overflow-hidden ${
                        darkMode ? 'border-white/10' : 'border-zinc-200'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
                        Parameter Change Audit:
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
                        {Object.entries(log.changes).map(([param, val]: [string, any]) => (
                          <div
                            key={param}
                            className={`p-2 rounded-lg flex items-center justify-between gap-2 ${
                              darkMode ? 'bg-black/30' : 'bg-zinc-50'
                            }`}
                          >
                            <span className="text-zinc-400 font-semibold">{param}:</span>
                            <div className="flex items-center gap-2 text-right">
                              <span className="text-rose-400 line-through opacity-70">
                                {typeof val?.from === 'object' ? JSON.stringify(val?.from) : String(val?.from ?? 'null')}
                              </span>
                              <ArrowRight size={12} className="text-zinc-500" />
                              <span className="text-emerald-400 font-bold">
                                {typeof val?.to === 'object' ? JSON.stringify(val?.to) : String(val?.to ?? 'null')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
