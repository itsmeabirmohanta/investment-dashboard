# API Documentation

## Overview

Investment Dashboard uses Firebase services for authentication and data storage. This document outlines the API structure and data models used in the application.

## Authentication API

### Firebase Authentication

The application uses Firebase Authentication for user management.

#### User Registration
```typescript
interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
}
```

#### User Login
```typescript
interface LoginData {
  email: string;
  password: string;
}
```

## Data Models

### User Profile
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences: {
    theme: 'light' | 'dark';
    currency: string;
    notifications: boolean;
  };
}
```

### Investment Transaction
```typescript
interface Transaction {
  id: string;
  userId: string;
  type: 'gold' | 'silver' | 'stock' | 'mutual-fund' | 'fd' | 'rd';
  action: 'buy' | 'sell' | 'deposit' | 'withdraw';
  amount: number;
  quantity?: number;
  rate?: number;
  date: Timestamp;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Gold Transaction
```typescript
interface GoldTransaction extends Transaction {
  type: 'gold';
  quantity: number; // in grams
  rate: number; // per gram
  purity: '22k' | '24k';
  jeweller?: string;
  hallmark?: boolean;
}
```

### Silver Transaction
```typescript
interface SilverTransaction extends Transaction {
  type: 'silver';
  quantity: number; // in grams/kg
  rate: number; // per gram/kg
  purity: '999' | '925';
}
```

### Stock Transaction
```typescript
interface StockTransaction extends Transaction {
  type: 'stock';
  symbol: string;
  quantity: number; // number of shares
  rate: number; // per share
  exchange: string;
  sector?: string;
}
```

### Mutual Fund Transaction
```typescript
interface MutualFundTransaction extends Transaction {
  type: 'mutual-fund';
  fundName: string;
  nav: number; // Net Asset Value
  units: number;
  category: 'equity' | 'debt' | 'hybrid';
  amc: string; // Asset Management Company
}
```

### Fixed Deposit
```typescript
interface FDTransaction extends Transaction {
  type: 'fd';
  principal: number;
  interestRate: number;
  tenure: number; // in months
  maturityDate: Timestamp;
  maturityAmount: number;
  bank: string;
  accountNumber?: string;
}
```

### Recurring Deposit
```typescript
interface RDTransaction extends Transaction {
  type: 'rd';
  monthlyAmount: number;
  interestRate: number;
  tenure: number; // in months
  maturityDate: Timestamp;
  maturityAmount: number;
  bank: string;
  accountNumber?: string;
}
```

## Firestore Collections

### Structure
```
users/
  {userId}/
    profile: UserProfile
    transactions/
      {transactionId}: Transaction
    rates/
      {rateId}: RateData
```

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transaction access
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rate data access
    match /users/{userId}/rates/{rateId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Service Functions

### Investment Service
```typescript
class InvestmentService {
  // Create transaction
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  
  // Get transactions
  async getTransactions(userId: string, type?: string): Promise<Transaction[]>
  
  // Update transaction
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void>
  
  // Delete transaction
  async deleteTransaction(id: string): Promise<void>
  
  // Get portfolio summary
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary>
}
```

### Calculation Service
```typescript
class CalculationService {
  // Calculate FD maturity
  calculateFDMaturity(principal: number, rate: number, tenure: number): number
  
  // Calculate RD maturity
  calculateRDMaturity(monthlyAmount: number, rate: number, tenure: number): number
  
  // Calculate portfolio value
  calculatePortfolioValue(transactions: Transaction[]): number
  
  // Calculate profit/loss
  calculateProfitLoss(transactions: Transaction[]): ProfitLoss
}
```

## Error Handling

### Common Error Codes
- `auth/user-not-found` - User doesn't exist
- `auth/wrong-password` - Invalid password
- `auth/email-already-in-use` - Email already registered
- `firestore/permission-denied` - Access denied
- `firestore/not-found` - Document not found

### Error Response Format
```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}
```

## Rate Limits

Firebase has built-in rate limiting:
- Firestore: 10,000 writes per second per database
- Authentication: 100 requests per second per IP

## Best Practices

1. **Data Validation**: Always validate data before storing
2. **Error Handling**: Implement proper error handling
3. **Security**: Use Firestore security rules
4. **Performance**: Use pagination for large datasets
5. **Caching**: Implement client-side caching with React Query

## Testing

### Mock Data
```typescript
const mockTransaction: Transaction = {
  id: 'test-id',
  userId: 'user-123',
  type: 'gold',
  action: 'buy',
  amount: 50000,
  quantity: 10,
  rate: 5000,
  date: Timestamp.now(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};
```

### Test Utilities
```typescript
// Create test user
const createTestUser = async (): Promise<User> => { /* ... */ }

// Create test transaction
const createTestTransaction = async (userId: string): Promise<Transaction> => { /* ... */ }
```