const fs = require('fs');
let data = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const topBarInjection = `
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className={\`text-3xl font-black uppercase tracking-tighter \${darkMode ? "text-white" : "text-black"}\`}>
              Innovation Plus <span className="text-orange-500">Studio</span>
            </h1>
            <p className={\`text-xs \${darkMode ? "text-white/50" : "text-black/50"} font-bold tracking-widest uppercase mt-1\`}>
              Admin Command Center
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleDarkMode()}
              className={\`p-3 rounded-2xl transition-all \${
                darkMode ? "bg-white/5 hover:bg-white/10 text-yellow-400" : "bg-black/5 hover:bg-black/10 text-yellow-500"
              }\`}
              title="Toggle Theme"
            >
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setPwaModalOpen(true)}
              className={\`p-3 rounded-2xl transition-all \${
                darkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"
              }\`}
              title="Install App"
            >
              <Smartphone size={18} />
            </button>
            <Link 
              to="/dashboard"
              className="px-4 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              <Wand2 size={16} /> Exit Studio
            </Link>
          </div>
        </motion.div>
`;

// Replace the existing top bar
data = data.replace(
  /<motion\.div[^>]*>\s*<div>\s*<h1 className=\{`text-3xl font-black uppercase tracking-tighter \$\{darkMode \? "text-white" : "text-black"\}`\}>\s*Innovation Plus <span className="text-orange-500">Studio<\/span>\s*<\/h1>[\s\S]*?<\/motion\.div>/,
  topBarInjection
);

// Add the settings tab button
const settingsTabBtn = `
          <button
            onClick={() => setActiveTab('settings')}
            className={\`px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all \${
              activeTab === 'settings' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : \`\${darkMode ? "bg-white/5" : "bg-black/5"} \${darkMode ? "text-white/60" : "text-black/60"} hover:\${darkMode ? "bg-white/10" : "bg-black/10"}\`
            }\`}
          >
            <Settings size={16} /> App & SEO Settings
          </button>
`;

data = data.replace(
  /(<button[^>]*onClick=\{\(\) => setActiveTab\('users'\)\}[\s\S]*?<\/button>)/,
  '$1\n' + settingsTabBtn
);

const settingsTabContent = `
        {/* Tab 3: Settings & SEO */}
        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={\`\${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 sm:p-8 border \${darkMode ? "border-white/10" : "border-black/10"} shadow-2xl space-y-6\`}
          >
            <div className={\`flex justify-between items-center pb-4 border-b \${darkMode ? "border-white/10" : "border-black/10"}\`}>
              <div>
                <h2 className={\`text-lg font-bold \${darkMode ? "text-white" : "text-black"}\`}>Platform Settings & SEO Editor</h2>
                <p className={\`text-xs \${darkMode ? "text-white/50" : "text-black/50"}\`}>Customize metadata, copy, and search visibility</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className={\`text-sm font-bold uppercase \${darkMode ? "text-white/70" : "text-black/70"}\`}>General Copy</h3>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>Hero Title</label>
                  <input
                    type="text"
                    value={settingsForm.heroTitle || ''}
                    onChange={(e) => setSettingsForm({...settingsForm, heroTitle: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-black/40 text-white border-white/10" : "bg-white text-black border-black/10"} border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500\`}
                  />
                </div>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>Hero Subtitle</label>
                  <textarea
                    value={settingsForm.heroSubtitle || ''}
                    onChange={(e) => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-black/40 text-white border-white/10" : "bg-white text-black border-black/10"} border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 min-h-[100px]\`}
                  />
                </div>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>Footer Text</label>
                  <input
                    type="text"
                    value={settingsForm.footerText || ''}
                    onChange={(e) => setSettingsForm({...settingsForm, footerText: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-black/40 text-white border-white/10" : "bg-white text-black border-black/10"} border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500\`}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className={\`text-sm font-bold uppercase \${darkMode ? "text-white/70" : "text-black/70"}\`}>SEO Metadata</h3>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>SEO Meta Title</label>
                  <input
                    type="text"
                    value={settingsForm.seoTitle || ''}
                    onChange={(e) => setSettingsForm({...settingsForm, seoTitle: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-black/40 text-white border-white/10" : "bg-white text-black border-black/10"} border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500\`}
                    placeholder="e.g. Innovation Plus | Premium Tutorials"
                  />
                </div>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>SEO Description</label>
                  <textarea
                    value={settingsForm.seoDescription || ''}
                    onChange={(e) => setSettingsForm({...settingsForm, seoDescription: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-black/40 text-white border-white/10" : "bg-white text-black border-black/10"} border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500 min-h-[80px]\`}
                    placeholder="Brief description for search engines..."
                  />
                </div>
                <div>
                  <label className={\`block text-[10px] font-bold uppercase tracking-wider \${darkMode ? "text-white/60" : "text-black/60"} mb-2\`}>SEO Keywords</label>
                  <input
                    type="text"
                    value={settingsForm.seoKeywords || ''}
                    onChange={(e) => setSettingsForm({...settingsForm, seoKeywords: e.target.value})}
                    className={\`w-full \${darkMode ? "bg-black/40 text-white border-white/10" : "bg-white text-black border-black/10"} border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500\`}
                    placeholder="e.g. tutorials, video, music, stream"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setAppSettings(settingsForm);
                  alert('Settings and SEO updated successfully!');
                }}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Save Settings
              </button>
            </div>
          </motion.div>
        )}
`;

data = data.replace(
  /(<\/div>\n\s*<\/div>\n\s*\);\n\})/,
  settingsTabContent + '\n      $1'
);

fs.writeFileSync('src/pages/AdminPanel.tsx', data);
