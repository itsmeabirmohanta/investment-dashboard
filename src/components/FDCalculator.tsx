import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Info, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  calculateFDMaturity, 
  calculateFDSimpleInterest, 
  calculateFDCompoundInterest,
  FDInterestType,
  formatCurrency 
} from '@/lib/investmentCalculations';

interface FDCalculatorProps {
  onCalculate?: (result: any) => void;
  showExamples?: boolean;
}

const FDCalculator: React.FC<FDCalculatorProps> = ({ onCalculate, showExamples = true }) => {
  const [formData, setFormData] = useState({
    amount: '',
    interestRate: '',
    duration: '',
    interestType: FDInterestType.COMPOUND,
    compoundingFrequency: '4', // Quarterly by default
  });

  const [result, setResult] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateFD = () => {
    const amount = parseFloat(formData.amount);
    const interestRate = parseFloat(formData.interestRate);
    const duration = parseFloat(formData.duration);
    const compoundingFreq = parseInt(formData.compoundingFrequency);

    if (!amount || !interestRate || !duration) {
      return;
    }

    // Calculate with selected interest type
    const calculationResult = calculateFDMaturity(
      amount,
      interestRate,
      duration,
      formData.interestType as FDInterestType,
      compoundingFreq
    );

    // Calculate comparison between simple and compound interest
    const simpleResult = calculateFDSimpleInterest(amount, interestRate, duration / 12);
    const compoundResult = calculateFDCompoundInterest(amount, interestRate, duration / 12, compoundingFreq);
    
    const comparisonData = {
      simple: simpleResult,
      compound: compoundResult,
      difference: compoundResult.maturityAmount - simpleResult.maturityAmount,
      percentageDifference: ((compoundResult.maturityAmount - simpleResult.maturityAmount) / simpleResult.maturityAmount) * 100
    };

    setResult(calculationResult);
    setComparison(comparisonData);

    if (onCalculate) {
      onCalculate({
        ...calculationResult,
        comparison: comparisonData
      });
    }
  };

  useEffect(() => {
    if (formData.amount && formData.interestRate && formData.duration) {
      calculateFD();
    }
  }, [formData]);

  const examples = [
    {
      title: "Example 1: Standard FD",
      amount: 100000,
      rate: 6.5,
      duration: 12,
      description: "₹1,00,000 at 6.5% for 1 year"
    },
    {
      title: "Example 2: Long-term FD",
      amount: 500000,
      rate: 7.25,
      duration: 60,
      description: "₹5,00,000 at 7.25% for 5 years"
    },
    {
      title: "Example 3: Short-term FD",
      amount: 250000,
      rate: 5.75,
      duration: 6,
      description: "₹2,50,000 at 5.75% for 6 months"
    }
  ];

  const loadExample = (example: any) => {
    setFormData({
      amount: example.amount.toString(),
      interestRate: example.rate.toString(),
      duration: example.duration.toString(),
      interestType: FDInterestType.COMPOUND,
      compoundingFrequency: '4'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            FD Calculator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculate your Fixed Deposit returns with accurate simple and compound interest formulas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calc-amount">Principal Amount (₹)</Label>
              <Input
                id="calc-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="100000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calc-rate">Interest Rate (% per annum)</Label>
              <Input
                id="calc-rate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                placeholder="6.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calc-duration">Duration (months)</Label>
              <Input
                id="calc-duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label>Interest Type</Label>
              <Select 
                value={formData.interestType} 
                onValueChange={(value) => handleInputChange('interestType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FDInterestType.SIMPLE}>Simple Interest</SelectItem>
                  <SelectItem value={FDInterestType.COMPOUND}>Compound Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.interestType === FDInterestType.COMPOUND && (
              <div className="space-y-2 md:col-span-2">
                <Label>Compounding Frequency</Label>
                <Select 
                  value={formData.compoundingFrequency} 
                  onValueChange={(value) => handleInputChange('compoundingFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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

          <Button onClick={calculateFD} className="w-full">
            Calculate FD Returns
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Principal</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(parseFloat(formData.amount))}
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Interest Earned</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(result.totalInterest)}
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Maturity Amount</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(result.maturityAmount)}
                </p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Calculator className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Effective Rate</p>
                <p className="text-lg font-bold text-orange-600">
                  {result.effectiveRate.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Monthly Interest:</span>
                <span className="font-medium">{formatCurrency(result.monthlyInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Duration:</span>
                <span className="font-medium">{formData.duration} months ({(parseFloat(formData.duration) / 12).toFixed(1)} years)</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Type:</span>
                <span className="font-medium">
                  <Badge variant={formData.interestType === FDInterestType.SIMPLE ? "secondary" : "default"}>
                    {formData.interestType === FDInterestType.SIMPLE ? 'Simple Interest' : 'Compound Interest'}
                  </Badge>
                </span>
              </div>
              {formData.interestType === FDInterestType.COMPOUND && (
                <div className="flex justify-between">
                  <span>Compounding:</span>
                  <span className="font-medium">
                    {formData.compoundingFrequency === '1' ? 'Annually' : 
                     formData.compoundingFrequency === '2' ? 'Half-yearly' : 
                     formData.compoundingFrequency === '4' ? 'Quarterly' : 'Monthly'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Simple vs Compound Interest Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-700">Simple Interest</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Formula:</span>
                    <span className="font-mono text-xs">M = P + (P×r×t/100)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest:</span>
                    <span className="font-medium">{formatCurrency(comparison.simple.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maturity:</span>
                    <span className="font-medium">{formatCurrency(comparison.simple.maturityAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-blue-700">Compound Interest</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Formula:</span>
                    <span className="font-mono text-xs">M = P×(1+r/100)^t</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest:</span>
                    <span className="font-medium">{formatCurrency(comparison.compound.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maturity:</span>
                    <span className="font-medium">{formatCurrency(comparison.compound.maturityAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-700">Advantage of Compound Interest</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Additional Amount:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(comparison.difference)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Percentage Gain:</span>
                  <span className="font-bold text-green-600">
                    +{comparison.percentageDifference.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showExamples && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Examples</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on any example to load the values and see the calculation
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examples.map((example, index) => (
                <div key={index} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => loadExample(example)}>
                  <h4 className="font-semibold mb-2">{example.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{example.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Load Example
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FDCalculator;