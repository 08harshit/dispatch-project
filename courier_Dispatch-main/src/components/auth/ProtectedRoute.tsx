import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const ALLOWED_ROLES = ["courier", "admin"];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading, signOut } = useAuth();

  const role = (user?.user_metadata?.role as string) || (user?.app_metadata?.role as string);
  const hasAccess = session && user && ALLOWED_ROLES.includes(role);

  useEffect(() => {
    if (!loading && session && user && !ALLOWED_ROLES.includes(role)) {
      signOut();
    }
  }, [loading, session, user, role, signOut]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
