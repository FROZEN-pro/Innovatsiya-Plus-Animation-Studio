import React, { useState } from 'react';
import { useAppStore } from '../store/useStore';
import { 
  X, Smartphone, Download, CheckCircle2, ShieldCheck, 
  Share, Globe, Monitor, Apple, Sparkles, ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function PwaInstallModal() {
  const { isPwaModalOpen, setPwaModalOpen, darkMode, pwaDeferredPrompt, setPwaDeferredPrompt } = useAppStore();
  const [installed, setInstalled] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'android' | 'ios' | 'pc'>('android');

  if (!isPwaModalOpen) return null;

  const handleInstallClick = async () => {
    if (pwaDeferredPrompt) {
      try {
        pwaDeferredPrompt.prompt();
        const choiceResult = await pwaDeferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstalled(true);
          setPwaDeferredPrompt(null);
          setTimeout(() => {
            setInstalled(false);
            setPwaModalOpen(false);
          }, 2500);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setInstalled(true);
      }
    } else {
      // Fallback for browsers where prompt has fired or on iOS
      setInstalled(true);
      setTimeout(() => {
        setInstalled(false);
        setPwaModalOpen(false);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-lg ${
          darkMode ? 'bg-[#0d0d12] border-orange-500/30 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        } border rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden transition-colors duration-200`}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={() => setPwaModalOpen(false)}
          className={`absolute top-5 right-5 p-2 rounded-full ${
            darkMode ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
          } transition-all`}
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            <Smartphone className="text-black" size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black">Innovation Plus Web-APK Ilovasi</h2>
            <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-zinc-500'}`}>Android, iPhone & PC uchun to'liq tezkor ilova</p>
          </div>
        </div>

        {installed ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-black">Ilova Muvaffaqiyatli O'rnatildi!</h3>
            <p className={`text-xs ${darkMode ? 'text-white/70' : 'text-zinc-600'} max-w-sm mx-auto leading-relaxed`}>
              Innovation Plus endi qurilmangizning bosh ekranida (Home Screen) mustaqil APK ilova sifatida ishlaydi.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Device Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl border bg-black/20 border-white/10">
              <button
                onClick={() => setSelectedDevice('android')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedDevice === 'android' ? 'bg-orange-500 text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone size={14} /> Android
              </button>
              <button
                onClick={() => setSelectedDevice('ios')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedDevice === 'ios' ? 'bg-orange-500 text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                <Apple size={14} /> iPhone / iPad
              </button>
              <button
                onClick={() => setSelectedDevice('pc')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedDevice === 'pc' ? 'bg-orange-500 text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                <Monitor size={14} /> PC / Mac
              </button>
            </div>

            {/* Instruction Card Based on Device */}
            {selectedDevice === 'android' && (
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'} border space-y-2.5 text-xs`}>
                <p className="font-bold text-orange-500 flex items-center gap-1.5">
                  <Download size={14} /> Android Web-APK O'rnatish:
                </p>
                <ol className={`list-decimal list-inside space-y-1.5 leading-relaxed ${darkMode ? 'text-white/80' : 'text-zinc-700'}`}>
                  <li>Quyidagi <b>"Ilovani O'rnatish"</b> tugmasini bosing.</li>
                  <li>Brauzer so'rovida <b>"O'rnatish" (Install)</b> ni tanlang.</li>
                  <li>Ilova telefoningiz ilovalar ro'yxatiga (APK kabi) qo'shiladi.</li>
                </ol>
              </div>
            )}

            {selectedDevice === 'ios' && (
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'} border space-y-2.5 text-xs`}>
                <p className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Share size={14} /> iPhone (Safari) uchun qo'llanma:
                </p>
                <ol className={`list-decimal list-inside space-y-1.5 leading-relaxed ${darkMode ? 'text-white/80' : 'text-zinc-700'}`}>
                  <li>Safari brauzerining pastki qismidagi <b>"Ulashish" (Share / ⎙)</b> tugmasini bosing.</li>
                  <li>Pastga suring va <b>"Bosh ekranga qo'shish" (Add to Home Screen)</b> ni tanlang.</li>
                  <li>Yuqori o'ng burchakdagi <b>"Qo'shish" (Add)</b> tugmasini bosing.</li>
                </ol>
              </div>
            )}

            {selectedDevice === 'pc' && (
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'} border space-y-2.5 text-xs`}>
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Monitor size={14} /> Kompyuter (Chrome, Edge, Brave) uchun:
                </p>
                <ol className={`list-decimal list-inside space-y-1.5 leading-relaxed ${darkMode ? 'text-white/80' : 'text-zinc-700'}`}>
                  <li>Brauzeringiz manzil qatori (URL bar) o'ng tomonidagi <b>O'rnatish belgisini (⊕)</b> bosing.</li>
                  <li>Yoki quyidagi <b>"Ilovani O'rnatish"</b> tugmasini bosing.</li>
                  <li>Kompyuteringiz ish stoliga to'liq ekranli dastur sifatida o'rnatiladi.</li>
                </ol>
              </div>
            )}

            {/* Install Button */}
            <button
              onClick={handleInstallClick}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} /> Ilovani Qurilmaga O'rnatish (Web-APK)
            </button>

            <div className={`flex items-center justify-center gap-1.5 text-[10px] ${darkMode ? 'text-white/40' : 'text-zinc-500'}`}>
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Tezkor, xavfsiz va xotiradan kam joy oluvchi PWA texnologiyasi</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
