import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  DollarSign, 
  PiggyBank, 
  CandlestickChart, 
  Building2, 
  Calendar,
  BarChart3,
  ArrowRight,
  Shield,
  Plus,
  Target,
  Activity,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchGoldTransactions, 
  fetchSilverTransactions, 
  fetchFDTransactions, 
  fetchRDTransactions, 
  fetchStockTransactions, 
  fetchMutualFundTransactions,
  fetchCurrentGoldRate,
  fetchCurrentSilverRate,
  GoldTransaction,
  SilverTransaction,
  FDTransaction,
  RDTransaction,
  StockTransaction,
  MutualFundTransaction
} from '@/lib/investmentService';
import { toast } from '@/hooks/use-toast';
import { 
  calculateGoldInvestment,
  calculateSilverInvestment,
  calculateFDInvestment,
  calculateRDInvestment,
  calculateStockInvestment,
  calculateMutualFundInvestment,
  formatCurrency as formatCurrencyUtil,
  formatPercentage as formatPercentageUtil
} from '@/lib/investmentCalculations';

interface InvestmentSummary {
  type: string;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  icon: React.ReactNode;
  color: string;
  route: string;
  description: string;
  itemsCount: number;
  additionalInfo?: {
    // Gold/Silver specific
    goldHeld?: number;
    silverHeld?: number;
    leftover?: number;
    currentRate?: number;
    
    // FD/RD specific
    activeDeposits?: number;
    maturedDeposits?: number;
    avgInterestRate?: number;
    totalMonthlyCommitment?: number;
    
    // Stocks/MF specific
    uniqueStocks?: number;
    uniqueFunds?: number;
    buyTransactions?: number;
    sellTransactions?: number;
  };
}

interface ChartDataPoint {
  date: string;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
}

const GlobalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investments, setInvestments] = useState<InvestmentSummary[]>([]);
  const [showValues, setShowValues] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Investment type configurations
  const allInvestmentTypes = useMemo(() => [
    {
      type: 'Gold',
      icon: <Coins className="h-4 w-4" />,
      color: 'bg-gradient-to-r from-amber-500 to-amber-600',
      route: '/gold',
      description: 'Precious metals investment'
    },
    {
      type: 'Silver',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-gradient-to-r from-gray-400 to-gray-500',
      route: '/silver',
      description: 'Silver investments'
    },
    {
      type: 'Fixed Deposits',
      icon: <Building2 className="h-4 w-4" />,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      route: '/fd',
      description: 'Bank fixed deposits'
    },
    {
      type: 'Recurring Deposits',
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      route: '/rd',
      description: 'Monthly recurring deposits'
    },
    {
      type: 'Stocks',
      icon: <CandlestickChart className="h-4 w-4" />,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      route: '/stocks',
      description: 'Equity investments'
    },
    {
      type: 'Mutual Funds',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      route: '/mutual-funds',
      description: 'Mutual fund investments'
    }
  ], []);

  // Load all investment data from Firebase
  const loadInvestmentData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        goldTransactions,
        silverTransactions,
        fdTransactions,
        rdTransactions,
        stockTransactions,
        mutualFundTransactions,
        goldRate,
        silverRate
      ] = await Promise.all([
        fetchGoldTransactions(),
        fetchSilverTransactions(),
        fetchFDTransactions(),
        fetchRDTransactions(),
        fetchStockTransactions(),
        fetchMutualFundTransactions(),
        fetchCurrentGoldRate(),
        fetchCurrentSilverRate()
      ]);

      // Use safe defaults for rates
      const currentGoldRate = goldRate && goldRate > 0 ? goldRate : 7500;
      const currentSilverRate = silverRate && silverRate > 0 ? silverRate : 85;

      // Calculate investment summaries using the proper calculation library
      const investmentSummaries: InvestmentSummary[] = [];

      // Gold investments
      if (goldTransactions && goldTransactions.length > 0) {
        const goldResult = calculateGoldInvestment(goldTransactions, currentGoldRate);
        
        investmentSummaries.push({
          type: 'Gold',
          totalInvested: goldResult.invested,
          currentValue: goldResult.currentValue,
          profitLoss: goldResult.profitLoss,
          profitLossPercentage: goldResult.roi,
          icon: <Coins className="h-4 w-4" />,
          color: 'bg-gradient-to-r from-amber-500 to-amber-600',
          route: '/gold',
          description: 'Precious metals investment',
          itemsCount: goldTransactions.length,
          additionalInfo: {
            goldHeld: goldResult.additionalInfo?.goldHeld || 0,
            leftover: goldResult.additionalInfo?.leftover || 0,
            currentRate: currentGoldRate
          }
        });
      }

      // Silver investments
      if (silverTransactions && silverTransactions.length > 0) {
        const silverResult = calculateSilverInvestment(silverTransactions, currentSilverRate);
        
        investmentSummaries.push({
          type: 'Silver',
          totalInvested: silverResult.invested,
          currentValue: silverResult.currentValue,
          profitLoss: silverResult.profitLoss,
          profitLossPercentage: silverResult.roi,
          icon: <Shield className="h-4 w-4" />,
          color: 'bg-gradient-to-r from-gray-400 to-gray-500',
          route: '/silver',
          description: 'Silver investments',
          itemsCount: silverTransactions.length,
          additionalInfo: {
            silverHeld: silverResult.additionalInfo?.silverHeld || 0,
            leftover: silverResult.additionalInfo?.leftover || 0,
            currentRate: currentSilverRate
          }
        });
      }

      // Fixed Deposits
      if (fdTransactions && fdTransactions.length > 0) {
        const fdResult = calculateFDInvestment(fdTransactions);
        
        investmentSummaries.push({
          type: 'Fixed Deposits',
          totalInvested: fdResult.invested,
          currentValue: fdResult.currentValue,
          profitLoss: fdResult.profitLoss,
          profitLossPercentage: fdResult.roi,
          icon: <Building2 className="h-4 w-4" />,
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
          route: '/fd',
          description: 'Bank fixed deposits',
          itemsCount: fdTransactions.length,
          additionalInfo: {
            activeDeposits: fdResult.additionalInfo?.activeDeposits || 0,
            maturedDeposits: fdResult.additionalInfo?.maturedDeposits || 0,
            avgInterestRate: fdTransactions.length > 0 ? 
              fdTransactions.reduce((sum, t) => sum + t.interestRate, 0) / fdTransactions.length : 0
          }
        });
      }

      // Recurring Deposits - Fixed calculation using proper RD logic
      if (rdTransactions && rdTransactions.length > 0) {
        const rdResult = calculateRDInvestment(rdTransactions);
        
        investmentSummaries.push({
          type: 'Recurring Deposits',
          totalInvested: rdResult.invested,
          currentValue: rdResult.currentValue,
          profitLoss: rdResult.profitLoss,
          profitLossPercentage: rdResult.roi,
          icon: <Calendar className="h-4 w-4" />,
          color: 'bg-gradient-to-r from-green-500 to-green-600',
          route: '/rd',
          description: 'Monthly recurring deposits',
          itemsCount: rdTransactions.length,
          additionalInfo: {
            activeDeposits: rdTransactions.filter(t => new Date(t.maturityDate) > new Date()).length,
            maturedDeposits: rdTransactions.filter(t => new Date(t.maturityDate) <= new Date()).length,
            totalMonthlyCommitment: rdTransactions.filter(t => new Date(t.maturityDate) > new Date())
              .reduce((sum, t) => sum + t.monthlyAmount, 0),
            avgInterestRate: rdTransactions.length > 0 ? 
              rdTransactions.reduce((sum, t) => sum + t.interestRate, 0) / rdTransactions.length : 0
          }
        });
      }

      // Stocks
      if (stockTransactions && stockTransactions.length > 0) {
        const stockResult = calculateStockInvestment(stockTransactions);
        
        investmentSummaries.push({
          type: 'Stocks',
          totalInvested: stockResult.invested,
          currentValue: stockResult.currentValue,
          profitLoss: stockResult.profitLoss,
          profitLossPercentage: stockResult.roi,
          icon: <CandlestickChart className="h-4 w-4" />,
          color: 'bg-gradient-to-r from-purple-500 to-purple-600',
          route: '/stocks',
          description: 'Equity investments',
          itemsCount: stockTransactions.length,
          additionalInfo: {
            uniqueStocks: stockResult.additionalInfo?.uniqueStocks || 0,
            buyTransactions: stockTransactions.filter(t => t.transactionType === 'buy').length,
            sellTransactions: stockTransactions.filter(t => t.transactionType === 'sell').length
          }
        });
      }

      // Mutual Funds
      if (mutualFundTransactions && mutualFundTransactions.length > 0) {
        const mfResult = calculateMutualFundInvestment(mutualFundTransactions);
        
        investmentSummaries.push({
          type: 'Mutual Funds',
          totalInvested: mfResult.invested,
          currentValue: mfResult.currentValue,
          profitLoss: mfResult.profitLoss,
          profitLossPercentage: mfResult.roi,
          icon: <BarChart3 className="h-4 w-4" />,
          color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
          route: '/mutual-funds',
          description: 'Mutual fund investments',
          itemsCount: mutualFundTransactions.length,
          additionalInfo: {
            uniqueFunds: mfResult.additionalInfo?.uniqueFunds || 0,
            buyTransactions: mutualFundTransactions.filter(t => t.transactionType === 'buy').length,
            sellTransactions: mutualFundTransactions.filter(t => t.transactionType === 'sell').length
          }
        });
      }

      setInvestments(investmentSummaries);
      setLastUpdated(new Date());
      
      // Show success toast only if we have data
      if (investmentSummaries.length > 0) {
        toast({
          title: "Portfolio Updated",
          description: `Loaded ${investmentSummaries.length} investment categories successfully.`,
        });
      }
    } catch (error) {
      console.error('Error loading investment data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load investment data';
      setError(errorMessage);
      toast({
        title: "Error Loading Portfolio",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInvestmentData();
  }, [loadInvestmentData]);

  // Calculate portfolio totals with proper validation
  const portfolioTotals = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.totalInvested || 0), 0);
    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
    
    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercentage
    };
  }, [investments]);

  const formatCurrency = (amount: number) => {
    if (!showValues) return "••••••";
    if (typeof amount !== 'number' || isNaN(amount)) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    if (!showValues) return "••••";
    if (typeof percent !== 'number' || isNaN(percent)) return "0.00%";
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Data for portfolio distribution pie chart
  const pieData = useMemo(() => {
    return investments
      .filter(inv => inv.currentValue > 0)
      .map(inv => ({
        name: inv.type,
        value: inv.currentValue,
        color: inv.color
      }));
  }, [investments]);

  const COLORS = ['#f59e0b', '#6b7280', '#3b82f6', '#10b981', '#8b5cf6', '#6366f1'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-chart-2 rounded-full blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-primary to-chart-2 p-4 rounded-full">
                <Activity className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Loading Portfolio</h2>
              <p className="text-muted-foreground">Analyzing your investment data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              Investment Portfolio
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Welcome back, {currentUser?.displayName || 'Investor'}! Track and manage your diversified investment portfolio across multiple asset classes.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValues(!showValues)}
              className="flex items-center gap-2"
            >
              {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showValues ? 'Hide Values' : 'Show Values'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInvestmentData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={loadInvestmentData}
                className="ml-2"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && investments.length === 0 && (
          <div className="text-center py-16">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-16">
                <div className="space-y-6">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-chart-2/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-full p-6">
                      <Target className="h-12 w-12 text-primary mx-auto" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Start Your Investment Journey</h3>
                    <p className="text-muted-foreground">
                      Begin tracking your investments across different asset classes. Choose from gold, silver, fixed deposits, stocks, and mutual funds.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {allInvestmentTypes.map((type) => (
                      <Button
                        key={type.type}
                        onClick={() => navigate(type.route)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <div className={`${type.color} rounded p-1 text-white`}>
                          {type.icon}
                        </div>
                        {type.type}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio Summary - Only show if there are investments */}
        {investments.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">{formatCurrency(portfolioTotals.totalInvested)}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Across {investments.length} categories</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-chart-3">{formatCurrency(portfolioTotals.totalCurrentValue)}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PiggyBank className="h-4 w-4" />
                      <span>Market value</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className={`text-3xl font-bold ${portfolioTotals.totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(portfolioTotals.totalProfitLoss))}
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${portfolioTotals.totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {portfolioTotals.totalProfitLoss >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{formatPercentage(portfolioTotals.totalProfitLossPercentage)} return</span>
                      </div>
                    </div>
                    <div className={`text-6xl font-bold ${portfolioTotals.totalProfitLoss >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                      {portfolioTotals.totalProfitLoss >= 0 ? '+' : '-'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-primary to-chart-2 p-2 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    Portfolio Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-chart-3 to-chart-4 p-2 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {investments.map((investment, index) => (
                      <div key={investment.type} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(investment.route)}>
                        <div className="flex items-center gap-3">
                          <div className={`${investment.color} rounded-lg p-2 text-white`}>
                            {investment.icon}
                          </div>
                          <div>
                            <p className="font-medium">{investment.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(investment.totalInvested)} invested • {investment.itemsCount} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {investment.profitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(investment.profitLoss))}
                          </p>
                          <p className={`text-sm ${investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatPercentage(investment.profitLossPercentage)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Investment Categories */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Investment Categories</h2>
            <p className="text-sm text-muted-foreground">
              Manage your investments across different asset classes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allInvestmentTypes.map((investmentType) => {
              const existingInvestment = investments.find(inv => inv.type === investmentType.type);
              
              return (
                <Card key={investmentType.type} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardHeader className="relative pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`${investmentType.color} rounded-lg p-3 text-white shadow-lg`}>
                        {investmentType.icon}
                      </div>
                      {existingInvestment && (
                        <Badge variant={existingInvestment.profitLoss >= 0 ? "default" : "destructive"} className="font-medium">
                          {formatPercentage(existingInvestment.profitLossPercentage)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{investmentType.type}</h3>
                      <p className="text-sm text-muted-foreground">{investmentType.description}</p>
                    </div>
                    
                    {existingInvestment ? (
                      <div className="space-y-4">
                        {/* Main Investment Values */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Invested</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(existingInvestment.totalInvested)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Current Value</p>
                            <p className="font-semibold text-green-600">{formatCurrency(existingInvestment.currentValue)}</p>
                          </div>
                        </div>

                        {/* Profit/Loss Display */}
                        <div className="text-center p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30">
                          <p className={`text-lg font-bold ${existingInvestment.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {existingInvestment.profitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(existingInvestment.profitLoss))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {existingInvestment.profitLoss >= 0 ? 'Profit' : 'Loss'} • {existingInvestment.itemsCount} items
                          </p>
                        </div>

                        {/* Investment Type Specific Details */}
                        {existingInvestment.additionalInfo && (
                          <div className="space-y-2 text-xs">
                            {/* Gold/Silver specific details */}
                            {(existingInvestment.type === 'Gold' || existingInvestment.type === 'Silver') && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Holdings:</span>
                                  <span className="font-medium">
                                    {existingInvestment.type === 'Gold' ? 
                                      `${(existingInvestment.additionalInfo.goldHeld || 0).toFixed(2)}g` :
                                      `${(existingInvestment.additionalInfo.silverHeld || 0).toFixed(2)}g`
                                    }
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Rate:</span>
                                  <span className="font-medium">₹{existingInvestment.additionalInfo.currentRate}/g</span>
                                </div>
                                {existingInvestment.additionalInfo.leftover > 0 && (
                                  <div className="flex justify-between col-span-2">
                                    <span className="text-muted-foreground">Leftover Cash:</span>
                                    <span className="font-medium text-green-600">
                                      {formatCurrency(existingInvestment.additionalInfo.leftover)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* FD specific details */}
                            {existingInvestment.type === 'Fixed Deposits' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className="font-medium text-blue-600">
                                    {existingInvestment.additionalInfo.activeDeposits || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Matured:</span>
                                  <span className="font-medium text-green-600">
                                    {existingInvestment.additionalInfo.maturedDeposits || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                  <span className="text-muted-foreground">Avg Rate:</span>
                                  <span className="font-medium">
                                    {(existingInvestment.additionalInfo.avgInterestRate || 0).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* RD specific details */}
                            {existingInvestment.type === 'Recurring Deposits' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className="font-medium text-green-600">
                                    {existingInvestment.additionalInfo.activeDeposits || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Matured:</span>
                                  <span className="font-medium text-blue-600">
                                    {existingInvestment.additionalInfo.maturedDeposits || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                  <span className="text-muted-foreground">Monthly SIP:</span>
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(existingInvestment.additionalInfo.totalMonthlyCommitment || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                  <span className="text-muted-foreground">Avg Rate:</span>
                                  <span className="font-medium">
                                    {(existingInvestment.additionalInfo.avgInterestRate || 0).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Stocks specific details */}
                            {existingInvestment.type === 'Stocks' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Stocks:</span>
                                  <span className="font-medium text-purple-600">
                                    {existingInvestment.additionalInfo.uniqueStocks || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Buys:</span>
                                  <span className="font-medium text-green-600">
                                    {existingInvestment.additionalInfo.buyTransactions || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                  <span className="text-muted-foreground">Sells:</span>
                                  <span className="font-medium text-red-600">
                                    {existingInvestment.additionalInfo.sellTransactions || 0}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Mutual Funds specific details */}
                            {existingInvestment.type === 'Mutual Funds' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Funds:</span>
                                  <span className="font-medium text-indigo-600">
                                    {existingInvestment.additionalInfo.uniqueFunds || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Buys:</span>
                                  <span className="font-medium text-green-600">
                                    {existingInvestment.additionalInfo.buyTransactions || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                  <span className="text-muted-foreground">Sells:</span>
                                  <span className="font-medium text-red-600">
                                    {existingInvestment.additionalInfo.sellTransactions || 0}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="space-y-2">
                          <Plus className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">No investments yet</p>
                          <p className="text-xs text-muted-foreground">Click to get started</p>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full group-hover:bg-primary/90 transition-colors"
                      onClick={() => navigate(investmentType.route)}
                    >
                      {existingInvestment ? 'Manage' : 'Add Investment'}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GlobalDashboard;