import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Building, Wallet, PiggyBank, DollarSign, Plus, History, Calendar, ArrowLeft, Calculator } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
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
  fetchFDTransactions, 
  addFDTransaction, 
  updateFDTransaction, 
  deleteFDTransaction,
  FDTransaction
} from '@/lib/investmentService';
import { 
  calculateFDInvestment, 
  calculateFDMaturity, 
  calculateFDAccruedValue,
  FDInterestType,
  formatCurrency, 
  BANK_NAMES 
} from '@/lib/investmentCalculations';

const commonDurations = [3, 6, 12, 18, 24, 36, 60]; // in months

const FDDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<FDTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Transaction Form State
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    customBankName: '',
    interestRate: '',
    duration: '',
    interestType: FDInterestType.COMPOUND,
    compoundingFrequency: '4', // Quarterly by default
    date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
  });

  const [calculations, setCalculations] = useState({
    maturityAmount: 0,
    totalInterest: 0,
    monthlyInterest: 0,
    effectiveRate: 0,
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
        const fdTransactions = await fetchFDTransactions();
        setTransactions(fdTransactions);
      } catch (error) {
        console.error('Error loading FD data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load your fixed deposits. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Calculate metrics using the new calculation library
  const investmentResult = calculateFDInvestment(transactions);
  const activeFDs = transactions.filter(t => new Date(t.maturityDate) > new Date());
  const maturedFDs = transactions.filter(t => new Date(t.maturityDate) <= new Date());
  const avgInterestRate = transactions.length > 0 ? 
    transactions.reduce((sum, t) => sum + t.interestRate, 0) / transactions.length : 0;

  const updateCalculations = (data: typeof formData) => {
    const amount = parseFloat(data.amount) || 0;
    const interestRate = parseFloat(data.interestRate) || 0;
    const duration = parseFloat(data.duration) || 0;
    const compoundingFreq = parseInt(data.compoundingFrequency) || 4;

    if (amount && interestRate && duration) {
      const result = calculateFDMaturity(
        amount, 
        interestRate, 
        duration, 
        data.interestType as FDInterestType,
        compoundingFreq
      );

      setCalculations({
        maturityAmount: result.maturityAmount,
        totalInterest: result.totalInterest,
        monthlyInterest: result.monthlyInterest,
        effectiveRate: result.effectiveRate,
      });
    } else {
      setCalculations({
        maturityAmount: 0,
        totalInterest: 0,
        monthlyInterest: 0,
        effectiveRate: 0,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateCalculations(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    const interestRate = parseFloat(formData.interestRate);
    const duration = parseFloat(formData.duration);
    const bankName = formData.bankName === 'Other' ? formData.customBankName : formData.bankName;
    const compoundingFreq = parseInt(formData.compoundingFrequency) || 4;

    if (!amount || !bankName || !interestRate || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDate = new Date(formData.date);
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + duration);

      const maturityResult = calculateFDMaturity(
        amount, 
        interestRate, 
        duration, 
        formData.interestType as FDInterestType,
        compoundingFreq
      );

      const newTransaction = {
        date: startDate.toISOString(),
        amount,
        bankName,
        interestRate,
        duration,
        maturityDate: maturityDate.toISOString(),
        maturityAmount: maturityResult.maturityAmount,
        notes: formData.notes,
      };

      const id = await addFDTransaction(newTransaction);
      const transactionWithId = { ...newTransaction, id, userId: currentUser!.uid };
      
      setTransactions(prev => [transactionWithId, ...prev]);
      
      // Reset form
      setFormData({
        amount: '',
        bankName: '',
        customBankName: '',
        interestRate: '',
        duration: '',
        interestType: FDInterestType.COMPOUND,
        compoundingFrequency: '4',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setCalculations({
        maturityAmount: 0,
        totalInterest: 0,
        monthlyInterest: 0,
        effectiveRate: 0,
      });

      toast({
        title: "FD Added Successfully",
        description: `Fixed Deposit of ${formatCurrency(amount)} created with ${bankName}`,
      });
    } catch (error) {
      console.error('Error adding FD:', error);
      toast({
        title: "Error Adding FD",
        description: "Failed to add your fixed deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteFDTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: "FD Deleted",
        description: "Fixed Deposit has been removed from your records.",
      });
    } catch (error) {
      console.error('Error deleting FD:', error);
      toast({
        title: "Error Deleting FD",
        description: "Failed to delete fixed deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDaysToMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to calculate individual FD current value using enhanced calculation
  const calculateCurrentFDValue = (transaction: FDTransaction) => {
    const startDate = new Date(transaction.date);
    const currentDate = new Date();
    const maturityDate = new Date(transaction.maturityDate);
    
    // If already matured, use maturity value
    if (currentDate >= maturityDate) {
      return transaction.maturityAmount;
    }
    
    // Calculate accrued value using the enhanced calculation function
    return calculateFDAccruedValue(
      transaction.amount,
      transaction.interestRate,
      startDate,
      currentDate,
      FDInterestType.COMPOUND,
      4 // Quarterly compounding
    );
  };

  // Helper function to get completion percentage for active FDs
  const getCompletionPercentage = (transaction: FDTransaction) => {
    const startDate = new Date(transaction.date);
    const currentDate = new Date();
    const maturityDate = new Date(transaction.maturityDate);
    
    if (currentDate >= maturityDate) return 100;
    
    const totalDuration = maturityDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    
    return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
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
        .reduce((sum, t) => sum + t.amount, 0);
      const cumulativeMaturity = transactions
        .slice(0, index + 1)
        .reduce((sum, t) => sum + t.maturityAmount, 0);
      
      acc.push({
        date,
        invested: cumulativeInvestment,
        maturityValue: cumulativeMaturity,
        interest: cumulativeMaturity - cumulativeInvestment,
      });
      return acc;
    }, [] as Array<{
      date: string;
      invested: number;
      maturityValue: number;
      interest: number;
    }>);

  const interestRateData = transactions.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    rate: t.interestRate,
    amount: t.amount,
    bank: t.bankName,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Building className="h-16 w-16 text-blue-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading your FD data...</h2>
          <p className="text-muted-foreground">Fetching your fixed deposits</p>
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Fixed Deposits Dashboard
          </h2>
          <p className="text-muted-foreground">Track your Fixed Deposits with accurate interest calculations</p>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <Building className="h-16 w-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Fixed Deposits Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your fixed deposits with accurate simple and compound interest calculations.
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
                {transactions.length} fixed deposits
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Active FDs</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{activeFDs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Avg Interest Rate</CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{avgInterestRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average across all FDs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-3">Current Value</CardTitle>
              <PiggyBank className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{formatCurrency(investmentResult.currentValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time accrued value
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-4">Matured FDs</CardTitle>
              <Calendar className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">{maturedFDs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Already matured
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Profit/Loss</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{formatCurrency(investmentResult.profitLoss)}</div>
              <p className="text-xs text-emerald-600 mt-1">
                {investmentResult.roi >= 0 ? '+' : ''}{investmentResult.roi.toFixed(2)}% ROI
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
                <p className="text-sm text-muted-foreground">Principal vs maturity value over time</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'invested' ? 'Invested' : name === 'maturityValue' ? 'Maturity Value' : 'Interest']} />
                    <Area type="monotone" dataKey="invested" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/20)" />
                    <Area type="monotone" dataKey="maturityValue" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/20)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interest Rate Comparison</CardTitle>
                <p className="text-sm text-muted-foreground">Interest rates across different FDs</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interestRateData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value, name) => [name === 'rate' ? `${value}%` : formatCurrency(Number(value)), name === 'rate' ? 'Interest Rate' : 'Amount']} />
                    <Bar dataKey="rate" fill="hsl(var(--blue-500))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Forms and History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Enhanced Add FD Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Fixed Deposit
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add your FD with accurate interest calculations
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Deposit Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="100000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Investment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_NAMES.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.bankName === 'Other' && (
                    <div className="space-y-2">
                      <Label htmlFor="customBankName">Custom Bank Name</Label>
                      <Input
                        id="customBankName"
                        type="text"
                        value={formData.customBankName}
                        onChange={(e) => handleInputChange('customBankName', e.target.value)}
                        placeholder="Enter bank name"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Interest Rate (%)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        value={formData.interestRate}
                        onChange={(e) => handleInputChange('interestRate', e.target.value)}
                        placeholder="6.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (months)</Label>
                      <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonDurations.map((duration) => (
                            <SelectItem key={duration} value={duration.toString()}>
                              {duration} months
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Enhanced Interest Type Selection */}
                  <div className="space-y-2">
                    <Label>Interest Calculation Type</Label>
                    <Select 
                      value={formData.interestType} 
                      onValueChange={(value) => handleInputChange('interestType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interest type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FDInterestType.SIMPLE}>Simple Interest</SelectItem>
                        <SelectItem value={FDInterestType.COMPOUND}>Compound Interest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Compounding Frequency (only show for compound interest) */}
                  {formData.interestType === FDInterestType.COMPOUND && (
                    <div className="space-y-2">
                      <Label>Compounding Frequency</Label>
                      <Select 
                        value={formData.compoundingFrequency} 
                        onValueChange={(value) => handleInputChange('compoundingFrequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Annually</SelectItem>
                          <SelectItem value="2">Half-yearly</SelectItem>
                          <SelectItem value="4">Quarterly</SelectItem>
                          <SelectItem value="12">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Enhanced Calculation Display */}
                {formData.amount && formData.interestRate && formData.duration && (
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        {formData.interestType === FDInterestType.SIMPLE ? 'Simple Interest' : 'Compound Interest'} Calculation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Principal Amount:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.amount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Rate:</span>
                        <span className="font-medium">{formData.interestRate}% per annum</span>
                      </div>
                      {formData.interestType === FDInterestType.COMPOUND && (
                        <div className="flex justify-between">
                          <span>Effective Rate:</span>
                          <span className="font-medium">{calculations.effectiveRate.toFixed(2)}%</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Interest Earned:</span>
                        <span className="font-medium text-green-600">{formatCurrency(calculations.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Maturity Amount:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(calculations.maturityAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Monthly Interest:</span>
                        <span>{formatCurrency(calculations.monthlyInterest)}</span>
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
                    placeholder="Add any notes about this FD..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Fixed Deposit
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column - FD History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Fixed Deposits History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No fixed deposits yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => {
                      const daysToMaturity = getDaysToMaturity(transaction.maturityDate);
                      const isMatured = daysToMaturity <= 0;
                      const currentValue = calculateCurrentFDValue(transaction);
                      const completionPercentage = getCompletionPercentage(transaction);
                      const accruedInterest = currentValue - transaction.amount;
                      
                      return (
                        <Card key={transaction.id} className={`${isMatured ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-blue-400'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{transaction.bankName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(transaction.date)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                                <Badge variant={isMatured ? "default" : "outline"}>
                                  {isMatured ? 'Matured' : `${daysToMaturity} days left`}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Enhanced real-time value display */}
                            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-blue-700">Current Value:</span>
                                <span className="font-bold text-blue-800">{formatCurrency(currentValue)}</span>
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-blue-600">Accrued Interest:</span>
                                <span className="text-sm font-medium text-emerald-600">+{formatCurrency(accruedInterest)}</span>
                              </div>
                              {!isMatured && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-blue-600 mb-1">
                                    <span>Progress:</span>
                                    <span>{completionPercentage.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${completionPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Rate: {transaction.interestRate}%</p>
                                <p className="text-muted-foreground">Duration: {transaction.duration} months</p>
                                <p className="text-muted-foreground">Maturity: {formatDate(transaction.maturityDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-green-600">
                                  {formatCurrency(transaction.maturityAmount)}
                                </p>
                                <p className="text-sm text-muted-foreground">Final Maturity Value</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="text-red-600 hover:text-red-700 mt-1"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {transaction.notes && (
                              <p className="text-sm text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
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
    </div>
  );
};

export default FDDashboard;