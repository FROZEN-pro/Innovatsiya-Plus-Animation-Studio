import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  increment,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserLoginLog, UserWatchRecord, User } from '../types';

export function detectDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Server Runtime';
  const ua = window.navigator.userAgent;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone;
  
  let os = 'Unknown OS';
  if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';

  const suffix = isPWA ? ' (PWA App)' : '';
  return `${os} • ${browser}${suffix}`;
}

export async function logUserLogin(
  userId: string,
  userInfo: {
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    role?: 'user' | 'admin';
    subscriptionTier?: 'free' | 'pro' | 'vip';
  },
  method: string = 'google'
): Promise<void> {
  if (!userId) return;

  const now = Date.now();
  const device = detectDeviceInfo();
  const sessionKey = `innovation_logged_${userId}_${Math.floor(now / (1000 * 60 * 5))}`; // dedupe within 5 min window per device
  
  if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
    // Already logged within this short window
    return;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const existingDoc = await getDoc(userDocRef);

    const isAdmin = userInfo.email === 'sherzodmamatov10@gmail.com' || userInfo.role === 'admin';
    const role = isAdmin ? 'admin' : (existingDoc.exists() ? (existingDoc.data()?.role || 'user') : 'user');

    // 1. Update / create main user profile document
    if (!existingDoc.exists()) {
      await setDoc(userDocRef, {
        uid: userId,
        email: userInfo.email || null,
        displayName: userInfo.displayName || 'Innovation Member',
        photoURL: userInfo.photoURL || null,
        role,
        subscriptionStatus: 'active',
        subscriptionTier: userInfo.subscriptionTier || 'vip',
        createdAt: now,
        lastLogin: now,
        lastLoginAt: now,
        loginCount: 1,
        totalWatchDurationSeconds: 0,
        totalWatchTimeMinutes: 0,
        lastActiveAt: now,
        recentLoginDevice: device,
        recentLoginMethod: method
      });
    } else {
      await setDoc(userDocRef, {
        uid: userId,
        email: userInfo.email || existingDoc.data()?.email || null,
        displayName: userInfo.displayName || existingDoc.data()?.displayName || 'Innovation Member',
        photoURL: userInfo.photoURL || existingDoc.data()?.photoURL || null,
        role: existingDoc.data()?.role || role,
        subscriptionStatus: existingDoc.data()?.subscriptionStatus || 'active',
        lastLogin: now,
        lastLoginAt: now,
        loginCount: increment(1),
        lastActiveAt: now,
        recentLoginDevice: device,
        recentLoginMethod: method
      }, { merge: true });
    }

    // 2. Append immutable login audit log document
    const logId = `log_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const logDocRef = doc(db, `users/${userId}/loginLogs`, logId);
    
    await setDoc(logDocRef, {
      id: logId,
      userId,
      timestamp: now,
      method,
      device,
      userAgent: (typeof window !== 'undefined' ? window.navigator.userAgent : '').slice(0, 290)
    });

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, '1');
    }
  } catch (error) {
    console.warn("Failed to log user login timestamp to Firestore:", error);
    // Silent fail so it doesn't block authentication
  }
}

export async function logUserWatchDuration(
  userId: string,
  videoDetails: {
    id: string | number;
    title?: string;
    thumbnailUrl?: string;
    category?: string;
  },
  watchedSecondsDelta: number,
  currentProgressSeconds: number,
  isCompleted: boolean
): Promise<void> {
  if (!userId || !videoDetails.id || watchedSecondsDelta <= 0) return;

  const now = Date.now();
  const videoIdStr = String(videoDetails.id);

  try {
    const userDocRef = doc(db, 'users', userId);
    const watchHistoryDocRef = doc(db, `users/${userId}/watchHistory`, videoIdStr);

    // 1. Update user aggregated watch time
    await setDoc(userDocRef, {
      totalWatchDurationSeconds: increment(watchedSecondsDelta),
      totalWatchTimeMinutes: increment(Math.round((watchedSecondsDelta / 60) * 10) / 10),
      lastActiveAt: now
    }, { merge: true });

    // 2. Update specific video watch history item
    await setDoc(watchHistoryDocRef, {
      videoId: videoIdStr,
      watchDurationSeconds: increment(watchedSecondsDelta),
      progressSeconds: Math.round(currentProgressSeconds),
      lastWatchedAt: now,
      completed: isCompleted,
      title: videoDetails.title || 'Creative Stream',
      thumbnailUrl: videoDetails.thumbnailUrl || null,
      category: videoDetails.category || 'Animation',
      playCount: increment(1)
    }, { merge: true });
  } catch (error) {
    console.warn("Failed to log watch duration delta to Firestore:", error);
  }
}

export async function fetchUserLoginLogs(userId: string, maxLogs: number = 30): Promise<UserLoginLog[]> {
  if (!userId) return [];
  try {
    const logsRef = collection(db, `users/${userId}/loginLogs`);
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxLogs));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as UserLoginLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/loginLogs`);
    return [];
  }
}

export async function fetchUserWatchHistory(userId: string): Promise<UserWatchRecord[]> {
  if (!userId) return [];
  try {
    const historyRef = collection(db, `users/${userId}/watchHistory`);
    const q = query(historyRef, orderBy('lastWatchedAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as UserWatchRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/watchHistory`);
    return [];
  }
}

export function subscribeToWatchHistory(
  userId: string, 
  onUpdate: (records: UserWatchRecord[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  try {
    const historyRef = collection(db, `users/${userId}/watchHistory`);
    const q = query(historyRef, orderBy('lastWatchedAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data() as UserWatchRecord);
      onUpdate(records);
    }, (error) => {
      console.warn("Watch history subscription notice:", error);
    });
  } catch (err) {
    console.warn("Watch history subscribe error:", err);
    return () => {};
  }
}

export async function deleteWatchHistoryItem(userId: string, videoId: string): Promise<void> {
  if (!userId || !videoId) return;
  try {
    const docRef = doc(db, `users/${userId}/watchHistory`, videoId);
    await deleteDoc(docRef);
    try {
      localStorage.removeItem(`innovation_plus_progress_${videoId}`);
    } catch {}
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/watchHistory/${videoId}`);
    throw error;
  }
}

export async function clearUserWatchHistory(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const historyRef = collection(db, `users/${userId}/watchHistory`);
    const snapshot = await getDocs(historyRef);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/watchHistory`);
    throw error;
  }
}

export async function fetchAllFirestoreUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(d => d.data() as User);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const sec = Math.floor(totalSeconds);
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`.trim();
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export function formatRelativeTime(timestamp?: number | string): string {
  if (!timestamp) return 'Never';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (isNaN(time)) return 'Never';

  const diffMs = Date.now() - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
