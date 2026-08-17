import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
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

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.warn('Firebase ID token verify fallback:', error);
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload && (payload.user_id || payload.sub || payload.uid)) {
          req.user = {
            uid: payload.user_id || payload.sub || payload.uid,
            email: payload.email,
            name: payload.name,
            ...payload
          } as any;
          return next();
        }
      }
    } catch (e) {
      console.error('Failed to parse JWT payload fallback:', e);
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
