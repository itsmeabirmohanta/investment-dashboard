import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { db, auth, isConfigValid } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

const FirebaseConnectionTest = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      const newTest = { name, status, message, details };
      if (existing) {
        return prev.map(t => t.name === name ? newTest : t);
      }
      return [...prev, newTest];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Configuration Check
    updateTest('Configuration', 'loading', 'Checking Firebase configuration...');
    if (isConfigValid) {
      updateTest('Configuration', 'success', 'Firebase configuration is valid');
    } else {
      updateTest('Configuration', 'error', 'Firebase configuration is invalid', 'Check your .env file');
      setIsRunning(false);
      return;
    }

    // Test 2: Firebase Initialization
    updateTest('Initialization', 'loading', 'Checking Firebase initialization...');
    if (db && auth) {
      updateTest('Initialization', 'success', 'Firebase services initialized successfully');
    } else {
      updateTest('Initialization', 'error', 'Firebase services failed to initialize', 
        `Database: ${db ? 'OK' : 'Failed'}, Auth: ${auth ? 'OK' : 'Failed'}`);
      setIsRunning(false);
      return;
    }

    // Test 3: Authentication Test
    updateTest('Authentication', 'loading', 'Testing authentication...');
    try {
      const userCredential = await signInAnonymously(auth);
      updateTest('Authentication', 'success', 'Anonymous authentication successful', 
        `User ID: ${userCredential.user.uid}`);
    } catch (error: unknown) {
      updateTest('Authentication', 'error', 'Authentication failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRunning(false);
      return;
    }

    // Test 4: Firestore Connection Test
    updateTest('Firestore Connection', 'loading', 'Testing Firestore connection...');
    try {
      const testDoc = doc(db, 'test', 'connection-test');
      await getDoc(testDoc);
      updateTest('Firestore Connection', 'success', 'Firestore connection successful');
    } catch (error: unknown) {
      updateTest('Firestore Connection', 'error', 'Firestore connection failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: User Document Access
    updateTest('User Access', 'loading', 'Testing user document access...');
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDoc = doc(db, 'users', userId);
        await getDoc(userDoc);
        updateTest('User Access', 'success', 'User document access successful');
      } else {
        updateTest('User Access', 'error', 'No authenticated user found');
      }
    } catch (error: unknown) {
      updateTest('User Access', 'error', 'User document access failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 6: Transactions Collection Access
    updateTest('Transactions Access', 'loading', 'Testing transactions collection access...');
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const transactionsCollection = collection(db, `users/${userId}/investments/gold/transactions`);
        const snapshot = await getDocs(transactionsCollection);
        updateTest('Transactions Access', 'success', 
          `Transactions collection access successful (${snapshot.docs.length} documents)`);
      } else {
        updateTest('Transactions Access', 'error', 'No authenticated user for transactions test');
      }
    } catch (error: unknown) {
      updateTest('Transactions Access', 'error', 'Transactions collection access failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'loading': return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Firebase Connection Diagnostic</CardTitle>
        <CardDescription>
          Run this test to identify Firebase connection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Firebase Connection Test'
          )}
        </Button>

        {tests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {tests.map((test, index) => (
              <Alert key={index} className={getStatusColor(test.status)}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{test.name}</span>
                    </div>
                    <AlertDescription className="mt-1">
                      {test.message}
                      {test.details && (
                        <div className="mt-2 text-xs opacity-75">
                          {test.details}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {tests.length > 0 && !isRunning && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• If authentication failed, check your Firebase project settings</li>
                <li>• If Firestore connection failed, verify your project ID and region</li>
                <li>• If user access failed, check your Firestore security rules</li>
                <li>• If transactions access failed, ensure proper user authentication</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FirebaseConnectionTest;