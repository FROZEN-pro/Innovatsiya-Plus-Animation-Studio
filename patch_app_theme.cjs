const fs = require('fs');
let data = fs.readFileSync('src/App.tsx', 'utf8');

data = data.replace(
  "  const { appSettings } = useAppStore();",
  "  const { appSettings, darkMode } = useAppStore();\n\n  useEffect(() => {\n    if (darkMode) {\n      document.documentElement.classList.add('dark');\n    } else {\n      document.documentElement.classList.remove('dark');\n    }\n  }, [darkMode]);"
);

fs.writeFileSync('src/App.tsx', data);
