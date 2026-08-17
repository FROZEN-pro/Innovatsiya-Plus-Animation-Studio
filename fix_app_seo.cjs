const fs = require('fs');
let data = fs.readFileSync('src/App.tsx', 'utf8');

const seoEffect = `
  const { appSettings } = useAppStore();
  
  useEffect(() => {
    if (appSettings?.seoTitle) {
      document.title = appSettings.seoTitle;
    }
    if (appSettings?.seoDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = appSettings.seoDescription;
    }
    if (appSettings?.seoKeywords) {
      let metaKey = document.querySelector('meta[name="keywords"]');
      if (!metaKey) {
        metaKey = document.createElement('meta');
        metaKey.name = "keywords";
        document.head.appendChild(metaKey);
      }
      metaKey.content = appSettings.seoKeywords;
    }
  }, [appSettings]);
`;

// useAppStore is already imported!
// Let's insert the effect right after const { setUser, setLoading } = useAuthStore();
data = data.replace(
  '  const { setUser, setLoading } = useAuthStore();',
  '  const { setUser, setLoading } = useAuthStore();\n' + seoEffect
);

// We need to import useAppStore if it is not imported
if (!data.includes('useAppStore')) {
    data = data.replace(
        "import { useAuthStore } from './store/useStore';",
        "import { useAuthStore, useAppStore } from './store/useStore';"
    );
}

fs.writeFileSync('src/App.tsx', data);
