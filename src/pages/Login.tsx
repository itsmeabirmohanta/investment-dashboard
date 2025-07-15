import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInUser, resetPassword, signInWithGoogle } from "@/lib/authService";
import { getAuthErrorMessage } from "@/lib/authErrorHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FirebaseError } from 'firebase/app';
import AuthDiagnostic from "@/components/AuthDiagnostic";
import ManualFirebaseConfig from "@/components/ManualFirebaseConfig";
import FirebaseConnectionTest from "@/components/FirebaseConnectionTest";
import EnvDiagnostic from "@/components/EnvDiagnostic";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signInUser(email, password);
      navigate("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      await resetPassword(email);
      setResetRequested(true);
      setError("Password reset email sent. Check your inbox for further instructions.");
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      setError(getAuthErrorMessage(err));
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      console.log("Google Sign-In successful:", user);
      // Redirect or perform additional actions here
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button
                      variant="link"
                      className="px-0 font-normal h-auto"
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading || resetRequested}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
                  Sign in with Google
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="underline underline-offset-4 hover:text-primary">
                Register
              </Link>
            </div>
            
            {/* Diagnostic button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiagnostic(true)}
              className="w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              Having trouble? Run Login Diagnostic
            </Button>
          </CardFooter>
        </Card>

        {/* Diagnostic Modal */}
        {showDiagnostic && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Login Diagnostic & Configuration</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDiagnostic(false)}
                  >
                    ✕
                  </Button>
                </div>
                
                <Tabs defaultValue="auth" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="auth">Auth Issues</TabsTrigger>
                    <TabsTrigger value="manual">Manual Config</TabsTrigger>
                    <TabsTrigger value="test">Test Connection</TabsTrigger>
                    <TabsTrigger value="env">Environment</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="auth" className="mt-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Authentication Diagnostic</h3>
                        <p className="text-sm text-muted-foreground">
                          Diagnose login and authentication issues
                        </p>
                      </div>
                      <AuthDiagnostic />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Manual Firebase Configuration</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter Firebase config details manually and test connection
                        </p>
                      </div>
                      <ManualFirebaseConfig />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="test" className="mt-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Test Current Configuration</h3>
                        <p className="text-sm text-muted-foreground">
                          Test your current .env file configuration
                        </p>
                      </div>
                      <FirebaseConnectionTest />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="env" className="mt-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
                        <p className="text-sm text-muted-foreground">
                          View current environment variable status
                        </p>
                      </div>
                      <EnvDiagnostic />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDiagnostic(false)}
                  >
                    Close Diagnostic
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}