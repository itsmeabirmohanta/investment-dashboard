import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CandlestickChart, Wallet, PiggyBank, DollarSign, Building2, Plus, History, Calculator, Activity, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from 'recharts';
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
  fetchStockTransactions, 
  addStockTransaction, 
  updateStockTransaction, 
  deleteStockTransaction,
  StockTransaction
} from '@/lib/investmentService';
import { calculateStockInvestment, formatCurrency, POPULAR_STOCKS } from '@/lib/investmentCalculations';

interface StockHolding {
  symbol: string;
  companyName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

const StocksDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [loading, setLoading] = useState(true);

  // Transaction Form State
  const [formData, setFormData] = useState({
    stockSymbol: '',
    companyName: '',
    customStockName: '',
    customCompanyName: '',
    transactionType: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    brokerageCharges: '',
    date: new Date().toISOString().split('T')[0], // Default to today
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
        const stockTransactions = await fetchStockTransactions();
        setTransactions(stockTransactions);

        // Calculate holdings from transactions
        calculateHoldings(stockTransactions);
      } catch (error) {
        console.error('Error loading stock data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load your stock investments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const calculateHoldings = (stockTransactions: StockTransaction[]) => {
    // Mock current prices for demonstration - in real app, fetch from API
    const currentPrices: { [key: string]: number } = {
      'RELIANCE': 2950,
      'TCS': 4100,
      'HDFCBANK': 1720,
      'INFY': 1850,
      'HINDUNILVR': 2650,
      'ICICIBANK': 1050,
      'BHARTIARTL': 1200,
      'ITC': 450,
      'KOTAKBANK': 1750,
      'LT': 3200,
      'AXISBANK': 1100,
      'MARUTI': 10500,
      'ASIANPAINT': 3200,
      'BAJFINANCE': 6800,
      'HCLTECH': 1400,
      'WIPRO': 430,
      'ULTRACEMCO': 9500,
      'TITAN': 3400,
      'POWERGRID': 250
    };

    const holdingsMap: { [key: string]: StockHolding } = {};

    stockTransactions.forEach(transaction => {
      const { stockSymbol, companyName, transactionType, quantity, price, totalAmount, brokerageCharges } = transaction;
      
      if (!holdingsMap[stockSymbol]) {
        holdingsMap[stockSymbol] = {
          symbol: stockSymbol,
          companyName,
          quantity: 0,
          avgPrice: 0,
          currentPrice: currentPrices[stockSymbol] || price, // Use last transaction price if no current price
          totalInvested: 0,
          currentValue: 0,
          profitLoss: 0,
          profitLossPercentage: 0
        };
      }

      const holding = holdingsMap[stockSymbol];

      if (transactionType === 'buy') {
        const newTotalInvested = holding.totalInvested + totalAmount + brokerageCharges;
        const newQuantity = holding.quantity + quantity;
        holding.avgPrice = newTotalInvested / newQuantity;
        holding.quantity = newQuantity;
        holding.totalInvested = newTotalInvested;
      } else {
        holding.quantity -= quantity;
        holding.totalInvested -= (holding.avgPrice * quantity);
      }

      holding.currentValue = holding.quantity * holding.currentPrice;
      holding.profitLoss = holding.currentValue - holding.totalInvested;
      holding.profitLossPercentage = holding.totalInvested > 0 ? (holding.profitLoss / holding.totalInvested) * 100 : 0;
    });

    const calculatedHoldings = Object.values(holdingsMap).filter(h => h.quantity > 0);
    setHoldings(calculatedHoldings);
  };

  // Calculate metrics using the new calculation library
  const investmentResult = calculateStockInvestment(transactions);
  const totalStocks = holdings.length;
  const profitableStocks = holdings.filter(h => h.profitLoss > 0).length;
  const losingStocks = holdings.filter(h => h.profitLoss < 0).length;

  const updateCalculations = (data: typeof formData) => {
    const quantity = parseFloat(data.quantity) || 0;
    const price = parseFloat(data.price) || 0;
    const brokerageCharges = parseFloat(data.brokerageCharges) || 0;

    const totalAmount = quantity * price;
    const netAmount = data.transactionType === 'buy' ? totalAmount + brokerageCharges : totalAmount - brokerageCharges;

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

  const handleStockSelect = (symbol: string) => {
    if (symbol === 'custom') {
      setFormData(prev => ({
        ...prev,
        stockSymbol: 'custom',
        companyName: '',
        customStockName: '',
        customCompanyName: ''
      }));
      return;
    }

    const selectedStock = POPULAR_STOCKS.find(s => s.symbol === symbol);
    if (selectedStock) {
      setFormData(prev => ({
        ...prev,
        stockSymbol: selectedStock.symbol,
        companyName: selectedStock.name,
        customStockName: '',
        customCompanyName: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);
    const brokerageCharges = parseFloat(formData.brokerageCharges);

    let stockSymbol = formData.stockSymbol;
    let companyName = formData.companyName;

    if (formData.stockSymbol === 'custom') {
      stockSymbol = formData.customStockName;
      companyName = formData.customCompanyName;
    }

    if (!stockSymbol || !companyName || !quantity || !price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTransaction = {
        date: formData.date,
        stockSymbol,
        companyName,
        transactionType: formData.transactionType,
        quantity,
        price,
        totalAmount: quantity * price,
        brokerageCharges: brokerageCharges || 0,
        notes: formData.notes,
      };

      const id = await addStockTransaction(newTransaction);
      const transactionWithId = { ...newTransaction, id, userId: currentUser!.uid };
      
      const updatedTransactions = [transactionWithId, ...transactions];
      setTransactions(updatedTransactions);
      calculateHoldings(updatedTransactions);
      
      // Reset form
      setFormData({
        stockSymbol: '',
        companyName: '',
        customStockName: '',
        customCompanyName: '',
        transactionType: 'buy',
        quantity: '',
        price: '',
        brokerageCharges: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        notes: '',
      });
      setCalculations({
        totalAmount: 0,
        netAmount: 0,
      });

      toast({
        title: "Transaction Added",
        description: `Successfully recorded ${formData.transactionType} transaction for ${stockSymbol}`,
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
      await deleteStockTransaction(id);
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
        .reduce((sum, t) => sum + t.totalAmount + t.brokerageCharges, 0);
      
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
          <CandlestickChart className="h-16 w-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading your stocks data...</h2>
          <p className="text-muted-foreground">Fetching your equity investments</p>
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
            Stocks Portfolio Dashboard
          </h2>
          <p className="text-muted-foreground">Track your equity investments and stock portfolio performance</p>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <CandlestickChart className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Stock Investments Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your stock investments by adding your first transaction below.
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
                Across {totalStocks} stocks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Portfolio Value</CardTitle>
              <CandlestickChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{formatCurrency(investmentResult.currentValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current market value
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${investmentResult.profitLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${investmentResult.profitLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                Net P&L
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
              <CardTitle className="text-sm font-medium text-chart-3">Profitable Stocks</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{profitableStocks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {totalStocks} holdings
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-4">Losing Stocks</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">{losingStocks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{transactions.length}</div>
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
            <p className="text-sm text-muted-foreground">Your active stock positions</p>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <div className="text-center py-8">
                <CandlestickChart className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No stock holdings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${holding.profitLoss >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        <CandlestickChart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{holding.symbol}</p>
                        <p className="text-sm text-muted-foreground">{holding.companyName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Qty</p>
                          <p className="font-medium">{holding.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Price</p>
                          <p className="font-medium">{formatCurrency(holding.avgPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-medium">{formatCurrency(holding.currentPrice)}</p>
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
                <p className="text-sm text-muted-foreground">Value distribution across stocks</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={holdings}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="symbol" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'currentValue' ? 'Current Value' : 'Invested']} />
                    <Bar dataKey="currentValue" fill="hsl(var(--purple-500))" radius={[4, 4, 0, 0]} />
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
                Add Stock Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockSymbol">Stock Symbol</Label>
                    <Select value={formData.stockSymbol} onValueChange={handleStockSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_STOCKS.map((stock) => (
                          <SelectItem key={stock.symbol} value={stock.symbol}>
                            {stock.symbol} - {stock.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.stockSymbol === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="customStockName">Custom Stock Symbol</Label>
                        <Input
                          id="customStockName"
                          type="text"
                          value={formData.customStockName}
                          onChange={(e) => handleInputChange('customStockName', e.target.value)}
                          placeholder="e.g., AAPL, GOOGL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customCompanyName">Custom Company Name</Label>
                        <Input
                          id="customCompanyName"
                          type="text"
                          value={formData.customCompanyName}
                          onChange={(e) => handleInputChange('customCompanyName', e.target.value)}
                          placeholder="e.g., Apple Inc., Alphabet Inc."
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
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Share (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="2850.50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brokerageCharges">Brokerage & Charges (₹)</Label>
                    <Input
                      id="brokerageCharges"
                      type="number"
                      value={formData.brokerageCharges}
                      onChange={(e) => handleInputChange('brokerageCharges', e.target.value)}
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Transaction Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                </div>

                {formData.quantity && formData.price && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Transaction Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Value:</span>
                        <span className="font-medium">{formatCurrency(calculations.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Charges:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.brokerageCharges) || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Net Amount:</span>
                        <span className="font-bold text-purple-600">{formatCurrency(calculations.netAmount)}</span>
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
                  <CandlestickChart className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No stock transactions yet</p>
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
                                <p className="font-medium">{transaction.stockSymbol}</p>
                                <Badge variant={transaction.transactionType === 'buy' ? 'default' : 'destructive'}>
                                  {transaction.transactionType.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{transaction.companyName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{transaction.quantity} shares</p>
                              <p className="text-sm text-muted-foreground">@ {formatCurrency(transaction.price)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total: {formatCurrency(transaction.totalAmount)}</p>
                              <p className="text-muted-foreground">Charges: {formatCurrency(transaction.brokerageCharges)}</p>
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
                            <p className="text-sm text-muted-foreground mt-2 p-2 bg-purple-50 rounded">
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

export default StocksDashboard;