import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');

let cachedAccessToken: string | null = null;

export const getAccessToken = () => cachedAccessToken;

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedAccessToken = credential.accessToken;
  }
  
  return result.user;
};

export const logout = () => {
  cachedAccessToken = null;
  return signOut(auth);
};
