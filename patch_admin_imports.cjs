const fs = require('fs');
let data = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

data = data.replace(
  "import { storage, auth, getAccessToken, loginWithGoogle } from '../lib/firebase';",
  "import { storage, auth, getAccessToken, loginWithGoogle, db } from '../lib/firebase';\nimport { collectionGroup, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';"
);
data = data.replace(
  "import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';",
  "import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';"
);
data = data.replace(
  "import { Wand2, UploadCloud, CheckCircle2, FileSpreadsheet, Users, Trash2, ShieldAlert, ShieldCheck, Film, Crown, RefreshCw } from 'lucide-react';",
  "import { Wand2, UploadCloud, CheckCircle2, FileSpreadsheet, Users, Trash2, ShieldAlert, ShieldCheck, Film, Crown, RefreshCw, BarChart2 } from 'lucide-react';"
);

// Update activeTab state
data = data.replace(
  "useState<'content' | 'users' | 'settings'>('content');",
  "useState<'content' | 'users' | 'settings' | 'analytics'>('analytics');"
);

// Add the Tab button
const tabButton = `
          <button
            onClick={() => setActiveTab('analytics')}
            className={\`px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all \${
              activeTab === 'analytics' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }\`}
          >
            <BarChart2 size={16} /> Analytics
          </button>
`;
data = data.replace(
  "          <button\n            onClick={() => setActiveTab('content')}",
  tabButton + "\n          <button\n            onClick={() => setActiveTab('content')}"
);

fs.writeFileSync('src/pages/AdminPanel.tsx', data);
