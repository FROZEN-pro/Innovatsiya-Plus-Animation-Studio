const fs = require('fs');

// Fix Dashboard.tsx
let dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
dashboard = dashboard.replace(
  'language, darkMode, appSettings, textSize, searchQuery,',
  'language, darkMode, appSettings, textSize, searchQuery, setSearchQuery,'
);
fs.writeFileSync('src/pages/Dashboard.tsx', dashboard);

// Fix App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  "let metaDesc = document.querySelector('meta[name=\"description\"]');",
  "let metaDesc = document.querySelector('meta[name=\"description\"]') as HTMLMetaElement | null;"
);
app = app.replace(
  "metaDesc = document.createElement('meta');",
  "metaDesc = document.createElement('meta') as HTMLMetaElement;"
);
app = app.replace(
  "let metaKey = document.querySelector('meta[name=\"keywords\"]');",
  "let metaKey = document.querySelector('meta[name=\"keywords\"]') as HTMLMetaElement | null;"
);
app = app.replace(
  "metaKey = document.createElement('meta');",
  "metaKey = document.createElement('meta') as HTMLMetaElement;"
);
fs.writeFileSync('src/App.tsx', app);
