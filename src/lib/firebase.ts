// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingFields = requiredFields.filter(field => !import.meta.env[field]);
  
  if (missingFields.length > 0) {
    console.error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
    console.error('Please set up your Firebase environment variables in .env file');
    return false;
  }
  return true;
};

// Check if Firebase configuration is valid
export const isConfigValid = validateFirebaseConfig();

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let db;
let analytics;
let auth;
const googleProvider = new GoogleAuthProvider();

if (isConfigValid) {
  try {
    console.log("Initializing Firebase...");
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Initialize Analytics if in browser environment
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw new Error("Firebase initialization failed. Please check your configuration.");
  }
} else {
  console.error("Firebase configuration is invalid. Please check your .env file.");
}

// Initialize user document with default values
export const initializeUserDocument = async (userId: string, userEmail: string, displayName?: string) => {
  try {
    if (!db) {
      throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
    }
    
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user document with default settings
      await setDoc(userDocRef, {
        email: userEmail,
        displayName: displayName || 'User',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        settings: {
          goldRate: 7500, // Default gold rate
          silverRate: 90,  // Default silver rate
          currency: 'INR',
          notifications: true
        }
      });
      
      // Initialize default settings subcollection
      const settingsRef = doc(db, `users/${userId}/settings/goldRate`);
      await setDoc(settingsRef, {
        value: 7500,
        updatedAt: Timestamp.now()
      });
      
      const silverSettingsRef = doc(db, `users/${userId}/settings/silverRate`);
      await setDoc(silverSettingsRef, {
        value: 90,
        updatedAt: Timestamp.now()
      });
      
      console.log("User document initialized with default values");
    } else {
      // Update last login
      await setDoc(userDocRef, {
        lastLoginAt: Timestamp.now()
      }, { merge: true });
      
      console.log("User document updated with last login");
    }
  } catch (error) {
    console.error("Error initializing user document:", error);
    throw error;
  }
};

// Add username and password to user document
export const addUsernameAndPassword = async (userId: string, username: string, password: string) => {
  try {
    if (!db) {
      throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
    }
    
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      username: username,
      password: password, // Note: In production, passwords should be hashed
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    console.log("Username and password added to user document");
  } catch (error) {
    console.error("Error adding username and password:", error);
    throw error;
  }
};

export { db, analytics, auth, googleProvider };