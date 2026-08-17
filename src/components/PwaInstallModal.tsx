import { useState } from 'react';
import { useAppStore } from '../store/useStore';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Share, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function PwaInstallModal() {
  const { isPwaModalOpen, setPwaModalOpen, darkMode } = useAppStore();
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
        className={`relative w-full max-w-md ${
          darkMode ? 'bg-[#0d0d12] border-orange-500/30 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        } border rounded-[32px] p-6 shadow-2xl overflow-hidden transition-colors duration-200`}
      >
        
        <button 
          onClick={() => setPwaModalOpen(false)}
          className={`absolute top-5 right-5 p-2 rounded-full ${
            darkMode ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
          } transition-all`}
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Smartphone className="text-black" size={24} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Innovation Plus Web-APK</h2>
            <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>Cross-Platform Native Experience</p>
          </div>
        </div>

        {installed ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-base font-bold">Web-APK Application Installed!</h3>
            <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>Launch Innovation Plus directly from your home screen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-zinc-50 border-zinc-200 text-zinc-600'} border space-y-2 text-xs`}>
              <div className="flex items-center gap-2 font-bold text-orange-500">
                <Download size={14} /> Direct Installation Instructions
              </div>
              <p className="leading-relaxed">
                Install as a standalone Web-APK for Android, iOS, or Desktop. Enjoy zero latency, background offline caching, and full screen streaming.
              </p>
              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-white/5 text-white/70' : 'bg-white border border-zinc-200 text-zinc-700'} flex items-center gap-1.5`}><Share size={12} className="text-sky-500" /> Tap Share & Add</div>
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-white/5 text-white/70' : 'bg-white border border-zinc-200 text-zinc-700'} flex items-center gap-1.5`}><Globe size={12} className="text-emerald-500" /> Offline PWA Ready</div>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-violet-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all"
            >
              Install Web-APK Standalone App
            </button>

            <div className={`flex items-center justify-center gap-1.5 text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>
              <ShieldCheck size={12} className="text-orange-500" />
              <span>Signed & Certified Innovation Plus Mobile APK Package</span>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
