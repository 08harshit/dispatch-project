import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const ALLOWED_ROLES = ["shipper", "admin"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth();

  const role = (user?.user_metadata?.role as string) || (user?.app_metadata?.role as string);
  const hasAccess = user && ALLOWED_ROLES.includes(role);

  useEffect(() => {
    if (!loading && user && !ALLOWED_ROLES.includes(role)) {
      signOut();
    }
  }, [loading, user, role, signOut]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
