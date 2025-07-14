import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Coins, Wallet, PiggyBank, DollarSign, CandlestickChart, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface DashboardProps {
  transactions: Transaction[];
  currentGoldRate: number;
  onUpdateCurrentRate: (rate: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, currentGoldRate, onUpdateCurrentRate }) => {
  const [openRateDialog, setOpenRateDialog] = useState(false);
  const [newRate, setNewRate] = useState(currentGoldRate.toString());

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
    setOpenRateDialog(false);
  };

  // Prepare chart data
  const chartData = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, transaction, index) => {
      const date = new Date(transaction.date).toLocaleDateString('en-IN', { 
        month: 'short', 
        year: '2-digit' 
      });
      const cumulativeInvestment = transactions
        .slice(0, index + 1)
        .reduce((sum, t) => sum + t.amountSent, 0);
      const cumulativeGold = transactions
        .slice(0, index + 1)
        .reduce((sum, t) => sum + t.goldPurchased, 0);
      const currentValue = cumulativeGold * currentGoldRate;
      const roi = cumulativeInvestment > 0 ? ((currentValue - cumulativeInvestment) / cumulativeInvestment) * 100 : 0;
      
      acc.push({
        date,
        invested: cumulativeInvestment,
        currentValue,
        goldHeld: cumulativeGold,
        profitLoss: currentValue - cumulativeInvestment,
        roi: roi
      });
      return acc;
    }, [] as Array<{
      date: string;
      invested: number;
      currentValue: number;
      goldHeld: number;
      profitLoss: number;
      roi: number;
    }>);

  const goldRateData = transactions.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    rate: t.goldRate,
    purchased: t.goldPurchased,
  }));

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Investment Tracker Dashboard
        </h2>
        <p className="text-muted-foreground">Track your investment portfolio performance and metrics</p>
      </div>

      {/* Metrics Cards - 2x3 grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Total Invested */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.length} transactions
            </p>
          </CardContent>
        </Card>

        {/* Gold Held */}
        <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-chart-2">Gold Held</CardTitle>
            <Coins className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{formatGold(totalGoldHeld)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              @ {formatCurrency(currentGoldRate)}/gm
            </p>
          </CardContent>
        </Card>

        {/* Current Gold Rate */}
        <Card 
          className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 cursor-pointer transition-all hover:shadow-md"
          onClick={() => setOpenRateDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Current Gold Rate</CardTitle>
            <CandlestickChart className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{formatCurrency(currentGoldRate)}/gm</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click to update rate
            </p>
          </CardContent>
        </Card>

        {/* Portfolio Value */}
        <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-chart-3">Portfolio Value</CardTitle>
            <PiggyBank className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{formatCurrency(portfolioValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current market value
            </p>
          </CardContent>
        </Card>

        {/* Leftover Balance */}
        <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-chart-4">Leftover Balance</CardTitle>
            <Wallet className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{formatCurrency(totalLeftover)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unused funds
            </p>
          </CardContent>
        </Card>

        {/* Net Profit/Loss - Placed in the red-marked space (replacing ROI Trajectory) */}
        <Card className={`bg-gradient-to-br ${netProfitLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} h-full`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${netProfitLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Net Profit/Loss
            </CardTitle>
            {netProfitLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfitLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(netProfitLoss))} {netProfitLoss >= 0 ? 'Profit' : 'Loss'}
            </div>
            <p className={`text-xs mt-1 ${netProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}% return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Larger Charts Section */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Growth</CardTitle>
              <p className="text-sm text-muted-foreground">Track your investment vs current value over time</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(Number(value)), name === 'invested' ? 'Invested' : 'Current Value']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Area 
                    type="monotone"
                    dataKey="invested"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/20)"
                    name="Invested"
                  />
                  <Area 
                    type="monotone"
                    dataKey="currentValue"
                    stackId="2" 
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2)/20)"
                    name="Current Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gold Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gold Rate History</CardTitle>
              <p className="text-sm text-muted-foreground">Historical gold rates at purchase times</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goldRateData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'rate') return [formatCurrency(Number(value)), 'Rate'];
                      return [value + ' gm', 'Amount'];
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <ReferenceLine 
                    y={currentGoldRate} 
                    label={{ 
                      value: 'Current', 
                      position: 'insideTopRight',
                      fill: 'hsl(var(--amber-600))'
                    }}
                    stroke="hsl(var(--amber-500))" 
                    strokeDasharray="3 3" 
                  />
                  <Bar 
                    dataKey="rate" 
                    fill="hsl(var(--amber-500))" 
                    name="Gold Rate" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rate Update Dialog */}
      <Dialog open={openRateDialog} onOpenChange={setOpenRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Gold Rate</DialogTitle>
            <DialogDescription>
              Enter the current market rate of gold per gram.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="gold-rate">Gold Rate (₹/gm)</Label>
                <Input
                  id="gold-rate"
                  type="number"
                  min="1"
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="Enter current gold rate"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenRateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Rate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;
