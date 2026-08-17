const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

data = data.replace(/\$\{darkMode \? \`\}border-white\/10" : "border-black\/10"\}/g, '${darkMode ? "border-white/10" : "border-black/10"}');
data = data.replace(/\$\{darkMode \? \`\}text-white\/60" : "text-black\/60"\}/g, '${darkMode ? "text-white/60" : "text-black/60"}');
data = data.replace(/\$\{darkMode \? \`\}bg-white\/5" : "bg-black\/5"\}/g, '${darkMode ? "bg-white/5" : "bg-black/5"}');
data = data.replace(/\$\{darkMode \? \`\}text-white\/80" : "text-black\/80"\}/g, '${darkMode ? "text-white/80" : "text-black/80"}');
data = data.replace(/\$\{darkMode \? \`\}text-white\/50" : "text-black\/50"\}/g, '${darkMode ? "text-white/50" : "text-black/50"}');
data = data.replace(/\$\{darkMode \? \`\}text-white\/40" : "text-black\/40"\}/g, '${darkMode ? "text-white/40" : "text-black/40"}');

fs.writeFileSync('src/pages/Dashboard.tsx', data);
