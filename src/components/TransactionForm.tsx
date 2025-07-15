import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calculator } from 'lucide-react';
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

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  currentGoldRate: number;
}

const standardGoldWeights = [0.5, 1, 2, 4, 5, 8, 10, 20, 50, 100];

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, currentGoldRate }) => {
  const [formData, setFormData] = useState({
    amountSent: '',
    goldRate: currentGoldRate.toString(),
    taxAmount: '',
    goldPurchased: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
  });

  const [goldInputType, setGoldInputType] = useState<'preset' | 'custom'>('preset');

  const [calculations, setCalculations] = useState({
    usableAmount: 0,
    goldCost: 0,
    leftover: 0,
  });

  const updateCalculations = (data: typeof formData) => {
    const amountSent = parseFloat(data.amountSent) || 0;
    const taxAmount = parseFloat(data.taxAmount) || 0;
    const goldRate = parseFloat(data.goldRate) || 0;
    const goldPurchased = parseFloat(data.goldPurchased) || 0;

    const usableAmount = amountSent - taxAmount;
    const goldCost = goldPurchased * goldRate;
    const leftover = usableAmount - goldCost;

    setCalculations({
      usableAmount,
      goldCost,
      leftover,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateCalculations(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountSent = parseFloat(formData.amountSent);
    const goldRate = parseFloat(formData.goldRate);
    const taxAmount = parseFloat(formData.taxAmount);
    const goldPurchased = parseFloat(formData.goldPurchased);

    if (!amountSent || !goldRate || !taxAmount || !goldPurchased) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const transaction = {
      date: formData.date,
      amountSent,
      goldRate,
      taxAmount,
      goldPurchased,
      notes: formData.notes,
    };

    onAddTransaction(transaction);
    
    // Reset form
    setFormData({
      amountSent: '',
      goldRate: currentGoldRate.toString(),
      taxAmount: '',
      goldPurchased: '',
      date: new Date().toISOString().split('T')[0], // Reset to today
      notes: '',
    });
    setCalculations({ usableAmount: 0, goldCost: 0, leftover: 0 });
    setGoldInputType('preset');

    toast({
      title: "Transaction Added",
      description: `Successfully recorded purchase of ${goldPurchased}gm gold`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountSent">Amount Sent (₹)</Label>
              <Input
                id="amountSent"
                type="number"
                value={formData.amountSent}
                onChange={(e) => handleInputChange('amountSent', e.target.value)}
                placeholder="10000"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Transaction Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goldRate">Gold Rate (₹/gm)</Label>
              <Input
                id="goldRate"
                type="number"
                value={formData.goldRate}
                onChange={(e) => handleInputChange('goldRate', e.target.value)}
                placeholder="7500"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAmount">Tax Amount (₹)</Label>
              <Input
                id="taxAmount"
                type="number"
                value={formData.taxAmount}
                onChange={(e) => handleInputChange('taxAmount', e.target.value)}
                placeholder="300"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goldPurchased">Gold Purchased</Label>
              <Tabs value={goldInputType} onValueChange={(value) => setGoldInputType(value as 'preset' | 'custom')} className="w-full">
                <TabsList className="grid grid-cols-2 mb-2">
                  <TabsTrigger value="preset">Preset Values</TabsTrigger>
                  <TabsTrigger value="custom">Custom Value</TabsTrigger>
                </TabsList>
                <TabsContent value="preset" className="mt-0">
                  <Select
                    value={formData.goldPurchased}
                    onValueChange={(value) => handleInputChange('goldPurchased', value)}
                  >
                    <SelectTrigger className="text-lg">
                      <SelectValue placeholder="Select weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {standardGoldWeights.map((weight) => (
                        <SelectItem key={weight} value={weight.toString()}>
                          {weight} gm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="custom" className="mt-0">
                  <div className="flex items-center">
                    <Input
                      id="customGoldAmount"
                      type="number"
                      step="0.01"
                      value={formData.goldPurchased}
                      onChange={(e) => handleInputChange('goldPurchased', e.target.value)}
                      placeholder="Custom weight"
                      className="text-lg"
                    />
                    <span className="ml-2">gm</span>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {formData.amountSent && formData.taxAmount && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Calculations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Usable Amount:</span>
                  <span className="font-medium">{formatCurrency(calculations.usableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gold Cost:</span>
                  <span className="font-medium">{formatCurrency(calculations.goldCost)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Leftover:</span>
                  <span className={`font-bold ${calculations.leftover >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(calculations.leftover)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes about this transaction..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
