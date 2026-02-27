import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { toast } from "sonner";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Couriers from "./pages/Couriers";
import Shippers from "./pages/Shippers";
import Accounting from "./pages/Accounting";
import Analytics from "./pages/Analytics";
import Loads from "./pages/Loads";
import Contracts from "./pages/Contracts";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import Vehicles from "./pages/Vehicles";
import VehicleAccess from "./pages/VehicleAccess";
import Settings from "./pages/Settings";
import Tickets from "./pages/Tickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthErrorHandler />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/couriers" element={<ProtectedRoute><Couriers /></ProtectedRoute>} />
            <Route path="/shippers" element={<ProtectedRoute><Shippers /></ProtectedRoute>} />
            <Route path="/loads" element={<ProtectedRoute><Loads /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
            <Route path="/trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
            <Route path="/vehicle-access" element={<ProtectedRoute><VehicleAccess /></ProtectedRoute>} />
            <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
