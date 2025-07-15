// Investment Calculation Utilities
// Implements the finalized investment logic as per specifications

import { 
  GoldTransaction, 
  SilverTransaction, 
  FDTransaction, 
  RDTransaction, 
  StockTransaction, 
  MutualFundTransaction 
} from './investmentService';

// Common calculation result interface
export interface InvestmentResult {
  invested: number;
  currentValue: number;
  profitLoss: number;
  roi: number;
  additionalInfo?: Record<string, number>;
}

// FD Interest Type enum
export enum FDInterestType {
  SIMPLE = 'simple',
  COMPOUND = 'compound'
}

// Enhanced FD calculation result interface
export interface FDCalculationResult {
  maturityAmount: number;
  totalInterest: number;
  monthlyInterest: number;
  effectiveRate: number;
}

// 🔵 ENHANCED FD CALCULATION FUNCTIONS

/**
 * Calculate FD maturity using Simple Interest
 * Formula: M = P + (P × r × t/100)
 * Where: P = Principal, r = Rate per annum, t = Time in years
 */
export const calculateFDSimpleInterest = (
  principal: number,
  ratePerAnnum: number,
  timeInYears: number
): FDCalculationResult => {
  const totalInterest = (principal * ratePerAnnum * timeInYears) / 100;
  const maturityAmount = principal + totalInterest;
  const monthlyInterest = totalInterest / (timeInYears * 12);
  
  return {
    maturityAmount,
    totalInterest,
    monthlyInterest,
    effectiveRate: ratePerAnnum
  };
};

/**
 * Calculate FD maturity using Compound Interest
 * Formula: M = P × (1 + r/100)^t
 * Where: P = Principal, r = Rate per annum, t = Time in years
 */
export const calculateFDCompoundInterest = (
  principal: number,
  ratePerAnnum: number,
  timeInYears: number,
  compoundingFrequency: number = 1 // Default: Annual compounding
): FDCalculationResult => {
  const rate = ratePerAnnum / 100;
  const maturityAmount = principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * timeInYears);
  const totalInterest = maturityAmount - principal;
  const monthlyInterest = totalInterest / (timeInYears * 12);
  
  // Calculate effective annual rate
  const effectiveRate = (Math.pow(1 + rate / compoundingFrequency, compoundingFrequency) - 1) * 100;
  
  return {
    maturityAmount,
    totalInterest,
    monthlyInterest,
    effectiveRate
  };
};

/**
 * Calculate FD maturity amount with automatic interest type detection
 * Defaults to compound interest for better accuracy
 */
export const calculateFDMaturity = (
  principal: number,
  ratePerAnnum: number,
  durationMonths: number,
  interestType: FDInterestType = FDInterestType.COMPOUND,
  compoundingFrequency: number = 4 // Default: Quarterly compounding
): FDCalculationResult => {
  const timeInYears = durationMonths / 12;
  
  if (interestType === FDInterestType.SIMPLE) {
    return calculateFDSimpleInterest(principal, ratePerAnnum, timeInYears);
  } else {
    return calculateFDCompoundInterest(principal, ratePerAnnum, timeInYears, compoundingFrequency);
  }
};

/**
 * Calculate current accrued value of an FD at any point in time
 */
export const calculateFDAccruedValue = (
  principal: number,
  ratePerAnnum: number,
  startDate: Date,
  currentDate: Date = new Date(),
  interestType: FDInterestType = FDInterestType.COMPOUND,
  compoundingFrequency: number = 4
): number => {
  const timeElapsedMs = currentDate.getTime() - startDate.getTime();
  const timeElapsedYears = timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25);
  
  if (timeElapsedYears <= 0) {
    return principal;
  }
  
  if (interestType === FDInterestType.SIMPLE) {
    const interest = (principal * ratePerAnnum * timeElapsedYears) / 100;
    return principal + interest;
  } else {
    const rate = ratePerAnnum / 100;
    return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * timeElapsedYears);
  }
};

