const fs = require('fs');
let data = fs.readFileSync('src/pages/VideoPlayer.tsx', 'utf8');

data = data.replace(
  "import { motion } from 'motion/react';",
  "import { motion, AnimatePresence } from 'motion/react';"
);

const stateCode = `  const [hasResumed, setHasResumed] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };`;
data = data.replace("  const [hasResumed, setHasResumed] = useState(false);", stateCode);

const buttonCode = `                {/* Offline Save Action */}
                <button
                  onClick={handleSaveOffline}
                  disabled={isSavedOffline}
                  className={\`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold \${
                    isSavedOffline
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }\`}
                  title="Save Encrypted Stream for Offline Playback"
                >
                  {isSavedOffline ? <Check size={16} /> : <Download size={16} />}
                  <span className="hidden sm:inline">{isSavedOffline ? 'In Vault' : 'Offline'}</span>
                </button>

                {/* Share Action */}
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold bg-white/10 border-white/20 text-white hover:bg-white/20"
                  title="Share Video"
                >
                  {showShareToast ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                  <span className="hidden sm:inline">{showShareToast ? 'Copied' : 'Share'}</span>
                </button>`;
                
data = data.replace(/\{\/\* Offline Save Action \*\/\}(.|\n)*?<\/button>/m, buttonCode);

const toastCode = `
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-6 py-3 rounded-full font-extrabold text-sm shadow-2xl flex items-center gap-2 z-[100]"
          >
            <Check size={18} /> Link copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`;

data = data.replace("    </div>\n  );\n}", toastCode);

fs.writeFileSync('src/pages/VideoPlayer.tsx', data);
