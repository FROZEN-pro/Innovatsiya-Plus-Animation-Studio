import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getAllUsers, updateUserRole, updateUserSubscription, updateUserProfile } from './src/db/users.ts';
import { db, createPool } from './src/db/index.ts';
import { videos } from './src/db/schema.ts';
import { desc, eq, inArray } from 'drizzle-orm';

// Seed High-Quality Creative Media
const seedMedia = [
  {
    title: "Cyber Neon Dreams 2088",
    description: "An immersive 4K 60fps 3D animated journey through futuristic futuristic cityscapes with ambient synthwave acoustics.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    category: "Animation",
    tags: JSON.stringify(["4K", "HDR", "Animation", "Cyberpunk", "Synthwave"]),
    visibility: "public",
    author: "Innovation Studio",
    isHd: true,
    isEncrypted: true,
    views: 12480,
  },
  {
    title: "Celestial Canvas: 2D Motion Art",
    description: "Hand-drawn frame-by-frame 2D animation showcasing cosmic mythology and celestial geometry.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    category: "2D Video",
    tags: JSON.stringify(["2DArt", "Motion", "Cosmic", "HandDrawn"]),
    visibility: "public",
    author: "Celestial Atelier",
    isHd: true,
    isEncrypted: true,
    views: 8930,
  },
  {
    title: "Shorts: Quantum Glitch Pulse",
    description: "15-second high-energy kinetic typography short reel optimized for mobile viewing.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    category: "Short",
    tags: JSON.stringify(["Shorts", "Kinetic", "Typography", "FastPaced"]),
    visibility: "public",
    author: "Pulse Shorts",
    isHd: true,
    isEncrypted: false,
    views: 24500,
  },
  {
    title: "Synthetic Horizon - Spatial Audio Symphony",
    description: "Lossless 96kHz 24-bit binaural spatial music composition recorded live with analog modular synthesizers.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    category: "Music",
    tags: JSON.stringify(["SpatialAudio", "Binaural", "Lossless", "Synthwave"]),
    visibility: "vip_only",
    author: "Sonic Lab",
    isHd: true,
    isEncrypted: true,
    views: 31200,
  },
  {
    title: "Chronicles of the Solar Wind",
    description: "Award-winning sci-fi animated short exploring deep space exploration and human resilience.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    category: "Animation",
    tags: JSON.stringify(["SciFi", "Animation", "Space", "AwardWinner"]),
    visibility: "public",
    author: "Solaris Guild",
    isHd: true,
    isEncrypted: true,
    views: 18750,
  }
];

