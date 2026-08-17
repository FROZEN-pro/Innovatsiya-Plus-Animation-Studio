import { db } from './index.ts';
import { users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string | null, displayName: string | null, photoURL: string | null) {
  const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(users)
    .values({
      uid,
      email,
      displayName,
      photoURL,
      role: 'user',
      subscriptionStatus: 'active',
    })
    .returning();

  return result[0];
}

export async function getAllUsers() {
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(uid: string, role: 'user' | 'admin') {
  const result = await db.update(users)
    .set({ role })
    .where(eq(users.uid, uid))
    .returning();
  return result[0];
}

export async function updateUserSubscription(uid: string, subscriptionStatus: string) {
  const result = await db.update(users)
    .set({ subscriptionStatus })
    .where(eq(users.uid, uid))
    .returning();
  return result[0];
}

export async function updateUserProfile(uid: string, data: { displayName?: string; photoURL?: string }) {
  const result = await db.update(users)
    .set(data)
    .where(eq(users.uid, uid))
    .returning();
  return result[0];
}

