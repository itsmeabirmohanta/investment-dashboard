import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Wallet, PiggyBank, DollarSign, Building2, Plus, History, Calculator, BarChart3, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchMutualFundTransactions, 
  addMutualFundTransaction, 
  updateMutualFundTransaction, 
  deleteMutualFundTransaction,
  MutualFundTransaction
} from '@/lib/investmentService';
import { calculateMutualFundInvestment, formatCurrency, POPULAR_MUTUAL_FUNDS } from '@/lib/investmentCalculations';

interface MutualFundHolding {
  fundName: string;
  schemeCode: string;
  units: number;
  avgNav: number;
  currentNav: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

const MutualFundsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<MutualFundTransaction[]>([]);
  const [holdings, setHoldings] = useState<MutualFundHolding[]>([]);
  const [loading, setLoading] = useState(true);

  // Transaction Form State
  const [formData, setFormData] = useState({
    fundName: '',
    schemeCode: '',
    customFundName: '',
    customSchemeCode: '',
    transactionType: 'buy' as 'buy' | 'sell',
    units: '',
    nav: '',
    charges: '',
    notes: '',
  });

  const [calculations, setCalculations] = useState({
    totalAmount: 0,
    netAmount: 0,
  });

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const mfTransactions = await fetchMutualFundTransactions();
        setTransactions(mfTransactions);

