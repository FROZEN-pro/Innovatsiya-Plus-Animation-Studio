import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getAllUsers, updateUserRole, updateUserSubscription } from './src/db/users.ts';
import { db } from './src/db/index.ts';
import { videos } from './src/db/schema.ts';
import { desc, eq } from 'drizzle-orm';

// Seed High-Quality Creative Media
const seedMedia = [
  {
    title: "Cyber Neon Dreams 2088",
    description: "An immersive 4K 60fps 3D animated journey through futuristic futuristic cityscapes with ambient synthwave acoustics.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    category: "Animation",
    views: 12480,
  },
  {
    title: "Celestial Canvas: 2D Motion Art",
    description: "Hand-drawn frame-by-frame 2D animation showcasing cosmic mythology and celestial geometry.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    category: "2D Video",
    views: 8930,
  },
  {
    title: "Shorts: Quantum Glitch Pulse",
    description: "15-second high-energy kinetic typography short reel optimized for mobile viewing.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    category: "Short",
    views: 24500,
  },
  {
    title: "Synthetic Horizon - Spatial Audio Symphony",
    description: "Lossless 96kHz 24-bit binaural spatial music composition recorded live with analog modular synthesizers.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    category: "Music",
    views: 31200,
  },
  {
    title: "Chronicles of the Solar Wind",
    description: "Award-winning sci-fi animated short exploring deep space exploration and human resilience.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    category: "Animation",
    views: 18750,
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Get Videos from Cloud SQL
  app.get("/api/settings", async (req, res) => {
    try {
      const docRef = db.collection('appSettings').doc('main');
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        const defaultSettings = {
          heroTitle: "Premium Stream Experience",
          heroSubtitle: "Handpicked HD creative masterwork for subscriber enjoyment.",
          brandName: "INNOVATION+",
          brandTag: "PRO"
        };
        await docRef.set(defaultSettings);
        return res.json(defaultSettings);
      }
      return res.json(docSnap.data());
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
      const docRef = db.collection('appSettings').doc('main');
      await docRef.set(req.body, { merge: true });
      return res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // existing /api/videos ...

  app.get("/api/videos", async (req, res) => {
    try {
      const allVideos = await db.select().from(videos).orderBy(desc(videos.createdAt));
      res.json(allVideos);
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
        res.json(video[0]);
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
      const { title, description, videoUrl, thumbnailUrl, category } = req.body;
      const newVideo = await db.insert(videos).values({
        title, description, videoUrl, thumbnailUrl, category: category || "Animation"
      }).returning();
      res.json(newVideo[0]);
    } catch (error: any) {
      console.error("DB Error:", error);
      res.status(500).json({ error: error.message || "Failed to create video" });
    }
  });

  // Delete video
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

  // AI Route using Gemini for Descriptions
  app.post("/api/ai/describe", async (req, res) => {
    try {
      const { title, type } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not set." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Write a short, cinematic 2-sentence description for a private high-definition ${type || 'video'} titled "${title}". Focus on artistic style, visual clarity, and exclusive subscriber value.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ description: response.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate description" });
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

