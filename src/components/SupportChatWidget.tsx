import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Image as ImageIcon, Sparkles, 
  CheckCheck, Clock, ShieldCheck, AlertCircle, Loader2, Maximize2, Minimize2
} from 'lucide-react';
import { useAuthStore, useAppStore } from '../store/useStore';
import { 
  subscribeToSupportMessages, 
  sendUserSupportMessage, 
  markChatReadByUser 
} from '../lib/supportChat';
import { SupportMessage } from '../types';
import { getAccessToken } from '../lib/firebase';

export default function SupportChatWidget() {
  const { user } = useAuthStore();
  const { darkMode } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time support chat
  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToSupportMessages(user.uid, (msgs) => {
      setMessages(msgs);
      if (isOpen) {
        markChatReadByUser(user.uid).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, imagePreviewUrl]);

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Iltimos, faqat rasm fayllarini tanlang (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Rasm hajmi 5MB dan oshmasligi kerak.');
      return;
    }

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setSelectedImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to secure API endpoint
  const uploadImageToServer = async (file: File): Promise<string> => {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Rasm yuklashda xatolik yuz berdi.');
    }

    const data = await res.json();
    return data.url;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!inputText.trim() && !selectedImageFile) return;

    setIsSending(true);
    try {
      let uploadedUrl: string | undefined = undefined;

      if (selectedImageFile) {
        setIsUploading(true);
        uploadedUrl = await uploadImageToServer(selectedImageFile);
        setIsUploading(false);
      }

      await sendUserSupportMessage({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Valued Member',
        userEmail: user.email || '',
        userPhotoURL: user.photoURL,
        text: inputText,
        imageUrl: uploadedUrl
      });

      setInputText('');
      removeSelectedImage();
    } catch (err: any) {
      console.error('Support message send error:', err);
      alert(err.message || 'Xabar yuborishda xatolik yuz berdi.');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  // Count unread admin messages for user
  const unreadCount = messages.filter(m => m.senderRole === 'admin' && !m.read).length;

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && user) {
              markChatReadByUser(user.uid).catch(() => {});
            }
          }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-black shadow-2xl shadow-orange-500/40 flex items-center justify-center transition-transform border border-amber-300/40"
          title="Yordam va Administrator bilan bog'lanish / Support Chat"
        >
          {isOpen ? (
            <X size={26} className="text-black" />
          ) : (
            <>
              <MessageSquare size={26} className="text-black fill-black/20" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-lg border-2 border-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>

      {/* Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[400px] h-[520px] max-h-[80vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden ${
              darkMode ? 'bg-[#0b0b10] border-white/15 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-black flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black/10 backdrop-blur-md flex items-center justify-center border border-black/10">
                  <ShieldCheck size={22} className="text-black" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">Yordam Markazi & Admin Chat</h3>
                  <p className="text-[11px] font-medium opacity-90 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-950 animate-pulse" />
                    Jonli Aloqa (24/7 Live Support)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content / Messages List */}
            <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${darkMode ? 'bg-[#07070b]' : 'bg-zinc-50'}`}>
              {/* Welcome Info Card */}
              <div className={`p-3 rounded-2xl border text-xs text-center space-y-1 ${
                darkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'
              }`}>
                <p className="font-bold flex items-center justify-center gap-1.5 text-orange-500">
                  <Sparkles size={14} /> Innovation Plus Administrator
                </p>
                <p className="text-[11px] leading-relaxed">
                  Savollaringiz, takliflaringiz yoki to'lov/video masalalari bo'yicha yozing. Rasm yoki skrinshot biriktirish mumkin.
                </p>
              </div>

              {messages.length === 0 && (
                <div className="text-center py-10 space-y-2">
                  <MessageSquare size={36} className="mx-auto text-orange-500/40" />
                  <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-zinc-400'}`}>
                    Hozircha xabarlar yo'q. Birinchi xabaringizni yozing!
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.senderRole === 'user';
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[85%]">
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                          A
                        </div>
                      )}

                      <div
                        className={`rounded-2xl p-3 shadow-md space-y-1.5 ${
                          isUser
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-br-xs font-medium'
                            : darkMode
                              ? 'bg-white/10 text-white rounded-bl-xs border border-white/10'
                              : 'bg-white text-zinc-900 rounded-bl-xs border border-zinc-200'
                        }`}
                      >
                        {!isUser && (
                          <p className="text-[10px] font-bold text-orange-400">
                            Administrator ({msg.senderName})
                          </p>
                        )}

                        {/* Image Attachment Preview */}
                        {msg.imageUrl && (
                          <div 
                            className="rounded-xl overflow-hidden cursor-pointer max-h-48 border border-black/10 relative group"
                            onClick={() => setEnlargedImage(msg.imageUrl || null)}
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                              Kattalashtirish
                            </div>
                          </div>
                        )}

                        {msg.text && (
                          <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        )}

                        <div className={`flex items-center justify-end gap-1 text-[9px] ${
                          isUser ? 'text-black/60' : darkMode ? 'text-white/40' : 'text-zinc-400'
                        }`}>
                          <span>{timeStr}</span>
                          {isUser && <CheckCheck size={11} />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected Image Preview Bar */}
            {imagePreviewUrl && (
              <div className={`p-2.5 px-4 flex items-center justify-between border-t ${
                darkMode ? 'bg-[#0f0f18] border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}>
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-orange-500/50"
                  />
                  <div className="text-[11px] leading-tight">
                    <p className="font-bold truncate max-w-[180px]">{selectedImageFile?.name}</p>
                    <p className={`text-[9px] ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                      {((selectedImageFile?.size || 0) / 1024).toFixed(1)} KB • Rasm biriktirildi
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeSelectedImage}
                  className="p-1 rounded-full text-zinc-400 hover:text-red-400 transition-colors"
                  title="O'chirish"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Footer Input Area */}
            <form onSubmit={handleSendMessage} className={`p-3 border-t flex items-center gap-2 ${
              darkMode ? 'bg-[#0e0e14] border-white/10' : 'bg-white border-zinc-200'
            }`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className={`p-2 rounded-xl transition-all ${
                  selectedImageFile
                    ? 'bg-orange-500 text-black'
                    : darkMode 
                      ? 'bg-white/5 hover:bg-white/10 text-white/70' 
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                }`}
                title="Rasm yuklash (JPG, PNG, WEBP)"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Savolingizni yozing..."
                disabled={isSending}
                className={`flex-1 rounded-xl px-3.5 py-2 text-xs transition-all focus:outline-none ${
                  darkMode
                    ? 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-orange-500/60'
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-orange-500/60'
                }`}
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && !selectedImageFile) || isSending}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md shadow-orange-500/20"
                title="Yuborish"
              >
                {isSending || isUploading ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlarged Image Lightbox */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={enlargedImage}
              alt="Enlarged attachment"
              className="w-auto h-auto max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
