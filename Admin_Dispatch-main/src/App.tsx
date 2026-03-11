import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { OfflineOverlay } from "@/components/OfflineOverlay";
import { toast } from "sonner";
import { fetchCouriers } from "@/services/courierService";
import { fetchShippers } from "@/services/shipperService";
import { fetchLoads } from "@/services/loadService";
import { courierKeys } from "@/hooks/queries/useCouriers";
import { shipperKeys } from "@/hooks/queries/useShippers";
import { loadKeys } from "@/hooks/queries/useLoads";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Couriers from "./pages/Couriers";
import Shippers from "./pages/Shippers";
import Analytics from "./pages/Analytics";
import Loads from "./pages/Loads";
// import Contracts from "./pages/Contracts"; // MODULE DISABLED
// import Trips from "./pages/Trips"; // MODULE DISABLED
// import TripDetail from "./pages/TripDetail"; // MODULE DISABLED
import Communication from "./pages/Communication";
// import Vehicles from "./pages/Vehicles"; // MODULE DISABLED
// import VehicleAccess from "./pages/VehicleAccess"; // MODULE DISABLED
import Settings from "./pages/Settings";
import Tickets from "./pages/Tickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * 60 * 1000, // strict 10-minute garbage collection limit for pagination bloat
      retry: (failureCount, error) => {
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

function ShipperIdRedirect() {
  const { shipperId } = useParams();
  return <Navigate to={`/shippers?shipper_id=${encodeURIComponent(shipperId || "")}`} replace />;
}

function AccountingRedirect() {
  return <Navigate to="/analytics?tab=accounting" replace />;
}

// MODULE DISABLED: VehicleIdRedirect
// function VehicleIdRedirect() {
//   const { vehicleId } = useParams();
//   return <Navigate to={`/vehicles?vehicle_id=${encodeURIComponent(vehicleId || "")}`} replace />;
// }

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      queryClient.prefetchQuery({
        queryKey: courierKeys.list({ search: "", status: "all" }, 1, 10),
        queryFn: () => fetchCouriers({ search: "", status: "all" }, 1, 10),
        staleTime: 5 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: shipperKeys.list({ search: "", status: "all" }),
        queryFn: () => fetchShippers({ search: "", status: "all" }),
        staleTime: 5 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: loadKeys.list({ search: "", status: "all", dateFrom: "", dateTo: "" }, 1, 10),
        queryFn: () => fetchLoads({ search: "", status: "all", dateFrom: "", dateTo: "" }, 1, 10),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [user, queryClient]);

  return null;
}

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
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/couriers" element={<ProtectedRoute><Couriers /></ProtectedRoute>} />
            <Route path="/shippers/:shipperId" element={<ProtectedRoute><ShipperIdRedirect /></ProtectedRoute>} />
            <Route path="/shippers" element={<ProtectedRoute><Shippers /></ProtectedRoute>} />
            <Route path="/loads" element={<ProtectedRoute><Loads /></ProtectedRoute>} />
            {/* <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} /> */} {/* MODULE DISABLED */}
            {/* <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} /> */} {/* MODULE DISABLED */}
            {/* <Route path="/trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} /> */} {/* MODULE DISABLED */}
            <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
            {/* <Route path="/vehicles/:vehicleId" element={<ProtectedRoute><VehicleIdRedirect /></ProtectedRoute>} /> */} {/* MODULE DISABLED */}
            {/* <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} /> */} {/* MODULE DISABLED */}
            {/* <Route path="/vehicle-access" element={<ProtectedRoute><VehicleAccess /></ProtectedRoute>} /> */} {/* MODULE DISABLED */}
            <Route path="/accounting" element={<ProtectedRoute><AccountingRedirect /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
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
