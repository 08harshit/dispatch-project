import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SidebarStateProvider } from "@/hooks/use-sidebar-state";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { OfflineOverlay } from "@/components/OfflineOverlay";
import Home from "./pages/Home";
import Shipping from "./pages/Shipping";
import Analytics from "./pages/Analytics";
import Accounting from "./pages/Accounting";
import Settings from "./pages/Settings";
import Communication from "./pages/Communication";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) return false;
        return failureCount < 3;
      },
    },
  },
});

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
      if (location.pathname !== "/landing") navigate("/landing", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

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

function AppContent() {
  const isOnline = useNetworkStatus();
  if (!isOnline) return <OfflineOverlay />;
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthErrorHandler />
        <AuthProvider>
          <SidebarStateProvider>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
              <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
