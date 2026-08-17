const fs = require('fs');
let data = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

data = "import ThemeToggle from './ThemeToggle';\n" + data;

fs.writeFileSync('src/components/Navbar.tsx', data);
