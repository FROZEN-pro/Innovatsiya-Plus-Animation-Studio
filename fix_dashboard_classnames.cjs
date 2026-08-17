const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The issue is strings like className="something ${darkMode...}"
// We can use a regex to find all className="..." that contain ${darkMode
data = data.replace(/className="([^"]*?\$\{darkMode[^"]*?)"/g, (match, p1) => {
  return 'className={`' + p1 + '`}'
});

fs.writeFileSync('src/pages/Dashboard.tsx', data);
