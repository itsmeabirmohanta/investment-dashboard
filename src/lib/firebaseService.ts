import { db, auth } from './firebase';
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
  where,
  collectionGroup,
  writeBatch
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

// Helper to get current user ID
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found. Please log in again.");
  return user.uid;
};

// Collection references with security
const getTransactionsCollection = () => {
  if (!db) throw new Error("Firebase database is not initialized. Check your Firebase configuration.");
  return collection(db, 'transactions');
};

const getSettingsCollection = () => {
  if (!db) throw new Error("Firebase database is not initialized. Check your Firebase configuration.");
  const userId = getCurrentUserId();
  return collection(db, `users/${userId}/settings`);
};

const getUserSettingsDoc = () => {
  if (!db) throw new Error("Firebase database is not initialized. Check your Firebase configuration.");
  const userId = getCurrentUserId();
  return doc(db, `users/${userId}/settings/goldRate`);
};

// Transactions CRUD operations
export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    // Log authentication status to debug
    console.log("Auth state before fetching:", auth.currentUser ? "User authenticated" : "No authenticated user");
    
    const userId = getCurrentUserId();
    console.log("Fetching transactions for user ID:", userId);
    
    const q = query(
      getTransactionsCollection(), 
      where("userId", "==", userId),
      orderBy('date', 'asc')
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
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    if (error.code === 'permission-denied') {
      throw new Error("Permission denied: You don't have access to these transactions. Please check your login status.");
    } else if (!auth.currentUser) {
      throw new Error("Authentication error: Please log in again to fetch your transactions.");
    } else {
      throw new Error(`Failed to fetch transactions: ${error.message || "Unknown error"}`);
    }
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>): Promise<string> => {
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
  const docRef = doc(getTransactionsCollection(), id);
  
  // Create an empty update data object of type FirestoreTransaction
  const updateData: Partial<FirestoreTransaction> = {};
  
  // Only copy over fields that exist in the transaction object
  if (transaction.amountSent !== undefined) updateData.amountSent = transaction.amountSent;
  if (transaction.goldRate !== undefined) updateData.goldRate = transaction.goldRate;
  if (transaction.taxAmount !== undefined) updateData.taxAmount = transaction.taxAmount;
  if (transaction.goldPurchased !== undefined) updateData.goldPurchased = transaction.goldPurchased;
  if (transaction.notes !== undefined) updateData.notes = transaction.notes;
  
  // Handle date conversion separately
  if (transaction.date) {
    updateData.date = Timestamp.fromDate(new Date(transaction.date));
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const docRef = doc(getTransactionsCollection(), id);
  await deleteDoc(docRef);
};

// Settings operations
export const fetchCurrentGoldRate = async (): Promise<number | null> => {
  try {
    const settingsDoc = await getDocs(getSettingsCollection());
    const goldRateDoc = settingsDoc.docs.find(doc => doc.id === 'goldRate');
    
    if (goldRateDoc) {
      return goldRateDoc.data().value;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching gold rate:", error);
    return null;
  }
};

export const updateCurrentGoldRate = async (rate: number): Promise<void> => {
  try {
    await setDoc(getUserSettingsDoc(), { 
      value: rate,
      updatedAt: Timestamp.now() 
    }, { merge: true });
  } catch (error) {
    console.error("Error updating gold rate:", error);
    throw error;
  }
};

// Check if there are old transactions without user IDs
export const checkForLegacyData = async (): Promise<boolean> => {
  try {
    // Query for any transaction without a userId field
    const q = query(getTransactionsCollection(), where("userId", "==", null));
    const snapshot = await getDocs(q);
    
    // Also check for transactions where userId is undefined
    const q2 = query(getTransactionsCollection());
    const snapshot2 = await getDocs(q2);
    
    const legacyDocs = snapshot2.docs.filter(doc => {
      const data = doc.data();
      return data.userId === undefined;
    });
    
    return snapshot.docs.length > 0 || legacyDocs.length > 0;
  } catch (error) {
    console.error("Error checking for legacy data:", error);
    return false;
  }
};

// Migrate old data to be associated with the current user
export const migrateUserData = async (): Promise<boolean> => {
  try {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);
    
    // Find transactions without a userId field
    const q = query(getTransactionsCollection());
    const snapshot = await getDocs(q);
    
    let migratedCount = 0;
    
    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (!data.userId) {
        // Add the current userId to this transaction
        const docRef = doc(getTransactionsCollection(), docSnapshot.id);
        batch.update(docRef, { userId });
        migratedCount++;
      }
    });
    
    // If there's legacy data, commit the batch
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`Migrated ${migratedCount} transactions to user ${userId}`);
    }
    
    // Migrate any old gold rate data to the user-specific location
    const oldSettingsCollection = collection(db, 'settings');
    const oldSettingsSnapshot = await getDocs(oldSettingsCollection);
    const goldRateDoc = oldSettingsSnapshot.docs.find(doc => doc.id === 'goldRate');
    
    if (goldRateDoc) {
      const goldRateData = goldRateDoc.data();
      await updateCurrentGoldRate(goldRateData.value);
      
      // Optionally delete the old goldRate document
      // await deleteDoc(doc(oldSettingsCollection, 'goldRate'));
    }
    
    return true;
  } catch (error) {
    console.error("Error migrating user data:", error);
    return false;
  }
};