
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Dashboard from '@/components/Dashboard';
import TransactionForm from '@/components/TransactionForm';
import TransactionHistory from '@/components/TransactionHistory';
import FirebaseSetupGuide from '@/components/FirebaseSetupGuide';
import { Coins, PlusCircle, History } from 'lucide-react';
import { fetchTransactions, addTransaction, deleteTransaction, updateTransaction, fetchCurrentGoldRate, updateCurrentGoldRate } from '@/lib/firebaseService';
import { isConfigValid } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

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

  // Load data from Firebase on component mount (only if config is valid)
  useEffect(() => {
    const loadData = async () => {
      if (!isConfigValid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch transactions
        const fetchedTransactions = await fetchTransactions();
        setTransactions(fetchedTransactions);
        
        // Fetch current gold rate
        const rate = await fetchCurrentGoldRate();
        if (rate !== null) {
          setCurrentGoldRate(rate);
        } else {
          // If no rate is stored yet, initialize it in Firebase
          await updateCurrentGoldRate(currentGoldRate);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Failed to load data",
          description: "There was an error loading your data from the database.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-primary to-chart-2 rounded-lg shadow-md">
                <Coins className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  Investment Tracker Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Track your investments and portfolio performance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
    </div>
  );
};

export default Index;
