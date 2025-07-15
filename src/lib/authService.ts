import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
  UserCredential,
  signInWithPopup
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider, isConfigValid } from './firebase';

// Helper to validate Firebase configuration
const validateFirebaseAuth = () => {
  if (!isConfigValid) {
    throw new Error("Firebase configuration is invalid. Please check your .env file and ensure all required environment variables are set.");
  }
  if (!auth) {
    throw new Error("Firebase authentication is not initialized. Please check your Firebase configuration.");
  }
};

// Helper to handle admin-restricted-operation errors
const handleAdminRestrictedError = (error: unknown) => {
  if (error instanceof FirebaseError && error.code === 'auth/admin-restricted-operation') {
    throw new Error('This authentication method is disabled. Please enable Email/Password authentication in your Firebase Console under Authentication > Sign-in method.');
  }
  throw error;
};

// Register a new user
export const registerUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    validateFirebaseAuth();
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    handleAdminRestrictedError(error);
    throw error;
  }
};

// Update a user's display name
export const updateUserProfile = async (displayName: string): Promise<void> => {
  validateFirebaseAuth();
  if (auth.currentUser) {
    return updateProfile(auth.currentUser, { displayName });
  }
  throw new Error('No user is signed in');
};

// Sign in a user
export const signInUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    validateFirebaseAuth();
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    handleAdminRestrictedError(error);
    throw error;
  }
};

// Sign out the current user
export const signOutUser = async (): Promise<void> => {
  validateFirebaseAuth();
  return signOut(auth);
};

// Send a password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    validateFirebaseAuth();
    return await sendPasswordResetEmail(auth, email);
  } catch (error) {
    handleAdminRestrictedError(error);
    throw error;
  }
};

// Get the current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  validateFirebaseAuth();
  return onAuthStateChanged(auth, callback);
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    validateFirebaseAuth();
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    handleAdminRestrictedError(error);
    throw error;
  }
};