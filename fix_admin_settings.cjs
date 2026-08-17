const fs = require('fs');
let data = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// Add new fields to settingsForm
data = data.replace(
  "footerText: 'Innovation Plus Media. All rights reserved.'",
  "footerText: 'Innovation Plus Media. All rights reserved.',\n    emptyVaultTitle: 'Offline Vault Empty',\n    emptyVaultDesc: 'Download animations, shorts, or music tracks while connected to stream them anytime without internet connection.',\n    noMediaTitle: 'No Media Found',\n    noMediaDesc: 'Try adjusting your search query or selected category filter.'"
);

const extraInputs = `
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>Empty Vault Title</label>
                  <input
                    type="text"
                    value={settingsForm.emptyVaultTitle}
                    onChange={(e) => setSettingsForm({...settingsForm, emptyVaultTitle: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-white/5" : "bg-black/5"} border \${darkMode ? "border-white/10" : "border-black/10"} rounded-xl p-3 text-sm \${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-yellow-400\`}
                  />
                </div>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>Empty Vault Description</label>
                  <textarea
                    value={settingsForm.emptyVaultDesc}
                    onChange={(e) => setSettingsForm({...settingsForm, emptyVaultDesc: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-white/5" : "bg-black/5"} border \${darkMode ? "border-white/10" : "border-black/10"} rounded-xl p-3 text-sm \${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-yellow-400\`}
                  />
                </div>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>No Media Title</label>
                  <input
                    type="text"
                    value={settingsForm.noMediaTitle}
                    onChange={(e) => setSettingsForm({...settingsForm, noMediaTitle: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-white/5" : "bg-black/5"} border \${darkMode ? "border-white/10" : "border-black/10"} rounded-xl p-3 text-sm \${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-yellow-400\`}
                  />
                </div>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>No Media Description</label>
                  <textarea
                    value={settingsForm.noMediaDesc}
                    onChange={(e) => setSettingsForm({...settingsForm, noMediaDesc: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-white/5" : "bg-black/5"} border \${darkMode ? "border-white/10" : "border-black/10"} rounded-xl p-3 text-sm \${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-yellow-400\`}
                  />
                </div>
`;

data = data.replace(
  /<button\n\s*onClick=\{\(\) => \{\n\s*setAppSettings/,
  extraInputs + '\n                <button\n                  onClick={() => {\n                    setAppSettings'
);

fs.writeFileSync('src/pages/AdminPanel.tsx', data);
