import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserProfile } from "@/lib/authService";
import { getAuthErrorMessage } from "@/lib/authErrorHandler";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { addUsernameAndPassword } from "@/lib/firebase";

export default function Profile() {
  const { currentUser, logout, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [error, setError] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Update display name when currentUser changes
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser]);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    try {
      setError("");
      setUpdateLoading(true);
      await updateUserProfile(displayName);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (err: unknown) {
      console.error("Update profile error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setUpdateLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage("User not logged in.");
      return;
    }

    try {
      await addUsernameAndPassword(currentUser.uid, username, password);
      setMessage("Username and password added successfully.");
    } catch (error) {
      setMessage("Failed to add username and password.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Your Profile</CardTitle>
          <CardDescription className="text-center">
            Manage your account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleUpdateProfile}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateLoading}>
                {updateLoading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Save
              </Button>
            </div>
          </form>
          {message && <p className="mt-2 text-center">{message}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full"
          >
            Sign Out
          </Button>
          <Button 
            onClick={() => navigate("/")} 
            variant="ghost" 
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}