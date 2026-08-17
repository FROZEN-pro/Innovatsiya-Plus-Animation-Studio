const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
try {
  require('esbuild').transformSync(content, { loader: 'tsx' });
  console.log("Parse ok!");
} catch (e) {
  console.error(e.message);
}
