
import React, { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import TransactionForm from '@/components/TransactionForm';
import TransactionHistory from '@/components/TransactionHistory';
import GoldRateManager from '@/components/GoldRateManager';
import { Coins } from 'lucide-react';

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

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('goldTransactions');
    const savedGoldRate = localStorage.getItem('currentGoldRate');
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    
    if (savedGoldRate) {
      setCurrentGoldRate(parseFloat(savedGoldRate));
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('goldTransactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('currentGoldRate', currentGoldRate.toString());
  }, [currentGoldRate]);

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [...prev, transaction]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTransaction = (id: string, updatedTransaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...updatedTransaction, id } : t
    ));
  };

  const handleUpdateCurrentRate = (rate: number) => {
    setCurrentGoldRate(rate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-chart-2 rounded-lg shadow-sm">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  Gold Investment Tracker
                </h1>
                <p className="text-sm text-muted-foreground">Track your gold purchases and portfolio performance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Dashboard - Full width on smaller screens, 2/3 on xl */}
          <div className="xl:col-span-3">
            <Dashboard 
              transactions={transactions} 
              currentGoldRate={currentGoldRate}
            />
          </div>

          {/* Transaction Form and Gold Rate Manager */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Add New Transaction</h3>
              <TransactionForm 
                onAddTransaction={handleAddTransaction}
                currentGoldRate={currentGoldRate}
              />
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Manage Gold Rates</h3>
              <GoldRateManager 
                currentGoldRate={currentGoldRate}
                onUpdateCurrentRate={handleUpdateCurrentRate}
              />
            </div>
          </div>

          {/* Transaction History - Sidebar on xl, full width on smaller */}
          <div className="xl:col-span-1">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-6 h-fit">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Transaction History</h3>
              <TransactionHistory 
                transactions={transactions}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleEditTransaction}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
