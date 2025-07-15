import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Dashboard from '@/components/Dashboard';
import TransactionForm from '@/components/TransactionForm';
import TransactionHistory from '@/components/TransactionHistory';
import { Header } from '@/components/Header';
import { DataMigrationDialog } from '@/components/DataMigrationDialog';
import FirebaseConnectionTest from '@/components/FirebaseConnectionTest';
import EnvDiagnostic from '@/components/EnvDiagnostic';
import ManualFirebaseConfig from '@/components/ManualFirebaseConfig';
import { Coins, PlusCircle, History, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  fetchTransactions, 
  addTransaction, 
  deleteTransaction, 
  updateTransaction, 
  fetchCurrentGoldRate, 
  updateCurrentGoldRate,
  checkForLegacyData,
  migrateUserData 
} from '@/lib/firebaseService';
import { isConfigValid } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface Transaction {
  id: string;
  date: string;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
}

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentGoldRate, setCurrentGoldRate] = useState(7500);
  const [loading, setLoading] = useState(true);
  const [showMigration, setShowMigration] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { currentUser } = useAuth();

  // Check for legacy data that needs migration
  useEffect(() => {
    const checkLegacyData = async () => {
      if (isConfigValid && currentUser) {
        try {
          const hasLegacyData = await checkForLegacyData();
          if (hasLegacyData) {
            setShowMigration(true);
          }
        } catch (error) {
          console.error("Error checking for legacy data:", error);
        }
      }
    };
    
    checkLegacyData();
  }, [currentUser]);

  // Load data from Firebase on component mount (only if config is valid)
  useEffect(() => {
    const loadData = async () => {
      if (!isConfigValid) {
        console.error("Firebase configuration is not valid. Cannot load data.");
        setLoading(false);
        return;
      }

      if (!currentUser) {
        console.error("No authenticated user found.");
        toast({
          title: "Authentication Error",
          description: "Please log in to access your data.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Starting to load data with user:", currentUser.uid);
        
        // First try to fetch transactions
        try {
          console.log("Attempting to fetch transactions...");
          const fetchedTransactions = await fetchTransactions();
          console.log("Transactions loaded successfully:", fetchedTransactions.length);
          setTransactions(fetchedTransactions);
        } catch (error: unknown) {
          console.error("Error fetching transactions:", error);
          // Show more specific error message based on the error
          toast({
            title: "Failed to Load Transactions",
            description: error instanceof Error ? error.message : "Could not retrieve your transaction history.",
            variant: "destructive",
          });
          
          // If there's an authentication error specifically, we should stop
          if (error instanceof Error && (error.message?.includes("authentication") || error.message?.includes("log in"))) {
            setLoading(false);
            return;
          }
        }

        // Then try to fetch the current gold rate
        try {
          console.log("Attempting to fetch gold rate...");
          const rate = await fetchCurrentGoldRate();
          if (rate !== null) {
            setCurrentGoldRate(rate);
            console.log("Gold rate loaded successfully:", rate);
          } else {
            console.log("No existing gold rate found, setting default");
            await updateCurrentGoldRate(currentGoldRate);
          }
        } catch (goldRateError: unknown) {
          console.error("Error fetching gold rate:", goldRateError);
          toast({
            title: "Failed to Load Gold Rate",
            description: goldRateError instanceof Error ? goldRateError.message : "Could not retrieve the current gold rate.",
            variant: "destructive",
          });
        }
      } catch (error: unknown) {
        console.error("Error loading data:", error);
        toast({
          title: "Failed to Load Data",
          description: error instanceof Error ? error.message : "An error occurred while fetching data from the server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser, currentGoldRate]);

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    try {
      const id = await addTransaction(newTransaction);
      const transactionWithId = { ...newTransaction, id };
      setTransactions(prev => [...prev, transactionWithId]);
      
      toast({
        title: "Transaction Added",
        description: `Successfully added transaction to the database.`,
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Failed to Add Transaction",
        description: "There was an error adding your transaction.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: "Transaction Deleted",
        description: `Successfully removed transaction.`,
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Failed to Delete Transaction",
        description: "There was an error deleting your transaction.",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = async (id: string, updatedTransaction: Omit<Transaction, 'id'>) => {
    try {
      await updateTransaction(id, updatedTransaction);
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...updatedTransaction, id } : t
      ));
      
      toast({
        title: "Transaction Updated",
        description: `Successfully updated transaction.`,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Failed to Update Transaction",
        description: "There was an error updating your transaction.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCurrentRate = async (rate: number) => {
    try {
      await updateCurrentGoldRate(rate);
      setCurrentGoldRate(rate);
      
      toast({
        title: "Gold Rate Updated",
        description: `Current gold rate set to ₹${rate.toLocaleString('en-IN')}/gm`,
      });
    } catch (error) {
      console.error("Error updating gold rate:", error);
      toast({
        title: "Failed to Update Gold Rate",
        description: "There was an error updating the gold rate.",
        variant: "destructive",
      });
    }
  };

  const handleMigrateData = async () => {
    try {
      const success = await migrateUserData();
      if (success) {
        // Reload transactions after migration
        const fetchedTransactions = await fetchTransactions();
        setTransactions(fetchedTransactions);
      }
      return success;
    } catch (error) {
      console.error("Migration error:", error);
      return false;
    }
  };

  // Show error message if Firebase configuration is not valid
  if (!isConfigValid || showDiagnostic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-4">
              Investment Tracker Dashboard
            </h1>
          </div>
          
          {!isConfigValid && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Firebase Configuration Error</AlertTitle>
              <AlertDescription>
                Firebase is not properly configured. Please check your .env file and ensure all required environment variables are set correctly.
              </AlertDescription>
            </Alert>
          )}

          {showDiagnostic && (
            <div className="mb-6">
              <FirebaseConnectionTest />
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDiagnostic(false)}
                >
                  Hide Diagnostic
                </Button>
              </div>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Required Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Make sure your .env file contains the following variables:
                </p>
                <ul className="text-sm space-y-1 pl-4">
                  <li>• VITE_FIREBASE_API_KEY</li>
                  <li>• VITE_FIREBASE_AUTH_DOMAIN</li>
                  <li>• VITE_FIREBASE_PROJECT_ID</li>
                  <li>• VITE_FIREBASE_STORAGE_BUCKET</li>
                  <li>• VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                  <li>• VITE_FIREBASE_APP_ID</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  After updating your .env file, restart the development server.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Coins className="h-16 w-16 text-primary/50 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading your data...</h2>
          <p className="text-muted-foreground">Fetching your investments from the cloud</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-2">
            Gold Investment Tracker
          </h1>
          <p className="text-muted-foreground">
            Track your gold purchases, monitor performance, and manage your investment portfolio
          </p>
        </div>

        {/* Add diagnostic button in the header area */}
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDiagnostic(true)}
            className="text-xs"
          >
            🔧 Run Firebase Diagnostic
          </Button>
        </div>

        {/* Show diagnostic modal */}
        {showDiagnostic && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <EnvDiagnostic />
                <FirebaseConnectionTest />
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDiagnostic(false)}
                  >
                    Close Diagnostic
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DataMigrationDialog
          isOpen={showMigration}
          onClose={() => setShowMigration(false)}
          migrateData={handleMigrateData}
        />

        <div className="space-y-8">
          <Dashboard 
            transactions={transactions}
            currentGoldRate={currentGoldRate}
            onUpdateCurrentRate={handleUpdateCurrentRate}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Add New Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionForm 
                  onAddTransaction={handleAddTransaction}
                  currentGoldRate={currentGoldRate}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionHistory 
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onEditTransaction={handleEditTransaction}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
