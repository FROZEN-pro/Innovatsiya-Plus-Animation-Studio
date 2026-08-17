import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  limit, 
  updateDoc, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { SupportChat, SupportMessage } from '../types';

const CHATS_COLLECTION = 'support_chats';

/**
 * Subscribe to messages for a specific user's chat room
 */
export const subscribeToSupportMessages = (
  chatId: string, 
  callback: (messages: SupportMessage[]) => void
) => {
  try {
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(150));

    return onSnapshot(q, (snapshot) => {
      const messages: SupportMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          chatId,
          senderId: data.senderId,
          senderName: data.senderName || 'Anonymous',
          senderPhotoURL: data.senderPhotoURL || null,
          senderRole: data.senderRole || 'user',
          text: data.text || '',
          imageUrl: data.imageUrl || undefined,
          createdAt: data.createdAt ? (typeof data.createdAt === 'number' ? data.createdAt : data.createdAt?.toMillis?.() || Date.now()) : Date.now(),
          read: Boolean(data.read)
        };
      });
      callback(messages);
    }, (err) => {
      console.warn('Support messages subscription warning:', err);
    });
  } catch (err) {
    console.error('Failed to subscribe to support messages:', err);
    return () => {};
  }
};

/**
 * Subscribe to all support chats for Admin Panel Inbox
 */
export const subscribeToAllSupportChats = (
  callback: (chats: SupportChat[]) => void
) => {
  try {
    const chatsRef = collection(db, CHATS_COLLECTION);
    const q = query(chatsRef, orderBy('lastMessageTime', 'desc'), limit(100));

    return onSnapshot(q, (snapshot) => {
      const chats: SupportChat[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || docSnap.id,
          userName: data.userName || 'Member',
          userEmail: data.userEmail || '',
          userPhotoURL: data.userPhotoURL || null,
          lastMessageText: data.lastMessageText || '',
          lastMessageTime: data.lastMessageTime ? (typeof data.lastMessageTime === 'number' ? data.lastMessageTime : data.lastMessageTime?.toMillis?.() || Date.now()) : Date.now(),
          lastSenderRole: data.lastSenderRole || 'user',
          status: data.status || 'open',
          unreadAdminCount: Number(data.unreadAdminCount || 0),
          unreadUserCount: Number(data.unreadUserCount || 0)
        };
      });
      callback(chats);
    }, (err) => {
      console.warn('All support chats subscription warning:', err);
    });
  } catch (err) {
    console.error('Failed to subscribe to all support chats:', err);
    return () => {};
  }
};

/**
 * Send a message from User to Admin
 */
export const sendUserSupportMessage = async (params: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string | null;
  text: string;
  imageUrl?: string;
}) => {
  const { userId, userName, userEmail, userPhotoURL, text, imageUrl } = params;
  const now = Date.now();

  const chatDocRef = doc(db, CHATS_COLLECTION, userId);
  const messagesRef = collection(db, CHATS_COLLECTION, userId, 'messages');

  // 1. Add message doc
  await addDoc(messagesRef, {
    chatId: userId,
    senderId: userId,
    senderName: userName,
    senderPhotoURL: userPhotoURL || null,
    senderRole: 'user',
    text: text.trim(),
    imageUrl: imageUrl || null,
    createdAt: now,
    read: false
  });

  // 2. Upsert parent chat conversation document
  await setDoc(chatDocRef, {
    id: userId,
    userId,
    userName,
    userEmail,
    userPhotoURL: userPhotoURL || null,
    lastMessageText: text.trim() || (imageUrl ? '📷 [Image attachment]' : ''),
    lastMessageTime: now,
    lastSenderRole: 'user',
    status: 'open',
    unreadAdminCount: increment(1)
  }, { merge: true });
};

/**
 * Send a reply from Admin to User
 */
export const sendAdminSupportReply = async (params: {
  userId: string;
  adminId: string;
  adminName: string;
  adminPhotoURL?: string | null;
  text: string;
  imageUrl?: string;
}) => {
  const { userId, adminId, adminName, adminPhotoURL, text, imageUrl } = params;
  const now = Date.now();

  const chatDocRef = doc(db, CHATS_COLLECTION, userId);
  const messagesRef = collection(db, CHATS_COLLECTION, userId, 'messages');

  // 1. Add message doc
  await addDoc(messagesRef, {
    chatId: userId,
    senderId: adminId,
    senderName: adminName,
    senderPhotoURL: adminPhotoURL || null,
    senderRole: 'admin',
    text: text.trim(),
    imageUrl: imageUrl || null,
    createdAt: now,
    read: false
  });

  // 2. Update parent chat doc
  await updateDoc(chatDocRef, {
    lastMessageText: text.trim() || (imageUrl ? '📷 [Admin image attachment]' : ''),
    lastMessageTime: now,
    lastSenderRole: 'admin',
    status: 'open',
    unreadUserCount: increment(1)
  });
};

/**
 * Mark all messages in a chat as read by Admin
 */
export const markChatReadByAdmin = async (userId: string) => {
  try {
    const chatDocRef = doc(db, CHATS_COLLECTION, userId);
    await updateDoc(chatDocRef, {
      unreadAdminCount: 0
    });
  } catch (err) {
    console.warn('Failed to mark chat read by admin:', err);
  }
};

/**
 * Mark all messages in a chat as read by User
 */
export const markChatReadByUser = async (userId: string) => {
  try {
    const chatDocRef = doc(db, CHATS_COLLECTION, userId);
    await updateDoc(chatDocRef, {
      unreadUserCount: 0
    });
  } catch (err) {
    console.warn('Failed to mark chat read by user:', err);
  }
};

/**
 * Toggle chat status (open / closed)
 */
export const toggleChatStatus = async (userId: string, newStatus: 'open' | 'closed') => {
  try {
    const chatDocRef = doc(db, CHATS_COLLECTION, userId);
    await updateDoc(chatDocRef, {
      status: newStatus
    });
  } catch (err) {
    console.warn('Failed to toggle chat status:', err);
  }
};
