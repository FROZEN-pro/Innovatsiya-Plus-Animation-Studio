const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

data = data.replace(/className=\{\`([^`]+?)"\n/g, 'className={`$1`}\n');
data = data.replace(/className=\{\`([^`]+?)"\s*>/g, 'className={`$1`} >');

fs.writeFileSync('src/pages/Dashboard.tsx', data);
