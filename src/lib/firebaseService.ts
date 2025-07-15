import { db, auth, isConfigValid } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  setDoc,
  where
} from 'firebase/firestore';

interface Transaction {
  id: string;
  date: string;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
  userId: string;
}

interface FirestoreTransaction {
  date: Timestamp;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
  createdAt: Timestamp;
  userId: string;
}

// Helper to validate Firebase configuration
const validateFirebaseInitialization = () => {
  if (!isConfigValid) {
    throw new Error("Firebase configuration is invalid. Please check your .env file and ensure all required environment variables are set.");
  }
  if (!db) {
    throw new Error("Firebase database is not initialized. Please check your Firebase configuration.");
  }
  if (!auth) {
    throw new Error("Firebase authentication is not initialized. Please check your Firebase configuration.");
  }
};

// Helper to get current user ID
const getCurrentUserId = (): string => {
  validateFirebaseInitialization();
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found. Please log in again.");
  return user.uid;
};

// Collection references with security
const getTransactionsCollection = () => {
  validateFirebaseInitialization();
  const userId = getCurrentUserId();
  return collection(db, `users/${userId}/investments/gold/transactions`);
};

const getUserSettingsDoc = () => {
  validateFirebaseInitialization();
  const userId = getCurrentUserId();
  return doc(db, `users/${userId}/settings/goldRate`);
};

// Transactions CRUD operations
export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    validateFirebaseInitialization();
    const userId = getCurrentUserId();
    console.log("Fetching transactions for user ID:", userId);
    
    const q = query(
      getTransactionsCollection(),
      orderBy('date', 'desc')
    );
    
    console.log("Executing Firestore query...");
    const snapshot = await getDocs(q);
    console.log(`Query returned ${snapshot.docs.length} documents`);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date.toDate().toISOString(),
        amountSent: data.amountSent,
        goldRate: data.goldRate,
        taxAmount: data.taxAmount,
        goldPurchased: data.goldPurchased,
        notes: data.notes,
        userId: data.userId,
      };
    });
  } catch (error: unknown) {
    console.error("Error fetching transactions:", error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
      throw new Error("Permission denied: You don't have access to these transactions. Please check your login status.");
    } else if (!auth?.currentUser) {
      throw new Error("Authentication error: Please log in again to fetch your transactions.");
    } else {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch transactions: ${errorMessage}`);
    }
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>): Promise<string> => {
  validateFirebaseInitialization();
  const userId = getCurrentUserId();
  
  const firestoreTransaction: Omit<FirestoreTransaction, 'id'> = {
    date: Timestamp.fromDate(new Date(transaction.date)),
    amountSent: transaction.amountSent,
    goldRate: transaction.goldRate,
    taxAmount: transaction.taxAmount,
    goldPurchased: transaction.goldPurchased,
    notes: transaction.notes,
    createdAt: Timestamp.now(),
    userId,
  };

  const docRef = await addDoc(getTransactionsCollection(), firestoreTransaction);
  return docRef.id;
};

export const updateTransaction = async (id: string, transaction: Partial<Omit<Transaction, 'id' | 'userId'>>): Promise<void> => {
  validateFirebaseInitialization();
  const docRef = doc(getTransactionsCollection(), id);
  
  const updateData: Partial<FirestoreTransaction> = {};
  
  if (transaction.amountSent !== undefined) updateData.amountSent = transaction.amountSent;
  if (transaction.goldRate !== undefined) updateData.goldRate = transaction.goldRate;
  if (transaction.taxAmount !== undefined) updateData.taxAmount = transaction.taxAmount;
  if (transaction.goldPurchased !== undefined) updateData.goldPurchased = transaction.goldPurchased;
  if (transaction.notes !== undefined) updateData.notes = transaction.notes;
  
  if (transaction.date) {
    updateData.date = Timestamp.fromDate(new Date(transaction.date));
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  validateFirebaseInitialization();
  const docRef = doc(getTransactionsCollection(), id);
  await deleteDoc(docRef);
};

// Settings operations
export const fetchCurrentGoldRate = async (): Promise<number | null> => {
  try {
    validateFirebaseInitialization();
    const userId = getCurrentUserId();
    const settingsCollection = collection(db, `users/${userId}/settings`);
    const settingsDoc = await getDocs(settingsCollection);
    const goldRateDoc = settingsDoc.docs.find(doc => doc.id === 'goldRate');
    
    if (goldRateDoc) {
      return goldRateDoc.data().value;
    }
    
    // Return default rate if no setting found
    return 7500;
  } catch (error) {
    console.error("Error fetching gold rate:", error);
    return 7500; // Default fallback
  }
};

export const updateCurrentGoldRate = async (rate: number): Promise<void> => {
  try {
    validateFirebaseInitialization();
    await setDoc(getUserSettingsDoc(), { 
      value: rate,
      updatedAt: Timestamp.now() 
    }, { merge: true });
  } catch (error) {
    console.error("Error updating gold rate:", error);
    throw error;
  }
};

// Legacy data migration functions
export const checkForLegacyData = async (): Promise<boolean> => {
  try {
    validateFirebaseInitialization();
    
    // Check if there's any data in the old structure (root level collections)
    const legacyTransactions = collection(db, 'transactions');
    const legacySnapshot = await getDocs(legacyTransactions);
    
    return !legacySnapshot.empty;
  } catch (error) {
    console.error("Error checking for legacy data:", error);
    return false;
  }
};

export const migrateUserData = async (): Promise<boolean> => {
  try {
    validateFirebaseInitialization();
    const userId = getCurrentUserId();
    
    // Get legacy transactions
    const legacyTransactions = collection(db, 'transactions');
    const legacySnapshot = await getDocs(legacyTransactions);
    
    if (legacySnapshot.empty) {
      console.log("No legacy data found to migrate");
      return false;
    }
    
    // Migrate transactions to new user-specific structure
    const userTransactionsCollection = collection(db, `users/${userId}/investments/gold/transactions`);
    
    for (const doc of legacySnapshot.docs) {
      const data = doc.data();
      
      // Add userId and migrate to new structure
      await addDoc(userTransactionsCollection, {
        ...data,
        userId,
        createdAt: data.createdAt || Timestamp.now(),
        migratedAt: Timestamp.now()
      });
    }
    
    console.log(`Successfully migrated ${legacySnapshot.docs.length} transactions`);
    return true;
  } catch (error) {
    console.error("Error migrating user data:", error);
    throw error;
  }
};