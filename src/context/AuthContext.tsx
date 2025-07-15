import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signOutUser } from '../lib/authService';
import { initializeUserDocument, isConfigValid } from '../lib/firebase';

// Define the context shape
interface AuthContextProps {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
});

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up auth state observer
  useEffect(() => {
    // Only proceed if Firebase is properly configured
    if (!isConfigValid) {
      console.error("Firebase not configured properly. Please check your .env file.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      // Initialize user document if user is authenticated
      if (user) {
        try {
          await initializeUserDocument(user.uid, user.email || '', user.displayName || undefined);
        } catch (error) {
          console.error('Error initializing user document:', error);
        }
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      if (!isConfigValid) {
        console.error("Firebase not configured properly");
        return;
      }
      
      await signOutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Context value
  const value = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth
export const useAuth = () => {
  return useContext(AuthContext);
};