import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoIcon, AlertTriangleIcon, FileIcon, GlobeIcon, ShieldIcon, KeyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const FirebaseSetupGuide = () => {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Firebase Setup Guide</CardTitle>
        <CardDescription>Follow these steps to set up your Firebase project for data persistence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Required Setup</AlertTitle>
          <AlertDescription>
            You need to create your own Firebase project to enable data persistence. This guide will walk you through the process.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="step1" className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="step1">Step 1: Create Project</TabsTrigger>
            <TabsTrigger value="step2">Step 2: Configure Firestore</TabsTrigger>
            <TabsTrigger value="step3">Step 3: Get Config</TabsTrigger>
            <TabsTrigger value="step4">Step 4: Set Environment</TabsTrigger>
          </TabsList>
          <TabsContent value="step1" className="p-4 border rounded-md mt-2 space-y-4">
            <h3 className="text-lg font-medium">Create a Firebase Project</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console</a></li>
              <li>Click "Add Project" and follow the setup steps</li>
              <li>Name your project (e.g., "gold-stash-tracker")</li>
              <li>Enable Google Analytics if desired (optional)</li>
              <li>Click "Create Project" and wait for setup to complete</li>
            </ol>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => window.open('https://console.firebase.google.com/', '_blank')}>
                Open Firebase Console
                <GlobeIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="step2" className="p-4 border rounded-md mt-2 space-y-4">
            <h3 className="text-lg font-medium">Set Up Firestore Database</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>In your Firebase project, go to "Build" → "Firestore Database"</li>
              <li>Click "Create database"</li>
              <li>Choose either "Start in production mode" or "Start in test mode" (for development, test mode is easier)</li>
              <li>Select a location for your Firestore database</li>
              <li>Set up security rules (for test mode, they're pre-configured)</li>
            </ol>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Security Note</AlertTitle>
              <AlertDescription>
                Test mode allows anyone to read and write to your database. For production use, configure proper security rules.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="step3" className="p-4 border rounded-md mt-2 space-y-4">
            <h3 className="text-lg font-medium">Get Firebase Configuration</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li>In Firebase Console, go to "Project settings" (gear icon)</li>
              <li>Under "Your apps", click the web icon ({"</>"})</li>
              <li>Register your app with a nickname (e.g., "gold-tracker-web")</li>
              <li>Firebase will generate a configuration object</li>
              <li>Copy this configuration for use in the next step</li>
            </ol>
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">
                {`// Example Firebase config object
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="step4" className="p-4 border rounded-md mt-2 space-y-4">
            <h3 className="text-lg font-medium">Set Up Environment Variables</h3>
            <Alert>
              <ShieldIcon className="h-4 w-4" />
              <AlertTitle>Security Best Practice</AlertTitle>
              <AlertDescription>
                Store your Firebase configuration in environment variables to keep sensitive data out of your code.
              </AlertDescription>
            </Alert>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Create a <code className="bg-muted px-1 py-0.5 rounded">.env</code> file in the root of your project</li>
              <li>Add your Firebase configuration as environment variables</li>
              <li>Make sure <code className="bg-muted px-1 py-0.5 rounded">.env</code> is in your <code className="bg-muted px-1 py-0.5 rounded">.gitignore</code> file</li>
            </ol>
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">
                {`# Contents of .env file
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"`}
              </pre>
            </div>
            <Alert className="mt-4">
              <KeyIcon className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                After creating the .env file, restart your development server for the changes to take effect.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                const path = ".env";
                alert(`Please create and edit ${path} in your project root to add your Firebase config`);
              }}>
                <FileIcon className="mr-2 h-4 w-4" />
                Configure .env File
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Need more help? Check the <a href="https://firebase.google.com/docs/web/setup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase documentation</a>.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload Application
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FirebaseSetupGuide; 