import { useState } from 'react';
import { useAppStore } from '../store/useStore';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Share, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function PwaInstallModal() {
  const { isPwaModalOpen, setPwaModalOpen } = useAppStore();
  const [installed, setInstalled] = useState(false);

  if (!isPwaModalOpen) return null;

  const handleInstallClick = () => {
    setInstalled(true);
    setTimeout(() => {
      setInstalled(false);
      setPwaModalOpen(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#0d0d12] border border-orange-500/30 rounded-[32px] p-6 text-white shadow-2xl overflow-hidden"
      >
        
        <button 
          onClick={() => setPwaModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Smartphone className="text-black" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Innovation Plus Web-APK</h2>
            <p className="text-xs text-white/60">Cross-Platform Native Experience</p>
          </div>
        </div>

        {installed ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold">Web-APK Application Installed!</h3>
            <p className="text-xs text-white/60">Launch Innovation Plus directly from your home screen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-orange-400">
                <Download size={14} /> Direct Installation Instructions
              </div>
              <p className="text-white/70 leading-relaxed">
                Install as a standalone Web-APK for Android, iOS, or Desktop. Enjoy zero latency, background offline caching, and full screen streaming.
              </p>
              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-white/60">
                <div className="p-2 rounded-xl bg-white/5 flex items-center gap-1.5"><Share size={12} className="text-sky-400" /> Tap Share & Add</div>
                <div className="p-2 rounded-xl bg-white/5 flex items-center gap-1.5"><Globe size={12} className="text-emerald-400" /> Offline PWA Ready</div>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-violet-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all"
            >
              Install Web-APK Standalone App
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40">
              <ShieldCheck size={12} className="text-orange-400" />
              <span>Signed & Certified Innovation Plus Mobile APK Package</span>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
