import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, RefreshCw, Wallet, PiggyBank, DollarSign, Plus, History, Calendar, ArrowLeft, Edit, Save, X } from 'lucide-react';
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
  fetchRDTransactions, 
  addRDTransaction, 
  updateRDTransaction, 
  deleteRDTransaction,
  RDTransaction
} from '@/lib/investmentService';
import { calculateRDInvestment, calculateRDMaturity, formatCurrency, BANK_NAMES } from '@/lib/investmentCalculations';

const commonDurations = [12, 24, 36, 48, 60, 84, 120]; // in months

const RDDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<RDTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit RD State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    monthlyAmount: '',
    bankName: '',
    customBankName: '',
    interestRate: '',
    duration: '',
    date: '',
    notes: '',
  });

  // Transaction Form State
  const [formData, setFormData] = useState({
    monthlyAmount: '',
    bankName: '',
    customBankName: '',
    interestRate: '',
    duration: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
  });

  const [calculations, setCalculations] = useState({
    totalInvested: 0,
    maturityAmount: 0,
    totalInterest: 0,
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
        const rdTransactions = await fetchRDTransactions();
        setTransactions(rdTransactions);
      } catch (error) {
        console.error('Error loading RD data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load your recurring deposits. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Calculate metrics using the new calculation library
  const investmentResult = calculateRDInvestment(transactions);
  const totalMonthlyInvestment = transactions.reduce((sum, t) => sum + t.monthlyAmount, 0);
  const avgInterestRate = transactions.length > 0 ? 
    transactions.reduce((sum, t) => sum + t.interestRate, 0) / transactions.length : 0;

  const activeRDs = transactions.filter(t => new Date(t.maturityDate) > new Date());
  const maturedRDs = transactions.filter(t => new Date(t.maturityDate) <= new Date());

  const updateCalculations = (data: typeof formData) => {
    const monthlyAmount = parseFloat(data.monthlyAmount) || 0;
    const interestRate = parseFloat(data.interestRate) || 0;
    const duration = parseFloat(data.duration) || 0;

    if (monthlyAmount && interestRate && duration) {
      const { totalInvested, maturityAmount, totalInterest } = calculateRDMaturity(monthlyAmount, interestRate, duration);

      setCalculations({
        totalInvested,
        maturityAmount,
        totalInterest,
      });
    } else {
      setCalculations({
        totalInvested: 0,
        maturityAmount: 0,
        totalInterest: 0,
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
    
    const monthlyAmount = parseFloat(formData.monthlyAmount);
    const interestRate = parseFloat(formData.interestRate);
    const duration = parseFloat(formData.duration);
    const bankName = formData.bankName === 'Other' ? formData.customBankName : formData.bankName;

    if (!monthlyAmount || !bankName || !interestRate || !duration) {
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

      const { totalInvested, maturityAmount } = calculateRDMaturity(monthlyAmount, interestRate, duration);

      const newTransaction = {
        date: startDate.toISOString(),
        monthlyAmount,
        bankName,
        interestRate,
        duration,
        maturityDate: maturityDate.toISOString(),
        totalInvested,
        maturityAmount,
        installmentsPaid: 0,
        notes: formData.notes,
      };

      const id = await addRDTransaction(newTransaction);
      const transactionWithId = { ...newTransaction, id, userId: currentUser!.uid };
      
      setTransactions(prev => [transactionWithId, ...prev]);
      
      // Reset form
      setFormData({
        monthlyAmount: '',
        bankName: '',
        customBankName: '',
        interestRate: '',
        duration: '',
        date: new Date().toISOString().split('T')[0], // Reset to today
        notes: '',
      });
      setCalculations({
        totalInvested: 0,
        maturityAmount: 0,
        totalInterest: 0,
      });

      toast({
        title: "RD Added Successfully",
        description: `Recurring Deposit of ${formatCurrency(monthlyAmount)}/month created with ${bankName}`,
      });
    } catch (error) {
      console.error('Error adding RD:', error);
      toast({
        title: "Error Adding RD",
        description: "Failed to add your recurring deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteRDTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: "RD Deleted",
        description: "Recurring Deposit has been removed from your records.",
      });
    } catch (error) {
      console.error('Error deleting RD:', error);
      toast({
        title: "Error Deleting RD",
        description: "Failed to delete recurring deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysToMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCompletionPercentage = (rd: RDTransaction) => {
    return (rd.installmentsPaid / rd.duration) * 100;
  };

  // Helper function to calculate individual RD current value using proper RD formula
  const calculateCurrentRDValue = (transaction: RDTransaction) => {
    const startDate = new Date(transaction.date);
    const currentDate = new Date();
    const maturityDate = new Date(transaction.maturityDate);
    
    // Calculate months elapsed since RD started
    const monthsElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const monthsToConsider = Math.min(monthsElapsed, transaction.duration);
    
    if (currentDate >= maturityDate) {
      // If matured, use full maturity value
      return transaction.maturityAmount;
    } else {
      // Calculate accrued value using the proper RD formula: A = P*(1+R/N)^(Nt)
      let accruedValue = 0;
      const P = transaction.monthlyAmount;
      const R = transaction.interestRate / 100;
      const N = 4; // Quarterly compounding
      
      for (let month = 1; month <= monthsToConsider; month++) {
        // Time in years that this month's deposit has been earning interest
        const timeInYears = (monthsToConsider - month + 1) / 12;
        const monthlyAccruedValue = P * Math.pow(1 + R / N, N * timeInYears);
        accruedValue += monthlyAccruedValue;
      }
      
      return accruedValue;
    }
  };

  // Helper function to get actual invested amount for RD (including booking month)
  const getActualInvestedAmount = (transaction: RDTransaction) => {
    const startDate = new Date(transaction.date);
    const currentDate = new Date();
    const monthsElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) + 1; // Include booking month
    const monthsToConsider = Math.min(monthsElapsed, transaction.duration);
    
    return transaction.monthlyAmount * monthsToConsider;
  };

  // Edit functionality handlers
  const handleEditTransaction = (transaction: RDTransaction) => {
    setEditingId(transaction.id);
    setEditFormData({
      monthlyAmount: transaction.monthlyAmount.toString(),
      bankName: transaction.bankName,
      customBankName: transaction.bankName === 'Other' ? transaction.bankName : '',
      interestRate: transaction.interestRate.toString(),
      duration: transaction.duration.toString(),
      date: new Date(transaction.date).toISOString().split('T')[0],
      notes: transaction.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      monthlyAmount: '',
      bankName: '',
      customBankName: '',
      interestRate: '',
      duration: '',
      date: '',
      notes: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const monthlyAmount = parseFloat(editFormData.monthlyAmount);
    const interestRate = parseFloat(editFormData.interestRate);
    const duration = parseFloat(editFormData.duration);
    const bankName = editFormData.bankName === 'Other' ? editFormData.customBankName : editFormData.bankName;

    if (!monthlyAmount || !bankName || !interestRate || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDate = new Date(editFormData.date);
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + duration);

      const { totalInvested, maturityAmount } = calculateRDMaturity(monthlyAmount, interestRate, duration);

      const updatedTransaction = {
        date: startDate.toISOString(),
        monthlyAmount,
        bankName,
        interestRate,
        duration,
        maturityDate: maturityDate.toISOString(),
        totalInvested,
        maturityAmount,
        installmentsPaid: 0,
        notes: editFormData.notes,
      };

      await updateRDTransaction(editingId, updatedTransaction);
      
      setTransactions(prev => prev.map(t => 
        t.id === editingId ? { ...updatedTransaction, id: editingId, userId: currentUser!.uid } : t
      ));

      setEditingId(null);
      setEditFormData({
        monthlyAmount: '',
        bankName: '',
        customBankName: '',
        interestRate: '',
        duration: '',
        date: '',
        notes: '',
      });

      toast({
        title: "RD Updated Successfully",
        description: `Recurring Deposit updated with new details.`,
      });
    } catch (error) {
      console.error('Error updating RD:', error);
      toast({
        title: "Error Updating RD",
        description: "Failed to update recurring deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Chart data
  const chartData = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, transaction, index) => {
      const date = new Date(transaction.date).toLocaleDateString('en-IN', { 
        month: 'short', 
        year: '2-digit' 
      });
      const cumulativeMonthly = transactions
        .slice(0, index + 1)
        .reduce((sum, t) => sum + t.monthlyAmount, 0);
      const cumulativeMaturity = transactions
        .slice(0, index + 1)
        .reduce((sum, t) => sum + t.maturityAmount, 0);
      
      acc.push({
        date,
        monthlyInvestment: cumulativeMonthly,
        maturityValue: cumulativeMaturity,
        projectedInterest: cumulativeMaturity - (cumulativeMonthly * 12), // Approximation
      });
      return acc;
    }, [] as Array<{
      date: string;
      monthlyInvestment: number;
      maturityValue: number;
      projectedInterest: number;
    }>);

  const interestRateData = transactions.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    rate: t.interestRate,
    monthlyAmount: t.monthlyAmount,
    bank: t.bankName,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-green-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading your RD data...</h2>
          <p className="text-muted-foreground">Fetching your recurring deposits</p>
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Recurring Deposits Dashboard
          </h2>
          <p className="text-muted-foreground">Track your Recurring Deposits and systematic savings</p>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center">
              <Calendar className="h-16 w-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recurring Deposits Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your recurring deposits by adding your first RD below.
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
                Across {transactions.length} RDs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-100 to-green-200 border-green-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Monthly Investment</CardTitle>
              <RefreshCw className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totalMonthlyInvestment)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across active RDs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Active RDs</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{activeRDs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-3">Maturity Value</CardTitle>
              <PiggyBank className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{formatCurrency(investmentResult.currentValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Expected at maturity
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-4">Avg Interest Rate</CardTitle>
              <Plus className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">{avgInterestRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average across all RDs
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
                <CardTitle className="text-lg">Monthly Investment Growth</CardTitle>
                <p className="text-sm text-muted-foreground">Cumulative monthly contributions vs maturity value</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'monthlyInvestment' ? 'Monthly Investment' : 'Maturity Value']} />
                    <Area type="monotone" dataKey="monthlyInvestment" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/20)" />
                    <Area type="monotone" dataKey="maturityValue" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/20)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interest Rate Comparison</CardTitle>
                <p className="text-sm text-muted-foreground">Interest rates across different RDs</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interestRateData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value, name) => [name === 'rate' ? `${value}%` : formatCurrency(Number(value)), name === 'rate' ? 'Interest Rate' : 'Monthly Amount']} />
                    <Bar dataKey="rate" fill="hsl(var(--green-500))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Forms and History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Add RD Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Recurring Deposit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyAmount">Monthly Amount (₹)</Label>
                    <Input
                      id="monthlyAmount"
                      type="number"
                      value={formData.monthlyAmount}
                      onChange={(e) => handleInputChange('monthlyAmount', e.target.value)}
                      placeholder="5000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Investment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
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
                </div>

                {formData.monthlyAmount && formData.interestRate && formData.duration && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Maturity Calculations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly Investment:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.monthlyAmount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Investment:</span>
                        <span className="font-medium">{formatCurrency(calculations.totalInvested)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Earned:</span>
                        <span className="font-medium">{formatCurrency(calculations.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Maturity Amount:</span>
                        <span className="font-bold text-green-600">{formatCurrency(calculations.maturityAmount)}</span>
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
                    placeholder="Add any notes about this RD..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Recurring Deposit
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column - RD History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recurring Deposits History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No recurring deposits yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => {
                      const daysToMaturity = getDaysToMaturity(transaction.maturityDate);
                      const isMatured = daysToMaturity <= 0;
                      const currentValue = calculateCurrentRDValue(transaction);
                      const actualInvested = getActualInvestedAmount(transaction);
                      const accruedInterest = currentValue - actualInvested;
                      const completionPercentage = getCompletionPercentage(transaction);
                      const isEditing = editingId === transaction.id;
                      
                      return (
                        <Card key={transaction.id} className={`${isMatured ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-blue-400'}`}>
                          <CardContent className="p-4">
                            {isEditing ? (
                              /* Edit Mode */
                              <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-medium">Edit RD Details</h4>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleSaveEdit}
                                      className="flex items-center gap-1"
                                    >
                                      <Save className="h-3 w-3" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                      className="flex items-center gap-1"
                                    >
                                      <X className="h-3 w-3" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-monthlyAmount-${transaction.id}`}>Monthly Amount (₹)</Label>
                                    <Input
                                      id={`edit-monthlyAmount-${transaction.id}`}
                                      type="number"
                                      value={editFormData.monthlyAmount}
                                      onChange={(e) => handleEditInputChange('monthlyAmount', e.target.value)}
                                      placeholder="5000"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-date-${transaction.id}`}>Investment Date</Label>
                                    <Input
                                      id={`edit-date-${transaction.id}`}
                                      type="date"
                                      value={editFormData.date}
                                      onChange={(e) => handleEditInputChange('date', e.target.value)}
                                      max={new Date().toISOString().split('T')[0]}
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-bankName-${transaction.id}`}>Bank Name</Label>
                                  <Select value={editFormData.bankName} onValueChange={(value) => handleEditInputChange('bankName', value)}>
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
                                
                                {editFormData.bankName === 'Other' && (
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-customBankName-${transaction.id}`}>Custom Bank Name</Label>
                                    <Input
                                      id={`edit-customBankName-${transaction.id}`}
                                      type="text"
                                      value={editFormData.customBankName}
                                      onChange={(e) => handleEditInputChange('customBankName', e.target.value)}
                                      placeholder="Enter bank name"
                                    />
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-interestRate-${transaction.id}`}>Interest Rate (%)</Label>
                                    <Input
                                      id={`edit-interestRate-${transaction.id}`}
                                      type="number"
                                      step="0.01"
                                      value={editFormData.interestRate}
                                      onChange={(e) => handleEditInputChange('interestRate', e.target.value)}
                                      placeholder="6.5"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-duration-${transaction.id}`}>Duration (months)</Label>
                                    <Select value={editFormData.duration} onValueChange={(value) => handleEditInputChange('duration', value)}>
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
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-notes-${transaction.id}`}>Notes (Optional)</Label>
                                  <Textarea
                                    id={`edit-notes-${transaction.id}`}
                                    value={editFormData.notes}
                                    onChange={(e) => handleEditInputChange('notes', e.target.value)}
                                    placeholder="Add any notes about this RD..."
                                    rows={2}
                                  />
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium">{transaction.bankName}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(transaction.date)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(transaction.monthlyAmount)}/month</p>
                                    <Badge variant={isMatured ? "default" : "outline"}>
                                      {isMatured ? 'Matured' : `${daysToMaturity} days left`}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Real-time value display */}
                                <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-green-700">Current Value:</span>
                                    <span className="font-bold text-green-800">{formatCurrency(currentValue)}</span>
                                  </div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-green-600">Invested So Far:</span>
                                    <span className="text-sm font-medium text-blue-600">{formatCurrency(actualInvested)}</span>
                                  </div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-green-600">Accrued Interest:</span>
                                    <span className="text-sm font-medium text-emerald-600">+{formatCurrency(accruedInterest)}</span>
                                  </div>
                                  {!isMatured && (
                                    <div className="mt-2">
                                      <div className="flex justify-between text-xs text-green-600 mb-1">
                                        <span>Progress:</span>
                                        <span>{completionPercentage.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full bg-green-200 rounded-full h-2">
                                        <div 
                                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
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
                                    <div className="flex gap-2 mt-1 justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTransaction(transaction)}
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
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
                                </div>
                                {transaction.notes && (
                                  <p className="text-sm text-muted-foreground mt-2 p-2 bg-green-50 rounded">
                                    {transaction.notes}
                                  </p>
                                )}
                              </>
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

export default RDDashboard;