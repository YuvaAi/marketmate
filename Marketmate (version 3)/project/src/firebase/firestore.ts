import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Firestore functions
export const saveCredential = async (userId: string, credentialData: any) => {
  try {
    const credentialRef = doc(collection(db, 'credentials'), `${userId}_facebook`);
    await setDoc(credentialRef, {
      ...credentialData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCredential = async (userId: string, platform: string = 'facebook') => {
  try {
    const credentialRef = doc(collection(db, 'credentials'), `${userId}_${platform}`);
    const credentialSnap = await getDoc(credentialRef);
    
    if (credentialSnap.exists()) {
      return { success: true, data: credentialSnap.data(), error: null };
    } else {
      return { success: false, data: null, error: 'No credentials found' };
    }
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};