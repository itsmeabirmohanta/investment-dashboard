
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { History, Edit2, Trash2, Calendar, TrendingUp, TrendingDown, ChevronRight, Coins } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Transaction {
  id: string;
  date: string;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (id: string, updatedTransaction: Omit<Transaction, 'id'>) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
}) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    amountSent: '',
    goldRate: '',
    taxAmount: '',
    goldPurchased: '',
    notes: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTransactionDetails = (transaction: Transaction) => {
    const usableAmount = transaction.amountSent - transaction.taxAmount;
    const goldCost = transaction.goldPurchased * transaction.goldRate;
    const leftover = usableAmount - goldCost;
    return { usableAmount, goldCost, leftover };
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      amountSent: transaction.amountSent.toString(),
      goldRate: transaction.goldRate.toString(),
      taxAmount: transaction.taxAmount.toString(),
      goldPurchased: transaction.goldPurchased.toString(),
      notes: transaction.notes || '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const updatedTransaction = {
      date: editingTransaction.date,
      amountSent: parseFloat(editFormData.amountSent),
      goldRate: parseFloat(editFormData.goldRate),
      taxAmount: parseFloat(editFormData.taxAmount),
      goldPurchased: parseFloat(editFormData.goldPurchased),
      notes: editFormData.notes,
    };

    onEditTransaction(editingTransaction.id, updatedTransaction);
    setEditingTransaction(null);
    toast({
      title: "Transaction Updated",
      description: "Transaction has been successfully updated.",
    });
  };

  const handleDelete = (id: string) => {
    onDeleteTransaction(id);
    toast({
      title: "Transaction Deleted",
      description: "Transaction has been removed from your records.",
    });
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group transactions by month/year for better organization
  const groupedTransactions = sortedTransactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
    const date = new Date(transaction.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(transaction);
    return groups;
  }, {});

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-b">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      
      {sortedTransactions.length === 0 ? (
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-16 w-16 mb-4 text-amber-300 opacity-70" />
          <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Add your first gold purchase to start tracking your investment journey.
          </p>
        </CardContent>
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grouped">Monthly View</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="list" className="m-0">
            <ScrollArea className="h-[450px] p-1">
              <div className="space-y-3 p-3">
                {sortedTransactions.map((transaction) => {
                  const { usableAmount, goldCost, leftover } = calculateTransactionDetails(transaction);
                  const transactionDate = new Date(transaction.date);
                  
                  return (
                    <Card 
                      key={transaction.id} 
                      className={`transition-all hover:shadow-md ${leftover >= 0 ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-red-400'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
                              <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {transaction.goldPurchased} gm
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                  @ {formatCurrency(transaction.goldRate)}/gm
                                </span>
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.date)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 ml-auto">
                            <Badge 
                              variant={leftover >= 0 ? "outline" : "destructive"}
                              className="rounded-md"
                            >
                              {leftover >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                              {formatCurrency(Math.abs(leftover))} {leftover >= 0 ? 'leftover' : 'over'}
                            </Badge>
                            
                            <div className="flex gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditClick(transaction)}
                                    className="h-8 w-8 rounded-full"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Transaction</DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="edit-amountSent">Amount Sent (₹)</Label>
                                        <Input
                                          id="edit-amountSent"
                                          type="number"
                                          value={editFormData.amountSent}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, amountSent: e.target.value }))}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-goldRate">Gold Rate (₹/gm)</Label>
                                        <Input
                                          id="edit-goldRate"
                                          type="number"
                                          value={editFormData.goldRate}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, goldRate: e.target.value }))}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-taxAmount">Tax Amount (₹)</Label>
                                        <Input
                                          id="edit-taxAmount"
                                          type="number"
                                          value={editFormData.taxAmount}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, taxAmount: e.target.value }))}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-goldPurchased">Gold Purchased (gm)</Label>
                                        <Input
                                          id="edit-goldPurchased"
                                          type="number"
                                          step="0.1"
                                          value={editFormData.goldPurchased}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, goldPurchased: e.target.value }))}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-notes">Notes</Label>
                                      <Input
                                        id="edit-notes"
                                        value={editFormData.notes}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                      />
                                    </div>
                                    <Button type="submit" className="w-full">Update Transaction</Button>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(transaction.id)}
                                className="h-8 w-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="bg-gray-50 dark:bg-gray-800/30 p-2 rounded-md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Amount Sent</p>
                            <p className="font-medium">{formatCurrency(transaction.amountSent)}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/30 p-2 rounded-md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Tax</p>
                            <p className="font-medium">{formatCurrency(transaction.taxAmount)}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/30 p-2 rounded-md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Usable Amount</p>
                            <p className="font-medium">{formatCurrency(usableAmount)}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/30 p-2 rounded-md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Gold Cost</p>
                            <p className="font-medium">{formatCurrency(goldCost)}</p>
                          </div>
                        </div>
                        
                        {transaction.notes && (
                          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-md border-l-2 border-amber-200 dark:border-amber-700">
                            <p className="text-sm text-amber-800 dark:text-amber-200">{transaction.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="grouped" className="m-0">
            <ScrollArea className="h-[450px]">
              {Object.entries(groupedTransactions).map(([monthYear, monthTransactions]) => (
                <div key={monthYear} className="mb-5">
                  <div className="sticky top-0 z-10 bg-background flex items-center px-4 py-2">
                    <h3 className="text-sm font-medium">{monthYear}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {monthTransactions.length} transaction{monthTransactions.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 px-3">
                    {monthTransactions.map((transaction) => {
                      const { leftover } = calculateTransactionDetails(transaction);
                      
                      return (
                        <div 
                          key={transaction.id}
                          className="flex items-center p-2 rounded-md hover:bg-muted"
                        >
                          <div className="mr-3">
                            <div className={`p-2 rounded-full ${leftover >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              <Coins className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-sm">{formatDate(transaction.date)}</p>
                              <p className="text-sm font-medium">{transaction.goldPurchased} gm</p>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <p>{formatCurrency(transaction.amountSent)}</p>
                              <p>{formatCurrency(transaction.goldRate)}/gm</p>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(transaction)}
                                  className="h-7 w-7 rounded-full"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Transaction</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="edit-amountSent">Amount Sent (₹)</Label>
                                      <Input
                                        id="edit-amountSent"
                                        type="number"
                                        value={editFormData.amountSent}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, amountSent: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-goldRate">Gold Rate (₹/gm)</Label>
                                      <Input
                                        id="edit-goldRate"
                                        type="number"
                                        value={editFormData.goldRate}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, goldRate: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-taxAmount">Tax Amount (₹)</Label>
                                      <Input
                                        id="edit-taxAmount"
                                        type="number"
                                        value={editFormData.taxAmount}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, taxAmount: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-goldPurchased">Gold Purchased (gm)</Label>
                                      <Input
                                        id="edit-goldPurchased"
                                        type="number"
                                        step="0.1"
                                        value={editFormData.goldPurchased}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, goldPurchased: e.target.value }))}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-notes">Notes</Label>
                                    <Input
                                      id="edit-notes"
                                      value={editFormData.notes}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                  </div>
                                  <Button type="submit" className="w-full">Update Transaction</Button>
                                </form>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(transaction.id)}
                              className="h-7 w-7 rounded-full text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
      
      <CardFooter className="bg-gray-50 dark:bg-gray-800/20 border-t py-3 px-4 text-xs text-muted-foreground">
        {sortedTransactions.length > 0 && (
          <div className="w-full flex justify-between items-center">
            <p>Total transactions: {sortedTransactions.length}</p>
            <p>
              Total gold purchased: {
                sortedTransactions.reduce((sum, t) => sum + t.goldPurchased, 0).toFixed(2)
              } gm
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TransactionHistory;
