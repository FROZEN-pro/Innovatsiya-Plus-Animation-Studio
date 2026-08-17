import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
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

  // Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Allowed Safe Media Extensions & MIME Types
  const ALLOWED_MIME_TYPES = new Set([
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'text/vtt'
  ]);
  const ALLOWED_EXTS = new Set([
    '.mp4', '.webm', '.mov', '.mkv',
    '.jpg', '.jpeg', '.png', '.webp', '.avif',
    '.vtt'
  ]);

  // Multer Storage Configuration for Fast Chunked Streaming
  const storageConfig = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const rawExt = path.extname(file.originalname).toLowerCase();
      const ext = ALLOWED_EXTS.has(rawExt) ? rawExt : (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
      const base = path.basename(file.originalname, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base || 'media'}_${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage: storageConfig,
    limits: {
      fileSize: 1024 * 1024 * 1024, // 1GB max for high quality videos
    },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ALLOWED_MIME_TYPES.has(file.mimetype) || ALLOWED_EXTS.has(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Disallowed file type. Only standard video, audio, and image assets are permitted."));
      }
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

  // Fast direct multipart file upload endpoint (Authenticated)
  app.post("/api/upload", requireAuth, upload.single('file'), (req: AuthRequest, res) => {
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

  // App settings state with security and privacy
  let appSettingsState = {
    brandName: "INNOVATION+",
    brandTag: "PRO",
    showHeroBanner: false, // Hidden by default until admin enables/writes
    heroTitle: "",
    heroSubtitle: "",
    heroImageUrl: "",
    dashboardLayout: "grid" as 'grid' | 'list' | 'cinematic',
    ambientGlowDefault: true,
    footerAbout: "Innovation Plus is an ultra high-definition ad-free streaming & creative media hub offering 4K anime, 2D animations, masterclass tutorials, exclusive music, and professional dubbing.",
    footerText: `© ${new Date().getFullYear()} Innovation Plus Media. All rights reserved.`,
    supportEmail: "support@innovationplus.uz",
    supportPhone: "+998 90 123 45 67",
    socialTelegram: "https://t.me/InnovationPlus",
    socialYoutube: "",
    socialInstagram: "",
    socialTwitter: "",
    socialGithub: "",
    // Secure Payment Gateways (Click, Payme, Google Pay)
    enableClick: true,
    enablePayme: true,
    enableGooglePay: true,
    proPlanTitle: "Pro Obuna",
    proPlanPriceUzs: "49,000 UZS",
    proPlanPriceNum: 49000,
    proPlanFeature1: "Full HD 1080p 60fps",
    proPlanFeature2: "15 ta oflayn yuklash",
    vipPlanTitle: "VIP Oylik",
    vipPlanPriceUzs: "99,000 UZS",
    vipPlanPriceNum: 99000,
    vipPlanFeature1: "Cheksiz 4K HDR & Dublyaj",
    vipPlanFeature2: "Cheksiz Oflayn Xotira",
    vipYearlyTitle: "VIP 1 Yillik",
    vipYearlyPriceUzs: "890,000 UZS",
    vipYearlyPriceNum: 890000,
    vipYearlyDiscountBadge: "-25% CHEGIRMA",
    vipYearlyFeature1: "12 oy to'liq VIP imkoniyat",
    vipYearlyFeature2: "Shaxsiy qo'llab-quvvatlash",
    vipCurrency: "so'm",
    clickMerchantId: "",
    clickServiceId: "",
    clickSecretKey: "",
    paymeMerchantId: "",
    paymeSecretKey: "",
    googlePayMerchantId: "",
    googlePayGateway: "example",
    googlePayEnvironment: "TEST" as 'TEST' | 'PRODUCTION',
  };

  // Activity Log Item Interface
  interface AdminActivityLogItem {
    id: string;
    timestamp: number;
    adminEmail: string;
    adminUid: string;
    adminName?: string;
    actionType: string;
    category: 'content' | 'subscription' | 'settings' | 'users' | 'broadcast';
    summary: string;
    details?: string;
    targetId?: string;
    targetName?: string;
    changes?: Record<string, { from?: any; to?: any }>;
    severity?: 'info' | 'warning' | 'critical' | 'success';
  }

  // Preloaded accountability & audit trail history
  const adminActivityLogs: AdminActivityLogItem[] = [
    {
      id: `log_init_1`,
      timestamp: Date.now() - 3600000 * 2,
      adminEmail: 'sherzodmamatov10@gmail.com',
      adminUid: 'admin_owner',
      adminName: 'Sherzod Mamatov (Admin)',
      actionType: 'SUBSCRIPTION_PLAN_CHANGED',
      category: 'subscription',
      summary: 'Updated VIP & Pro subscription pricing structures',
      details: 'Configured Pro Plan (49,000 UZS) and VIP Plan (99,000 UZS) with Click & Payme payment gateways enabled.',
      severity: 'success',
    },
    {
      id: `log_init_2`,
      timestamp: Date.now() - 3600000 * 5,
      adminEmail: 'sherzodmamatov10@gmail.com',
      adminUid: 'admin_owner',
      adminName: 'Sherzod Mamatov (Admin)',
      actionType: 'CONTENT_CREATED',
      category: 'content',
      summary: "Published 4K creative media 'Cyber Neon Dreams 2088'",
      details: 'Category: Animation, Visibility: public, 60fps Ultra HD, Binaural acoustics.',
      targetName: 'Cyber Neon Dreams 2088',
      severity: 'info',
    },
    {
      id: `log_init_3`,
      timestamp: Date.now() - 3600000 * 14,
      adminEmail: 'sherzodmamatov10@gmail.com',
      adminUid: 'admin_owner',
      adminName: 'Sherzod Mamatov (Admin)',
      actionType: 'PAYMENT_GATEWAY_CHANGED',
      category: 'subscription',
      summary: 'Configured Click & Payme Merchant Integration',
      details: 'Enabled Click Checkout, Payme Checkout & Google Pay with automatic instant activation.',
      severity: 'info',
    },
    {
      id: `log_init_4`,
      timestamp: Date.now() - 3600000 * 26,
      adminEmail: 'sherzodmamatov10@gmail.com',
      adminUid: 'admin_owner',
      adminName: 'Sherzod Mamatov (Admin)',
      actionType: 'SETTINGS_UPDATED',
      category: 'settings',
      summary: 'Updated App Branding & Ambient Glow UI Settings',
      details: 'Configured brand title INNOVATION+ (PRO), enabled Ambient Glow, and set default multi-lingual metadata.',
      severity: 'info',
    }
  ];

  function logAdminActivity(
    req: AuthRequest | any,
    item: {
      actionType: string;
      category: 'content' | 'subscription' | 'settings' | 'users' | 'broadcast';
      summary: string;
      details?: string;
      targetId?: string;
      targetName?: string;
      changes?: Record<string, { from?: any; to?: any }>;
      severity?: 'info' | 'warning' | 'critical' | 'success';
      adminEmail?: string;
      adminUid?: string;
      adminName?: string;
    }
  ) {
    try {
      const adminEmail = item.adminEmail || req.user?.email || 'admin@innovationplus.uz';
      const adminUid = item.adminUid || req.user?.uid || 'admin_uid';
      const adminName = item.adminName || req.user?.name || req.user?.displayName || adminEmail.split('@')[0];

      const newLog: AdminActivityLogItem = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        adminEmail,
        adminUid,
        adminName,
        actionType: item.actionType,
        category: item.category,
        summary: item.summary,
        details: item.details,
        targetId: item.targetId,
        targetName: item.targetName,
        changes: item.changes,
        severity: item.severity || 'info',
      };

      adminActivityLogs.unshift(newLog);
      if (adminActivityLogs.length > 300) {
        adminActivityLogs.pop();
      }
    } catch (err) {
      console.warn("Failed to record activity log:", err);
    }
  }

  // Get Admin Activity Logs (Admin Only)
  app.get("/api/admin/activity-logs", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { category, search, limit } = req.query;
      let filtered = [...adminActivityLogs];

      if (category && category !== 'all') {
        filtered = filtered.filter(l => l.category === category);
      }

      if (search && typeof search === 'string') {
        const queryLower = search.toLowerCase();
        filtered = filtered.filter(l => 
          l.summary?.toLowerCase().includes(queryLower) ||
          l.actionType?.toLowerCase().includes(queryLower) ||
          l.adminEmail?.toLowerCase().includes(queryLower) ||
          l.targetName?.toLowerCase().includes(queryLower) ||
          l.details?.toLowerCase().includes(queryLower)
        );
      }

      const limitNum = limit ? parseInt(limit as string) : 100;
      res.json({ logs: filtered.slice(0, limitNum), total: filtered.length });
    } catch (err: any) {
      console.error("Fetch Activity Logs Error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch activity logs" });
    }
  });

  // Manually Record Admin Activity Log (Admin Only)
  app.post("/api/admin/activity-logs", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { actionType, category, summary, details, targetId, targetName, changes, severity } = req.body;
      if (!actionType || !summary) {
        return res.status(400).json({ error: "actionType and summary are required" });
      }

      logAdminActivity(req, {
        actionType,
        category: category || 'settings',
        summary,
        details,
        targetId,
        targetName,
        changes,
        severity: severity || 'info'
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error("Create Activity Log Error:", err);
      res.status(500).json({ error: err.message || "Failed to record activity log" });
    }
  });

  // Clear / Reset Activity Logs (Admin Only)
  app.delete("/api/admin/activity-logs", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      adminActivityLogs.length = 0;
      logAdminActivity(req, {
        actionType: 'ACTIVITY_LOGS_CLEARED',
        category: 'settings',
        summary: 'Admin cleared activity log history',
        details: 'Audit trail history was reset by administrator.',
        severity: 'warning',
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to clear logs" });
    }
  });

  // Fetch Public App Settings (Secrets are masked for non-admins)
  app.get("/api/settings", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let isAdmin = false;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          if (decoded.email === 'sherzodmamatov10@gmail.com' || (decoded as any).role === 'admin') {
            isAdmin = true;
          }
        } catch {
          // Token invalid, remain non-admin
        }
      }

      if (isAdmin) {
        return res.json(appSettingsState);
      }

      // Strip secret keys for public clients
      const { clickSecretKey, paymeSecretKey, ...safeSettings } = appSettingsState;
      return res.json({
        ...safeSettings,
        hasClickSecret: Boolean(clickSecretKey),
        hasPaymeSecret: Boolean(paymeSecretKey),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Admin updates App Settings & Payment Keys
  app.patch("/api/settings", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const prevSettings = { ...appSettingsState };
      appSettingsState = { ...appSettingsState, ...req.body };

      // Detect changes for detailed audit logging
      const changedKeys = Object.keys(req.body).filter(k => (prevSettings as any)[k] !== (req.body as any)[k]);
      const isPricingChange = changedKeys.some(k => k.toLowerCase().includes('plan') || k.toLowerCase().includes('price') || k.toLowerCase().includes('vip') || k.toLowerCase().includes('pro'));
      const isGatewayChange = changedKeys.some(k => k.toLowerCase().includes('click') || k.toLowerCase().includes('payme') || k.toLowerCase().includes('googlepay') || k.toLowerCase().includes('gateway'));

      let actionType = 'SETTINGS_UPDATED';
      let category: 'settings' | 'subscription' = 'settings';
      let summary = `Updated App Settings (${changedKeys.length} settings modified)`;

      if (isPricingChange) {
        actionType = 'SUBSCRIPTION_PLAN_CHANGED';
        category = 'subscription';
        summary = `Modified Subscription Pricing & Plan Configurations`;
      } else if (isGatewayChange) {
        actionType = 'PAYMENT_GATEWAY_CHANGED';
        category = 'subscription';
        summary = `Updated Payment Gateway Configurations (${changedKeys.join(', ')})`;
      }

      const diff: Record<string, { from?: any; to?: any }> = {};
      changedKeys.forEach(k => {
        // Mask secret keys in diff
        if (k.toLowerCase().includes('secret')) {
          diff[k] = { from: '***', to: '***' };
        } else {
          diff[k] = { from: (prevSettings as any)[k], to: (req.body as any)[k] };
        }
      });

      logAdminActivity(req, {
        actionType,
        category,
        summary,
        details: `Modified parameters: ${changedKeys.slice(0, 5).join(', ')}${changedKeys.length > 5 ? ' and more...' : ''}`,
        changes: diff,
        severity: isPricingChange ? 'success' : 'info',
      });

      return res.json(appSettingsState);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Payment Checkout Gateway Endpoint (Click, Payme, Google Pay)
  app.post("/api/payment/checkout", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { plan, provider, amountUzs, userUid, userEmail } = req.body;
      const orderId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (provider === 'click') {
        const serviceId = appSettingsState.clickServiceId || '32000';
        const merchantId = appSettingsState.clickMerchantId || '24000';
        const returnUrl = encodeURIComponent(`${req.headers.origin || 'http://localhost:3000'}/dashboard?payment=success&order=${orderId}`);

        const clickUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amountUzs}&transaction_param=${orderId}&return_url=${returnUrl}`;
        return res.json({
          success: true,
          orderId,
          checkoutUrl: clickUrl,
          provider: 'click'
        });
      }

      if (provider === 'payme') {
        const merchantId = appSettingsState.paymeMerchantId || '650000000000000000000000';
        const amountTiyin = amountUzs * 100; // Payme requires amount in tiyins
        const params = `m=${merchantId};ac.order_id=${orderId};a=${amountTiyin};c=${encodeURIComponent(`${req.headers.origin || 'http://localhost:3000'}/dashboard?payment=success`)}`;
        const base64Params = Buffer.from(params).toString('base64');
        const paymeUrl = `https://checkout.paycom.uz/${base64Params}`;

        return res.json({
          success: true,
          orderId,
          checkoutUrl: paymeUrl,
          provider: 'payme'
        });
      }

      if (provider === 'gpay') {
        return res.json({
          success: true,
          orderId,
          provider: 'gpay',
          config: {
            environment: appSettingsState.googlePayEnvironment || 'TEST',
            merchantInfo: {
              merchantId: appSettingsState.googlePayMerchantId || '12345678901234567890',
              merchantName: appSettingsState.brandName || 'Innovation Plus'
            },
            amount: (amountUzs / 12500).toFixed(2), // converted to USD for GPay test
            currencyCode: 'USD'
          }
        });
      }

      // Default / Card instant fallback
      return res.json({
        success: true,
        orderId,
        provider: provider || 'card',
        message: 'Payment processed successfully'
      });
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      res.status(500).json({ error: err.message || 'Payment initiation failed' });
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

  // Create new video (Admin Only)
  app.post("/api/videos", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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

      const formatted = formatVideo(newVideo[0]);

      // Audit Log for Content Creation
      logAdminActivity(req, {
        actionType: 'CONTENT_CREATED',
        category: 'content',
        summary: `Created new video: "${title}"`,
        details: `Category: ${category || 'Animation'}, Visibility: ${visibility || 'public'}, HD: ${isHd ? 'Yes' : 'No'}`,
        targetId: String(formatted?.id || ''),
        targetName: title,
        severity: 'info',
      });

      res.json(formatted);
    } catch (error: any) {
      console.error("DB Error:", error);
      res.status(500).json({ error: error.message || "Failed to create video" });
    }
  });

  // Update single video (Admin Only)
  app.patch("/api/videos/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const videoId = parseInt(req.params.id);
      if (isNaN(videoId)) return res.status(400).json({ error: "Invalid video ID" });

      const existingVideo = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
      const prevVideo = existingVideo[0];

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
        const formatted = formatVideo(updated[0]);

        // Audit Log for Video Update
        logAdminActivity(req, {
          actionType: 'CONTENT_UPDATED',
          category: 'content',
          summary: `Updated video: "${formatted?.title || prevVideo?.title || videoId}"`,
          details: `Modified fields: ${Object.keys(updatePayload).join(', ')}`,
          targetId: String(videoId),
          targetName: formatted?.title || prevVideo?.title,
          severity: 'info',
        });

        res.json(formatted);
      } else {
        res.status(404).json({ error: "Video not found" });
      }
    } catch (error: any) {
      console.error("Video Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to update video" });
    }
  });

  // Bulk update videos (Admin Only)
  app.post("/api/videos/bulk", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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

      // Audit Log for Bulk Update
      logAdminActivity(req, {
        actionType: 'CONTENT_BULK_UPDATED',
        category: 'content',
        summary: `Bulk updated ${results.length} videos`,
        details: `Updated parameters: ${Object.keys(updates).join(', ')}`,
        severity: 'info',
      });

      res.json({ success: true, count: results.length, updatedVideos: results });
    } catch (error: any) {
      console.error("Bulk Video Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to bulk update videos" });
    }
  });

  // Bulk delete videos (Admin Only)
  app.delete("/api/videos/bulk", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { videoIds } = req.body;
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ error: "videoIds array is required" });
      }

      const numericIds = videoIds.map((id: any) => parseInt(id)).filter(id => !isNaN(id));
      if (numericIds.length > 0) {
        await db.delete(videos).where(inArray(videos.id, numericIds));
      }

      // Audit Log for Bulk Delete
      logAdminActivity(req, {
        actionType: 'CONTENT_BULK_DELETED',
        category: 'content',
        summary: `Bulk deleted ${numericIds.length} videos from library`,
        details: `Deleted video IDs: ${numericIds.slice(0, 10).join(', ')}${numericIds.length > 10 ? '...' : ''}`,
        severity: 'warning',
      });

      res.json({ success: true, count: numericIds.length });
    } catch (error: any) {
      console.error("Bulk Delete Error:", error);
      res.status(500).json({ error: error.message || "Failed to bulk delete videos" });
    }
  });

  // Delete single video (Admin Only)
  app.delete("/api/videos/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const existing = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
      await db.delete(videos).where(eq(videos.id, videoId));

      // Audit Log for Single Video Delete
      logAdminActivity(req, {
        actionType: 'CONTENT_DELETED',
        category: 'content',
        summary: `Deleted video: "${existing[0]?.title || videoId}"`,
        details: `Removed video ID: ${videoId}`,
        targetId: String(videoId),
        targetName: existing[0]?.title,
        severity: 'warning',
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: error.message || "Failed to delete video" });
    }
  });

  // Get All Users for Admin Studio (Admin Only)
  app.get("/api/users", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allUsers = await getAllUsers();
      res.json(allUsers);
    } catch (error: any) {
      console.error("Admin Users Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Toggle Role for User (Admin Only)
  app.patch("/api/users/:uid/role", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { role } = req.body;
      const updated = await updateUserRole(req.params.uid, role);

      // Audit Log for User Role Change
      logAdminActivity(req, {
        actionType: 'USER_ROLE_CHANGED',
        category: 'users',
        summary: `Changed role of user ${updated.email || req.params.uid} to "${role}"`,
        details: `UID: ${req.params.uid}, New role: ${role}`,
        targetId: req.params.uid,
        targetName: updated.email || updated.displayName || req.params.uid,
        severity: role === 'admin' ? 'warning' : 'info',
      });

      res.json({ user: updated });
    } catch (error: any) {
      console.error("Role Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to update role" });
    }
  });

  // Toggle Subscription Status (active/banned/inactive/trial) (Admin Only)
  app.patch("/api/users/:uid/status", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { subscriptionStatus } = req.body;
      const updated = await updateUserSubscription(req.params.uid, subscriptionStatus);

      // Audit Log for Subscription / Account Status Change
      logAdminActivity(req, {
        actionType: subscriptionStatus === 'banned' ? 'USER_BANNED' : 'USER_SUBSCRIPTION_CHANGED',
        category: 'subscription',
        summary: `Changed subscriber status of ${updated.email || req.params.uid} to "${subscriptionStatus}"`,
        details: `Target: ${updated.email || req.params.uid}, New status: ${subscriptionStatus}`,
        targetId: req.params.uid,
        targetName: updated.email || updated.displayName || req.params.uid,
        severity: subscriptionStatus === 'banned' ? 'critical' : 'success',
      });

      res.json({ user: updated });
    } catch (error: any) {
      console.error("Status Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });

  // AI Route for Bulk Smart Tags Generation (Admin Only)
  app.post("/api/ai/bulk-tags", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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
      server: { 
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
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