// 🟡 GOLD CALCULATIONS (✅ COMPLETED — DO NOT TOUCH)
export const calculateGoldInvestment = (
  transactions: GoldTransaction[], 
  currentGoldRate: number
): InvestmentResult => {
  const totalInvested = transactions.reduce((sum, t) => sum + t.amountSent, 0);
  const totalGoldHeld = transactions.reduce((sum, t) => sum + t.goldPurchased, 0);
  const totalLeftover = transactions.reduce((sum, t) => {
    const usableAmount = t.amountSent - t.taxAmount;
    const goldCost = t.goldPurchased * t.goldRate;
    return sum + (usableAmount - goldCost);
  }, 0);
  
  const goldValue = totalGoldHeld * currentGoldRate;
  const currentValue = goldValue + totalLeftover;
  const profitLoss = currentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    invested: totalInvested,
    currentValue,
    profitLoss,
    roi,
    additionalInfo: {
      goldHeld: totalGoldHeld,
      goldValue,
      leftover: totalLeftover,
    }
  };
};

// ⚪ SILVER CALCULATIONS (📌 CLONE OF GOLD)
export const calculateSilverInvestment = (
  transactions: SilverTransaction[], 
  currentSilverRate: number
): InvestmentResult => {
  const totalInvested = transactions.reduce((sum, t) => sum + t.amountSent, 0);
  const totalSilverHeld = transactions.reduce((sum, t) => sum + t.silverPurchased, 0);
  const totalLeftover = transactions.reduce((sum, t) => {
    const usableAmount = t.amountSent - t.taxAmount;
    const silverCost = t.silverPurchased * t.silverRate;
    return sum + (usableAmount - silverCost);
  }, 0);
  
  const silverValue = totalSilverHeld * currentSilverRate;
  const currentValue = silverValue + totalLeftover;
  const profitLoss = currentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    invested: totalInvested,
    currentValue,
    profitLoss,
    roi,
    additionalInfo: {
      silverHeld: totalSilverHeld,
      silverValue,
      leftover: totalLeftover,
    }
  };
};

// 🔵 FIXED DEPOSIT CALCULATIONS - ENHANCED WITH PROPER FORMULAS
export const calculateFDInvestment = (
  transactions: FDTransaction[]
): InvestmentResult => {
  const totalInvested = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  const totalCurrentValue = transactions.reduce((sum, t) => {
    const startDate = new Date(t.date);
    const currentDate = new Date();
    const maturityDate = new Date(t.maturityDate);
    
    // If already matured, use the stored maturity value
    if (currentDate >= maturityDate) {
      return sum + t.maturityAmount;
    }
    
    // Calculate current accrued value using proper compound interest formula
    const accruedValue = calculateFDAccruedValue(
      t.amount,
      t.interestRate,
      startDate,
      currentDate,
      FDInterestType.COMPOUND,
      4 // Quarterly compounding
    );
    
    return sum + accruedValue;
  }, 0);
  
  const profitLoss = totalCurrentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    invested: totalInvested,
    currentValue: totalCurrentValue,
    profitLoss,
    roi,
    additionalInfo: {
      accruedValue: totalCurrentValue,
      activeDeposits: transactions.filter(t => new Date(t.maturityDate) > new Date()).length,
      maturedDeposits: transactions.filter(t => new Date(t.maturityDate) <= new Date()).length,
    }
  };
};

// 🟣 RECURRING DEPOSIT CALCULATIONS - REAL-TIME ACCRUED INTEREST
// Using the standard RD maturity formula: A = P*(1+R/N)^(Nt)
export const calculateRDMaturity = (
  monthlyAmount: number, 
  interestRate: number, 
  durationMonths: number
): { totalInvested: number; maturityAmount: number; totalInterest: number } => {
  const P = monthlyAmount;
  const R = interestRate / 100; // Convert percentage to decimal
  const N = 4; // Compounding frequency (quarterly)
  const totalInvested = P * durationMonths;
  
  let maturityAmount = 0;
  
  // Calculate maturity for each month's deposit using the RD formula
  for (let month = 1; month <= durationMonths; month++) {
    const t = (durationMonths - month + 1) / 12; // Time in years for this deposit
    const monthlyMaturity = P * Math.pow(1 + R / N, N * t);
    maturityAmount += monthlyMaturity;
  }
  
  const totalInterest = maturityAmount - totalInvested;
  
  return {
    totalInvested,
    maturityAmount,
    totalInterest
  };
};

