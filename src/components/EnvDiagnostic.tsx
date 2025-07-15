import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

const EnvDiagnostic = () => {
  const envVars = {
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
    'VITE_FIREBASE_MEASUREMENT_ID': import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const allVarsPresent = Object.entries(envVars).every(([key, value]) => 
    key === 'VITE_FIREBASE_MEASUREMENT_ID' ? true : !!value
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allVarsPresent ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          Environment Variables Diagnostic
        </CardTitle>
        <CardDescription>
          Checking if Firebase environment variables are loaded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={allVarsPresent ? "default" : "destructive"}>
          <AlertDescription>
            {allVarsPresent 
              ? "All required environment variables are loaded correctly!" 
              : "Some environment variables are missing. Please check your .env file."}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="font-mono text-sm">{key}</span>
              <div className="flex items-center gap-2">
                {value ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      {key.includes('API_KEY') ? '***' : value.substring(0, 20)}...
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">Missing</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvDiagnostic;