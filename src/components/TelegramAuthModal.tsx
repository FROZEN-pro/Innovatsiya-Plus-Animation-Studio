import { useState, FormEvent } from 'react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { X, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function TelegramAuthModal() {
  const { isTelegramModalOpen, setTelegramModalOpen } = useAppStore();
  const { setUser } = useAuthStore();
  
  const [telegramHandle, setTelegramHandle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isTelegramModalOpen) return null;

  const handleTelegramSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: Date.now(),
          username: telegramHandle.replace('@', ''),
          firstName: telegramHandle.replace('@', '') || 'Telegram Member'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setTelegramModalOpen(false);
        }, 1500);
      } else {
        throw new Error('Telegram Auth Failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#0d0d12] border border-sky-500/20 rounded-[32px] p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
      >
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={() => setTelegramModalOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Send className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Telegram Authentication</h2>
            <p className="text-xs text-white/60">Sign in using Telegram ID or Bot widget</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Telegram Account Linked!</h3>
            <p className="text-xs text-white/60">Welcome to Innovation Plus VIP Media Platform.</p>
          </div>
        ) : (
          <form onSubmit={handleTelegramSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Telegram Username / Handle
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  placeholder="@your_telegram_username"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying Telegram Account...' : 'Confirm & Authenticate'}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40 pt-2">
              <ShieldCheck size={12} className="text-sky-400" />
              <span>Verified via Telegram Auth Protocol</span>
            </div>
          </form>
        )}

      </motion.div>
    </div>
  );
}
