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
  where,
  writeBatch
} from 'firebase/firestore';

// Investment Types
export interface GoldTransaction {
  id: string;
  date: string;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
  userId: string;
}

export interface SilverTransaction {
  id: string;
  date: string;
  amountSent: number;
  silverRate: number;
  taxAmount: number;
  silverPurchased: number;
  notes?: string;
  userId: string;
}

export interface FDTransaction {
  id: string;
  date: string;
  amount: number;
  bankName: string;
  interestRate: number;
  duration: number; // in months
  maturityDate: string;
  maturityAmount: number;
  notes?: string;
  userId: string;
}

export interface RDTransaction {
  id: string;
  date: string;
  monthlyAmount: number;
  bankName: string;
  interestRate: number;
  duration: number; // in months
  maturityDate: string;
  totalInvested: number;
  maturityAmount: number;
  installmentsPaid: number;
  notes?: string;
  userId: string;
}

export interface StockTransaction {
  id: string;
  date: string;
  stockSymbol: string;
  companyName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  transactionType: 'buy' | 'sell';
  brokerageCharges: number;
  notes?: string;
  userId: string;
}

export interface MutualFundTransaction {
  id: string;
  date: string;
  fundName: string;
  schemeCode: string;
  units: number;
  nav: number;
  totalAmount: number;
  transactionType: 'buy' | 'sell';
  charges: number;
  notes?: string;
  userId: string;
}

// Default values for new users
const DEFAULT_RATES = {
  goldRate: 7500,
  silverRate: 90,
} as const;

// Demo data for when Firebase is not configured
const DEMO_DATA = {
  gold: [] as GoldTransaction[],
  silver: [] as SilverTransaction[],
  fd: [] as FDTransaction[],
  rd: [] as RDTransaction[],
  stocks: [] as StockTransaction[],
  mutualfunds: [] as MutualFundTransaction[],
  settings: {
    goldRate: DEFAULT_RATES.goldRate,
    silverRate: DEFAULT_RATES.silverRate,
  }
};

// Helper to get current user ID
const getCurrentUserId = (): string => {
  if (!isConfigValid) {
    return 'demo-user';
  }
  
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found. Please log in again.");
  return user.uid;
};

// Collection references with security
const getInvestmentCollection = (type: string) => {
  if (!db) throw new Error("Firebase database is not initialized. Check your Firebase configuration.");
  const userId = getCurrentUserId();
  return collection(db, `users/${userId}/investments/${type}/transactions`);
};

const getUserSettingsDoc = (setting: string) => {
  if (!db) throw new Error("Firebase database is not initialized. Check your Firebase configuration.");
  const userId = getCurrentUserId();
  return doc(db, `users/${userId}/settings/${setting}`);
};

// Generic CRUD operations
export const fetchInvestments = async <T extends { id: string; date: string; userId: string }>(
  type: string
): Promise<T[]> => {
  // Demo mode - return empty array
  if (!isConfigValid) {
    console.log(`Demo mode: Returning empty ${type} investments`);
    return [];
  }

  try {
    const userId = getCurrentUserId();
    console.log(`Fetching ${type} investments for user ID:`, userId);
    
    const q = query(
      getInvestmentCollection(type),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`Query returned ${snapshot.docs.length} ${type} documents`);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: data.date.toDate().toISOString(),
        userId: data.userId,
      } as T;
    });
  } catch (error: unknown) {
    console.error(`Error fetching ${type} investments:`, error);
    const err = error as { code?: string; message?: string };
    if (err.code === 'permission-denied') {
      throw new Error("Permission denied: You don't have access to these investments. Please check your login status.");
    } else if (!auth.currentUser) {
      throw new Error("Authentication error: Please log in again to fetch your investments.");
    } else {
      throw new Error(`Failed to fetch ${type} investments: ${err.message || "Unknown error"}`);
    }
  }
};

export const addInvestment = async <T extends { date: string; [key: string]: unknown }>(
  type: string,
  investment: Omit<T, 'id' | 'userId'>
): Promise<string> => {
  // Demo mode - generate fake ID
  if (!isConfigValid) {
    console.log(`Demo mode: Simulating add ${type} investment`);
    return `demo-${Date.now()}`;
  }

  const userId = getCurrentUserId();
  
  const firestoreInvestment = {
    ...investment,
    date: Timestamp.fromDate(new Date(investment.date)),
    createdAt: Timestamp.now(),
    userId,
  };

  const docRef = await addDoc(getInvestmentCollection(type), firestoreInvestment);
  return docRef.id;
};

