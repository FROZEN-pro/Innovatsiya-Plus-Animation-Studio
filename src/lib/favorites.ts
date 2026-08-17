import { doc, getDoc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { FavoriteItem } from '../types';

/**
 * Checks if a specific video is bookmarked as favorite by the user in Firestore.
 */
export async function checkIsFavorite(userId: string, videoId: string | number): Promise<boolean> {
  if (!userId || !videoId) return false;
  try {
    const docRef = doc(db, `users/${userId}/favorites/${videoId}`);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Toggles a video in the user's Firestore favorites collection.
 * Returns the new favorite state (true = favorited, false = removed).
 */
export async function toggleFavorite(
  userId: string,
  video: {
    id: string | number;
    title?: string;
    thumbnailUrl?: string;
    category?: string;
  }
): Promise<boolean> {
  if (!userId || !video || !video.id) {
    throw new Error('User ID and Video are required to toggle favorite.');
  }

  const vId = video.id.toString();
  const docRef = doc(db, `users/${userId}/favorites/${vId}`);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    // Remove from favorites
    await deleteDoc(docRef);
    return false;
  } else {
    // Add to favorites
    const newFav: FavoriteItem = {
      videoId: vId,
      title: video.title || 'Untitled Stream',
      thumbnailUrl: video.thumbnailUrl || '',
      category: video.category || 'Media',
      createdAt: Date.now()
    };
    await setDoc(docRef, newFav);
    return true;
  }
}

/**
 * Sets a video as favorite or unfavorite explicitly.
 */
export async function setFavoriteDoc(
  userId: string,
  video: {
    id: string | number;
    title?: string;
    thumbnailUrl?: string;
    category?: string;
  },
  shouldFavorite: boolean
): Promise<void> {
  if (!userId || !video || !video.id) return;
  const vId = video.id.toString();
  const docRef = doc(db, `users/${userId}/favorites/${vId}`);

  if (shouldFavorite) {
    const favData: FavoriteItem = {
      videoId: vId,
      title: video.title || 'Untitled Stream',
      thumbnailUrl: video.thumbnailUrl || '',
      category: video.category || 'Media',
      createdAt: Date.now()
    };
    await setDoc(docRef, favData);
  } else {
    await deleteDoc(docRef);
  }
}

/**
 * Subscribes to real-time changes of the user's favorites collection.
 */
export function subscribeToFavorites(
  userId: string,
  onUpdate: (favorites: FavoriteItem[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, `users/${userId}/favorites`),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FavoriteItem[] = snapshot.docs.map((docSnap) => ({
        videoId: docSnap.id,
        ...(docSnap.data() as Omit<FavoriteItem, 'videoId'>)
      }));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/favorites`);
    }
  );
}

/**
 * One-time fetch of user's favorites from Firestore.
 */
export async function fetchFavorites(userId: string): Promise<FavoriteItem[]> {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, `users/${userId}/favorites`),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      videoId: d.id,
      ...(d.data() as Omit<FavoriteItem, 'videoId'>)
    }));
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}
