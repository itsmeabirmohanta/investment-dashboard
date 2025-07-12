
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Coins className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gold Investment Tracker</h1>
                <p className="text-sm text-gray-500">Track your gold purchases and portfolio performance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Section */}
        <Dashboard 
          transactions={transactions} 
          currentGoldRate={currentGoldRate}
        />

        {/* Add Transaction Section */}
        <TransactionForm 
          onAddTransaction={handleAddTransaction}
          currentGoldRate={currentGoldRate}
        />

        {/* Transaction History Section */}
        <TransactionHistory 
          transactions={transactions}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransaction={handleEditTransaction}
        />

        {/* Gold Rate Manager Section */}
        <GoldRateManager 
          currentGoldRate={currentGoldRate}
          onUpdateCurrentRate={handleUpdateCurrentRate}
        />
      </main>
    </div>
  );
};

export default Index;
