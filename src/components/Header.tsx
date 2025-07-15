import { Link, useLocation } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/context/AuthContext";
import { 
  Menu, 
  BarChart3, 
  Coins, 
  Shield, 
  Building2, 
  Calendar, 
  CandlestickChart, 
  TrendingUp,
  ChevronDown,
  Search,
  Star,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Close sheet when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const investmentTypes = [
    { 
      path: "/gold", 
      label: "Gold", 
      icon: Coins, 
      color: "text-amber-500",
      bgColor: "bg-amber-50 hover:bg-amber-100",
      description: "Precious metals investment",
      trend: "+2.3%"
    },
    { 
      path: "/silver", 
      label: "Silver", 
      icon: Shield, 
      color: "text-slate-500",
      bgColor: "bg-slate-50 hover:bg-slate-100",
      description: "Silver investments",
      trend: "+1.8%"
    },
    { 
      path: "/fd", 
      label: "Fixed Deposits", 
      icon: Building2, 
      color: "text-blue-500",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      description: "Bank fixed deposits",
      trend: "+0.5%"
    },
    { 
      path: "/rd", 
      label: "Recurring Deposits", 
      icon: Calendar, 
      color: "text-green-500",
      bgColor: "bg-green-50 hover:bg-green-100",
      description: "Monthly recurring deposits",
      trend: "+0.7%"
    },
    { 
      path: "/stocks", 
      label: "Stocks", 
      icon: CandlestickChart, 
      color: "text-purple-500",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      description: "Equity investments",
      trend: "+5.2%"
    },
    { 
      path: "/mutual-funds", 
      label: "Mutual Funds", 
      icon: BarChart3, 
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
      description: "Mutual fund investments",
      trend: "+3.4%"
    },
  ];

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-chart-2/5"></div>
      
      <div className="container relative flex h-16 items-center justify-between">
        {/* Enhanced Logo and Brand */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"></div>
              <div className="relative bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <TrendingUp className="h-5 w-5 text-white drop-shadow-sm" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-200 opacity-80" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-none bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent group-hover:from-amber-600 group-hover:via-orange-600 group-hover:to-yellow-600 transition-all duration-300">
                GoldStash
              </span>
              <span className="text-xs text-muted-foreground leading-none font-medium">
                Investment Portfolio
              </span>
            </div>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 flex justify-center px-6">
          {isAuthenticated && !isMobile && (
            <div className={`relative transition-all duration-300 ${searchFocused ? 'w-96' : 'w-80'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search investments, transactions..."
                className="pl-10 pr-4 py-2 bg-muted/50 border-0 rounded-lg focus:bg-background focus:shadow-lg focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          )}
        </div>

        {/* Right Side Actions with Navigation */}
        <div className="flex items-center gap-3">
          {/* Desktop Navigation moved to right */}
          {isAuthenticated && !isMobile && (
            <nav className="hidden lg:flex items-center gap-2">
              <Link
                to="/"
                className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActiveRoute("/") 
                    ? "bg-gradient-to-r from-primary to-chart-2 text-white shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted hover:to-muted/80 hover:shadow-md"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
                {isActiveRoute("/") && <Zap className="h-3 w-3 ml-1 animate-pulse" />}
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gradient-to-r hover:from-muted hover:to-muted/80 hover:shadow-md transition-all duration-200">
                    <Star className="h-4 w-4" />
                    Investments
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 p-2 shadow-xl border-0 bg-background/95 backdrop-blur-xl">
                  <div className="grid gap-1">
                    {investmentTypes.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.path} asChild className="p-0">
                          <Link
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isActiveRoute(item.path) 
                                ? "bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20" 
                                : `${item.bgColor} hover:shadow-md`
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${item.bgColor}`}>
                              <Icon className={`h-4 w-4 ${item.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm flex items-center gap-2">
                                {item.label}
                                {isActiveRoute(item.path) && <Badge variant="secondary" className="text-xs">Active</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            </div>
                            <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              {item.trend}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          )}

          {/* Mobile Menu */}
          {isAuthenticated && isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg hover:bg-muted/80 transition-all duration-200">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-background/95 backdrop-blur-xl">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 pb-6 border-b">
                    <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 p-2.5 rounded-xl shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                        GoldStash
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Investment Portfolio
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Search */}
                  <div className="py-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-muted/50 border-0 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <nav className="flex-1 py-6">
                    <div className="space-y-2">
                      <Link
                        to="/"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActiveRoute("/") 
                            ? "bg-gradient-to-r from-primary to-chart-2 text-white shadow-lg" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                        {isActiveRoute("/") && <Zap className="h-3 w-3 ml-auto animate-pulse" />}
                      </Link>
                      
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Star className="h-3 w-3" />
                          Investments
                        </div>
                        <div className="space-y-1">
                          {investmentTypes.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                                  isActiveRoute(item.path) 
                                    ? "bg-gradient-to-r from-primary/10 to-chart-2/10 text-foreground border border-primary/20" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                }`}
                                onClick={() => setIsOpen(false)}
                              >
                                <div className={`p-1.5 rounded-lg ${item.bgColor}`}>
                                  <Icon className={`h-4 w-4 ${item.color}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {item.label}
                                    {isActiveRoute(item.path) && <Badge variant="secondary" className="text-xs">Active</Badge>}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{item.description}</div>
                                </div>
                                <div className="text-xs font-medium text-green-600">
                                  {item.trend}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Enhanced User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}