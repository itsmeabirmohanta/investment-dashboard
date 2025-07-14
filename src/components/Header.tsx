import { Link } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/context/AuthContext";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Close sheet when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return (
    <header className="bg-background sticky top-0 z-30 w-full border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <img src="./gold-coin-favicon.svg" alt="Logo" className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">Gold Stash</span>
        </Link>


        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Mobile Menu */}
          {isAuthenticated && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex flex-col space-y-4 py-4">
                  <Link
                    to="/"
                    className="flex items-center space-x-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <img src="./gold-coin-favicon.svg" alt="Logo" className="h-6 w-6" />
                    <span className="font-bold">Gold Stash</span>
                  </Link>
                  <nav className="flex flex-col space-y-2 pt-4">
                    <Link
                      to="/"
                      className="flex items-center py-2 text-sm font-medium transition-colors hover:text-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}