export const calculateRDInvestment = (
  transactions: RDTransaction[]
): InvestmentResult => {
  const currentDate = new Date();
  
  let totalInvested = 0;
  let totalCurrentValue = 0;
  
  transactions.forEach(t => {
    const startDate = new Date(t.date);
    const maturityDate = new Date(t.maturityDate);
    
    // Calculate months elapsed since RD started (including the booking month)
    const monthsElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) + 1;
    const monthsToConsider = Math.min(monthsElapsed, t.duration);
    
    // Calculate invested amount so far (including the booking month)
    const investedSoFar = t.monthlyAmount * monthsToConsider;
    totalInvested += investedSoFar;
    
    if (currentDate >= maturityDate) {
      // If matured, use the proper RD maturity formula
      const { maturityAmount } = calculateRDMaturity(t.monthlyAmount, t.interestRate, t.duration);
      totalCurrentValue += maturityAmount;
    } else {
      // Calculate accrued value for each month's deposit using the RD formula
      let accruedValue = 0;
      const P = t.monthlyAmount;
      const R = t.interestRate / 100;
      const N = 4; // Quarterly compounding
      
      for (let month = 1; month <= monthsToConsider; month++) {
        // Time in years that this month's deposit has been earning interest
        const timeInYears = (monthsToConsider - month + 1) / 12;
        const monthlyAccruedValue = P * Math.pow(1 + R / N, N * timeInYears);
        accruedValue += monthlyAccruedValue;
      }
      
      totalCurrentValue += accruedValue;
    }
  });
  
  const profitLoss = totalCurrentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    invested: totalInvested,
    currentValue: totalCurrentValue,
    profitLoss,
    roi,
    additionalInfo: {
      accruedValue: totalCurrentValue,
      activeDeposits: transactions.length,
    }
  };
};

// 🔺 STOCK CALCULATIONS
export const calculateStockInvestment = (
  transactions: StockTransaction[]
): InvestmentResult => {
  // Group transactions by stock symbol
  const stockGroups = transactions.reduce((groups, t) => {
    if (!groups[t.stockSymbol]) {
      groups[t.stockSymbol] = [];
    }
    groups[t.stockSymbol].push(t);
    return groups;
  }, {} as Record<string, StockTransaction[]>);

  let totalInvested = 0;
  let totalCurrentValue = 0;

  Object.entries(stockGroups).forEach(([symbol, stockTransactions]) => {
    let netQuantity = 0;
    let totalCost = 0;

    stockTransactions.forEach(t => {
      if (t.transactionType === 'buy') {
        netQuantity += t.quantity;
        totalCost += t.totalAmount + t.brokerageCharges;
      } else if (t.transactionType === 'sell') {
        netQuantity -= t.quantity;
        totalCost -= t.totalAmount - t.brokerageCharges;
      }
    });

    if (netQuantity > 0) {
      totalInvested += totalCost;
      // For current value calculation, we need the latest price
      const latestTransaction = stockTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      totalCurrentValue += netQuantity * latestTransaction.price;
    }
  });

  const profitLoss = totalCurrentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    invested: totalInvested,
    currentValue: totalCurrentValue,
    profitLoss,
    roi,
    additionalInfo: {
      uniqueStocks: Object.keys(stockGroups).length,
      totalTransactions: transactions.length,
    }
  };
};

