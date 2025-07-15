import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { auth, isConfigValid } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

interface AuthTestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

const AuthDiagnostic = () => {
  const [tests, setTests] = useState<AuthTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');

  const updateTest = (name: string, status: AuthTestResult['status'], message: string, details?: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      const newTest = { name, status, message, details };
      if (existing) {
        return prev.map(t => t.name === name ? newTest : t);
      }
      return [...prev, newTest];
    });
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Configuration Check
    updateTest('Configuration', 'loading', 'Checking Firebase configuration...');
    if (!isConfigValid) {
      updateTest('Configuration', 'error', 'Firebase configuration is invalid', 'Check your .env file');
      setIsRunning(false);
      return;
    }
    updateTest('Configuration', 'success', 'Firebase configuration is valid');

    // Test 2: Auth Service Check
    updateTest('Auth Service', 'loading', 'Checking Firebase Auth initialization...');
    if (!auth) {
      updateTest('Auth Service', 'error', 'Firebase Auth not initialized', 'Check your Firebase setup');
      setIsRunning(false);
      return;
    }
    updateTest('Auth Service', 'success', 'Firebase Auth initialized successfully');

    // Test 3: Check Environment Variables
    updateTest('Environment Variables', 'loading', 'Checking environment variables...');
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    if (missingVars.length > 0) {
      updateTest('Environment Variables', 'error', 'Missing environment variables', 
        `Missing: ${missingVars.join(', ')}`);
    } else {
      updateTest('Environment Variables', 'success', 'All required environment variables present');
    }

    // Test 4: Anonymous Authentication Test
    updateTest('Anonymous Auth', 'loading', 'Testing anonymous authentication...');
    try {
      const result = await signInAnonymously(auth);
      updateTest('Anonymous Auth', 'success', 'Anonymous authentication successful', 
        `User ID: ${result.user.uid}`);
      
      // Sign out the anonymous user
      await auth.signOut();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest('Anonymous Auth', 'error', 'Anonymous authentication failed', 
        `Error: ${errorMessage}`);
    }

    // Test 5: Test User Registration (if anonymous auth worked)
    updateTest('User Registration', 'loading', 'Testing user registration...');
    try {
      const testEmailUnique = `test-${Date.now()}@example.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, testEmailUnique, testPassword);
      updateTest('User Registration', 'success', 'User registration successful', 
        `Created user: ${userCredential.user.email}`);
      
      // Test 6: Test Login with the created user
      updateTest('User Login', 'loading', 'Testing login with created user...');
      try {
        await auth.signOut(); // Sign out first
        const loginResult = await signInWithEmailAndPassword(auth, testEmailUnique, testPassword);
        updateTest('User Login', 'success', 'User login successful', 
          `Logged in as: ${loginResult.user.email}`);
        
        // Clean up - delete the test user
        await loginResult.user.delete();
      } catch (loginError: unknown) {
        const loginErrorMessage = loginError instanceof Error ? loginError.message : 'Unknown login error';
        updateTest('User Login', 'error', 'User login failed', 
          `Login Error: ${loginErrorMessage}`);
      }
    } catch (regError: unknown) {
      const regErrorMessage = regError instanceof Error ? regError.message : 'Unknown registration error';
      updateTest('User Registration', 'error', 'User registration failed', 
        `Registration Error: ${regErrorMessage}`);
      
      // Still test login with existing credentials if registration failed
      updateTest('User Login', 'loading', 'Testing login with provided credentials...');
      try {
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
        updateTest('User Login', 'success', 'Login with existing credentials successful');
        await auth.signOut();
      } catch (loginError: unknown) {
        const loginErrorMessage = loginError instanceof Error ? loginError.message : 'Unknown login error';
        updateTest('User Login', 'error', 'Login with existing credentials failed', 
          `Error: ${loginErrorMessage}`);
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: AuthTestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = (status: AuthTestResult['status']) => {
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
        <CardTitle>Firebase Authentication Diagnostic</CardTitle>
        <CardDescription>
          Diagnose authentication issues and test login functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testEmail">Test Email (optional)</Label>
          <Input
            id="testEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="testPassword">Test Password (optional)</Label>
          <Input
            id="testPassword"
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="testpassword123"
          />
        </div>

        <Button 
          onClick={runAuthTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Authentication Tests...
            </>
          ) : (
            'Run Authentication Diagnostic'
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
              <strong>Common Solutions:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Check Firebase Console → Authentication → Sign-in method</li>
                <li>• Ensure Email/Password authentication is enabled</li>
                <li>• Verify your Firebase project ID in .env file</li>
                <li>• Check if your domain is authorized in Firebase Console</li>
                <li>• Ensure Firestore database is created and rules are set</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDiagnostic;