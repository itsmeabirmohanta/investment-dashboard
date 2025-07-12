
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Coins, Wallet, PiggyBank, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

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
      
      acc.push({
        date,
        invested: cumulativeInvestment,
        currentValue,
        goldHeld: cumulativeGold,
        profitLoss: currentValue - cumulativeInvestment,
      });
      return acc;
    }, [] as any[]);

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
          Investment Dashboard
        </h2>
        <p className="text-muted-foreground">Track your gold investment portfolio performance</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <Card className={`bg-gradient-to-br ${netProfitLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} md:col-span-2`}>
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
            <div className={`text-3xl font-bold ${netProfitLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(netProfitLoss))} {netProfitLoss >= 0 ? 'Profit' : 'Loss'}
            </div>
            <p className={`text-xs mt-1 ${netProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}% return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
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
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="currentValue" 
                    stackId="2" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gold Rate Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gold Rate Trend</CardTitle>
              <p className="text-sm text-muted-foreground">Historical gold rates and purchase amounts</p>
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
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'rate' ? formatCurrency(Number(value)) : `${Number(value).toFixed(2)} gm`,
                      name === 'rate' ? 'Gold Rate' : 'Gold Purchased'
                    ]}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
