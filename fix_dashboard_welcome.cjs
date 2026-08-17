const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const welcomeBanner = `
          /* Main Video Grid */
          <div className="space-y-6">
            <div className={\`p-6 md:p-10 mb-8 rounded-3xl \${darkMode ? "bg-white/5" : "bg-black/5"} border \${darkMode ? "border-white/10" : "border-black/10"} flex flex-col justify-center items-center text-center shadow-lg\`}>
              <h1 className={\`text-3xl md:text-5xl font-extrabold tracking-tight \${darkMode ? "text-white" : "text-black"} mb-4\`}>
                {appSettings?.heroTitle || "Elevate Your Creative Journey."}
              </h1>
              <p className={\`text-sm md:text-base max-w-2xl \${darkMode ? "text-white/70" : "text-black/70"}\`}>
                {appSettings?.heroSubtitle || "Stream exclusive 4K ad-free tutorials, animations, and premium music from world-class creators."}
              </p>
            </div>
`;

data = data.replace(
  /\/\*\s*Main Video Grid\s*\*\/\n\s*<div className="space-y-6">/,
  welcomeBanner
);

fs.writeFileSync('src/pages/Dashboard.tsx', data);
