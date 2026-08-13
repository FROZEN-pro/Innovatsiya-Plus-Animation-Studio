import { useState, FormEvent, useRef, ChangeEvent, useEffect } from 'react';
import { storage, auth, getAccessToken, loginWithGoogle } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion } from 'motion/react';
import { Wand2, UploadCloud, CheckCircle2, FileSpreadsheet, Users, Trash2, ShieldAlert, ShieldCheck, Film, Crown, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { Video } from '../types';

const activityData = [
  { day: 'Mon', views: 400 },
  { day: 'Tue', views: 650 },
  { day: 'Wed', views: 920 },
  { day: 'Thu', views: 1100 },
  { day: 'Fri', views: 1450 },
  { day: 'Sat', views: 2100 },
  { day: 'Sun', views: 1890 },
];

interface DBUser {
  id: number;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [usersList, setUsersList] = useState<DBUser[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'users' | 'analytics'>('content');

  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    category: 'Animation'
  });

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        fetchVideos();
        fetchUsers();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (err) {
      console.error('Fetch videos error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const handleGenerateDescription = async () => {
    if (!form.title) return alert('Enter a title first');
    try {
      setLoading(true);
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, type: form.category })
      });
      const data = await res.json();
      if (data.description) {
        setForm({ ...form, description: data.description });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!window.confirm('Delete this creative media stream?')) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchVideos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserRole = async (uid: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/users/${uid}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserBan = async (uid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'banned' ? 'active' : 'banned';
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/users/${uid}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subscriptionStatus: nextStatus })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setLoading(true);
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        setLoading(false);
        setUploadProgress(0);
        alert('Upload failed. Ensure Storage is configured.');
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        if (type === 'video') {
          setForm(prev => ({ ...prev, videoUrl: url }));
        } else {
          setForm(prev => ({ ...prev, thumbnailUrl: url }));
        }
        setLoading(false);
        setUploadProgress(0);
      }
    );
  };

  const handleExportSheets = async () => {
    setExportingSheets(true);
    try {
      let token = getAccessToken();
      if (!token) {
        const confirmLogin = window.confirm('Authenticate with Google to export to Sheets?');
        if (!confirmLogin) {
          setExportingSheets(false);
          return;
        }
        await loginWithGoogle();
        token = getAccessToken();
        if (!token) throw new Error('Authentication failed or scopes missing.');
      }

      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `Innovation Plus Admin Export - ${new Date().toLocaleDateString()}`
          },
          sheets: [
            {
              properties: { title: 'Analytics' },
              data: [
                {
                  startRow: 0,
                  startColumn: 0,
                  rowData: [
                    { values: [{ userEnteredValue: { stringValue: 'Day' } }, { userEnteredValue: { stringValue: 'Views' } }] },
                    ...activityData.map(d => ({
                      values: [
                        { userEnteredValue: { stringValue: d.day } },
                        { userEnteredValue: { numberValue: d.views } }
                      ]
                    }))
                  ]
                }
              ]
            },
            {
              properties: { title: 'Users' },
              data: [
                {
                  startRow: 0,
                  startColumn: 0,
                  rowData: [
                    { values: [
                      { userEnteredValue: { stringValue: 'UID' } },
                      { userEnteredValue: { stringValue: 'Email' } },
                      { userEnteredValue: { stringValue: 'Role' } },
                      { userEnteredValue: { stringValue: 'Status' } }
                    ] },
                    ...usersList.map(u => ({
                      values: [
                        { userEnteredValue: { stringValue: u.uid || '' } },
                        { userEnteredValue: { stringValue: u.email || '' } },
                        { userEnteredValue: { stringValue: u.role || '' } },
                        { userEnteredValue: { stringValue: u.subscriptionStatus || '' } }
                      ]
                    }))
                  ]
                }
              ]
            },
            {
              properties: { title: 'Videos' },
              data: [
                {
                  startRow: 0,
                  startColumn: 0,
                  rowData: [
                    { values: [
                      { userEnteredValue: { stringValue: 'ID' } },
                      { userEnteredValue: { stringValue: 'Title' } },
                      { userEnteredValue: { stringValue: 'Category' } },
                      { userEnteredValue: { stringValue: 'Views' } }
                    ] },
                    ...videos.map(v => ({
                      values: [
                        { userEnteredValue: { stringValue: v.id || '' } },
                        { userEnteredValue: { stringValue: v.title || '' } },
                        { userEnteredValue: { stringValue: v.category || '' } },
                        { userEnteredValue: { numberValue: v.views || 0 } }
                      ]
                    }))
                  ]
                }
              ]
            }
          ]
        })
      });

      const data = await res.json();
      if (data.spreadsheetUrl) {
        window.open(data.spreadsheetUrl, '_blank');
      } else {
        throw new Error(data.error?.message || 'Failed to export');
      }
    } catch (err: any) {
      console.error(err);
      alert('Export Error: ' + err.message);
    } finally {
      setExportingSheets(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form })
      });
      
      if (!res.ok) throw new Error('Failed to publish video');
      
      setSuccess(true);
      setForm({ title: '', description: '', videoUrl: '', thumbnailUrl: '', category: 'Animation' });
      fetchVideos();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to publish.');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"} mb-2`}>Admin Access Required</h2>
            <p className={`mb-6 ${darkMode ? "text-white/60" : "text-black/60"}`}>Please log in through the main application first.</p>
          <a href="/" className="px-6 py-2 bg-orange-500 text-black font-bold rounded-full hover:bg-orange-400 transition-colors">Go to App</a>
        </div>
      </div>
    );
  }

  return (
      <div className={`min-h-screen ${darkMode ? "bg-[#0a0a0f] text-white" : "bg-gray-50 text-gray-900"} p-6 sm:p-8 font-sans select-none`}>
        <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-wrap items-center justify-between gap-4 pb-6 border-b ${darkMode ? "border-white/10" : "border-black/10"}`}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">Innovation Plus Studio</h1>
              <span className="bg-orange-500 text-black font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full">Admin</span>
            </div>
            <p className={`text-xs ${darkMode ? "text-white" : "text-black"}/50`}>Content Management & Subscriber Studio</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { fetchVideos(); fetchUsers(); }}
              className={`p-2.5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-black/5"} hover:bg-white/10 ${darkMode ? "text-white" : "text-black"}/70 hover:${darkMode ? "text-white" : "text-black"} transition-all`} title="Refresh Studio Data"
            >
              <RefreshCw size={16} />
            </button>
            <Link 
              to="/dashboard" 
              className={`px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider ${darkMode ? "text-white" : "text-black"} transition-all"}`}>
              Return to App
            </Link>
          </div>
        </motion.div>

        {/* Studio Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex items-center gap-2 border-b ${darkMode ? "border-white/10" : "border-black/10"} pb-3`}>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'content' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : (darkMode ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
          >
            <Film size={16} /> Media Publishing ({videos.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : (darkMode ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
          >
            <Users size={16} /> Subscriber Management ({usersList.length})
          </button>
        </motion.div>

        {/* Tab 1: Content Publishing & Media List */}
        {activeTab === 'content' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 sm:p-8 border ${darkMode ? "border-white/10" : "border-black/10"} shadow-2xl`}>
                <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
                  <UploadCloud size={20} className="text-orange-400" /> Upload Creative Stream
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold ${darkMode ? "text-white" : "text-black"}/60 mb-1`}>Title</label>
                    <input 
                      required
                      type="text"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className={`w-full bg-black/40 border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-xs ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500 transition shadow-inner`}
                      placeholder="Title of animation, video, or music track"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold ${darkMode ? "text-white" : "text-black"}/60 mb-1`}>Category</label>
                      <select 
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className={`w-full bg-black/40 border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-xs ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500 transition shadow-inner`}
                      >
                        <option value="Animation">Animation</option>
                        <option value="2D Video">2D Video</option>
                        <option value="Short">Short Reel</option>
                        <option value="Music">Music & Audio</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className={`block text-[10px] uppercase font-bold ${darkMode ? "text-white" : "text-black"}/60`}>Thumbnail Image URL</label>
                        <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="text-[10px] text-orange-400 uppercase font-bold hover:underline">
                          Upload File
                        </button>
                      </div>
                      <input 
                        required
                        type="url"
                        value={form.thumbnailUrl}
                        onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })}
                        className={`w-full bg-black/40 border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-xs ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500 transition shadow-inner`}
                        placeholder="https://..."
                      />
                      <input type="file" accept="image/*" className="hidden" ref={thumbnailInputRef} onChange={e => handleFileUpload(e, 'thumbnail')} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`block text-[10px] uppercase font-bold ${darkMode ? "text-white" : "text-black"}/60`}>Media Video Stream URL (MP4)</label>
                      <button type="button" onClick={() => videoInputRef.current?.click()} className="text-[10px] text-orange-400 uppercase font-bold hover:underline">
                        Upload Video
                      </button>
                    </div>
                    <input 
                      required
                      type="url"
                      value={form.videoUrl}
                      onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                      className={`w-full bg-black/40 border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-xs ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500 transition shadow-inner`}
                      placeholder="https://..."
                    />
                    <input type="file" accept="video/mp4,video/webm" className="hidden" ref={videoInputRef} onChange={e => handleFileUpload(e, 'video')} />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2">
                        <div className={`flex justify-between text-[10px] font-mono ${darkMode ? "text-white" : "text-black"}/50 mb-1`}>
                          <span>Uploading Media File...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`block text-[10px] uppercase font-bold ${darkMode ? "text-white" : "text-black"}/60`}>Description</label>
                      <button 
                        type="button"
                        onClick={handleGenerateDescription}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20"
                      >
                        <Wand2 size={12} /> Gemini Auto-Generate
                      </button>
                    </div>
                    <textarea 
                      required
                      rows={3}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className={`w-full bg-black/40 border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-xs ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500 transition shadow-inner`}
                    />
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-black py-4 rounded-2xl font-extrabold uppercase text-xs tracking-wider transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
                  >
                    {success ? <><CheckCircle2 size={16} /> Stream Published</> : 'Publish to Innovation Plus'}
                  </button>
                </form>
              </div>

              {/* Published Media List */}
              <div className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 sm:p-8 border ${darkMode ? "border-white/10" : "border-black/10"} shadow-2xl space-y-4`}>
                <h3 className={`font-bold text-sm uppercase ${darkMode ? "text-white" : "text-black"}/70`}>Published Creative Catalog</h3>
                <div className="space-y-3">
                  {videos.map(v => (
                    <div key={v.id} className={`p-3 rounded-2xl ${darkMode ? "bg-white/5" : "bg-black/5"} border ${darkMode ? "border-white/10" : "border-black/10"} flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img src={v.thumbnailUrl} alt={v.title} className="w-16 h-12 rounded-xl object-cover shrink-0" />
                        <div className="overflow-hidden">
                          <span className="text-[9px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">{v.category}</span>
                          <h4 className={`text-xs font-bold truncate ${darkMode ? "text-white" : "text-black"} mt-0.5`}>{v.title}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteVideo(v.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all shrink-0"
                        title="Delete Stream"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Preview & Analytics Export */}
            <div className="space-y-6">
              <div className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 border ${darkMode ? "border-white/10" : "border-black/10"} shadow-xl space-y-4`}>
                <h3 className={`text-xs font-bold uppercase ${darkMode ? "text-white" : "text-black"}/60`}>Live Preview</h3>
                {form.thumbnailUrl ? (
                  <div className={`aspect-video bg-black rounded-2xl overflow-hidden border ${darkMode ? "border-white/10" : "border-black/10"} relative`}>
                    <img src={form.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`aspect-video bg-black/40 rounded-2xl flex items-center justify-center ${darkMode ? "text-white" : "text-black"}/20 border border-dashed ${darkMode ? "border-white/10" : "border-black/10"} text-xs font-mono`}>
                    No Thumbnail
                  </div>
                )}
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-extrabold uppercase rounded">
                  {form.category}
                </span>
                <h4 className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>{form.title || 'Untitled Stream'}</h4>
                <p className={`text-xs ${darkMode ? "text-white" : "text-black"}/50 line-clamp-3`}>{form.description || 'Description preview...'}</p>
              </div>

              <div className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 border ${darkMode ? "border-white/10" : "border-black/10"} shadow-xl space-y-4`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-xs font-bold uppercase ${darkMode ? "text-white" : "text-black"}/60`}>Member Engagement</h3>
                  <span className="text-[10px] text-emerald-400 font-mono">Optimal</span>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <button
                  onClick={handleExportSheets}
                  disabled={exportingSheets}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} />
                  {exportingSheets ? 'Exporting to Sheets...' : 'Export Sheets Analytics'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Subscriber Management */}
        
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-bold tracking-tight ${darkMode ? "text-white" : "text-black"} flex items-center gap-2`}>
                <Settings className="text-orange-500" size={20} /> Content Management
              </h2>
            </div>
            
            <form onSubmit={handleSettingsSubmit} className={`${darkMode ? "bg-white/5" : "bg-black/5"} border ${darkMode ? "border-white/10" : "border-black/10"} rounded-[32px] p-6 sm:p-8 space-y-6`}>
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-white" : "text-black"}/50`}>Hero Title</label>
                <input
                  type="text"
                  value={settingsForm.heroTitle}
                  onChange={e => setSettingsForm({...settingsForm, heroTitle: e.target.value})}
                  className={`w-full ${darkMode ? "bg-black/50" : "bg-white"} border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-sm ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500/50`}
                  placeholder="Premium Stream Experience"
                />
              </div>
              
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-white" : "text-black"}/50`}>Hero Subtitle</label>
                <textarea
                  value={settingsForm.heroSubtitle}
                  onChange={e => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})}
                  className={`w-full ${darkMode ? "bg-black/50" : "bg-white"} border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-sm ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500/50 h-24 resize-none`}
                  placeholder="Handpicked HD creative masterwork..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-white" : "text-black"}/50`}>Brand Name</label>
                  <input
                    type="text"
                    value={settingsForm.brandName}
                    onChange={e => setSettingsForm({...settingsForm, brandName: e.target.value})}
                    className={`w-full ${darkMode ? "bg-black/50" : "bg-white"} border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-sm ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500/50`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-white" : "text-black"}/50`}>Brand Tag</label>
                  <input
                    type="text"
                    value={settingsForm.brandTag}
                    onChange={e => setSettingsForm({...settingsForm, brandTag: e.target.value})}
                    className={`w-full ${darkMode ? "bg-black/50" : "bg-white"} border ${darkMode ? "border-white/10" : "border-black/10"} rounded-2xl px-4 py-3 text-sm ${darkMode ? "text-white" : "text-black"} focus:outline-none focus:border-orange-500/50`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Settings size={18} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${darkMode ? "bg-white/5" : "bg-black/5"} rounded-[32px] p-6 sm:p-8 border ${darkMode ? "border-white/10" : "border-black/10"} } shadow-2xl space-y-6`}
          >
            <div className={`flex justify-between items-center pb-4 border-b ${darkMode ? "border-white/10" : "border-black/10"} }`}>
              <div>
                <h2 className="text-lg font-bold">Registered Members & Subscribers</h2>
                <p className={`text-xs ${darkMode ? "text-white" : "text-black"}/50`}>Manage roles, bans, and automated subscriptions</p>
              </div>
              <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                {usersList.length} Accounts Active
              </span>
            </div>

            <div className="space-y-3">
              {usersList.map((u) => (
                <div key={u.uid} className={`p-4 rounded-2xl ${darkMode ? "bg-white/5" : "bg-black/5"} border ${darkMode ? "border-white/10" : "border-black/10"} flex flex-wrap items-center justify-between gap-4`}>
                  <div className="flex items-center gap-3">
                    <img src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} alt="user" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${darkMode ? "text-white" : "text-black"}`}>{u.displayName || 'Anonymous Member'}</h4>
                        {u.role === 'admin' && (
                          <span className="bg-amber-500/20 text-amber-400 text-[9px] font-mono px-1.5 py-0.2 rounded border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                        {u.subscriptionStatus === 'banned' && (
                          <span className="bg-red-500/20 text-red-400 text-[9px] font-mono px-1.5 py-0.2 rounded border border-red-500/30">
                            BANNED
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] ${darkMode ? "text-white" : "text-black"}/50`}>{u.email || u.uid}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleUserRole(u.uid, u.role)}
                      className={`px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold ${darkMode ? "text-white" : "text-black"} transition-all flex items-center gap-1"}`}>
                      <Crown size={12} className="text-amber-400" />
                      {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </button>

                    <button
                      onClick={() => handleToggleUserBan(u.uid, u.subscriptionStatus)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ${
                        u.subscriptionStatus === 'banned'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {u.subscriptionStatus === 'banned' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                      {u.subscriptionStatus === 'banned' ? 'Unban Account' : 'Ban Account'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

