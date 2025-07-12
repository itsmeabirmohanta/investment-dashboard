
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { History, Edit2, Trash2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet. Add your first gold purchase to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTransactions.map((transaction) => {
              const { usableAmount, goldCost, leftover } = calculateTransactionDetails(transaction);
              
              return (
                <Card key={transaction.id} className="border-l-4 border-l-amber-400">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {formatDate(transaction.date)}
                          </Badge>
                          <Badge 
                            variant={leftover >= 0 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {leftover >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {formatCurrency(Math.abs(leftover))} {leftover >= 0 ? 'leftover' : 'over'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Amount Sent</p>
                            <p className="font-semibold">{formatCurrency(transaction.amountSent)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Gold Rate</p>
                            <p className="font-semibold">{formatCurrency(transaction.goldRate)}/gm</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tax</p>
                            <p className="font-semibold">{formatCurrency(transaction.taxAmount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Gold Bought</p>
                            <p className="font-semibold">{transaction.goldPurchased} gm</p>
                          </div>
                        </div>

                        {transaction.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <p className="text-gray-600">{transaction.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(transaction)}
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
