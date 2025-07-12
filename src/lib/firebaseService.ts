import { db } from './firebase';
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
  setDoc 
} from 'firebase/firestore';

interface Transaction {
  id: string;
  date: string;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
}

interface FirestoreTransaction {
  date: Timestamp;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
  createdAt: Timestamp;
}

// Collection references
const transactionsCollection = collection(db, 'transactions');
const settingsCollection = collection(db, 'settings');

// Transactions CRUD operations
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const q = query(transactionsCollection, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
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
    };
  });
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
  const firestoreTransaction: Omit<FirestoreTransaction, 'id'> = {
    date: Timestamp.fromDate(new Date(transaction.date)),
    amountSent: transaction.amountSent,
    goldRate: transaction.goldRate,
    taxAmount: transaction.taxAmount,
    goldPurchased: transaction.goldPurchased,
    notes: transaction.notes,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(transactionsCollection, firestoreTransaction);
  return docRef.id;
};

export const updateTransaction = async (id: string, transaction: Partial<Omit<Transaction, 'id'>>): Promise<void> => {
  const docRef = doc(transactionsCollection, id);
  
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
  const docRef = doc(transactionsCollection, id);
  await deleteDoc(docRef);
};

// Settings operations
export const fetchCurrentGoldRate = async (): Promise<number | null> => {
  const snapshot = await getDocs(settingsCollection);
  const settings = snapshot.docs.find(doc => doc.id === 'goldRate');
  
  if (settings) {
    return settings.data().value;
  }
  
  return null;
};

export const updateCurrentGoldRate = async (rate: number): Promise<void> => {
  try {
    const settingsRef = doc(settingsCollection, 'goldRate');
    await setDoc(settingsRef, { 
      value: rate,
      updatedAt: Timestamp.now() 
    }, { merge: true });
  } catch (error) {
    console.error("Error updating gold rate:", error);
    throw error;
  }
}; 