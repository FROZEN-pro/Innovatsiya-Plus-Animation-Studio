import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Tv, Shield, MonitorPlay, Send, Fingerprint, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store/useStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { setTelegramModalOpen, setBiometricModalOpen } = useAppStore();
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      setUser({
        uid: `user_${Date.now()}`,
        email: email || 'subscriber@innovationplus.app',
        displayName: email.split('@')[0] || 'Subscriber',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        role: email.includes('admin') ? 'admin' : 'user',
        subscriptionStatus: 'active',
        subscriptionTier: 'vip'
      });
      setIsLoggingIn(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none px-4">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-orange-600/20 via-amber-500/10 to-violet-600/20 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 text-center max-w-md w-full bg-[#0a0a0f]/80 border border-white/10 rounded-[36px] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo Badge */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 via-amber-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform">
            <Tv className="text-white" size={32} />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-white to-orange-400 bg-clip-text text-transparent">
          INNOVATION<span className="text-orange-500">+</span>
        </h1>
        
        <p className="text-white/60 text-xs mb-8 leading-relaxed">
          Private, High-Definition, Ad-Free Streaming Environment for Animations, 2D Art, Shorts & Spatial Music.
        </p>

        {/* Login Options */}
        <div className="space-y-3">
          
          {/* Primary Google Auth */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white text-black py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all shadow-lg disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full" />
                Sign in with Google
              </>
            )}
          </button>

          {/* Telegram Auth Launcher */}
          <button
            onClick={() => setTelegramModalOpen(true)}
            className="w-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Send size={16} />
            Sign in with Telegram
          </button>

          {/* Email Form Toggle */}
          {authMode === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-3 pt-2 text-left">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Subscriber Email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-all"
              />
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all"
              >
                Access Innovation Plus
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAuthMode('email')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 py-3 rounded-2xl font-medium text-xs transition-all"
            >
              Email & Password Sign In
            </button>
          )}

        </div>

        {/* Security & Features Bar */}
        <div className="grid grid-cols-3 gap-2 mt-8 pt-6 border-t border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50">
          <div className="flex flex-col items-center gap-1">
            <MonitorPlay size={18} className="text-orange-400" />
            <span>4K HDR</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield size={18} className="text-emerald-400" />
            <span>AES-256 Encrypted</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Fingerprint size={18} className="text-sky-400" />
            <span>Biometric Pass</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

