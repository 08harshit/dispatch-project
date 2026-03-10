import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { OfflineOverlay } from "@/components/OfflineOverlay";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { LoadsPage } from "./pages/LoadsPage";
import { SavedLoadsPage } from "./pages/SavedLoadsPage";
import { AccountingPage } from "./pages/AccountingPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CommunicationPage } from "./pages/CommunicationPage";
import { SetupPage } from "./pages/SetupPage";
import NotFound from "./pages/NotFound";
import { courierDashboardKeys } from "@/hooks/queries/useCourierDashboard";
import { contractKeys } from "@/hooks/queries/useCourierContracts";
import { fetchCourierOverview } from "@/services/courierDashboardService";
import { fetchContracts } from "@/services/contractsService";

function AuthErrorHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash?.slice(1) || "";
    const params = new URLSearchParams(hash);
    const error = params.get("error");
    const errorCode = params.get("error_code");
    const description = params.get("error_description");

    if (error || errorCode) {
      if (errorCode === "otp_expired" || description?.toLowerCase().includes("expired")) {
        toast.error("Email link has expired. Please sign in again with your password.");
      } else if (description) {
        toast.error(decodeURIComponent(description.replace(/\+/g, " ")));
      } else {
        toast.error("Sign-in failed. Please try again.");
      }
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      if (location.pathname !== "/auth") navigate("/auth", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

function GlobalPrefetcher() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (session) {
      queryClient.prefetchQuery({
        queryKey: courierDashboardKeys.overview(),
        queryFn: fetchCourierOverview,
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: contractKeys.list("signed,active,completed"),
        queryFn: () => fetchContracts({ status: "signed,active,completed" }),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [session, queryClient]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * 60 * 1000,
      retry: (failureCount) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) return false;
        return failureCount < 3;
      },
    },
  },
});

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return isOnline;
}

const PublicHome = () => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (session) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};

function AppContent() {
  const isOnline = useNetworkStatus();
  if (!isOnline) return <OfflineOverlay />;
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthErrorHandler />
          <GlobalPrefetcher />
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>}>
              <Route index element={<HomePage />} />
              <Route path="loads" element={<LoadsPage />} />
              <Route path="saved" element={<SavedLoadsPage />} />
              <Route path="accounting" element={<AccountingPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="communication" element={<CommunicationPage />} />
              <Route path="setup" element={<SetupPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
