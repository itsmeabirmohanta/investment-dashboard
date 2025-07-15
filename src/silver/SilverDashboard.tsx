import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Shield, Wallet, PiggyBank, DollarSign, Building2, Plus, History, Calculator, ArrowLeft, Coins, CandlestickChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchSilverTransactions, 
  addSilverTransaction, 
  updateSilverTransaction, 
  deleteSilverTransaction,
  fetchCurrentSilverRate,
  updateCurrentSilverRate,
  SilverTransaction
} from '@/lib/investmentService';

const standardSilverWeights = [10, 25, 50, 100, 250, 500, 1000];

const SilverDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<SilverTransaction[]>([]);
  const [currentSilverRate, setCurrentSilverRate] = useState(85);
  const [loading, setLoading] = useState(true);
  const [openRateDialog, setOpenRateDialog] = useState(false);
  const [newRate, setNewRate] = useState(currentSilverRate.toString());

  // Transaction Form State
  const [formData, setFormData] = useState({
    amountSent: '',
    silverRate: currentSilverRate.toString(),
    taxAmount: '',
    silverPurchased: '',
    notes: '',
  });

  const [silverInputType, setSilverInputType] = useState<'preset' | 'custom'>('preset');
  const [calculations, setCalculations] = useState({
    usableAmount: 0,
    silverCost: 0,
    leftover: 0,
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
        // Load transactions
        const silverTransactions = await fetchSilverTransactions();
        setTransactions(silverTransactions);

        // Load current silver rate (will return default 90 if not set)
        const rate = await fetchCurrentSilverRate();
        setCurrentSilverRate(rate);
        setFormData(prev => ({ ...prev, silverRate: rate.toString() }));
        setNewRate(rate.toString());
      } catch (error) {
        console.error('Error loading silver data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load your silver investments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, toast]);

  // Calculate metrics
  const totalInvested = transactions.reduce((sum, t) => sum + t.amountSent, 0);
  const totalSilverHeld = transactions.reduce((sum, t) => sum + t.silverPurchased, 0);
  const totalLeftover = transactions.reduce((sum, t) => {
    const usableAmount = t.amountSent - t.taxAmount;
    const silverCost = t.silverPurchased * t.silverRate;
    return sum + (usableAmount - silverCost);
  }, 0);
  
  const portfolioValue = totalSilverHeld * currentSilverRate;
  const netProfitLoss = (portfolioValue + totalLeftover) - totalInvested;
  const profitLossPercentage = totalInvested > 0 ? (netProfitLoss / totalInvested) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatSilver = (grams: number) => {
    return `${grams.toFixed(0)} gm`;
  };

  const updateCalculations = (data: typeof formData) => {
    const amountSent = parseFloat(data.amountSent) || 0;
    const taxAmount = parseFloat(data.taxAmount) || 0;
    const silverRate = parseFloat(data.silverRate) || 0;
    const silverPurchased = parseFloat(data.silverPurchased) || 0;

    const usableAmount = amountSent - taxAmount;
    const silverCost = silverPurchased * silverRate;
    const leftover = usableAmount - silverCost;

    setCalculations({
      usableAmount,
      silverCost,
      leftover,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateCalculations(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountSent = parseFloat(formData.amountSent);
    const silverRate = parseFloat(formData.silverRate);
    const taxAmount = parseFloat(formData.taxAmount);
    const silverPurchased = parseFloat(formData.silverPurchased);

    if (!amountSent || !silverRate || !taxAmount || !silverPurchased) {
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
        amountSent,
        silverRate,
        taxAmount,
        silverPurchased,
        notes: formData.notes,
      };

      const id = await addSilverTransaction(newTransaction);
      const transactionWithId = { ...newTransaction, id, userId: currentUser!.uid };
      
      setTransactions(prev => [transactionWithId, ...prev]);
      
      // Reset form
      setFormData({
        amountSent: '',
        silverRate: currentSilverRate.toString(),
        taxAmount: '',
        silverPurchased: '',
        notes: '',
      });
      setCalculations({ usableAmount: 0, silverCost: 0, leftover: 0 });
      setSilverInputType('preset');

      toast({
        title: "Transaction Added",
        description: `Successfully recorded purchase of ${silverPurchased}gm silver`,
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

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(newRate);
    
    if (!rate || rate <= 0) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid silver rate.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCurrentSilverRate(rate);
      setCurrentSilverRate(rate);
      setFormData(prev => ({ ...prev, silverRate: rate.toString() }));
      
      toast({
        title: "Silver Rate Updated",
        description: `Current silver rate set to ₹${rate.toLocaleString('en-IN')}/gm`,
      });
      setOpenRateDialog(false);
    } catch (error) {
      console.error('Error updating rate:', error);
      toast({
        title: "Error Updating Rate",
        description: "Failed to update silver rate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteSilverTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      
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
      const cumulativeInvestment = transactions
        .slice(0, index + 1)
        .reduce((sum, t) => sum + t.amountSent, 0);
      const cumulativeSilver = transactions
        .slice(0, index + 1)
        .reduce((sum, t) => sum + t.silverPurchased, 0);
      const currentValue = cumulativeSilver * currentSilverRate;
      
      acc.push({
        date,
        invested: cumulativeInvestment,
        currentValue,
        silverHeld: cumulativeSilver,
        profitLoss: currentValue - cumulativeInvestment,
      });
      return acc;
    }, [] as Array<{
      date: string;
      invested: number;
      currentValue: number;
      silverHeld: number;
      profitLoss: number;
    }>);

  const silverRateData = transactions.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    rate: t.silverRate,
    purchased: t.silverPurchased,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Coins className="h-16 w-16 text-gray-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading your silver data...</h2>
          <p className="text-muted-foreground">Fetching your silver investments</p>
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-400 to-slate-600 bg-clip-text text-transparent">
            Silver Investment Dashboard
          </h2>
          <p className="text-muted-foreground">Track your silver investments and market performance</p>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <Coins className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Silver Investments Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your silver investments by adding your first transaction below.
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
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalInvested)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Silver Held</CardTitle>
              <Coins className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{formatSilver(totalSilverHeld)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                @ {formatCurrency(currentSilverRate)}/gm
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setOpenRateDialog(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Current Silver Rate</CardTitle>
              <CandlestickChart className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{formatCurrency(currentSilverRate)}/gm</div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to update rate
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

          <Card className={`bg-gradient-to-br ${netProfitLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'}`}>
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
                {formatCurrency(Math.abs(netProfitLoss))}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Investment Growth</CardTitle>
                <p className="text-sm text-muted-foreground">Track your investment vs current value over time</p>
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
                <CardTitle className="text-lg">Silver Rate History</CardTitle>
                <p className="text-sm text-muted-foreground">Historical silver rates at purchase times</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={silverRateData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `₹${value}`} />
                    <Tooltip formatter={(value, name) => [name === 'rate' ? formatCurrency(Number(value)) : value + ' gm', name === 'rate' ? 'Rate' : 'Amount']} />
                    <ReferenceLine y={currentSilverRate} label="Current" stroke="hsl(var(--gray-500))" strokeDasharray="3 3" />
                    <Bar dataKey="rate" fill="hsl(var(--gray-500))" radius={[4, 4, 0, 0]} />
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
                Add Silver Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amountSent">Amount Sent (₹)</Label>
                    <Input
                      id="amountSent"
                      type="number"
                      value={formData.amountSent}
                      onChange={(e) => handleInputChange('amountSent', e.target.value)}
                      placeholder="10000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="silverRate">Silver Rate (₹/gm)</Label>
                    <Input
                      id="silverRate"
                      type="number"
                      value={formData.silverRate}
                      onChange={(e) => handleInputChange('silverRate', e.target.value)}
                      placeholder="85"
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="silverPurchased">Silver Purchased</Label>
                    <Tabs value={silverInputType} onValueChange={(value) => setSilverInputType(value as 'preset' | 'custom')}>
                      <TabsList className="grid grid-cols-2 mb-2">
                        <TabsTrigger value="preset">Preset</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                      </TabsList>
                      <TabsContent value="preset" className="mt-0">
                        <Select value={formData.silverPurchased} onValueChange={(value) => handleInputChange('silverPurchased', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weight" />
                          </SelectTrigger>
                          <SelectContent>
                            {standardSilverWeights.map((weight) => (
                              <SelectItem key={weight} value={weight.toString()}>
                                {weight} gm
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TabsContent>
                      <TabsContent value="custom" className="mt-0">
                        <Input
                          type="number"
                          value={formData.silverPurchased}
                          onChange={(e) => handleInputChange('silverPurchased', e.target.value)}
                          placeholder="Custom weight"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                {formData.amountSent && formData.taxAmount && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Calculations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Usable Amount:</span>
                        <span className="font-medium">{formatCurrency(calculations.usableAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Silver Cost:</span>
                        <span className="font-medium">{formatCurrency(calculations.silverCost)}</span>
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
                  <Coins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No silver transactions yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => {
                      const usableAmount = transaction.amountSent - transaction.taxAmount;
                      const silverCost = transaction.silverPurchased * transaction.silverRate;
                      const leftover = usableAmount - silverCost;
                      
                      return (
                        <Card key={transaction.id} className={`${leftover >= 0 ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-red-400'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{transaction.silverPurchased} gm</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.date).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(transaction.amountSent)}</p>
                                <Badge variant={leftover >= 0 ? "outline" : "destructive"}>
                                  {formatCurrency(Math.abs(leftover))} {leftover >= 0 ? 'left' : 'over'}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Rate: {formatCurrency(transaction.silverRate)}/gm</p>
                                <p className="text-muted-foreground">Tax: {formatCurrency(transaction.taxAmount)}</p>
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
                              <p className="text-sm text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
                                {transaction.notes}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Rate Update Dialog */}
      <Dialog open={openRateDialog} onOpenChange={setOpenRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Silver Rate</DialogTitle>
            <DialogDescription>
              Enter the current market rate of silver per gram.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="silver-rate">Silver Rate (₹/gm)</Label>
                <Input
                  id="silver-rate"
                  type="number"
                  min="1"
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="Enter current silver rate"
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

export default SilverDashboard;