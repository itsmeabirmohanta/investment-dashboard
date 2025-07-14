import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Dashboard from '@/components/Dashboard';
import TransactionForm from '@/components/TransactionForm';
import TransactionHistory from '@/components/TransactionHistory';
import FirebaseSetupGuide from '@/components/FirebaseSetupGuide';
import { Header } from '@/components/Header';
import { DataMigrationDialog } from '@/components/DataMigrationDialog';
import { Coins, PlusCircle, History } from 'lucide-react';
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
        console.warn("Firebase configuration is not valid. Skipping data loading.");
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
        } catch (error: any) {
          console.error("Error fetching transactions:", error);
          // Show more specific error message based on the error
          toast({
            title: "Failed to Load Transactions",
            description: error?.message || "Could not retrieve your transaction history.",
            variant: "destructive",
          });
          
          // If there's an authentication error specifically, we should stop
          if (error.message?.includes("authentication") || error.message?.includes("log in")) {
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
        } catch (goldRateError: any) {
          console.error("Error fetching gold rate:", goldRateError);
          toast({
            title: "Failed to Load Gold Rate",
            description: goldRateError?.message || "Could not retrieve the current gold rate.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast({
          title: "Failed to Load Data",
          description: error?.message || "An error occurred while fetching data from the server.",
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
  }, [currentUser]);

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

  // Show Firebase setup guide if configuration is not valid
  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-4">
              Investment Tracker Dashboard
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Complete the Firebase setup to enable persistent data storage
            </p>
          </div>
          <FirebaseSetupGuide />
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Section - Full Width */}
        <section>
          <Dashboard 
            transactions={transactions} 
            currentGoldRate={currentGoldRate}
            onUpdateCurrentRate={handleUpdateCurrentRate}
          />
        </section>

        {/* Forms and History Section - Two Column Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  Add New Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TransactionForm 
                  onAddTransaction={handleAddTransaction}
                  currentGoldRate={currentGoldRate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - History */}
          <div>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 h-fit">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TransactionHistory 
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onEditTransaction={handleEditTransaction}
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Data Migration Dialog */}
      <DataMigrationDialog
        isOpen={showMigration}
        onClose={() => setShowMigration(false)}
        migrateData={handleMigrateData}
      />
    </div>
  );
};

export default Index;