        // Calculate holdings from transactions
        calculateHoldings(mfTransactions);
      } catch (error) {
        console.error('Error loading mutual fund data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load your mutual fund investments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const calculateHoldings = (mfTransactions: MutualFundTransaction[]) => {
    // Mock current NAVs for demonstration - in real app, fetch from API
    const currentNavs: { [key: string]: number } = {
      'HDFC Top 100 Fund': 865.3,
      'SBI Small Cap Fund': 208.5,
      'Axis Bluechip Fund': 71.2,
      'Mirae Asset Large Cap Fund': 95.8,
      'Parag Parikh Flexi Cap Fund': 58.2,
      'Kotak Small Cap Fund': 145.6,
      'ICICI Prudential Technology Fund': 88.9,
      'UTI Nifty 50 Index Fund': 25.4,
      'Nippon India Small Cap Fund': 168.7,
      'DSP Mid Cap Fund': 102.3,
      'Aditya Birla SL Frontline Equity Fund': 420.5,
      'Franklin India Prima Fund': 1250.8,
      'Motilal Oswal Nasdaq 100 Fund': 28.4,
      'Quantum Long Term Equity Fund': 68.9,
      'Tata Digital India Fund': 35.2
    };

    const holdingsMap: { [key: string]: MutualFundHolding } = {};

    mfTransactions.forEach(transaction => {
      const { fundName, schemeCode, transactionType, units, nav, totalAmount, charges } = transaction;
      
      if (!holdingsMap[fundName]) {
        holdingsMap[fundName] = {
          fundName,
          schemeCode,
          units: 0,
          avgNav: 0,
          currentNav: currentNavs[fundName] || nav, // Use last transaction NAV if no current NAV
          totalInvested: 0,
          currentValue: 0,
          profitLoss: 0,
          profitLossPercentage: 0
        };
      }

      const holding = holdingsMap[fundName];

      if (transactionType === 'buy') {
        const newTotalInvested = holding.totalInvested + totalAmount + charges;
        const newUnits = holding.units + units;
        holding.avgNav = newTotalInvested / newUnits;
        holding.units = newUnits;
        holding.totalInvested = newTotalInvested;
      } else {
        holding.units -= units;
        holding.totalInvested -= (holding.avgNav * units);
      }

      holding.currentValue = holding.units * holding.currentNav;
      holding.profitLoss = holding.currentValue - holding.totalInvested;
      holding.profitLossPercentage = holding.totalInvested > 0 ? (holding.profitLoss / holding.totalInvested) * 100 : 0;
    });

    const calculatedHoldings = Object.values(holdingsMap).filter(h => h.units > 0);
    setHoldings(calculatedHoldings);
  };

  // Calculate metrics using the new calculation library
  const investmentResult = calculateMutualFundInvestment(transactions);
  const totalFunds = holdings.length;
  const profitableFunds = holdings.filter(h => h.profitLoss > 0).length;
  const losingFunds = holdings.filter(h => h.profitLoss < 0).length;

  const updateCalculations = (data: typeof formData) => {
    const units = parseFloat(data.units) || 0;
    const nav = parseFloat(data.nav) || 0;
    const charges = parseFloat(data.charges) || 0;

    const totalAmount = units * nav;
    const netAmount = data.transactionType === 'buy' ? totalAmount + charges : totalAmount - charges;

    setCalculations({
      totalAmount,
      netAmount,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateCalculations(newData);
  };

  const handleFundSelect = (fundName: string) => {
    if (fundName === 'custom') {
      setFormData(prev => ({
        ...prev,
        fundName: 'custom',
        schemeCode: '',
        customFundName: '',
        customSchemeCode: ''
      }));
      return;
    }

    const selectedFund = POPULAR_MUTUAL_FUNDS.find(f => f.name === fundName);
    if (selectedFund) {
      setFormData(prev => ({
        ...prev,
        fundName: selectedFund.name,
        schemeCode: selectedFund.schemeCode,
        customFundName: '',
        customSchemeCode: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const units = parseFloat(formData.units);
    const nav = parseFloat(formData.nav);
    const charges = parseFloat(formData.charges);

    let fundName = formData.fundName;
    let schemeCode = formData.schemeCode;

    if (formData.fundName === 'custom') {
      fundName = formData.customFundName;
      schemeCode = formData.customSchemeCode;
    }

    if (!fundName || !schemeCode || !units || !nav) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTransaction = {
        date: new Date().toISOString(),
        fundName,
        schemeCode,
        transactionType: formData.transactionType,
        units,
        nav,
        totalAmount: units * nav,
        charges: charges || 0,
        notes: formData.notes,
      };

      const id = await addMutualFundTransaction(newTransaction);
      const transactionWithId = { ...newTransaction, id, userId: currentUser!.uid };
      
      const updatedTransactions = [transactionWithId, ...transactions];
      setTransactions(updatedTransactions);
      calculateHoldings(updatedTransactions);
      
      // Reset form
      setFormData({
        fundName: '',
        schemeCode: '',
        customFundName: '',
        customSchemeCode: '',
        transactionType: 'buy',
        units: '',
        nav: '',
        charges: '',
        notes: '',
      });
      setCalculations({
        totalAmount: 0,
        netAmount: 0,
      });

      toast({
        title: "Transaction Added",
        description: `Successfully recorded ${formData.transactionType} transaction for ${fundName}`,
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error Adding Transaction",
        description: "Failed to add your transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteMutualFundTransaction(id);
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      calculateHoldings(updatedTransactions);
      
      toast({
        title: "Transaction Deleted",
        description: "Transaction has been removed from your records.",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error Deleting Transaction",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Chart data
  const chartData = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, transaction, index) => {
      const date = new Date(transaction.date).toLocaleDateString('en-IN', { 
        month: 'short', 
        year: '2-digit' 
      });
      
      // Calculate cumulative investment (buy transactions only)
      const cumulativeInvestment = transactions
        .slice(0, index + 1)
        .filter(t => t.transactionType === 'buy')
        .reduce((sum, t) => sum + t.totalAmount + t.charges, 0);
      
      acc.push({
        date,
        invested: cumulativeInvestment,
        currentValue: investmentResult.currentValue,
        profitLoss: investmentResult.profitLoss,
      });
      return acc;
    }, [] as Array<{
      date: string;
      invested: number;
      currentValue: number;
      profitLoss: number;
    }>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-indigo-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading your mutual funds data...</h2>
          <p className="text-muted-foreground">Fetching your mutual fund investments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with Back Button */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent">
            Mutual Funds Dashboard
          </h2>
          <p className="text-muted-foreground">Track your mutual fund investments and SIP performance</p>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <BarChart3 className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Mutual Fund Investments Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your mutual fund investments by adding your first transaction below.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Total Invested</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(investmentResult.invested)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {totalFunds} funds
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Portfolio Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">{formatCurrency(investmentResult.currentValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current NAV value
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${investmentResult.profitLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${investmentResult.profitLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                Net Returns
              </CardTitle>
              {investmentResult.profitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${investmentResult.profitLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(Math.abs(investmentResult.profitLoss))}
              </div>
              <p className={`text-xs mt-1 ${investmentResult.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {investmentResult.roi >= 0 ? '+' : ''}{investmentResult.roi.toFixed(2)}% ROI
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-3">Profitable Funds</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{profitableFunds}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {totalFunds} funds
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-4">Underperforming</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">{losingFunds}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Need review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Total Transactions</CardTitle>
              <Target className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">{transactions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Buy & sell orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Holdings</CardTitle>
            <p className="text-sm text-muted-foreground">Your mutual fund portfolio</p>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No mutual fund holdings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div key={holding.fundName} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${holding.profitLoss >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{holding.fundName}</p>
                        <p className="text-sm text-muted-foreground">{holding.schemeCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Units</p>
                          <p className="font-medium">{holding.units.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg NAV</p>
                          <p className="font-medium">₹{holding.avgNav.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current NAV</p>
                          <p className="font-medium">₹{holding.currentNav.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className={`font-medium ${holding.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(holding.profitLoss)}
                        </p>
                        <p className={`text-xs ${holding.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {holding.profitLossPercentage >= 0 ? '+' : ''}{holding.profitLossPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Section */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Growth</CardTitle>
                <p className="text-sm text-muted-foreground">Investment vs current value over time</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'invested' ? 'Invested' : 'Current Value']} />
                    <Area type="monotone" dataKey="invested" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/20)" />
                    <Area type="monotone" dataKey="currentValue" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/20)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Holdings Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">Value distribution across funds</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={holdings}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="fundName" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'currentValue' ? 'Current Value' : 'Invested']} />
                    <Bar dataKey="currentValue" fill="hsl(var(--indigo-500))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Forms and History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Add Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Mutual Fund Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fundName">Fund Name</Label>
                    <Select value={formData.fundName} onValueChange={handleFundSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_MUTUAL_FUNDS.map((fund) => (
                          <SelectItem key={fund.name} value={fund.name}>
                            {fund.name} ({fund.category})
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Fund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.fundName === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="customFundName">Custom Fund Name</Label>
                        <Input
                          id="customFundName"
                          type="text"
                          value={formData.customFundName}
                          onChange={(e) => handleInputChange('customFundName', e.target.value)}
                          placeholder="e.g., XYZ Mutual Fund"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customSchemeCode">Custom Scheme Code</Label>
                        <Input
                          id="customSchemeCode"
                          type="text"
                          value={formData.customSchemeCode}
                          onChange={(e) => handleInputChange('customSchemeCode', e.target.value)}
                          placeholder="e.g., XYZ001"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="transactionType">Transaction Type</Label>
                    <Select value={formData.transactionType} onValueChange={(value) => handleInputChange('transactionType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="units">Units</Label>
                      <Input
                        id="units"
                        type="number"
                        step="0.001"
                        value={formData.units}
                        onChange={(e) => handleInputChange('units', e.target.value)}
                        placeholder="30.450"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nav">NAV (₹)</Label>
                      <Input
                        id="nav"
                        type="number"
                        step="0.01"
                        value={formData.nav}
                        onChange={(e) => handleInputChange('nav', e.target.value)}
                        placeholder="820.50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="charges">Exit Load/Charges (₹)</Label>
                    <Input
                      id="charges"
                      type="number"
                      value={formData.charges}
                      onChange={(e) => handleInputChange('charges', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {formData.units && formData.nav && (
                  <Card className="bg-indigo-50 border-indigo-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Transaction Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Units:</span>
                        <span className="font-medium">{parseFloat(formData.units).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>NAV:</span>
                        <span className="font-medium">₹{parseFloat(formData.nav).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Value:</span>
                        <span className="font-medium">{formatCurrency(calculations.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Charges:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.charges) || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Net Amount:</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(calculations.netAmount)}</span>
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
                    placeholder="Add any notes about this transaction..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Transaction
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column - Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No mutual fund transactions yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => (
                      <Card key={transaction.id} className={`${transaction.transactionType === 'buy' ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-red-400'}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{transaction.fundName}</p>
                                <Badge variant={transaction.transactionType === 'buy' ? 'default' : 'destructive'}>
                                  {transaction.transactionType.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{transaction.schemeCode}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(transaction.date).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(transaction.totalAmount)}</p>
                              <p className="text-sm text-muted-foreground">@ ₹{transaction.nav.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Units: {transaction.units.toFixed(3)}</p>
                              <p className="text-muted-foreground">Charges: {formatCurrency(transaction.charges)}</p>
                            </div>
                            <div className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          {transaction.notes && (
                            <p className="text-sm text-muted-foreground mt-2 p-2 bg-indigo-50 rounded">
                              {transaction.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MutualFundsDashboard;