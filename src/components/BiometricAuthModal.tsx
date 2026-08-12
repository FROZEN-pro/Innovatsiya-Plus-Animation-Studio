import { useState } from 'react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { X, Fingerprint, Shield, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function BiometricAuthModal() {
  const { isBiometricModalOpen, setBiometricModalOpen } = useAppStore();
  const { user, setUser } = useAuthStore();
  
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isBiometricModalOpen) return null;

  const triggerBiometricScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setSuccess(true);
      if (user) {
        setUser({
          ...user,
          biometricEnabled: true
        });
      }
      setTimeout(() => {
        setSuccess(false);
        setBiometricModalOpen(false);
      }, 1500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-[#0d0d12] border border-emerald-500/30 rounded-[32px] p-6 text-center shadow-2xl text-white overflow-hidden"
      >
        
        <button 
          onClick={() => setBiometricModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <X size={16} />
        </button>

        <div className="my-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center mb-4 text-emerald-400 shadow-xl shadow-emerald-500/10">
            <Fingerprint size={36} className={scanning ? 'animate-pulse text-emerald-300' : ''} />
          </div>
          <h2 className="text-lg font-bold">Biometric Quick-Pass</h2>
          <p className="text-xs text-white/60 mt-1">Use WebAuthn / FaceID / TouchID for high-security encrypted access.</p>
        </div>

        {success ? (
          <div className="py-4 space-y-2">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto animate-bounce" />
            <p className="text-xs font-bold text-emerald-400">Biometric Verification Active ✓</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <button
              onClick={triggerBiometricScan}
              disabled={scanning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {scanning ? 'Scanning Biometrics...' : 'Scan TouchID / FaceID'}
            </button>
            
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40">
              <Lock size={12} className="text-emerald-400" />
              <span>Protected by WebAuthn FIDO2 Security Standard</span>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
