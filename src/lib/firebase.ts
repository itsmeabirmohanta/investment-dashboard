// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration
// Using environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: Log the environment variables (without exposing sensitive data)
console.log("Firebase config check:", {
  apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
});

// Check if the Firebase configuration is valid
const isPlaceholder = (value: string | undefined) => {
  if (!value) return true;
  return value.includes('YOUR_') || value === '';
};

const isConfigValid = !Object.values(firebaseConfig).some(isPlaceholder);
console.log("Is Firebase config valid:", isConfigValid);

let app;
let db;
let analytics;
let auth;
const googleProvider = new GoogleAuthProvider();

if (isConfigValid) {
  // Initialize Firebase
  try {
    console.log("Attempting to initialize Firebase...");
    app = initializeApp(firebaseConfig);
    // Initialize Firestore
    db = getFirestore(app);
    console.log("Firestore initialized successfully");
    // Initialize Auth
    auth = getAuth(app);
    console.log("Authentication initialized successfully");
    // Initialize Analytics if in browser environment
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
      console.log("Analytics initialized successfully");
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.error("Firebase configuration is invalid. Check your .env file.");
}

// Function to add username and password for a logged-in user
async function addUsernameAndPassword(userId: string, username: string, password: string) {
  try {
    // Update Firestore with username and password
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, { username, password }, { merge: true });
    console.log("Username and password added successfully.");
  } catch (error) {
    console.error("Error adding username and password:", error);
    throw error;
  }
}

export { db, analytics, auth, isConfigValid, googleProvider, addUsernameAndPassword };