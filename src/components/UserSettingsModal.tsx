import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User as UserIcon, Camera, Sparkles, Check, 
  AlertCircle, Loader2, Image, Shield, RefreshCw,
  Copy, CheckCheck, Edit3, Lock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore, useAppStore } from '../store/useStore';
import { getTranslation } from '../lib/i18n';

// Curated high-res avatar presets tailored for creative streaming
const PRESET_AVATARS = [
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    tag: 'Cyberpunk'
  },
  {
    id: 'creative-director',
    name: 'Creative Director',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    tag: 'Studio'
  },
  {
    id: 'synth-voyager',
    name: 'Synth Voyager',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
    tag: 'Spatial'
  },
  {
    id: 'digital-artist',
    name: 'Digital Artist',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    tag: 'Art'
  },
  {
    id: 'motion-creator',
    name: 'Motion Creator',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    tag: 'Motion'
  },
  {
    id: 'hologram-anime',
    name: 'Anime Aesthetic',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    tag: 'Anime'
  },
  {
    id: 'neon-minimal',
    name: 'Cosmic Minimal',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    tag: 'Cosmic'
  },
  {
    id: 'sound-architect',
    name: 'Sound Architect',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    tag: 'Audio'
  }
];

export default function UserSettingsModal() {
  const { user, setUser } = useAuthStore();
  const { 
    isProfileSettingsModalOpen, 
    setProfileSettingsModalOpen, 
    darkMode,
    language 
  } = useAppStore();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar-presets' | 'account'>('profile');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showCustomUrlField, setShowCustomUrlField] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasCopiedUid, setHasCopiedUid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => getTranslation(language, key);

  // Initialize values when modal opens or user updates
  useEffect(() => {
    if (isProfileSettingsModalOpen && user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setCustomUrlInput(user.photoURL || '');
      setStatusMessage(null);
      setShowCustomUrlField(false);
    }
  }, [isProfileSettingsModalOpen, user]);

  if (!isProfileSettingsModalOpen) return null;

  const handleClose = () => {
    if (isSaving) return;
    setStatusMessage(null);
    setProfileSettingsModalOpen(false);
  };

  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setHasCopiedUid(true);
    setTimeout(() => setHasCopiedUid(false), 2000);
  };

  const handleSelectPreset = (url: string) => {
    setPhotoURL(url);
    setCustomUrlInput(url);
    setStatusMessage(null);
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setPhotoURL(customUrlInput.trim());
      setShowCustomUrlField(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB for avatar)
    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Image file must be under 10MB. Please choose a smaller image or use an avatar preset.'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setPhotoURL(data.url);
          setCustomUrlInput(data.url);
          setStatusMessage(null);
          return;
        }
      }
      throw new Error('Fallback to local preview');
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setPhotoURL(event.target.result);
          setCustomUrlInput(event.target.result);
          setStatusMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setStatusMessage({
        type: 'error',
        text: 'Display name cannot be blank. Please enter a valid name.'
      });
      return;
    }

    if (trimmedName.length > 50) {
      setStatusMessage({
        type: 'error',
        text: 'Display name is too long (maximum 50 characters).'
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const finalPhoto = photoURL.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
      
      // 1. Sync to Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: trimmedName,
          photoURL: finalPhoto
        });
      }

      // 2. Sync to Firestore User Document
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          role: user.role || 'user',
          subscriptionStatus: user.subscriptionStatus || 'active',
          displayName: trimmedName,
          photoURL: finalPhoto,
          lastActiveAt: Date.now()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore User Doc Sync Notice:', firestoreErr);
      }

      // 3. Sync to Cloud SQL PostgreSQL Backend
      try {
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          await fetch('/api/users/profile', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              displayName: trimmedName,
              photoURL: finalPhoto
            })
          });
        }
      } catch (backendErr) {
        console.warn('Backend API User Sync Notice:', backendErr);
      }

      // 4. Update Zustand Global State
      setUser({
        ...user,
        displayName: trimmedName,
        photoURL: finalPhoto
      });

      setStatusMessage({
        type: 'success',
        text: 'Profile updated and synced successfully with Firebase Auth!'
      });

      // Auto-close modal after brief confirmation
      setTimeout(() => {
        setIsSaving(false);
        setProfileSettingsModalOpen(false);
      }, 1200);

    } catch (err: any) {
      console.error('Failed to update Firebase Auth profile:', err);
      setIsSaving(false);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update profile. Please try again.'
      });
    }
  };

  const hasChanges = 
    (displayName.trim() !== (user?.displayName || '')) || 
    (photoURL.trim() !== (user?.photoURL || ''));

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        id="user-settings-modal-backdrop"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden z-10 ${
            darkMode 
              ? 'bg-[#0d0d14] border-white/10 text-white' 
              : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-950/20'
          }`}
        >
          {/* Top Decorative Ambient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

          {/* Modal Header */}
          <div className={`flex items-center justify-between px-6 pt-6 pb-4 border-b ${
            darkMode ? 'border-white/10' : 'border-zinc-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-inner">
                <Edit3 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  Profile Settings
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold uppercase">
                    Firebase Auth
                  </span>
                </h2>
                <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                  Customize your streamer identity & avatar
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={isSaving}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className={`flex items-center px-6 pt-3 border-b gap-2 text-xs font-semibold ${
            darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-200 bg-zinc-50/50'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'border-orange-500 text-orange-500 font-bold'
                  : darkMode 
                    ? 'border-transparent text-white/50 hover:text-white/80' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <UserIcon size={14} />
              General Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('avatar-presets')}
              className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'avatar-presets'
                  ? 'border-orange-500 text-orange-500 font-bold'
                  : darkMode 
                    ? 'border-transparent text-white/50 hover:text-white/80' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Sparkles size={14} />
              Avatar Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'account'
                  ? 'border-orange-500 text-orange-500 font-bold'
                  : darkMode 
                    ? 'border-transparent text-white/50 hover:text-white/80' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Shield size={14} />
              Auth Details
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSaveProfile} className="p-6 space-y-6">

            {/* Notification / Feedback Banner */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-3 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400 font-medium'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check size={16} className="shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                )}
                <span className="leading-snug">{statusMessage.text}</span>
              </motion.div>
            )}

            {/* TAB 1: Main Profile Edit */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Avatar Preview & Quick Changer */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 shadow-xl shadow-orange-500/20">
                      <img
                        src={photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                        alt="Profile Preview"
                        className="w-full h-full rounded-[22px] object-cover bg-zinc-900"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                    </div>

                    {/* Quick photo upload button overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-orange-500 text-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                      title="Upload custom image file"
                    >
                      <Camera size={14} className="font-bold stroke-[2.5]" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h4 className="text-sm font-bold tracking-tight">Avatar & Visual Identity</h4>
                      <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                        Choose from creative presets, upload an image, or enter a direct image URL.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('avatar-presets')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          darkMode 
                            ? 'bg-white/5 hover:bg-white/10 text-orange-400 border border-white/10' 
                            : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200'
                        }`}
                      >
                        <Sparkles size={13} />
                        Browse Presets
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCustomUrlField(!showCustomUrlField)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          darkMode 
                            ? 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10' 
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
                        }`}
                      >
                        <Image size={13} />
                        Custom URL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Photo URL Input (Collapsible) */}
                {showCustomUrlField && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-3.5 rounded-2xl border space-y-2 ${
                      darkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${
                      darkMode ? 'text-white/60' : 'text-zinc-500'
                    }`}>
                      Direct Image Web Address (HTTPS)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/my-photo.jpg"
                        className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                          darkMode 
                            ? 'bg-black/40 border border-white/10 text-white focus:border-orange-500' 
                            : 'bg-white border border-zinc-300 text-zinc-900 focus:border-orange-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-3.5 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400 transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Display Name Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold ${darkMode ? 'text-white/90' : 'text-zinc-800'}`}>
                      Display Name <span className="text-orange-500">*</span>
                    </label>
                    <span className={`text-[10px] font-mono ${
                      displayName.length > 45 
                        ? 'text-red-400 font-bold' 
                        : darkMode ? 'text-white/40' : 'text-zinc-400'
                    }`}>
                      {displayName.length}/50
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your streamer alias..."
                      maxLength={50}
                      required
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all focus:outline-none ${
                        darkMode 
                          ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-orange-500 focus:bg-white/10' 
                          : 'bg-zinc-100/80 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:bg-white'
                      }`}
                    />
                    {displayName && (
                      <button
                        type="button"
                        onClick={() => setDisplayName('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <p className={`text-[11px] ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                    This name appears in Live Premiere countdown chats, video comments, and leaderboards.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Avatar Presets */}
            {activeTab === 'avatar-presets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold ${darkMode ? 'text-white/70' : 'text-zinc-600'}`}>
                    Select an official Studio avatar:
                  </p>
                  <span className="text-[10px] font-mono text-orange-500 font-bold">
                    8 HD Styles
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1 scrollbar-thin">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = photoURL === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`group relative rounded-2xl p-1.5 transition-all text-center flex flex-col items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 scale-105 shadow-lg shadow-orange-500/20'
                            : darkMode
                              ? 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                              : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-200/60'
                        }`}
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-orange-500/40 backdrop-blur-xs flex items-center justify-center text-black">
                              <Check size={18} className="stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold truncate w-full ${
                          isSelected 
                            ? 'text-orange-500 font-black' 
                            : darkMode ? 'text-white/70' : 'text-zinc-700'
                        }`}>
                          {preset.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Account & Auth Details */}
            {activeTab === 'account' && (
              <div className="space-y-3.5">
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                      Email Address
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {user?.email || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                      Subscription Status
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                      <Zap size={11} fill="currentColor" />
                      {user?.subscriptionStatus?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                      User Role
                    </span>
                    <span className="text-xs font-bold text-orange-500">
                      {user?.role === 'admin' ? 'Studio Administrator' : 'VIP Member'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className={`text-[11px] ${darkMode ? 'text-white/40' : 'text-zinc-400'}`}>
                      Account UID
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUid}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-white transition-colors"
                    >
                      <span>{user?.uid.slice(0, 12)}...</span>
                      {hasCopiedUid ? (
                        <CheckCheck size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs ${
                  darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-700'
                }`}>
                  <Lock size={15} className="shrink-0" />
                  <span>Profile updates are verified and synchronized across Firebase Auth and cloud database.</span>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className={`pt-4 border-t flex items-center justify-end gap-3 ${
              darkMode ? 'border-white/10' : 'border-zinc-200'
            }`}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  darkMode 
                    ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                    : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || !displayName.trim() || !hasChanges}
                className={`px-6 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all ${
                  isSaving || !displayName.trim() || !hasChanges
                    ? 'bg-zinc-700/50 text-zinc-400 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:scale-105 active:scale-95 shadow-orange-500/25'
                }`}
                id="save-profile-settings-btn"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Syncing Firebase Auth...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} className="stroke-[3]" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
