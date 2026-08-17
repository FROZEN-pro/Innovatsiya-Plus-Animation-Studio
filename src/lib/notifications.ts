import { doc, setDoc, deleteDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { AppNotification } from '../types';

export const sendVideoNotification = async (video: {
  id: string | number;
  title: string;
  category: string;
  thumbnailUrl: string;
  author?: string;
  description?: string;
}) => {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const notificationData: AppNotification = {
    id: notifId,
    type: 'new_video',
    title: 'New Stream Release',
    message: `${video.title} is now streaming in ${video.category}.`,
    videoId: String(video.id),
    videoTitle: video.title.slice(0, 200),
    thumbnailUrl: video.thumbnailUrl.slice(0, 500),
    category: (video.category || 'Animation').slice(0, 50),
    author: (video.author || 'Innovation Studio').slice(0, 100),
    createdAt: Date.now()
  };

  try {
    await setDoc(doc(db, 'notifications', notifId), notificationData);
    return notificationData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notifications/${notifId}`);
    throw error;
  }
};

export const sendBroadcastAnnouncement = async (title: string, message: string, type: 'announcement' | 'system' = 'announcement') => {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const notificationData: AppNotification = {
    id: notifId,
    type,
    title: title.slice(0, 200),
    message: message.slice(0, 1000),
    createdAt: Date.now()
  };

  try {
    await setDoc(doc(db, 'notifications', notifId), notificationData);
    return notificationData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notifications/${notifId}`);
    throw error;
  }
};

export const deleteNotificationDoc = async (notificationId: string) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${notificationId}`);
    throw error;
  }
};

export const subscribeToNotifications = (
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(15)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifs: AppNotification[] = snapshot.docs.map((docSnap) => docSnap.data() as AppNotification);
      onData(notifs);
    },
    (err) => {
      console.error('Notifications snapshot error:', err);
      handleFirestoreError(err, OperationType.LIST, 'notifications');
      if (onError) onError(err);
    }
  );
};
