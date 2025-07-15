import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

const ManualFirebaseConfig = () => {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [configValid, setConfigValid] = useState(false);

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

  const validateConfig = () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    return requiredFields.every(field => config[field as keyof FirebaseConfig]?.trim() !== '');
  };

  const handleInputChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setConfigValid(validateConfig());
  };

  const testConnection = async () => {
    if (!validateConfig()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsRunning(true);
    setTests([]);

    let testApp;
    let testDb;
    let testAuth;

    try {
      // Test 1: Configuration Validation
      updateTest('Configuration', 'loading', 'Validating configuration...');
      
      if (!config.apiKey || !config.authDomain || !config.projectId) {
        updateTest('Configuration', 'error', 'Missing required configuration fields');
        setIsRunning(false);
        return;
      }

      updateTest('Configuration', 'success', 'Configuration fields are valid');

      // Test 2: Firebase Initialization
      updateTest('Initialization', 'loading', 'Initializing Firebase with provided config...');
      
      try {
        testApp = initializeApp(config, 'test-app-' + Date.now());
        testDb = getFirestore(testApp);
        testAuth = getAuth(testApp);
        
        updateTest('Initialization', 'success', 'Firebase initialized successfully');
      } catch (error) {
        updateTest('Initialization', 'error', 'Firebase initialization failed', 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsRunning(false);
        return;
      }

      // Test 3: Authentication Test
      updateTest('Authentication', 'loading', 'Testing authentication...');
      
      try {
        const userCredential = await signInAnonymously(testAuth);
        updateTest('Authentication', 'success', 'Anonymous authentication successful', 
          `User ID: ${userCredential.user.uid}`);
      } catch (error) {
        updateTest('Authentication', 'error', 'Authentication failed', 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsRunning(false);
        return;
      }

      // Test 4: Firestore Connection Test
      updateTest('Firestore Connection', 'loading', 'Testing Firestore connection...');
      
      try {
        const testDoc = doc(testDb, 'test', 'connection-test');
        await getDoc(testDoc);
        updateTest('Firestore Connection', 'success', 'Firestore connection successful');
      } catch (error) {
        updateTest('Firestore Connection', 'error', 'Firestore connection failed', 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 5: Project Access Test
      updateTest('Project Access', 'loading', 'Testing project access...');
      
      try {
        const userId = testAuth.currentUser?.uid;
        if (userId) {
          const userDoc = doc(testDb, 'users', userId);
          await getDoc(userDoc);
          updateTest('Project Access', 'success', 'Project access successful');
        } else {
          updateTest('Project Access', 'error', 'No authenticated user found');
        }
      } catch (error) {
        updateTest('Project Access', 'error', 'Project access failed', 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      updateTest('General Error', 'error', 'Unexpected error occurred', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up test app
      if (testApp) {
        try {
          await testApp.delete();
        } catch (error) {
          console.warn('Error cleaning up test app:', error);
        }
      }
      setIsRunning(false);
    }
  };

  const generateEnvFile = () => {
    const envContent = `# Firebase Configuration
VITE_FIREBASE_API_KEY="${config.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${config.authDomain}"
VITE_FIREBASE_PROJECT_ID="${config.projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${config.storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${config.messagingSenderId}"
VITE_FIREBASE_APP_ID="${config.appId}"${config.measurementId ? `\nVITE_FIREBASE_MEASUREMENT_ID="${config.measurementId}"` : ''}`;

    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    link.click();
    URL.revokeObjectURL(url);
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Firebase Configuration</CardTitle>
          <CardDescription>
            Manually enter your Firebase configuration details to test the connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">API Key *</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your Firebase API Key"
                  value={config.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="authDomain">Auth Domain *</Label>
              <Input
                id="authDomain"
                placeholder="your-project.firebaseapp.com"
                value={config.authDomain}
                onChange={(e) => handleInputChange('authDomain', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="projectId">Project ID *</Label>
              <Input
                id="projectId"
                placeholder="your-project-id"
                value={config.projectId}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="storageBucket">Storage Bucket *</Label>
              <Input
                id="storageBucket"
                placeholder="your-project.appspot.com"
                value={config.storageBucket}
                onChange={(e) => handleInputChange('storageBucket', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="messagingSenderId">Messaging Sender ID *</Label>
              <Input
                id="messagingSenderId"
                placeholder="123456789"
                value={config.messagingSenderId}
                onChange={(e) => handleInputChange('messagingSenderId', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="appId">App ID *</Label>
              <Input
                id="appId"
                placeholder="1:123456789:web:abcdef123456"
                value={config.appId}
                onChange={(e) => handleInputChange('appId', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="measurementId">Measurement ID (Optional)</Label>
              <Input
                id="measurementId"
                placeholder="G-XXXXXXXXXX"
                value={config.measurementId}
                onChange={(e) => handleInputChange('measurementId', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={testConnection} 
              disabled={!validateConfig() || isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Firebase Connection'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={generateEnvFile}
              disabled={!validateConfig()}
            >
              Generate .env File
            </Button>
          </div>

          {!validateConfig() && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Required Fields</AlertTitle>
              <AlertDescription>
                Please fill in all required fields marked with * before testing the connection.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                        <div className="mt-2 text-xs opacity-75 font-mono">
                          {test.details}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}

            {!isRunning && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Next Steps</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• If tests passed, click "Generate .env File" to download your configuration</li>
                    <li>• Place the .env file in your project root directory</li>
                    <li>• Restart your development server for changes to take effect</li>
                    <li>• If tests failed, verify your Firebase project settings and try again</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManualFirebaseConfig;