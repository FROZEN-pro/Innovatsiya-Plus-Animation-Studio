import { useState } from 'react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { getTranslation } from '../lib/i18n';
import { X, Crown, Check, ShieldCheck, Zap, CreditCard, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function SubscriptionModal() {
  const { isSubscriptionModalOpen, setSubscriptionModalOpen, language, darkMode } = useAppStore();
  const { user, setUser } = useAuthStore();
  const t = (key: string) => getTranslation(language, key);

  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'vip'>('vip');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gpay' | 'telegram'>('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isSubscriptionModalOpen) return null;

  const handleSubscribe = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      if (user) {
        setUser({
          ...user,
          subscriptionStatus: 'active',
          subscriptionTier: selectedPlan
        });
      }
      setTimeout(() => {
        setSuccess(false);
        setSubscriptionModalOpen(false);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-2xl ${
          darkMode ? 'bg-[#0d0d12] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        } border rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden transition-colors duration-200`}
      >
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-orange-500/20 to-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={() => setSubscriptionModalOpen(false)}
          className={`absolute top-6 right-6 p-2 rounded-full ${
            darkMode ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
          } transition-all`}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Crown className="text-black" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Innovation Plus VIP Membership</h2>
            <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>Automated Monthly Ad-Free High-Definition Access</p>
          </div>
        </div>

        {/* Subscription Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* Pro Plan */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all ${
              selectedPlan === 'pro'
                ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10'
                : darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Pro Subscriber</h3>
                <p className={`text-[10px] ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>Full HD Streaming</p>
              </div>
              <span className="text-lg font-black text-orange-500">$9.99<span className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-400'} font-normal`}>/mo</span></span>
            </div>
            <ul className={`space-y-1.5 text-[11px] ${darkMode ? 'text-white/70' : 'text-zinc-600'}`}>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-orange-500" /> Ad-free 1080p 60fps</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-orange-500" /> 10 encrypted offline downloads</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-orange-500" /> All video & music categories</li>
            </ul>
          </div>

          {/* VIP Creator Plan */}
          <div 
            onClick={() => setSelectedPlan('vip')}
            className={`cursor-pointer rounded-2xl p-5 border relative transition-all ${
              selectedPlan === 'vip'
                ? 'bg-gradient-to-b from-orange-500/20 to-violet-500/20 border-orange-500 shadow-xl shadow-orange-500/20'
                : darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-orange-500 to-amber-500 text-black text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow">
              POPULAR
            </span>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'} flex items-center gap-1`}>VIP Creator <Sparkles size={12} className="text-amber-500" /></h3>
                <p className={`text-[10px] ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>4K Ultra HD + Spatial Audio</p>
              </div>
              <span className="text-lg font-black text-amber-500">$19.99<span className={`text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-400'} font-normal`}>/mo</span></span>
            </div>
            <ul className={`space-y-1.5 text-[11px] ${darkMode ? 'text-white/80' : 'text-zinc-600'}`}>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-amber-500" /> Unlimited 4K HDR & Spatial Music</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-amber-500" /> Unlimited AES-256 Offline Downloads</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-amber-500" /> Gemini AI Script & Subtitle Tools</li>
            </ul>
          </div>

        </div>

        {/* Payment Gateways */}
        <div className="mb-6 space-y-2">
          <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-white/50' : 'text-zinc-500'}`}>Automated Billing Method</label>
          <div className="grid grid-cols-3 gap-2">
            
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                paymentMethod === 'card' 
                  ? 'bg-orange-500/10 border-orange-500 text-orange-500 font-bold' 
                  : darkMode ? 'bg-white/5 border-white/10 text-white/60' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}
            >
              <CreditCard size={14} className="text-orange-500" />
              <span>Card / Stripe</span>
            </button>

            <button
              onClick={() => setPaymentMethod('gpay')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                paymentMethod === 'gpay' 
                  ? 'bg-orange-500/10 border-orange-500 text-orange-500 font-bold' 
                  : darkMode ? 'bg-white/5 border-white/10 text-white/60' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}
            >
              <Zap size={14} className="text-amber-500" />
              <span>Google Pay</span>
            </button>

            <button
              onClick={() => setPaymentMethod('telegram')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                paymentMethod === 'telegram' 
                  ? 'bg-orange-500/10 border-orange-500 text-orange-500 font-bold' 
                  : darkMode ? 'bg-white/5 border-white/10 text-white/60' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}
            >
              <Send size={14} className="text-sky-500" />
              <span>Telegram Pay</span>
            </button>

          </div>
        </div>

        {/* Security & Action */}
        <div className="space-y-4">
          <div className={`flex items-center gap-2 text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-500'} justify-center`}>
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>End-to-End Encrypted Automated Billing • Cancel Anytime</span>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={processing || success}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-violet-600 text-black font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {processing ? 'Processing Encrypted Order...' : success ? 'VIP Status Activated! ✓' : `Confirm $${selectedPlan === 'pro' ? '9.99' : '19.99'}/mo Membership`}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
