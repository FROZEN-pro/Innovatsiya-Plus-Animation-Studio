const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Patch filter
data = data.replace(
  'v.description.toLowerCase().includes(searchQuery.toLowerCase());',
  'v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||\n      v.category.toLowerCase().includes(searchQuery.toLowerCase());'
);

// Patch JSX for search bar
const searchBarJSX = `      {/* Content Hub Section */}
      <div className={\`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20 space-y-8 \${featured && !isVaultTab ? '-mt-16' : 'pt-28'}\`}>
        
        {/* Global Dashboard Search */}
        {!isVaultTab && (
          <div className="relative max-w-2xl mx-auto w-full z-30 mb-8 mt-2">
            <Search size={20} className={\`absolute left-4 top-1/2 -translate-y-1/2 \${darkMode ? 'text-white/40' : 'text-black/40'}\`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams by title, category, or keyword..."
              className={\`w-full rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-xl transition-all focus:outline-none \${
                darkMode 
                  ? 'bg-[#121216] border border-white/10 text-white placeholder-white/40 focus:border-orange-500/50 focus:bg-[#1a1a20]'
                  : 'bg-white border border-black/10 text-black placeholder-black/40 focus:border-orange-500/50 focus:bg-gray-50'
              }\`}
            />
          </div>
        )}`;

data = data.replace(
  /\{\/\* Content Hub Section \*\/\}\n\s*<div className=\{`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20 space-y-8 \$\{featured && !isVaultTab \? '-mt-16' : 'pt-28'\}`\}>/,
  searchBarJSX
);

fs.writeFileSync('src/pages/Dashboard.tsx', data);
