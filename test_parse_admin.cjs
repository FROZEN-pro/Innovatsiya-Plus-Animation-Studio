const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');
try {
  require('esbuild').transformSync(content, { loader: 'tsx' });
  console.log("Parse ok!");
} catch (e) {
  console.error(e.message);
}
