const fs = require('fs');
let data = fs.readFileSync('src/pages/VideoPlayer.tsx', 'utf8');

// Imports
data = data.replace(
  "import { doc, setDoc, collection, query, where, orderBy, getDocs, addDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';",
  "import { doc, setDoc, collection, query, where, orderBy, getDocs, addDoc, deleteDoc, serverTimestamp, onSnapshot, increment, getDoc } from 'firebase/firestore';"
);

data = data.replace(
  "import { MessageSquare, Send, Trash2 } from 'lucide-react';",
  "import { MessageSquare, Send, Trash2, Heart } from 'lucide-react';"
);

// State vars
const likeState = `
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Fetch Like status
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user || !video || id?.startsWith('vault_')) return;
      try {
        const likeDoc = await getDoc(doc(db, \`users/\${user.uid}/likes/\${video.id}\`));
        setIsLiked(likeDoc.exists());
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };
    fetchLikeStatus();
  }, [user, video, id]);

  // Fetch Like count
  useEffect(() => {
    if (!video || id?.startsWith('vault_')) return;
    const unsubscribe = onSnapshot(doc(db, \`videoStats/\${video.id}\`), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setLikeCount(docSnapshot.data().likes || 0);
      } else {
        setLikeCount(video.likes || 0);
      }
    });
    return () => unsubscribe();
  }, [video, id]);

  const handleToggleLike = async () => {
    if (!user) {
      alert("Please log in to like this video.");
      return;
    }
    if (!video || id?.startsWith('vault_')) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    
    // Optimistic UI update
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      const statsRef = doc(db, \`videoStats/\${video.id}\`);
      const userLikeRef = doc(db, \`users/\${user.uid}/likes/\${video.id}\`);

      // Ensure stats doc exists first
      const statsSnap = await getDoc(statsRef);
      if (!statsSnap.exists()) {
        await setDoc(statsRef, { likes: video.likes || 0 });
      }

      if (newIsLiked) {
        await setDoc(userLikeRef, {
          videoId: video.id.toString(),
          createdAt: Date.now()
        });
        await setDoc(statsRef, { likes: increment(1) }, { merge: true });
      } else {
        await deleteDoc(userLikeRef);
        await setDoc(statsRef, { likes: increment(-1) }, { merge: true });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert optimistic update on failure
      setIsLiked(!newIsLiked);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
    }
  };
`;

data = data.replace(
  "const [newComment, setNewComment] = useState('');",
  "const [newComment, setNewComment] = useState('');\n" + likeState
);

// UI Button
const likeButtonJSX = `
                {/* Like Button */}
                <button
                  onClick={handleToggleLike}
                  className={\`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold \${
                    isLiked
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }\`}
                  title="Like this video"
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                  <span className="hidden sm:inline">{likeCount}</span>
                </button>
`;

data = data.replace(
  "                {/* Offline Save Action */}",
  likeButtonJSX + "\n                {/* Offline Save Action */}"
);

fs.writeFileSync('src/pages/VideoPlayer.tsx', data);
