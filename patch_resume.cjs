const fs = require('fs');
let data = fs.readFileSync('src/pages/VideoPlayer.tsx', 'utf8');

// Add a ref for the video element
data = data.replace(
  "const lastSyncTime = useRef<number>(0);",
  "const videoRef = useRef<HTMLVideoElement>(null);\n  const lastSyncTime = useRef<number>(0);\n  const [hasResumed, setHasResumed] = useState(false);"
);

// Add logic to fetch and resume watch history
const resumeLogic = `
  // Fetch watch history to resume playback
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !video || hasResumed || id?.startsWith('vault_')) return;
      try {
        const historyDoc = await getDoc(doc(db, \`users/\${user.uid}/watchHistory/\${video.id}\`));
        if (historyDoc.exists()) {
          const data = historyDoc.data();
          if (data.progressSeconds && !data.completed && videoRef.current) {
            videoRef.current.currentTime = data.progressSeconds;
          }
        }
        setHasResumed(true);
      } catch (err) {
        console.error("Failed to fetch watch history:", err);
      }
    };
    fetchHistory();
  }, [user, video, hasResumed, id]);
`;

data = data.replace(
  '  // Fetch comments',
  resumeLogic + '\n  // Fetch comments'
);

data = data.replace(
  '<video \n              controls \n              autoPlay \n              src={video.videoUrl} \n              poster={video.thumbnailUrl}\n              className="w-full h-full object-contain"\n              controlsList="nodownload"\n              onTimeUpdate={handleTimeUpdate}\n            />',
  '<video \n              ref={videoRef}\n              controls \n              autoPlay \n              src={video.videoUrl} \n              poster={video.thumbnailUrl}\n              className="w-full h-full object-contain"\n              controlsList="nodownload"\n              onTimeUpdate={handleTimeUpdate}\n            />'
);

fs.writeFileSync('src/pages/VideoPlayer.tsx', data);
