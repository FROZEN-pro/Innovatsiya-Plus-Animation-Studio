const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

data = data.replace(
  'language, highContrast, textSize, searchQuery, ',
  'language, darkMode, appSettings, textSize, searchQuery, '
);

data = data.replace(
  /className=\{`min-h-screen font-sans select-none overflow-x-hidden \$\{\n\s*highContrast \? 'bg-black text-yellow-300' : 'bg-\[#050508\] text-white'\n\s*\}`\}/,
  'className={`min-h-screen font-sans select-none overflow-x-hidden ${darkMode ? "bg-[#050505] text-white" : "bg-gray-50 text-black"} transition-colors duration-300`}'
);

// We need to carefully replace all background colors and text colors using darkMode
data = data.replace(/bg-\[#050508\]/g, '${darkMode ? "bg-[#050505]" : "bg-gray-50"}');
data = data.replace(/bg-white\/5/g, '${darkMode ? "bg-white/5" : "bg-black/5"}');
data = data.replace(/hover:bg-white\/10/g, 'hover:${darkMode ? "bg-white/10" : "bg-black/10"}');
data = data.replace(/border-white\/10/g, '${darkMode ? "border-white/10" : "border-black/10"}');
data = data.replace(/text-white\/60/g, '${darkMode ? "text-white/60" : "text-black/60"}');
data = data.replace(/text-white\/40/g, '${darkMode ? "text-white/40" : "text-black/40"}');
data = data.replace(/text-white\/80/g, '${darkMode ? "text-white/80" : "text-black/80"}');
data = data.replace(/text-white\/50/g, '${darkMode ? "text-white/50" : "text-black/50"}');

fs.writeFileSync('src/pages/Dashboard.tsx', data);