// 🟢 MUTUAL FUND CALCULATIONS
export const calculateMutualFundInvestment = (
  transactions: MutualFundTransaction[]
): InvestmentResult => {
  // Group transactions by fund name
  const fundGroups = transactions.reduce((groups, t) => {
    if (!groups[t.fundName]) {
      groups[t.fundName] = [];
    }
    groups[t.fundName].push(t);
    return groups;
  }, {} as Record<string, MutualFundTransaction[]>);

  let totalInvested = 0;
  let totalCurrentValue = 0;

  Object.entries(fundGroups).forEach(([fundName, fundTransactions]) => {
    let netUnits = 0;
    let totalCost = 0;

    fundTransactions.forEach(t => {
      if (t.transactionType === 'buy') {
        netUnits += t.units;
        totalCost += t.totalAmount + t.charges;
      } else if (t.transactionType === 'sell') {
        netUnits -= t.units;
        totalCost -= t.totalAmount - t.charges;
      }
    });

    if (netUnits > 0) {
      totalInvested += totalCost;
      // For current value calculation, we need the latest NAV
      const latestTransaction = fundTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      const currentValue = netUnits * latestTransaction.nav;
      const exitLoad = 0; // Assuming no exit load for simplicity, can be made configurable
      const netValue = currentValue - exitLoad;
      
      totalCurrentValue += netValue;
    }
  });

  const profitLoss = totalCurrentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    invested: totalInvested,
    currentValue: totalCurrentValue,
    profitLoss,
    roi,
    additionalInfo: {
      uniqueFunds: Object.keys(fundGroups).length,
      totalTransactions: transactions.length,
    }
  };
};

// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

export const formatWeight = (weight: number, unit: string = 'gm'): string => {
  return `${weight.toFixed(2)} ${unit}`;
};

// Bank names for FD/RD dropdowns
export const BANK_NAMES = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'Central Bank of India',
  'Indian Overseas Bank',
  'UCO Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Yes Bank',
  'IndusInd Bank',
  'Federal Bank',
  'South Indian Bank',
  'Karur Vysya Bank',
  'Tamilnad Mercantile Bank',
  'Indian Post Office',
  'Other'
] as const;

// Popular stock symbols for dropdown
export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'ITC', name: 'ITC' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
  { symbol: 'LT', name: 'Larsen & Toubro' },
  { symbol: 'AXISBANK', name: 'Axis Bank' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'HCLTECH', name: 'HCL Technologies' },
  { symbol: 'WIPRO', name: 'Wipro' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
  { symbol: 'TITAN', name: 'Titan Company' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation' },
] as const;

// Popular mutual funds for dropdown
export const POPULAR_MUTUAL_FUNDS = [
  { code: 'SBI-BLUECHIP', name: 'SBI Blue Chip Fund' },
  { code: 'HDFC-EQUITY', name: 'HDFC Equity Fund' },
  { code: 'ICICI-BLUECHIP', name: 'ICICI Prudential Blue Chip Fund' },
  { code: 'AXIS-BLUECHIP', name: 'Axis Blue Chip Fund' },
  { code: 'KOTAK-BLUECHIP', name: 'Kotak Blue Chip Fund' },
  { code: 'NIPPON-LARGECAP', name: 'Nippon India Large Cap Fund' },
  { code: 'FRANKLIN-BLUECHIP', name: 'Franklin India Blue Chip Fund' },
  { code: 'MIRAE-LARGECAP', name: 'Mirae Asset Large Cap Fund' },
  { code: 'UTI-EQUITY', name: 'UTI Equity Fund' },
  { code: 'ADITYA-FRONTLINE', name: 'Aditya Birla Sun Life Frontline Equity Fund' },
  { code: 'SBI-SMALLCAP', name: 'SBI Small Cap Fund' },
  { code: 'HDFC-MIDCAP', name: 'HDFC Mid-Cap Opportunities Fund' },
  { code: 'ICICI-MIDCAP', name: 'ICICI Prudential Mid Cap Fund' },
  { code: 'AXIS-MIDCAP', name: 'Axis Mid Cap Fund' },
  { code: 'KOTAK-MIDCAP', name: 'Kotak Mid Cap Fund' },
  { code: 'NIPPON-MIDCAP', name: 'Nippon India Mid Cap Fund' },
  { code: 'FRANKLIN-MIDCAP', name: 'Franklin India Mid Cap Fund' },
  { code: 'MIRAE-MIDCAP', name: 'Mirae Asset Mid Cap Fund' },
  { code: 'UTI-MIDCAP', name: 'UTI Mid Cap Fund' },
  { code: 'ADITYA-MIDCAP', name: 'Aditya Birla Sun Life Mid Cap Fund' },
] as const;