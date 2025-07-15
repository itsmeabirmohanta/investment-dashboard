import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Dynamic imports for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Investment Dashboard imports
const GlobalDashboard = lazy(() => import("./dashboard/GlobalDashboard"));
const GoldDashboard = lazy(() => import("./gold/GoldDashboard"));
const SilverDashboard = lazy(() => import("./silver/SilverDashboard"));
const FDDashboard = lazy(() => import("./fd/FDDashboard"));
const RDDashboard = lazy(() => import("./rd/RDDashboard"));
const StocksDashboard = lazy(() => import("./stocks/StocksDashboard"));
const MutualFundsDashboard = lazy(() => import("./mutualfunds/MutualFundsDashboard"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <GlobalDashboard />
                </ProtectedRoute>
              } />
              
              {/* Legacy Gold Dashboard (preserve existing functionality) */}
              <Route path="/legacy-gold" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              {/* New Investment Module Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <GlobalDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/gold" element={
                <ProtectedRoute>
                  <GoldDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/silver" element={
                <ProtectedRoute>
                  <SilverDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/fd" element={
                <ProtectedRoute>
                  <FDDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/rd" element={
                <ProtectedRoute>
                  <RDDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/stocks" element={
                <ProtectedRoute>
                  <StocksDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/mutual-funds" element={
                <ProtectedRoute>
                  <MutualFundsDashboard />
                </ProtectedRoute>
              } />
              
              {/* User Management Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />

              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
