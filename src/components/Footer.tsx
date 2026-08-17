import { Link } from 'react-router-dom';
import { 
  Tv, Send, Youtube, Instagram, Twitter, Github, 
  Mail, Phone, ShieldCheck, Smartphone, Sparkles, Heart, Crown, Globe
} from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { getTranslation } from '../lib/i18n';

export default function Footer() {
  const { darkMode, appSettings, language, setPwaModalOpen, setSubscriptionModalOpen } = useAppStore();
  const t = (key: string) => getTranslation(language, key);

  const brandName = appSettings?.brandName || 'INNOVATION';
  const brandTag = appSettings?.brandTag || '+';
  const footerAbout = appSettings?.footerAbout || 'Innovation Plus is an ultra high-definition ad-free streaming & creative media hub offering 4K anime, 2D animations, masterclass tutorials, exclusive music, and professional dubbing.';
  const footerText = appSettings?.footerText || `© ${new Date().getFullYear()} Innovation Plus Media. All rights reserved.`;
  const supportEmail = appSettings?.supportEmail || 'support@innovationplus.uz';
  const supportPhone = appSettings?.supportPhone || '+998 90 123 45 67';

  const telegramUrl = appSettings?.socialTelegram || 'https://t.me/InnovationPlus';
  const youtubeUrl = appSettings?.socialYoutube || '';
  const instagramUrl = appSettings?.socialInstagram || '';
  const twitterUrl = appSettings?.socialTwitter || '';
  const githubUrl = appSettings?.socialGithub || '';

  return (
    <footer className={`mt-24 border-t transition-colors duration-300 ${
      darkMode ? 'bg-[#050508] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Main Footer Grid: 1 col on Mobile, 2 on Tablet, 4 on PC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <Link to="/dashboard" className="flex items-center gap-3 group inline-flex">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Tv className="text-black" size={22} />
              </div>
              <span className="font-extrabold tracking-tight text-xl">
                {brandName}<span className="text-orange-500">{brandTag}</span>
              </span>
            </Link>
            
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-white/60' : 'text-zinc-600'}`}>
              {footerAbout}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    darkMode ? 'bg-white/5 hover:bg-sky-500 hover:text-white text-white/70' : 'bg-zinc-100 hover:bg-sky-500 hover:text-white text-zinc-700'
                  }`}
                  title="Telegram Channel"
                >
                  <Send size={16} />
                </a>
              )}

              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    darkMode ? 'bg-white/5 hover:bg-red-600 hover:text-white text-white/70' : 'bg-zinc-100 hover:bg-red-600 hover:text-white text-zinc-700'
                  }`}
                  title="YouTube"
                >
                  <Youtube size={16} />
                </a>
              )}

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    darkMode ? 'bg-white/5 hover:bg-pink-600 hover:text-white text-white/70' : 'bg-zinc-100 hover:bg-pink-600 hover:text-white text-zinc-700'
                  }`}
                  title="Instagram"
                >
                  <Instagram size={16} />
                </a>
              )}

              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    darkMode ? 'bg-white/5 hover:bg-zinc-800 hover:text-white text-white/70' : 'bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700'
                  }`}
                  title="Twitter / X"
                >
                  <Twitter size={16} />
                </a>
              )}

              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    darkMode ? 'bg-white/5 hover:bg-zinc-800 hover:text-white text-white/70' : 'bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700'
                  }`}
                  title="GitHub"
                >
                  <Github size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Categories & Exploration */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-500">
              Kategoriyalar
            </h4>
            <ul className={`space-y-2 text-xs ${darkMode ? 'text-white/70' : 'text-zinc-600'}`}>
              <li>
                <Link to="/dashboard?tab=Premieres" className="hover:text-orange-500 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Jonli Premyeralar
                </Link>
              </li>
              <li>
                <Link to="/dashboard?cat=Animation" className="hover:text-orange-500 transition-colors">
                  Animatsiya va Multfilmlar
                </Link>
              </li>
              <li>
                <Link to="/dashboard?cat=Dubbing" className="hover:text-orange-500 transition-colors">
                  Professional Dublyaj
                </Link>
              </li>
              <li>
                <Link to="/dashboard?cat=2D+Video" className="hover:text-orange-500 transition-colors">
                  2D & 3D Video San'ati
                </Link>
              </li>
              <li>
                <Link to="/dashboard?cat=Music" className="hover:text-orange-500 transition-colors">
                  Eksklyuziv Musiqalar
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: VIP & PWA App */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-500">
              Xizmatlar & Ilova
            </h4>
            <ul className={`space-y-2 text-xs ${darkMode ? 'text-white/70' : 'text-zinc-600'}`}>
              <li>
                <button
                  onClick={() => setSubscriptionModalOpen(true)}
                  className="hover:text-orange-500 transition-colors flex items-center gap-1.5 text-left"
                >
                  <Crown size={13} className="text-amber-400" /> VIP Obuna (Click & Payme)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPwaModalOpen(true)}
                  className="hover:text-orange-500 transition-colors flex items-center gap-1.5 text-left"
                >
                  <Smartphone size={13} className="text-orange-400" /> Web-APK Ilovasini O'rnatish
                </button>
              </li>
              <li>
                <Link to="/dashboard?tab=Vault" className="hover:text-orange-500 transition-colors">
                  Offline Yuklab Olish (Vault)
                </Link>
              </li>
              <li>
                <Link to="/dashboard?tab=Favorites" className="hover:text-orange-500 transition-colors">
                  Saqlangan Sevimlilar
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Security Badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-500">
              Aloqa & Yordam
            </h4>
            <div className={`space-y-2 text-xs ${darkMode ? 'text-white/70' : 'text-zinc-600'}`}>
              {supportEmail && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-orange-500 shrink-0" />
                  <a href={`mailto:${supportEmail}`} className="hover:underline truncate">
                    {supportEmail}
                  </a>
                </div>
              )}
              {supportPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-orange-500 shrink-0" />
                  <a href={`tel:${supportPhone}`} className="hover:underline">
                    {supportPhone}
                  </a>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="pt-2 space-y-2">
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                darkMode ? 'bg-white/5 border-white/10 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <ShieldCheck size={16} className="shrink-0" />
                <span>Click, Payme & SSL Shifrlangan Xavfsiz To'lov</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className={darkMode ? 'text-white/50' : 'text-zinc-500'}>
            {footerText}
          </p>

          <div className="flex items-center gap-4 text-[11px]">
            <span className={darkMode ? 'text-white/40' : 'text-zinc-400'}>
              4K Ultra HD • Reklamasiz Media
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