const formatVideo = (v: any) => {
  if (!v) return null;
  let parsedTags: string[] = [];
  if (Array.isArray(v.tags)) {
    parsedTags = v.tags;
  } else if (typeof v.tags === 'string') {
    try {
      const parsed = JSON.parse(v.tags);
      parsedTags = Array.isArray(parsed) ? parsed : [];
    } catch {
      parsedTags = v.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
  }

  let parsedSubtitles: any[] = [];
  if (Array.isArray(v.subtitles)) {
    parsedSubtitles = v.subtitles;
  } else if (typeof v.subtitles === 'string' && v.subtitles.trim()) {
    try {
      const parsed = JSON.parse(v.subtitles);
      parsedSubtitles = Array.isArray(parsed) ? parsed : [];
    } catch {
      parsedSubtitles = [];
    }
  }

  let parsedQualities: any[] = [];
  if (Array.isArray(v.qualities)) {
    parsedQualities = v.qualities;
  } else if (typeof v.qualities === 'string' && v.qualities.trim()) {
    try {
      const parsed = JSON.parse(v.qualities);
      parsedQualities = Array.isArray(parsed) ? parsed : [];
    } catch {
      parsedQualities = [];
    }
  }

  return {
    ...v,
    tags: parsedTags,
    subtitles: parsedSubtitles,
    qualities: parsedQualities,
    visibility: v.visibility || 'public',
    author: v.author || 'Innovation Studio',
    isHd: v.isHd !== undefined ? v.isHd : true,
    isEncrypted: v.isEncrypted !== undefined ? v.isEncrypted : true,
    isPremiere: Boolean(v.isPremiere),
    premiereTime: v.premiereTime || null,
    isLiveChatEnabled: v.isLiveChatEnabled !== undefined ? v.isLiveChatEnabled : true,
    accentColor: v.accentColor || '#f97316',
  };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists in both public/uploads and dist/uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer Storage Configuration for Fast Chunked Streaming
  const storageConfig = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}_${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage: storageConfig,
    limits: {
      fileSize: 1024 * 1024 * 1024, // 1GB max for high quality videos
    }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve static uploaded files with byte-range streaming for seamless video seeking
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }));

  // Fast direct multipart file upload endpoint
  app.post("/api/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file was uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message || "Failed to process upload" });
    }
  });

  // Auto Seed Database if Empty
  try {
    const existing = await db.select().from(videos).limit(1);
    if (existing.length === 0) {
      console.log("Seeding Innovation Plus Creative Media...");
      for (const item of seedMedia) {
        await db.insert(videos).values(item);
      }
    }
  } catch (err) {
    console.error("Auto Seed Error:", err);
  }

  // Authenticate and sync user with Cloud SQL
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { email, name, picture } = req.user!;
      const user = await getOrCreateUser(req.user!.uid, email || null, name || null, picture || null);
      res.json({ user });
    } catch (error: any) {
      console.error("Sync Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });

  // Update authenticated user profile
  app.patch("/api/users/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { displayName, photoURL } = req.body;
      const updateData: { displayName?: string; photoURL?: string } = {};
      if (displayName !== undefined) updateData.displayName = String(displayName).slice(0, 100);
      if (photoURL !== undefined) updateData.photoURL = String(photoURL).slice(0, 1000);

      const updated = await updateUserProfile(req.user!.uid, updateData);
      res.json({ user: updated });
    } catch (error: any) {
      console.error("Profile Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to update profile" });
    }
  });

  // Telegram Auth Simulation Endpoint
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const { telegramId, username, firstName } = req.body;
      const fakeUid = `telegram_${telegramId || Date.now()}`;
      const fakeEmail = `${username || firstName || 'tg_user'}@telegram.org`;
      const displayName = firstName ? `${firstName} (@${username || 'user'})` : `@${username || 'tg_user'}`;
      const photoURL = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

      const user = await getOrCreateUser(fakeUid, fakeEmail, displayName, photoURL);
      res.json({ user, token: `tg_token_${fakeUid}` });
    } catch (error: any) {
      console.error("Telegram Auth Error:", error);
      res.status(500).json({ error: error.message || "Telegram authentication failed" });
    }
  });

  // App settings state
  let appSettingsState = {
    heroTitle: "Premium Stream Experience",
    heroSubtitle: "Handpicked HD creative masterwork for subscriber enjoyment.",
    brandName: "INNOVATION+",
    brandTag: "PRO",
    heroImageUrl: "",
    dashboardLayout: "grid" as 'grid' | 'list' | 'cinematic',
    ambientGlowDefault: true,
  };

  app.get("/api/settings", async (req, res) => {
    try {
      return res.json(appSettingsState);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      // @ts-ignore
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }
      appSettingsState = { ...appSettingsState, ...req.body };
      return res.json(appSettingsState);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Get all videos
  app.get("/api/videos", async (req, res) => {
    try {
      const allVideos = await db.select().from(videos).orderBy(desc(videos.createdAt));
      res.json(allVideos.map(formatVideo));
    } catch (error: any) {
      console.error("DB Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch videos" });
    }
  });

  // Get Single Video by ID
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      if (isNaN(videoId)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }
      const video = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
      if (video.length > 0) {
        db.update(videos).set({ views: video[0].views + 1 }).where(eq(videos.id, video[0].id)).execute().catch(console.error);
        res.json(formatVideo(video[0]));
      } else {
        res.status(404).json({ error: "Video not found" });
      }
    } catch (error: any) {
      console.error("DB Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch video" });
    }
  });

  // Create new video
  app.post("/api/videos", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { 
        title, description, videoUrl, thumbnailUrl, category, 
        tags, visibility, author, isHd, isEncrypted,
        isPremiere, premiereTime, isLiveChatEnabled, accentColor,
        subtitles, qualities
      } = req.body;
      const formattedTags = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');
      const formattedSubtitles = Array.isArray(subtitles) ? JSON.stringify(subtitles) : (typeof subtitles === 'string' ? subtitles : '[]');
      const formattedQualities = Array.isArray(qualities) ? JSON.stringify(qualities) : (typeof qualities === 'string' ? qualities : '[]');
      
      const newVideo = await db.insert(videos).values({
        title, 
        description, 
        videoUrl, 
        thumbnailUrl, 
        category: category || "Animation",
        tags: formattedTags,
        visibility: visibility || "public",
        author: author || "Innovation Studio",
        isHd: isHd !== undefined ? isHd : true,
        isEncrypted: isEncrypted !== undefined ? isEncrypted : true,
        isPremiere: Boolean(isPremiere),
        premiereTime: premiereTime ? String(premiereTime) : null,
        isLiveChatEnabled: isLiveChatEnabled !== undefined ? isLiveChatEnabled : true,
        accentColor: accentColor || '#f97316',
        subtitles: formattedSubtitles,
        qualities: formattedQualities,
      }).returning();
      res.json(formatVideo(newVideo[0]));
    } catch (error: any) {
      console.error("DB Error:", error);
      res.status(500).json({ error: error.message || "Failed to create video" });
    }
  });

  // Update single video
  app.patch("/api/videos/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const videoId = parseInt(req.params.id);
      if (isNaN(videoId)) return res.status(400).json({ error: "Invalid video ID" });

      const { 
        title, description, category, tags, visibility, author, 
        isHd, isEncrypted, thumbnailUrl, videoUrl,
        isPremiere, premiereTime, isLiveChatEnabled, accentColor,
        subtitles, qualities
      } = req.body;
      const updatePayload: any = {};
      if (title !== undefined) updatePayload.title = title;
      if (description !== undefined) updatePayload.description = description;
      if (category !== undefined) updatePayload.category = category;
      if (thumbnailUrl !== undefined) updatePayload.thumbnailUrl = thumbnailUrl;
      if (videoUrl !== undefined) updatePayload.videoUrl = videoUrl;
      if (visibility !== undefined) updatePayload.visibility = visibility;
      if (author !== undefined) updatePayload.author = author;
      if (isHd !== undefined) updatePayload.isHd = isHd;
      if (isEncrypted !== undefined) updatePayload.isEncrypted = isEncrypted;
      if (isPremiere !== undefined) updatePayload.isPremiere = Boolean(isPremiere);
      if (premiereTime !== undefined) updatePayload.premiereTime = premiereTime ? String(premiereTime) : null;
      if (isLiveChatEnabled !== undefined) updatePayload.isLiveChatEnabled = isLiveChatEnabled;
      if (accentColor !== undefined) updatePayload.accentColor = accentColor;
      if (tags !== undefined) {
        updatePayload.tags = Array.isArray(tags) ? JSON.stringify(tags) : String(tags);
      }
      if (subtitles !== undefined) {
        updatePayload.subtitles = Array.isArray(subtitles) ? JSON.stringify(subtitles) : String(subtitles);
      }
      if (qualities !== undefined) {
        updatePayload.qualities = Array.isArray(qualities) ? JSON.stringify(qualities) : String(qualities);
      }

      const updated = await db.update(videos)
        .set(updatePayload)
        .where(eq(videos.id, videoId))
        .returning();

      if (updated.length > 0) {
        res.json(formatVideo(updated[0]));
      } else {
        res.status(404).json({ error: "Video not found" });
      }
    } catch (error: any) {
      console.error("Video Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to update video" });
    }
  });

  // Bulk update videos (Metadata, Tags, Visibility, Category, Studio)
  app.post("/api/videos/bulk", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { videoIds, updates } = req.body;
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ error: "videoIds array is required" });
      }
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: "updates payload is required" });
      }

      const numericIds = videoIds.map((id: any) => parseInt(id)).filter(id => !isNaN(id));
      if (numericIds.length === 0) {
        return res.status(400).json({ error: "No valid video IDs provided" });
      }

      const existingVideos = await db.select().from(videos).where(inArray(videos.id, numericIds));
      const results = [];

      for (const v of existingVideos) {
        const currentTags: string[] = (() => {
          try {
            return Array.isArray(v.tags) ? v.tags : JSON.parse(v.tags || '[]');
          } catch {
            return typeof v.tags === 'string' ? v.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
          }
        })();

        let newTags = [...currentTags];
        if (updates.setTags !== undefined) {
          newTags = Array.isArray(updates.setTags) ? updates.setTags : [];
        } else {
          if (Array.isArray(updates.addTags) && updates.addTags.length > 0) {
            updates.addTags.forEach((t: string) => {
              const clean = t.trim();
              if (clean && !newTags.includes(clean)) newTags.push(clean);
            });
          }
          if (Array.isArray(updates.removeTags) && updates.removeTags.length > 0) {
            newTags = newTags.filter((t: string) => !updates.removeTags.includes(t));
          }
        }

        let newTitle = v.title;
        if (updates.titlePrefix) newTitle = `${updates.titlePrefix} ${newTitle}`.trim();
        if (updates.titleSuffix) newTitle = `${newTitle} ${updates.titleSuffix}`.trim();
        if (updates.setTitle) newTitle = updates.setTitle;

        let newDesc = v.description;
        if (updates.descriptionAppend) newDesc = `${newDesc}\n\n${updates.descriptionAppend}`.trim();
        if (updates.setDescription) newDesc = updates.setDescription;

        const singleUpdatePayload: any = {
          tags: JSON.stringify(newTags),
          title: newTitle,
          description: newDesc,
        };

        if (updates.category) singleUpdatePayload.category = updates.category;
        if (updates.visibility) singleUpdatePayload.visibility = updates.visibility;
        if (updates.author) singleUpdatePayload.author = updates.author;
        if (updates.isHd !== undefined) singleUpdatePayload.isHd = updates.isHd;
        if (updates.isEncrypted !== undefined) singleUpdatePayload.isEncrypted = updates.isEncrypted;

        const [updatedItem] = await db.update(videos)
          .set(singleUpdatePayload)
          .where(eq(videos.id, v.id))
          .returning();

        if (updatedItem) results.push(formatVideo(updatedItem));
      }

      res.json({ success: true, count: results.length, updatedVideos: results });
    } catch (error: any) {
      console.error("Bulk Video Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to bulk update videos" });
    }
  });

  // Bulk delete videos
  app.delete("/api/videos/bulk", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { videoIds } = req.body;
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ error: "videoIds array is required" });
      }

      const numericIds = videoIds.map((id: any) => parseInt(id)).filter(id => !isNaN(id));
      if (numericIds.length > 0) {
        await db.delete(videos).where(inArray(videos.id, numericIds));
      }

      res.json({ success: true, count: numericIds.length });
    } catch (error: any) {
      console.error("Bulk Delete Error:", error);
      res.status(500).json({ error: error.message || "Failed to bulk delete videos" });
    }
  });

  // Delete single video
  app.delete("/api/videos/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const videoId = parseInt(req.params.id);
      await db.delete(videos).where(eq(videos.id, videoId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: error.message || "Failed to delete video" });
    }
  });

  // Get All Users for Admin Studio
  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const allUsers = await getAllUsers();
      res.json(allUsers);
    } catch (error: any) {
      console.error("Admin Users Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Toggle Role for User
  app.patch("/api/users/:uid/role", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { role } = req.body;
      const updated = await updateUserRole(req.params.uid, role);
      res.json({ user: updated });
    } catch (error: any) {
      console.error("Role Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to update role" });
    }
  });

  // Toggle Subscription Status (active/banned/inactive)
  app.patch("/api/users/:uid/status", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { subscriptionStatus } = req.body;
      const updated = await updateUserSubscription(req.params.uid, subscriptionStatus);
      res.json({ user: updated });
    } catch (error: any) {
      console.error("Status Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });

  // AI Route for Bulk Smart Tags Generation
  app.post("/api/ai/bulk-tags", async (req, res) => {
    try {
      const { items } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not set." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a media metadata curator. Analyze these video titles and descriptions and output relevant tags.
Output strict JSON with format:
{
  "batchCommonTags": ["4K", "HDR", "Trending", "Exclusive"],
  "itemTags": [
    { "id": 1, "tags": ["Animation", "Cyberpunk", "Neon"] }
  ]
}

Items to analyze:
${JSON.stringify(items || [], null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error("AI Bulk Tags Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI tags" });
    }
  });

  // AI Recommendation Engine
  app.post("/api/ai/recommend", async (req, res) => {
    const categoryName = req.body?.category || 'creative content';
    const currentTitle = req.body?.currentTitle || 'stream';
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ reason: "Based on your interest in " + categoryName + ", you will love this high-definition stream." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Write a 1-sentence personalized AI recommendation for why a member watching "${currentTitle}" (${categoryName}) should continue streaming related creative content.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ reason: response.text });
    } catch (error: any) {
      res.json({ reason: "Recommended for fans of premium " + categoryName + " art." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Important: custom lets us handle HTML serving manually
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let templatePath = url.startsWith('/admin') ? 'adminindex.html' : 'index.html';
        const template = await fs.promises.readFile(path.resolve(process.cwd(), templatePath), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/admin*', (req, res) => {
      res.sendFile(path.join(distPath, 'adminindex.html'));
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Innovation Plus Server running on http://localhost:${PORT}`);
  });
}

startServer();

