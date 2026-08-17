const fs = require('fs');
let data = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// Import hooks and missing icons
data = data.replace(
  "import { Link } from 'react-router-dom';",
  "import { Link } from 'react-router-dom';\nimport { useAppStore } from '../store/useStore';\nimport { Sun, Moon, Smartphone, Settings } from 'lucide-react';"
);

// Add useAppStore inside the component
data = data.replace(
  "export default function AdminPanel() {",
  "export default function AdminPanel() {\n  const { darkMode, toggleDarkMode, setPwaModalOpen, appSettings, setAppSettings } = useAppStore();\n  const [settingsForm, setSettingsForm] = useState(appSettings || {});"
);

// Add 'settings' to activeTab generic
data = data.replace(
  "useState<'content' | 'users' | 'analytics'>('content');",
  "useState<'content' | 'users' | 'settings'>('content');"
);

// Fix background
data = data.replace(
  '<div className="min-h-screen bg-[#050508] text-white p-6 sm:p-8 font-sans select-none">',
  '<div className={`min-h-screen ${darkMode ? "bg-[#050505] text-white" : "bg-gray-50 text-black"} p-6 sm:p-8 font-sans select-none transition-colors duration-300`}>'
);

// Dark mode replacements using a simple regex loop or explicit replaces
// I will just use careful replace globally where applicable
const replacements = [
  ['bg-white/5', '${darkMode ? "bg-white/5" : "bg-black/5"}'],
  ['hover:bg-white/10', 'hover:${darkMode ? "bg-white/10" : "bg-black/10"}'],
  ['hover:bg-white/20', 'hover:${darkMode ? "bg-white/20" : "bg-black/20"}'],
  ['border-white/10', '${darkMode ? "border-white/10" : "border-black/10"}'],
  ['border-white/20', '${darkMode ? "border-white/20" : "border-black/20"}'],
  ['text-white/20', '${darkMode ? "text-white/20" : "text-black/20"}'],
  ['text-white/50', '${darkMode ? "text-white/50" : "text-black/50"}'],
  ['text-white/60', '${darkMode ? "text-white/60" : "text-black/60"}'],
  ['text-white/70', '${darkMode ? "text-white/70" : "text-black/70"}'],
  ['text-white', '${darkMode ? "text-white" : "text-black"}']
];

let replaced = data;

// Replace all className="something text-white" with className={`something ${darkMode ? "text-white" : "text-black"}`}
replaced = replaced.replace(/className="([^"]*)"/g, (match, p1) => {
  let cls = p1;
  let needsTemplate = false;
  
  if (cls.includes('text-white') && !cls.includes('text-white/')) {
      cls = cls.replace(/\btext-white\b/g, '${darkMode ? "text-white" : "text-black"}');
      needsTemplate = true;
  }
  
  for (const [find, replace] of replacements) {
    if (find === 'text-white') continue; // already handled
    if (cls.includes(find)) {
      cls = cls.split(find).join(replace);
      needsTemplate = true;
    }
  }

  if (needsTemplate) {
    return 'className={`' + cls + '`}';
  }
  return match;
});

// Write it back
fs.writeFileSync('src/pages/AdminPanel.tsx', replaced);
