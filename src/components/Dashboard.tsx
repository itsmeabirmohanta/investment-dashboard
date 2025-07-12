
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
          Portfolio Overview
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
                    fill="hsl(var(--primary) / 0.1)" 
                    name="Invested"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="currentValue" 
                    stackId="2" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2) / 0.1)" 
                    name="Current Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gold Purchase Timeline */}
          {transactions.length >= 2 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gold Purchase Timeline</CardTitle>
                <p className="text-sm text-muted-foreground">Gold amount purchased at each transaction</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transactions.map(t => ({
                    date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit', day: 'numeric' }),
                    goldPurchased: t.goldPurchased,
                    goldRate: t.goldRate
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      yAxisId="left"
                      orientation="left"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${value.toFixed(2)} gm`}
                    />
                    <YAxis 
                      className="text-xs"
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: 'hsl(var(--amber-600))' }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        if (name === 'goldPurchased') return [`${Number(value).toFixed(2)} gm`, 'Gold Purchased'];
                        if (name === 'goldRate') return [formatCurrency(Number(value)), 'Gold Rate'];
                        return [value, name];
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Bar 
                      dataKey="goldPurchased" 
                      yAxisId="left"
                      fill="hsl(var(--chart-2) / 0.8)" 
                      name="Gold Purchased"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="goldRate" 
                      yAxisId="right"
                      stroke="hsl(var(--amber-600))" 
                      strokeWidth={2}
                      name="Gold Rate"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : transactions.length === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">Add more transactions to see additional insights</p>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-xl font-medium">More Data Needed</h3>
                  <p className="text-muted-foreground max-w-md">
                    Add at least one more transaction to view purchase timeline analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Transactions Message */}
      {transactions.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-8">
            <div className="text-center space-y-3">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-medium">No Transactions Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add your first transaction to start tracking your gold investments and see performance charts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gold Rate Update Dialog */}
      <Dialog open={openRateDialog} onOpenChange={setOpenRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Gold Rate</DialogTitle>
            <DialogDescription>
              Set the current market price for gold per gram.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goldRate">Current Gold Rate (₹/gm)</Label>
                <Input
                  id="goldRate"
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="Enter rate"
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
};

export default Dashboard;
