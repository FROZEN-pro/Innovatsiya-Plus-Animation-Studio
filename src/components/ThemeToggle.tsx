import { Sun, Moon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useStore';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export default function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative flex items-center gap-2 p-2 rounded-full overflow-hidden transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
        darkMode 
          ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border-white/10 shadow-lg shadow-black/40' 
          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200/80 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {darkMode ? (
            <motion.div
              key="dark"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center text-amber-400"
            >
              <Moon size={16} className="fill-amber-400/20" />
            </motion.div>
          ) : (
            <motion.div
              key="light"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center text-amber-500"
            >
              <Sun size={17} className="fill-amber-400/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className={`text-xs font-semibold pr-1.5 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {darkMode ? 'Dark' : 'Light'}
        </span>
      )}
    </motion.button>
  );
}
