import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Play, Send, Sparkles, Flame, Heart, 
  ThumbsUp, PartyPopper, Rocket, Gem, Bell, Check, 
  Users, MessageSquare, Trash2, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, PremiereChatMessage } from '../types';
import { useAuthStore, useAppStore } from '../store/useStore';
import { sendPremiereMessage, subscribePremiereMessages, deletePremiereMessage } from '../lib/premiereChat';

interface LivePremiereRoomProps {
  video: Video;
  onPremiereStarted: () => void;
}

interface FloatingParticle {
  id: string;
  emoji: string;
  left: number;
}

export default function LivePremiereRoom({ video, onPremiereStarted }: LivePremiereRoomProps) {
  const { user } = useAuthStore();
  const { darkMode } = useAppStore();

  const premiereTimeMs = typeof video.premiereTime === 'number' 
    ? video.premiereTime 
    : (video.premiereTime ? new Date(video.premiereTime).getTime() : Date.now());

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  const [messages, setMessages] = useState<PremiereChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const onPremiereStartedRef = useRef(onPremiereStarted);
  onPremiereStartedRef.current = onPremiereStarted;
  const hasTriggeredPremiereRef = useRef(false);

  // Real-time Countdown calculation
  useEffect(() => {
    const calculateTime = () => {
      const diff = premiereTimeMs - Date.now();
      if (diff <= 0) {
        setTimeLeft(prev => (prev.totalMs === 0 ? prev : { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }));
        if (!hasTriggeredPremiereRef.current) {
          hasTriggeredPremiereRef.current = true;
          onPremiereStartedRef.current?.();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, totalMs: diff });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [premiereTimeMs]);

  // Subscribe to live chat
  useEffect(() => {
    if (!video.id) return;
    const unsubscribe = subscribePremiereMessages(video.id.toString(), (msgs) => {
      setMessages(msgs);
      // If a new reaction arrived, spawn floating particle
      const latest = msgs[msgs.length - 1];
      if (latest && latest.isReaction && latest.reactionEmoji && Date.now() - latest.createdAt < 3000) {
        spawnParticle(latest.reactionEmoji);
      }
    });
    return () => unsubscribe();
  }, [video.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const spawnParticle = (emoji: string) => {
    const newParticle: FloatingParticle = {
      id: Math.random().toString(),
      emoji,
      left: Math.floor(Math.random() * 80) + 10,
    };
    setParticles(prev => [...prev.slice(-15), newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 2500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || isSending) return;

    try {
      setIsSending(true);
      await sendPremiereMessage(
        video.id.toString(),
        {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        inputText.trim()
      );
      setInputText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    if (!user) {
      alert("Please sign in to send live reactions.");
      return;
    }
    spawnParticle(emoji);
    try {
      await sendPremiereMessage(
        video.id.toString(),
        {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        emoji,
        true,
        emoji
      );
    } catch (err) {
      console.error(err);
    }
  };

  const reactionEmojis = ['🔥', '❤️', '👏', '🎉', '🚀', '💎'];

  return (
    <div className="relative w-full rounded-[36px] overflow-hidden border border-orange-500/30 shadow-2xl bg-black" id="live-premiere-room">
      
      {/* Background Poster Blur & Glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 pointer-events-none" />

      {/* Floating Particle Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 350, scale: 0.8, x: 0 }}
              animate={{ opacity: 0, y: -100, scale: 1.6, x: (Math.random() - 0.5) * 60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              style={{ left: `${p.left}%` }}
              className="absolute bottom-16 text-3xl select-none filter drop-shadow-md"
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Grid: Left Countdown Spotlight, Right Live Chat */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        
        {/* Left Side: Premiere Spotlight & Countdown */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
                <Flame size={12} /> Jonli Premyera • Live Premiere
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-mono">
                {video.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
              {video.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed max-w-xl">
              {video.description}
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="my-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-1.5">
              <Clock size={14} /> Premyera Boshlanishiga Qoldi:
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-md">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono block">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider">Kun</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-md">
                <span className="text-2xl sm:text-4xl font-black text-orange-400 font-mono block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider">Soat</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-md">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider">Daqiqa</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-md">
                <span className="text-2xl sm:text-4xl font-black text-amber-400 font-mono block animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider">Soniya</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsNotified(!isNotified)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                isNotified
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <Bell size={15} className={isNotified ? "text-emerald-400 fill-current" : ""} />
              {isNotified ? "Eslatma Faol (Notified)" : "Menga Eslatib O'tish"}
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={onPremiereStarted}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-black text-xs font-extrabold transition-all shadow-lg shadow-orange-500/30"
              >
                <Play size={14} fill="currentColor" /> Premyerani Hozir Boshlash (Admin)
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Real-time Live Chat & Reactions */}
        <div className="lg:col-span-5 flex flex-col h-[480px] lg:h-auto bg-[#0a0a0f]/60 backdrop-blur-xl">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-orange-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Jonli Premyera Chati
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Users size={12} />
              <span>{Math.max(18, messages.length * 3 + 12)} tomoshabin</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 space-y-2">
                <Sparkles size={24} className="text-orange-400/60" />
                <p className="text-xs font-medium">Premyera kutilmoqda!</p>
                <p className="text-[11px] text-white/30">Birinchi bo'lib fikringizni yoki emojini yuboring.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2.5 group">
                  <img
                    src={msg.userPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                    alt={msg.userDisplayName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-bold text-white/90 truncate">
                        {msg.userDisplayName}
                      </span>
                      <span className="text-[9px] text-white/30 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.isReaction ? (
                      <span className="inline-block text-xl py-0.5 animate-bounce">
                        {msg.reactionEmoji || msg.text}
                      </span>
                    ) : (
                      <p className="text-xs text-white/80 leading-relaxed break-words bg-white/5 rounded-2xl rounded-tl-sm px-3 py-1.5 mt-1 border border-white/5">
                        {msg.text}
                      </p>
                    )}
                  </div>
                  {(user?.role === 'admin' || user?.uid === msg.userId) && (
                    <button
                      onClick={() => deletePremiereMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-1 transition-opacity"
                      title="O'chirish"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Floating Reaction Bar */}
          <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between gap-1">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider hidden sm:inline">
              Reaksiya:
            </span>
            <div className="flex items-center gap-1.5 flex-1 justify-around sm:justify-end">
              {reactionEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-125 transition-all text-base flex items-center justify-center border border-white/10 hover:border-orange-500/50"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-white/10 bg-black/60">
            {user ? (
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Jonli chatga yozing..."
                  maxLength={400}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="absolute right-2 text-orange-400 hover:text-orange-300 disabled:opacity-30 p-1.5 transition-opacity"
                >
                  <Send size={14} />
                </button>
              </form>
            ) : (
              <div className="text-center py-2 text-[11px] text-white/50">
                Chatda qatnashish uchun tizimga kiring.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
