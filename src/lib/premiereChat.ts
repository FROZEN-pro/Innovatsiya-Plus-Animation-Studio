import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { PremiereChatMessage } from '../types';

export const sendPremiereMessage = async (
  videoId: string,
  user: { uid: string; displayName?: string | null; photoURL?: string | null },
  text: string,
  isReaction: boolean = false,
  reactionEmoji?: string
): Promise<PremiereChatMessage> => {
  const messageId = `pmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const messageData: PremiereChatMessage = {
    id: messageId,
    videoId: String(videoId),
    userId: user.uid,
    userDisplayName: user.displayName || 'Subscriber',
    userPhotoURL: user.photoURL || null,
    text: text.slice(0, 400),
    createdAt: Date.now(),
    isReaction: Boolean(isReaction),
    reactionEmoji: reactionEmoji ? reactionEmoji.slice(0, 10) : undefined
  };

  try {
    await setDoc(doc(db, 'premiere_chats', messageId), messageData);
    return messageData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `premiere_chats/${messageId}`);
    throw error;
  }
};

export const subscribePremiereMessages = (
  videoId: string,
  callback: (messages: PremiereChatMessage[]) => void
) => {
  try {
    const q = query(
      collection(db, 'premiere_chats'),
      where('videoId', '==', String(videoId)),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => docSnap.data() as PremiereChatMessage);
        callback(msgs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `premiere_chats?videoId=${videoId}`);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error subscribing to premiere chat:", error);
    return () => {};
  }
};

export const deletePremiereMessage = async (messageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'premiere_chats', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `premiere_chats/${messageId}`);
    throw error;
  }
};
