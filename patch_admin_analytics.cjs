const fs = require('fs');
let data = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const analyticsCode = `
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    
    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        
        // Fetch likes
        const likesQuery = query(collectionGroup(db, 'likes'), where('createdAt', '>=', thirtyDaysAgo));
        const likesSnap = await getDocs(likesQuery);
        const likes = likesSnap.docs.map(doc => doc.data());
        
        // Fetch views
        const viewsQuery = query(collectionGroup(db, 'watchHistory'), where('lastWatchedAt', '>=', thirtyDaysAgo));
        const viewsSnap = await getDocs(viewsQuery);
        const views = viewsSnap.docs.map(doc => doc.data());

        // Process data by day
        const dayMap = new Map();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = d.toISOString().split('T')[0];
          dayMap.set(dateStr, { date: dateStr, views: 0, likes: 0, registrations: 0 });
        }

        likes.forEach(like => {
          const d = new Date(like.createdAt);
          const dateStr = d.toISOString().split('T')[0];
          if (dayMap.has(dateStr)) dayMap.get(dateStr).likes += 1;
        });

        views.forEach(view => {
          const d = new Date(view.lastWatchedAt);
          const dateStr = d.toISOString().split('T')[0];
          if (dayMap.has(dateStr)) dayMap.get(dateStr).views += 1;
        });

        usersList.forEach(user => {
          const d = new Date(user.createdAt);
          const dateStr = d.toISOString().split('T')[0];
          if (dayMap.has(dateStr)) dayMap.get(dateStr).registrations += 1;
        });

        setChartData(Array.from(dayMap.values()));
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    
    fetchAnalytics();
  }, [activeTab, usersList]);
`;

data = data.replace(
  "  const [form, setForm] = useState({",
  analyticsCode + "\n  const [form, setForm] = useState({"
);

const analyticsJSX = `
        {/* Tab 0: Analytics */}
        {activeTab === 'analytics' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={\`\${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 sm:p-10 border \${darkMode ? "border-white/10" : "border-black/10"} shadow-2xl relative overflow-hidden\`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className={\`text-2xl font-extrabold flex items-center gap-2 \${darkMode ? "text-white" : "text-black"}\`}>
                    <BarChart2 className="text-orange-500" size={28} /> Platform Analytics
                  </h2>
                  <p className={\`text-sm mt-2 \${darkMode ? "text-white/60" : "text-black/60"}\`}>Past 30 days performance metrics</p>
                </div>
              </div>

              {isLoadingAnalytics ? (
                <div className="h-80 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-orange-500" size={32} />
                </div>
              ) : (
                <div className="h-96 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke={darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        tick={{ fontSize: 12, fill: darkMode ? '#888' : '#666' }}
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        stroke={darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        tick={{ fontSize: 12, fill: darkMode ? '#888' : '#666' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1a1a20' : '#ffffff', 
                          border: \`1px solid \${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}\`,
                          borderRadius: '12px',
                          color: darkMode ? '#fff' : '#000'
                        }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" name="Video Views" dataKey="views" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Total Likes" dataKey="likes" stroke="#ec4899" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="New Registrations" dataKey="registrations" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        )}
`;

data = data.replace(
  "{/* Tab 1: Content Publishing & Media List */}",
  analyticsJSX + "\n\n        {/* Tab 1: Content Publishing & Media List */}"
);

fs.writeFileSync('src/pages/AdminPanel.tsx', data);
