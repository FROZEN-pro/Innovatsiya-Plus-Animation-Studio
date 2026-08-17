import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, Square, Tag, Trash2, Eye, Lock, 
  Sparkles, Search, Shield, Crown, Film, 
  Edit3, RefreshCw, Wand2, CheckCircle2, 
  AlertTriangle, LayoutGrid, LayoutList, SlidersHorizontal,
  X, Plus, Globe, FileText, Check
} from 'lucide-react';
import { Video, ContentCategory, VisibilityStatus } from '../types';
import { auth } from '../lib/firebase';

interface BulkVideoManagerProps {
  videos: Video[];
  darkMode: boolean;
  onRefreshVideos: () => Promise<void> | void;
}

const CATEGORIES: ContentCategory[] = ['Animation', 'Dubbing', '2D Video', 'Short', 'Music', '3D Art', 'Vault'];
const VISIBILITIES: { value: VisibilityStatus; label: string; icon: any; color: string }[] = [
  { value: 'public', label: 'Public', icon: Globe, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'vip_only', label: 'VIP Only', icon: Crown, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'unlisted', label: 'Unlisted', icon: Eye, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { value: 'draft', label: 'Draft', icon: Edit3, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'archived', label: 'Archived', icon: Lock, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' }
];

const PRESET_TAGS = [
  '4K', 'HDR', 'Exclusive', 'SpatialAudio', 'Binaural', 
  'Synthwave', 'Cyberpunk', '2DAnimation', '3DArt', 
  'Trending', 'Masterclass', 'DolbyVision', 'SciFi'
];

export default function BulkVideoManager({ videos, darkMode, onRefreshVideos }: BulkVideoManagerProps) {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  
  // Filtering & View state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Bulk Edit Form state
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkVisibility, setBulkVisibility] = useState<string>('');
  const [bulkAuthor, setBulkAuthor] = useState<string>('');
  const [bulkIsHd, setBulkIsHd] = useState<string>('no_change'); // 'no_change' | 'true' | 'false'
  const [bulkIsEncrypted, setBulkIsEncrypted] = useState<string>('no_change'); // 'no_change' | 'true' | 'false'
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [titlePrefix, setTitlePrefix] = useState('');
  const [titleSuffix, setTitleSuffix] = useState('');
  const [descAppend, setDescAppend] = useState('');

  // Single Quick-Edit Modal state
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    category: string;
    visibility: VisibilityStatus;
    author: string;
    isHd: boolean;
    isEncrypted: boolean;
    tags: string[];
    newTag: string;
  }>({
    title: '',
    description: '',
    category: 'Animation',
    visibility: 'public',
    author: 'Innovation Studio',
    isHd: true,
    isEncrypted: true,
    tags: [],
    newTag: ''
  });

  // Action status
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    batchCommonTags?: string[];
    itemTags?: { id: number | string; tags: string[] }[];
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered video list
  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
      const vVisibility = v.visibility || 'public';
      const matchesVisibility = visibilityFilter === 'All' || vVisibility === visibilityFilter;
      const q = searchQuery.toLowerCase().trim();
      const tagsString = (v.tags || []).join(' ').toLowerCase();
      const matchesSearch = !q || 
        v.title.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q) || 
        (v.author && v.author.toLowerCase().includes(q)) ||
        tagsString.includes(q);

      return matchesCategory && matchesVisibility && matchesSearch;
    });
  }, [videos, categoryFilter, visibilityFilter, searchQuery]);

  // Selection helpers
  const isAllSelected = filteredVideos.length > 0 && filteredVideos.every(v => selectedIds.has(v.id));
  const isSomeSelected = filteredVideos.some(v => selectedIds.has(v.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredVideos.forEach(v => next.add(v.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Get Auth Token Helper
  const getAuthToken = async () => {
    if (!auth.currentUser) throw new Error("Authentication required");
    return await auth.currentUser.getIdToken();
  };

  // Add Tag to Bulk Action
  const handleAddBulkTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !tagsToAdd.includes(clean)) {
      setTagsToAdd([...tagsToAdd, clean]);
      setTagsToRemove(tagsToRemove.filter(t => t !== clean));
    }
    setBulkTagInput('');
  };

  const handleRemoveBulkTagToAdd = (tag: string) => {
    setTagsToAdd(tagsToAdd.filter(t => t !== tag));
  };

  const handleAddTagToRemove = (tag: string) => {
    const clean = tag.trim();
    if (clean && !tagsToRemove.includes(clean)) {
      setTagsToRemove([...tagsToRemove, clean]);
      setTagsToAdd(tagsToAdd.filter(t => t !== clean));
    }
  };

  // Quick Single Video Edit Handlers
  const handleOpenEdit = (v: Video) => {
    setEditingVideo(v);
    setEditForm({
      title: v.title || '',
      description: v.description || '',
      category: v.category || 'Animation',
      visibility: (v.visibility as VisibilityStatus) || 'public',
      author: v.author || 'Innovation Studio',
      isHd: v.isHd !== undefined ? v.isHd : true,
      isEncrypted: v.isEncrypted !== undefined ? v.isEncrypted : true,
      tags: Array.isArray(v.tags) ? [...v.tags] : [],
      newTag: ''
    });
  };

  const handleSaveSingleEdit = async () => {
    if (!editingVideo) return;
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/videos/${editingVideo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          visibility: editForm.visibility,
          author: editForm.author,
          isHd: editForm.isHd,
          isEncrypted: editForm.isEncrypted,
          tags: editForm.tags
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update video');
      }

      showToast(`Updated "${editForm.title}" successfully!`);
      setEditingVideo(null);
      await onRefreshVideos();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating video', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Edit Submit
  const handleApplyBulkEdit = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      const updatesPayload: any = {};

      if (bulkCategory) updatesPayload.category = bulkCategory;
      if (bulkVisibility) updatesPayload.visibility = bulkVisibility;
      if (bulkAuthor) updatesPayload.author = bulkAuthor;
      if (bulkIsHd !== 'no_change') updatesPayload.isHd = bulkIsHd === 'true';
      if (bulkIsEncrypted !== 'no_change') updatesPayload.isEncrypted = bulkIsEncrypted === 'true';
      if (tagsToAdd.length > 0) updatesPayload.addTags = tagsToAdd;
      if (tagsToRemove.length > 0) updatesPayload.removeTags = tagsToRemove;
      if (titlePrefix) updatesPayload.titlePrefix = titlePrefix;
      if (titleSuffix) updatesPayload.titleSuffix = titleSuffix;
      if (descAppend) updatesPayload.descriptionAppend = descAppend;

      const res = await fetch('/api/videos/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoIds: Array.from(selectedIds),
          updates: updatesPayload
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Bulk update failed');
      }

      const data = await res.json();
      showToast(`Successfully updated ${data.count} videos!`);
      setIsBulkEditOpen(false);
      // Reset form
      setBulkCategory('');
      setBulkVisibility('');
      setBulkAuthor('');
      setBulkIsHd('no_change');
      setBulkIsEncrypted('no_change');
      setTagsToAdd([]);
      setTagsToRemove([]);
      setTitlePrefix('');
      setTitleSuffix('');
      setDescAppend('');
      await onRefreshVideos();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating videos in bulk', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/videos/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoIds: Array.from(selectedIds)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Bulk delete failed');
      }

      const data = await res.json();
      showToast(`Permanently deleted ${data.count} videos.`);
      setShowDeleteConfirm(false);
      clearSelection();
      await onRefreshVideos();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error deleting videos', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Preset Actions
  const handleQuickSetVisibility = async (visibility: VisibilityStatus) => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/videos/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoIds: Array.from(selectedIds),
          updates: { visibility }
        })
      });

      if (!res.ok) throw new Error('Failed to update visibility');
      showToast(`Set visibility to "${visibility.toUpperCase()}" for ${selectedIds.size} videos.`);
      await onRefreshVideos();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Smart Tag Generation for Selected Videos
  const handleGenerateAiTags = async () => {
    if (selectedIds.size === 0) {
      showToast("Please select at least 1 video for AI Tag Generation", "error");
      return;
    }
    setIsAiGenerating(true);
    try {
      const selectedVideos = videos.filter(v => selectedIds.has(v.id));
      const items = selectedVideos.map(v => ({
        id: v.id,
        title: v.title,
        category: v.category,
        description: v.description
      }));

      const res = await fetch('/api/ai/bulk-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!res.ok) throw new Error('AI tag generation failed');
      const data = await res.json();
      setAiSuggestions(data);

      if (data.batchCommonTags && data.batchCommonTags.length > 0) {
        // Pre-fill bulk tags to add with suggested common tags
        const newTags = Array.from(new Set([...tagsToAdd, ...data.batchCommonTags]));
        setTagsToAdd(newTags);
      }

      showToast(`Gemini analyzed ${items.length} videos and generated smart tags!`);
      setIsBulkEditOpen(true);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'AI Tag Generation failed', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/90 border-red-500/40 text-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="text-xs font-bold">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Header & Filter Bar */}
      <div className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 sm:p-8 border ${darkMode ? "border-white/10" : "border-black/10"} shadow-2xl space-y-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="text-orange-500" size={24} />
              <h2 className={`text-xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-black"}`}>
                Bulk Video Management Tool
              </h2>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? "text-white/60" : "text-black/60"}`}>
              Select multiple streams to edit metadata, tags, visibility status, and encryption in batch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefreshVideos()}
              disabled={isProcessing}
              className={`p-2.5 rounded-2xl ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/70" : "bg-black/5 hover:bg-black/10 text-black/70"} transition-all`}
              title="Refresh Catalog"
            >
              <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} />
            </button>

            <div className={`p-1 rounded-2xl flex items-center gap-1 ${darkMode ? "bg-black/40 border border-white/10" : "bg-black/5 border border-black/10"}`}>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-orange-500 text-black shadow-md' : darkMode ? 'text-white/60 hover:text-white' : 'text-zinc-600 hover:text-black'
                }`}
                title="Spreadsheet Table View"
              >
                <LayoutList size={15} /> Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' ? 'bg-orange-500 text-black shadow-md' : darkMode ? 'text-white/60 hover:text-white' : 'text-zinc-600 hover:text-black'
                }`}
                title="Gallery Grid View"
              >
                <LayoutGrid size={15} /> Grid
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? "text-white/40" : "text-black/40"}`} size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, tag, author, or description..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs ${
                darkMode ? "bg-black/40 border-white/10 text-white placeholder-white/40" : "bg-white border-black/10 text-black placeholder-black/40 shadow-sm"
              } border focus:outline-none focus:border-orange-500 transition`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-2xl text-xs font-medium ${
                darkMode ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black shadow-sm"
              } border focus:outline-none focus:border-orange-500 transition`}
            >
              <option value="All">All Categories ({videos.length})</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({videos.filter(v => v.category === cat).length})
                </option>
              ))}
            </select>
          </div>

          {/* Visibility Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <select
              value={visibilityFilter}
              onChange={e => setVisibilityFilter(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-2xl text-xs font-medium ${
                darkMode ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black shadow-sm"
              } border focus:outline-none focus:border-orange-500 transition`}
            >
              <option value="All">All Visibility ({videos.length})</option>
              {VISIBILITIES.map(v => (
                <option key={v.value} value={v.value}>
                  {v.label} ({videos.filter(item => (item.visibility || 'public') === v.value).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selection summary & Quick Preset Bar */}
        <div className={`pt-4 border-t ${darkMode ? "border-white/10" : "border-black/10"} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isAllSelected 
                  ? 'bg-orange-500 text-black' 
                  : isSomeSelected
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : darkMode ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-black/10 text-black/70 hover:bg-black/20'
              }`}
            >
              {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              <span>{isAllSelected ? 'Deselect All' : 'Select All Filtered'}</span>
            </button>

            {selectedIds.size > 0 && (
              <>
                <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold px-3 py-1.5 rounded-xl">
                  {selectedIds.size} of {videos.length} selected
                </span>
                <button
                  onClick={clearSelection}
                  className={`text-xs underline ${darkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                >
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={selectedIds.size === 0 || isProcessing || isAiGenerating}
              onClick={handleGenerateAiTags}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 transition-all disabled:opacity-40"
              title="Generate tags with Gemini AI for selected videos"
            >
              <Sparkles size={14} className={isAiGenerating ? "animate-spin" : ""} />
              <span>{isAiGenerating ? 'Analyzing...' : 'AI Bulk Tags'}</span>
            </button>

            <button
              disabled={selectedIds.size === 0 || isProcessing}
              onClick={() => setIsBulkEditOpen(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-black flex items-center gap-1.5 shadow-lg shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
            >
              <Edit3 size={14} /> Bulk Edit ({selectedIds.size})
            </button>

            {selectedIds.size > 0 && (
              <button
                disabled={isProcessing}
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-1.5 transition-all"
                title="Delete Selected"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Quick Action Drawer when items are selected */}
      <AnimatePresence>
        {selectedIds.size > 0 && !isBulkEditOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`sticky bottom-6 z-40 p-4 rounded-3xl backdrop-blur-2xl shadow-2xl border ${
              darkMode 
                ? "bg-zinc-950/90 border-orange-500/30 text-white" 
                : "bg-white/95 border-orange-500/30 text-black shadow-orange-500/10"
            } flex flex-wrap items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-black font-extrabold text-xs flex items-center justify-center">
                {selectedIds.size}
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide">Quick Batch Operations</span>
                <span className={`block text-[10px] ${darkMode ? "text-white/50" : "text-black/50"}`}>
                  Apply instant modifications to {selectedIds.size} videos
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleQuickSetVisibility('vip_only')}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center gap-1 transition-all"
              >
                <Crown size={13} /> Set VIP Only
              </button>

              <button
                onClick={() => handleQuickSetVisibility('public')}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 transition-all"
              >
                <Globe size={13} /> Set Public
              </button>

              <button
                onClick={() => handleQuickSetVisibility('draft')}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center gap-1 transition-all"
              >
                <Edit3 size={13} /> Set Draft
              </button>

              <button
                onClick={() => setIsBulkEditOpen(true)}
                className="px-4 py-1.5 rounded-xl text-[11px] font-extrabold bg-orange-500 text-black flex items-center gap-1 shadow-md hover:bg-orange-400 transition-all"
              >
                <SlidersHorizontal size={13} /> Full Bulk Editor...
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Video Catalog (Table or Grid View) */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] border ${darkMode ? "border-white/10" : "border-black/10"} shadow-2xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${darkMode ? "border-white/10 bg-white/5 text-white/60" : "border-black/10 bg-black/5 text-black/60"} text-[10px] uppercase font-mono tracking-wider`}>
                  <th className="p-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="hover:text-orange-500">
                      {isAllSelected ? <CheckSquare size={16} className="text-orange-500" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="p-4">Media Video</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4">DRM & HD</th>
                  <th className="p-4">Views</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? "divide-white/5 text-white" : "divide-black/5 text-black"} text-xs`}>
                {filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`p-12 text-center ${darkMode ? "text-white/40" : "text-black/40"}`}>
                      No media streams match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map(video => {
                    const isSelected = selectedIds.has(video.id);
                    const currentVis = VISIBILITIES.find(v => v.value === (video.visibility || 'public')) || VISIBILITIES[0];
                    const VisIcon = currentVis.icon;
                    const videoTags = Array.isArray(video.tags) ? video.tags : [];

                    return (
                      <tr 
                        key={video.id} 
                        className={`transition-colors hover:${darkMode ? "bg-white/5" : "bg-black/5"} ${
                          isSelected ? (darkMode ? "bg-orange-500/10" : "bg-orange-500/5") : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => toggleSelectOne(video.id)}
                            className="text-zinc-400 hover:text-orange-500 transition"
                          >
                            {isSelected ? <CheckSquare size={16} className="text-orange-500" /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Thumbnail & Title */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-16 h-10 object-cover rounded-xl shrink-0 border border-white/10 shadow-sm"
                            />
                            <div className="min-w-0 max-w-xs">
                              <h4 className="font-bold truncate text-xs">{video.title}</h4>
                              <span className={`text-[10px] truncate block ${darkMode ? "text-white/50" : "text-black/50"}`}>
                                {video.author || "Innovation Studio"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {video.category}
                          </span>
                        </td>

                        {/* Tags */}
                        <td className="p-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {videoTags.length === 0 ? (
                              <span className={`text-[10px] italic ${darkMode ? "text-white/30" : "text-black/30"}`}>No tags</span>
                            ) : (
                              videoTags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${darkMode ? "bg-white/10 text-white/80" : "bg-black/10 text-black/80"}`}>
                                  #{tag}
                                </span>
                              ))
                            )}
                            {videoTags.length > 3 && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${darkMode ? "text-white/50" : "text-black/50"}`}>
                                +{videoTags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Visibility */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${currentVis.color}`}>
                            <VisIcon size={12} /> {currentVis.label}
                          </span>
                        </td>

                        {/* DRM / HD */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${video.isHd !== false ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-500/20 text-zinc-400"}`}>
                              4K
                            </span>
                            {video.isEncrypted !== false && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 flex items-center gap-1">
                                <Shield size={10} /> DRM
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Views */}
                        <td className="p-4 font-mono text-[11px] opacity-70">
                          {video.views?.toLocaleString() || 0}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(video)}
                              className={`p-2 rounded-xl ${darkMode ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"} transition`}
                              title="Edit Video Metadata"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedIds(new Set([video.id]));
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition"
                              title="Delete Stream"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.length === 0 ? (
            <div className={`col-span-full py-16 text-center rounded-[32px] border ${darkMode ? "bg-white/5 border-white/10 text-white/40" : "bg-black/5 border-black/10 text-black/40"}`}>
              No videos found matching your criteria.
            </div>
          ) : (
            filteredVideos.map(video => {
              const isSelected = selectedIds.has(video.id);
              const currentVis = VISIBILITIES.find(v => v.value === (video.visibility || 'public')) || VISIBILITIES[0];
              const VisIcon = currentVis.icon;
              const videoTags = Array.isArray(video.tags) ? video.tags : [];

              return (
                <div
                  key={video.id}
                  onClick={() => toggleSelectOne(video.id)}
                  className={`cursor-pointer rounded-[28px] overflow-hidden border transition-all relative ${
                    darkMode ? "bg-white/5 border-white/10" : "bg-white border-black/10 shadow-lg"
                  } ${isSelected ? "ring-2 ring-orange-500 border-orange-500/50 shadow-orange-500/20" : "hover:border-orange-500/40"}`}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    
                    {/* Checkbox badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center backdrop-blur-md ${
                        isSelected ? 'bg-orange-500 text-black shadow-lg' : 'bg-black/60 text-white/80 border border-white/20'
                      }`}>
                        {isSelected ? <Check size={16} strokeWidth={3} /> : <Square size={14} />}
                      </div>
                    </div>

                    {/* Visibility badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase backdrop-blur-md border flex items-center gap-1 ${currentVis.color}`}>
                        <VisIcon size={10} /> {currentVis.label}
                      </span>
                    </div>

                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono text-orange-400 border border-white/10">
                      {video.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className={`font-bold text-xs line-clamp-1 ${darkMode ? "text-white" : "text-black"}`}>
                      {video.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {videoTags.slice(0, 3).map((t, idx) => (
                        <span key={idx} className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${darkMode ? "bg-white/10 text-white/70" : "bg-black/10 text-black/70"}`}>
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
                      <span className={darkMode ? "text-white/50 font-mono" : "text-black/50 font-mono"}>
                        {video.views || 0} views
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(video);
                        }}
                        className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK EDIT DRAWER / MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBulkEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-3xl rounded-[32px] p-6 sm:p-8 border shadow-2xl space-y-6 my-8 ${
                darkMode ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-black/10 text-black"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-4 border-white/10">
                <div>
                  <h3 className="text-xl font-extrabold flex items-center gap-2">
                    <SlidersHorizontal className="text-orange-500" size={20} />
                    Batch Edit {selectedIds.size} Videos
                  </h3>
                  <p className={`text-xs mt-1 ${darkMode ? "text-white/60" : "text-black/60"}`}>
                    Leave any field empty or unselected if you do not want to alter it.
                  </p>
                </div>
                <button
                  onClick={() => setIsBulkEditOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* AI Suggestions Callout if available */}
              {aiSuggestions?.batchCommonTags && aiSuggestions.batchCommonTags.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <Wand2 size={16} /> Gemini AI Recommended Batch Tags:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestions.batchCommonTags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddBulkTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border transition ${
                          tagsToAdd.includes(tag)
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-amber-500/20 text-amber-200 border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        <Plus size={11} /> #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Category & Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                      Set Category (Optional)
                    </label>
                    <select
                      value={bulkCategory}
                      onChange={e => setBulkCategory(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    >
                      <option value="">-- Keep Current Category --</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                      Set Visibility Status (Optional)
                    </label>
                    <select
                      value={bulkVisibility}
                      onChange={e => setBulkVisibility(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    >
                      <option value="">-- Keep Current Visibility --</option>
                      {VISIBILITIES.map(v => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Author & Hardware Flags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                      Author / Studio Attribution
                    </label>
                    <input
                      type="text"
                      value={bulkAuthor}
                      onChange={e => setBulkAuthor(e.target.value)}
                      placeholder="e.g. Innovation Studio"
                      className={`w-full px-4 py-3 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                      4K HDR Master Flag
                    </label>
                    <select
                      value={bulkIsHd}
                      onChange={e => setBulkIsHd(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    >
                      <option value="no_change">-- No Change --</option>
                      <option value="true">Enable 4K HDR</option>
                      <option value="false">Standard HD</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                      AES-256 Vault Encryption
                    </label>
                    <select
                      value={bulkIsEncrypted}
                      onChange={e => setBulkIsEncrypted(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    >
                      <option value="no_change">-- No Change --</option>
                      <option value="true">Protected (Encrypted)</option>
                      <option value="false">Unprotected</option>
                    </select>
                  </div>
                </div>

                {/* TAGS MANAGEMENT IN BULK */}
                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-black/30 border-white/10" : "bg-black/5 border-black/10"} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] uppercase font-extrabold flex items-center gap-1.5 ${darkMode ? "text-white/80" : "text-black/80"}`}>
                      <Tag size={13} className="text-orange-400" /> Batch Tags Manager
                    </label>
                    <span className="text-[10px] text-zinc-400">Append or prune tags across all {selectedIds.size} videos</span>
                  </div>

                  {/* Add Tag Input & Presets */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bulkTagInput}
                      onChange={e => setBulkTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBulkTag(bulkTagInput);
                        }
                      }}
                      placeholder="Type tag name and click Add..."
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs ${
                        darkMode ? "bg-black/60 border-white/10 text-white" : "bg-white border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddBulkTag(bulkTagInput)}
                      className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-orange-500 text-black hover:bg-orange-400 transition"
                    >
                      Add Tag
                    </button>
                  </div>

                  {/* Quick Preset Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-zinc-400 mr-1">Presets:</span>
                    {PRESET_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddBulkTag(tag)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border transition ${
                          tagsToAdd.includes(tag)
                            ? 'bg-orange-500 text-black border-orange-400'
                            : darkMode ? 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10' : 'bg-black/5 text-black/70 border-black/10 hover:bg-black/10'
                        }`}
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>

                  {/* Tags Queued to Add */}
                  {tagsToAdd.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-400">Tags to Add:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tagsToAdd.map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-xl text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                          >
                            #{tag}
                            <button onClick={() => handleRemoveBulkTagToAdd(tag)} className="hover:text-white">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags Queued to Remove */}
                  {tagsToRemove.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] font-bold uppercase text-red-400">Tags to Remove:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tagsToRemove.map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-xl text-xs font-mono bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5"
                          >
                            <s>#{tag}</s>
                            <button onClick={() => setTagsToRemove(tagsToRemove.filter(t => t !== tag))} className="hover:text-white">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Batch Title / Description Transforms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                      Add Title Prefix (e.g. "[VIP]")
                    </label>
                    <input
                      type="text"
                      value={titlePrefix}
                      onChange={e => setTitlePrefix(e.target.value)}
                      placeholder="e.g. [Exclusive]"
                      className={`w-full px-4 py-3 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                      Add Title Suffix (e.g. "(Remastered)")
                    </label>
                    <input
                      type="text"
                      value={titleSuffix}
                      onChange={e => setTitleSuffix(e.target.value)}
                      placeholder="e.g. (4K HDR)"
                      className={`w-full px-4 py-3 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1.5 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                    Append Note to Descriptions
                  </label>
                  <textarea
                    rows={2}
                    value={descAppend}
                    onChange={e => setDescAppend(e.target.value)}
                    placeholder="Append licensing note, subscriber disclaimer, or creator credit..."
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs ${
                      darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                    } border focus:outline-none focus:border-orange-500 transition`}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(false)}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold ${
                    darkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/10 hover:bg-black/20 text-black"
                  } transition`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApplyBulkEdit}
                  className="px-6 py-3 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-black flex items-center gap-2 shadow-xl shadow-orange-500/20 hover:scale-105 transition disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Apply Bulk Updates to {selectedIds.size} Videos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SINGLE QUICK EDIT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-2xl rounded-[32px] p-6 sm:p-8 border shadow-2xl space-y-6 my-8 ${
                darkMode ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-black/10 text-black"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-4 border-white/10">
                <div className="flex items-center gap-3">
                  <Edit3 className="text-orange-500" size={20} />
                  <div>
                    <h3 className="text-lg font-extrabold">Edit Media Metadata</h3>
                    <span className="text-[10px] text-zinc-400 font-mono">Stream ID: #{editingVideo.id}</span>
                  </div>
                </div>
                <button onClick={() => setEditingVideo(null)} className="p-2 rounded-xl text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-white/70" : "text-black/70"}`}>Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs ${
                      darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                    } border focus:outline-none focus:border-orange-500 transition`}
                  />
                </div>

                {/* Category & Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-white/70" : "text-black/70"}`}>Category</label>
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-white/70" : "text-black/70"}`}>Visibility</label>
                    <select
                      value={editForm.visibility}
                      onChange={e => setEditForm({ ...editForm, visibility: e.target.value as VisibilityStatus })}
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    >
                      {VISIBILITIES.map(v => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags Management */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-white/70" : "text-black/70"}`}>Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={editForm.newTag}
                      onChange={e => setEditForm({ ...editForm, newTag: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const clean = editForm.newTag.trim();
                          if (clean && !editForm.tags.includes(clean)) {
                            setEditForm({ ...editForm, tags: [...editForm.tags, clean], newTag: '' });
                          }
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className={`flex-1 px-4 py-2 rounded-xl text-xs ${
                        darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                      } border focus:outline-none focus:border-orange-500 transition`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = editForm.newTag.trim();
                        if (clean && !editForm.tags.includes(clean)) {
                          setEditForm({ ...editForm, tags: [...editForm.tags, clean], newTag: '' });
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-black hover:bg-orange-400 transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {editForm.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-xl text-xs font-mono bg-orange-500/15 text-orange-300 border border-orange-500/30 flex items-center gap-1.5"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) })}
                          className="hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-white/70" : "text-black/70"}`}>Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs ${
                      darkMode ? "bg-black/40 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                    } border focus:outline-none focus:border-orange-500 transition`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingVideo(null)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold ${
                    darkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
                  }`}
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleSaveSingleEdit}
                  className="px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/20 hover:scale-105 transition"
                >
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* BULK DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-[32px] p-6 sm:p-8 border shadow-2xl space-y-6 ${
                darkMode ? "bg-zinc-950 border-red-500/30 text-white" : "bg-white border-red-500/30 text-black"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold">Confirm Bulk Deletion</h3>
                <p className={`text-xs mt-1 ${darkMode ? "text-white/60" : "text-black/60"}`}>
                  Are you sure you want to permanently delete <strong className="text-red-400">{selectedIds.size}</strong> selected videos from the catalog? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold ${
                    darkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
                  }`}
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleBulkDelete}
                  className="px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-red-500 text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                >
                  {isProcessing ? 'Deleting...' : `Delete ${selectedIds.size} Videos`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
