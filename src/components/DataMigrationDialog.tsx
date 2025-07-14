import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DataMigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  migrateData: () => Promise<boolean>;
}

export function DataMigrationDialog({
  isOpen,
  onClose,
  migrateData,
}: DataMigrationDialogProps) {
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleMigration = async () => {
    setMigrating(true);
    setError("");
    
    try {
      const result = await migrateData();
      if (result) {
        setSuccess(true);
        toast({
          title: "Data migration successful",
          description: "Your data has been successfully migrated to your account",
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError("Migration failed. Please try again.");
      }
    } catch (err) {
      console.error("Migration error:", err);
      setError("An error occurred during migration. Please try again.");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !migrating && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Data Migration Required</DialogTitle>
          <DialogDescription>
            We need to migrate your existing data to your user account for better security.
            This is a one-time process and won't delete any of your existing information.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center font-medium">Migration Completed Successfully!</p>
            </div>
          ) : (
            <p>
              This process will associate all your transactions with your user account,
              ensuring that only you can access your data. Click "Start Migration" to continue.
            </p>
          )}
        </div>

        <DialogFooter>
          {!success && (
            <>
              <Button variant="outline" onClick={onClose} disabled={migrating}>
                Cancel
              </Button>
              <Button onClick={handleMigration} disabled={migrating}>
                {migrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {migrating ? "Migrating..." : "Start Migration"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 