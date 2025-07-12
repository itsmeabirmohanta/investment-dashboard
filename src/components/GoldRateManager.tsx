
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GoldRateManagerProps {
  currentGoldRate: number;
  onUpdateCurrentRate: (rate: number) => void;
}

const GoldRateManager: React.FC<GoldRateManagerProps> = ({
  currentGoldRate,
  onUpdateCurrentRate,
}) => {
  const [newRate, setNewRate] = useState(currentGoldRate.toString());

  const handleUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(newRate);
    
    if (!rate || rate <= 0) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid gold rate.",
        variant: "destructive",
      });
      return;
    }

    onUpdateCurrentRate(rate);
    toast({
      title: "Gold Rate Updated",
      description: `Current gold rate set to ₹${rate.toLocaleString('en-IN')}/gm`,
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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gold Rate Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Current Gold Rate</span>
          </div>
          <div className="text-3xl font-bold text-amber-900">
            {formatCurrency(currentGoldRate)}/gm
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Last updated: {new Date().toLocaleDateString('en-IN')}
          </p>
        </div>

        <Separator />

        <form onSubmit={handleUpdateRate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goldRate">Update Current Gold Rate</Label>
            <Input
              id="goldRate"
              type="number"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="7500"
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              Enter the current market rate for gold per gram in INR
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Update Gold Rate
          </Button>
        </form>

        <div className="text-xs text-gray-500 text-center">
          <p>💡 Tip: Update this rate regularly to get accurate portfolio valuations</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoldRateManager;