export const updateInvestment = async <T extends { date?: string; [key: string]: unknown }>(
  type: string,
  id: string,
  investment: Partial<Omit<T, 'id' | 'userId'>>
): Promise<void> => {
  // Demo mode - do nothing
  if (!isConfigValid) {
    console.log(`Demo mode: Simulating update ${type} investment`);
    return;
  }

  const docRef = doc(getInvestmentCollection(type), id);
  
  const updateData: Record<string, unknown> = { ...investment };
  
  // Handle date conversion if present
  if (investment.date) {
    updateData.date = Timestamp.fromDate(new Date(investment.date));
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteInvestment = async (type: string, id: string): Promise<void> => {
  // Demo mode - do nothing
  if (!isConfigValid) {
    console.log(`Demo mode: Simulating delete ${type} investment`);
    return;
  }

  const docRef = doc(getInvestmentCollection(type), id);
  await deleteDoc(docRef);
};

// Settings operations with default fallbacks
export const fetchSetting = async (settingName: string): Promise<number | null> => {
  // Demo mode - return default values
  if (!isConfigValid) {
    if (settingName === 'goldRate') return DEFAULT_RATES.goldRate;
    if (settingName === 'silverRate') return DEFAULT_RATES.silverRate;
    return null;
  }

  try {
    const userId = getCurrentUserId();
    const settingsCollection = collection(db, `users/${userId}/settings`);
    const snapshot = await getDocs(settingsCollection);
    
    const setting = snapshot.docs.find(doc => doc.id === settingName);
    if (setting) {
      return setting.data().value;
    }
    
    // Return default value if setting doesn't exist
    if (settingName === 'goldRate') return DEFAULT_RATES.goldRate;
    if (settingName === 'silverRate') return DEFAULT_RATES.silverRate;
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${settingName}:`, error);
    
    // Return default values on error
    if (settingName === 'goldRate') return DEFAULT_RATES.goldRate;
    if (settingName === 'silverRate') return DEFAULT_RATES.silverRate;
    
    return null;
  }
};

export const updateSetting = async (settingName: string, value: number): Promise<void> => {
  // Demo mode - do nothing
  if (!isConfigValid) {
    console.log(`Demo mode: Simulating update ${settingName} to ${value}`);
    return;
  }

  try {
    await setDoc(getUserSettingsDoc(settingName), { 
      value,
      updatedAt: Timestamp.now() 
    }, { merge: true });
  } catch (error) {
    console.error(`Error updating ${settingName}:`, error);
    throw error;
  }
};

// Specific investment type functions
export const fetchGoldTransactions = () => fetchInvestments<GoldTransaction>('gold');
export const addGoldTransaction = (transaction: Omit<GoldTransaction, 'id' | 'userId'>) => 
  addInvestment('gold', transaction);
export const updateGoldTransaction = (id: string, transaction: Partial<Omit<GoldTransaction, 'id' | 'userId'>>) => 
  updateInvestment('gold', id, transaction);
export const deleteGoldTransaction = (id: string) => deleteInvestment('gold', id);

export const fetchSilverTransactions = () => fetchInvestments<SilverTransaction>('silver');
export const addSilverTransaction = (transaction: Omit<SilverTransaction, 'id' | 'userId'>) => 
  addInvestment('silver', transaction);
export const updateSilverTransaction = (id: string, transaction: Partial<Omit<SilverTransaction, 'id' | 'userId'>>) => 
  updateInvestment('silver', id, transaction);
export const deleteSilverTransaction = (id: string) => deleteInvestment('silver', id);

export const fetchFDTransactions = () => fetchInvestments<FDTransaction>('fd');
export const addFDTransaction = (transaction: Omit<FDTransaction, 'id' | 'userId'>) => 
  addInvestment('fd', transaction);
export const updateFDTransaction = (id: string, transaction: Partial<Omit<FDTransaction, 'id' | 'userId'>>) => 
  updateInvestment('fd', id, transaction);
export const deleteFDTransaction = (id: string) => deleteInvestment('fd', id);

export const fetchRDTransactions = () => fetchInvestments<RDTransaction>('rd');
export const addRDTransaction = (transaction: Omit<RDTransaction, 'id' | 'userId'>) => 
  addInvestment('rd', transaction);
export const updateRDTransaction = (id: string, transaction: Partial<Omit<RDTransaction, 'id' | 'userId'>>) => 
  updateInvestment('rd', id, transaction);
export const deleteRDTransaction = (id: string) => deleteInvestment('rd', id);

export const fetchStockTransactions = () => fetchInvestments<StockTransaction>('stocks');
export const addStockTransaction = (transaction: Omit<StockTransaction, 'id' | 'userId'>) => 
  addInvestment('stocks', transaction);
export const updateStockTransaction = (id: string, transaction: Partial<Omit<StockTransaction, 'id' | 'userId'>>) => 
  updateInvestment('stocks', id, transaction);
export const deleteStockTransaction = (id: string) => deleteInvestment('stocks', id);

export const fetchMutualFundTransactions = () => fetchInvestments<MutualFundTransaction>('mutualfunds');
export const addMutualFundTransaction = (transaction: Omit<MutualFundTransaction, 'id' | 'userId'>) => 
  addInvestment('mutualfunds', transaction);
export const updateMutualFundTransaction = (id: string, transaction: Partial<Omit<MutualFundTransaction, 'id' | 'userId'>>) => 
  updateInvestment('mutualfunds', id, transaction);
export const deleteMutualFundTransaction = (id: string) => deleteInvestment('mutualfunds', id);

// Rate management with default fallbacks
export const fetchCurrentGoldRate = () => fetchSetting('goldRate');
export const updateCurrentGoldRate = (rate: number) => updateSetting('goldRate', rate);

export const fetchCurrentSilverRate = () => fetchSetting('silverRate');
export const updateCurrentSilverRate = (rate: number) => updateSetting('silverRate', rate);