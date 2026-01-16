
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { User } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- AUTH PROVIDERS ---
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const discordProvider = new OAuthProvider('oidc.discord');

// --- TYPES ---
export type UserProfile = {
  id: string;
  email?: string | null;
  credits: number;
  tier: 'free' | 'pro' | 'enterprise';
  full_name?: string | null;
  last_credit_reset?: any; // Firestore timestamp
};

export interface WebsiteRecord {
    id: string;
    user_id: string;
    name: string;
    prompt: string;
    code: string;
    created_at: any; // Firestore timestamp
    netlify_site_id?: string | null;
    netlify_deployment_url?: string | null;
    netlify_api_token?: string | null;
}


// --- PROFILE HELPERS ---

export const createUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, 'profiles', user.uid);
  const userProfile: UserProfile = {
    id: user.uid,
    email: user.email,
    full_name: user.displayName,
    credits: 10, // Default credits for new users
    tier: 'free',
    last_credit_reset: serverTimestamp(),
  };
  await setDoc(userRef, userProfile);
  return userProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'profiles', userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserCredits = async (userId: string, newCredits: number) => {
    try {
        const userRef = doc(db, 'profiles', userId);
        await updateDoc(userRef, { credits: newCredits });
        return true;
    } catch (e) {
        console.warn("Failed to update credits in DB (using local state only):", e);
        return false;
    }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, 'profiles', userId);
        await updateDoc(userRef, data);
        return true;
    } catch (e) {
        console.error("Failed to update user profile:", e);
        return false;
    }
};

// --- WEBSITE HELPERS ---

export const saveWebsite = async (userId: string, projectData: Partial<WebsiteRecord>): Promise<WebsiteRecord> => {
    const websitesRef = collection(db, 'websites');
    if (projectData.id) {
        // Update existing project
        const projectId = projectData.id;
        const projectRef = doc(db, 'websites', projectId);

        // Clone the object and remove the id property before updating
        const dataToUpdate = { ...projectData };
        delete dataToUpdate.id;

        await updateDoc(projectRef, dataToUpdate);
        const docSnap = await getDoc(projectRef);
        return { id: docSnap.id, ...docSnap.data() } as WebsiteRecord;
    } else {
        // Create new project
        const newDocRef = await addDoc(websitesRef, {
            ...projectData,
            user_id: userId,
            created_at: serverTimestamp()
        });
        const docSnap = await getDoc(newDocRef);
        return { id: docSnap.id, ...docSnap.data() } as WebsiteRecord;
    }
};

export const getUserWebsites = async (userId: string): Promise<WebsiteRecord[]> => {
    const websitesRef = collection(db, 'websites');
    const q = query(websitesRef, where('user_id', '==', userId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WebsiteRecord));
};

export const deleteWebsite = async (projectId: string): Promise<void> => {
    const projectRef = doc(db, 'websites', projectId);
    await deleteDoc(projectRef);
};


export { app, auth, db, analytics, googleProvider, githubProvider, discordProvider, signInWithPopup, signInWithRedirect, getRedirectResult };
