
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Coins, Wallet, PiggyBank, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  amountSent: number;
  goldRate: number;
  taxAmount: number;
  goldPurchased: number;
  notes?: string;
}

interface DashboardProps {
  transactions: Transaction[];
  currentGoldRate: number;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, currentGoldRate }) => {
  const totalInvested = transactions.reduce((sum, t) => sum + t.amountSent, 0);
  const totalGoldHeld = transactions.reduce((sum, t) => sum + t.goldPurchased, 0);
  const totalLeftover = transactions.reduce((sum, t) => {
    const usableAmount = t.amountSent - t.taxAmount;
    const goldCost = t.goldPurchased * t.goldRate;
    return sum + (usableAmount - goldCost);
  }, 0);
  
  const portfolioValue = totalGoldHeld * currentGoldRate;
  const netProfitLoss = (portfolioValue + totalLeftover) - totalInvested;
  const profitLossPercentage = totalInvested > 0 ? (netProfitLoss / totalInvested) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatGold = (grams: number) => {
    return `${grams.toFixed(2)} gm`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">Total Invested</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalInvested)}</div>
          <p className="text-xs text-blue-600 mt-1">
            {transactions.length} transactions
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-800">Gold Held</CardTitle>
          <Coins className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-900">{formatGold(totalGoldHeld)}</div>
          <p className="text-xs text-amber-600 mt-1">
            @ {formatCurrency(currentGoldRate)}/gm
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Portfolio Value</CardTitle>
          <PiggyBank className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{formatCurrency(portfolioValue)}</div>
          <p className="text-xs text-green-600 mt-1">
            Current market value
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-800">Leftover Balance</CardTitle>
          <Wallet className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalLeftover)}</div>
          <p className="text-xs text-purple-600 mt-1">
            Unused funds
          </p>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-r ${netProfitLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} md:col-span-2`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${netProfitLoss >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
            Net Profit/Loss
          </CardTitle>
          {netProfitLoss >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${netProfitLoss >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
            {formatCurrency(Math.abs(netProfitLoss))} {netProfitLoss >= 0 ? 'Profit' : 'Loss'}
          </div>
          <p className={`text-xs mt-1 ${netProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}% return
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
