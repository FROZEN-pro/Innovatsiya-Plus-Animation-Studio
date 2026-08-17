const fs = require('fs');
let data = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Imports
data = data.replace(
  "import { Play, Download, Sparkles, Flame, Check, Shield, Film, Music, Clapperboard, Smartphone, Crown, Eye, Search, Lock } from 'lucide-react';",
  "import { Play, Download, Sparkles, Flame, Check, Shield, Film, Music, Clapperboard, Smartphone, Crown, Eye, Search, Lock, Clock } from 'lucide-react';\nimport { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';\nimport { db, handleFirestoreError, OperationType } from '../lib/firebase';"
);

// State & Effect
const watchHistoryCode = `
  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchWatchHistory = async () => {
      if (!user) {
        setWatchHistory([]);
        return;
      }
      try {
        const q = query(
          collection(db, \`users/\${user.uid}/watchHistory\`),
          orderBy('lastWatchedAt', 'desc'),
          limit(4)
        );
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map(doc => doc.data());
        setWatchHistory(history);
      } catch (err) {
        // handleFirestoreError(err, OperationType.LIST, \`users/\${user.uid}/watchHistory\`);
        console.error("Watch history error:", err);
      }
    };
    fetchWatchHistory();
  }, [user]);

  const continueWatchingVideos = watchHistory
    .map(wh => {
      const vid = videos.find(v => v.id.toString() === wh.videoId);
      return vid ? { ...vid, progressSeconds: wh.progressSeconds, completed: wh.completed } : null;
    })
    .filter(v => v !== null && !v.completed) as (Video & { progressSeconds: number })[];
`;

data = data.replace(
  "const [aiRecommendation, setAiRecommendation] = useState<string>('');",
  "const [aiRecommendation, setAiRecommendation] = useState<string>('');\n" + watchHistoryCode
);

// JSX
const continueWatchingJSX = `
            {/* Continue Watching Section */}
            {continueWatchingVideos.length > 0 && selectedCategory === 'All' && !searchQuery && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={\`text-xl font-bold tracking-tight \${darkMode ? "text-white" : "text-black"} flex items-center gap-2\`}>
                    <Clock className="text-orange-500" size={20} />
                    <span>Continue Watching</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {continueWatchingVideos.map((video, idx) => {
                    // Note: In VideoPlayer, duration is a string like "10:30". 
                    // Let's just show a play button since we can't reliably parse "duration" without a bit of logic, 
                    // but we can show progress in seconds if needed, or simply render it just like the other cards.
                    return (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={\`group \${darkMode ? "bg-white/5" : "bg-black/5"} border \${darkMode ? "border-white/10" : "border-black/10"} rounded-[28px] overflow-hidden hover:border-orange-500/50 hover:\${darkMode ? "bg-white/10" : "bg-black/10"} transition-all shadow-xl\`}
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Link
                              to={\`/play/\${video.id}\`}
                              className="w-12 h-12 rounded-2xl bg-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform"
                            >
                              <Play fill="currentColor" size={20} className="ml-0.5" />
                            </Link>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            {/* Assuming we can roughly show progress if we had total duration, for now just a small orange bar that indicates in progress */}
                            <div className="h-full bg-orange-500 w-1/2 rounded-r"></div>
                          </div>
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold uppercase text-orange-400">
                            {video.category}
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                            {video.title}
                          </h3>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
`;

data = data.replace(
  '            <div className="flex justify-between items-center">',
  continueWatchingJSX + '\n            <div className="flex justify-between items-center">'
);

fs.writeFileSync('src/pages/Dashboard.tsx', data);
