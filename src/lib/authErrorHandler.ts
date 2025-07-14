import { FirebaseError } from "firebase/app";

// Function to get user-friendly error messages from Firebase auth errors
export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      // Email/Password Authentication Errors
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please use a different email or sign in.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials. Please check your email and password.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
      
      // Password Reset Errors
      case 'auth/expired-action-code':
        return 'The password reset link has expired. Please request a new one.';
      case 'auth/invalid-action-code':
        return 'The password reset link is invalid. Please request a new one.';
      
      // General Authentication Errors
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/internal-error':
        return 'An internal authentication error occurred. Please try again later.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed. Please contact support.';
      
      // Default case
      default:
        return error.message || 'An authentication error occurred. Please try again.';
    }
  }
  
  // If not a Firebase error, return a generic message
  return 'An error occurred. Please try again.';
}; 