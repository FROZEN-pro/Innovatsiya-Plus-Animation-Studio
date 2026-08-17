const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// We can replace the static texts with `appSettings` fallbacks.
// Footer
data = data.replace(
  '      </div>\n    </div>\n  );\n}',
  '      </div>\n\n      <footer className={`mt-20 py-8 text-center text-xs ${darkMode ? "text-white/40" : "text-black/40"} border-t ${darkMode ? "border-white/10" : "border-black/10"}`}>\n        {appSettings?.footerText || "Innovation Plus Media. All rights reserved."}\n      </footer>\n    </div>\n  );\n}'
);

// Empty Vault
data = data.replace(
  '<h3 className={`text-base font-bold ${darkMode ? "text-white/80" : "text-black/80"}`}>Offline Vault Empty</h3>',
  '<h3 className={`text-base font-bold ${darkMode ? "text-white/80" : "text-black/80"}`}>{appSettings?.emptyVaultTitle || "Offline Vault Empty"}</h3>'
);

data = data.replace(
  'Download animations, shorts, or music tracks while connected to stream them anytime without internet connection.',
  '{appSettings?.emptyVaultDesc || "Download animations, shorts, or music tracks while connected to stream them anytime without internet connection."}'
);

// No Media
data = data.replace(
  '<h3 className={`text-base font-bold ${darkMode ? "text-white/80" : "text-black/80"}`}>No Media Found</h3>',
  '<h3 className={`text-base font-bold ${darkMode ? "text-white/80" : "text-black/80"}`}>{appSettings?.noMediaTitle || "No Media Found"}</h3>'
);

data = data.replace(
  'Try adjusting your search query or selected category filter.',
  '{appSettings?.noMediaDesc || "Try adjusting your search query or selected category filter."}'
);

fs.writeFileSync('src/pages/Dashboard.tsx', data);
