import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & {
    dbRole?: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Unauthorized: Invalid token string' });
  }

  // Handle Telegram or custom simulated tokens
  if (token.startsWith('tg_token_')) {
    const uid = token.replace('tg_token_', '');
    req.user = {
      uid,
      email: `${uid}@telegram.org`,
      auth_time: Date.now() / 1000,
      iat: Date.now() / 1000,
      exp: (Date.now() + 86400000) / 1000,
      aud: 'innovation-plus',
      iss: 'https://securetoken.google.com/innovation-plus',
      sub: uid,
      firebase: { identities: {}, sign_in_provider: 'custom' }
    } as any;
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error: any) {
    console.error('Firebase token verification failed:', error?.message || error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const adminEmail = 'sherzodmamatov10@gmail.com';
  if (req.user.email === adminEmail) {
    return next();
  }

  try {
    const dbUser = await db.select().from(users).where(eq(users.uid, req.user.uid)).limit(1);
    if (dbUser.length > 0 && dbUser[0].role === 'admin') {
      return next();
    }
  } catch (e) {
    console.error('Admin check DB query error:', e);
  }

  return res.status(403).json({ error: 'Forbidden: Admin access required' });
};
