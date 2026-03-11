import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, Eye, EyeOff } from "lucide-react";

type AuthView = "login" | "signup" | "forgot" | "reset";

function getInitialView(): AuthView {
  if (typeof window === "undefined") return "login";
  const hash = window.location.hash?.slice(1) || "";
  const params = new URLSearchParams(hash);
  return params.get("type") === "recovery" ? "reset" : "login";
}

const AuthForm = () => {
  const [view, setView] = useState<AuthView>(getInitialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash?.slice(1) || "";
    const params = new URLSearchParams(hash);
    if (params.get("type") === "recovery") {
      setView("reset");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/landing`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a reset link." });
        setView("login");
      } else if (view === "reset") {
        if (password !== confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast({ title: "Password updated", description: "You can now sign in." });
        setView("login");
      } else if (view === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const user = data?.user;
        const role = (user?.user_metadata?.role as string) || (user?.app_metadata?.role as string);
        if (role !== "shipper" && role !== "admin") {
          await supabase.auth.signOut();
          toast({
            title: "Access denied",
            description: "You do not have access to the Shipper portal. Please use the Courier or Admin portal.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, company_name: companyName, role: "shipper" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent you a verification link to confirm your account.",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (view === "login") return "Welcome back";
    if (view === "signup") return "Create account";
    if (view === "forgot") return "Reset password";
    return "Set new password";
  };

  const getDescription = () => {
    if (view === "login") return "Sign in to your dispatch account";
    if (view === "signup") return "Start managing your shipments";
    if (view === "forgot") return "Enter your email and we'll send you a reset link";
    return "Enter your new password below";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{getTitle()}</h2>
            <p className="text-sm text-muted-foreground">{getDescription()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Transport Co."
                />
              </div>
            </>
          )}

          {(view === "login" || view === "signup" || view === "forgot") && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
          )}

          {(view === "login" || view === "signup") && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {view === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {view === "reset" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Please wait..."
              : view === "login"
                ? "Sign In"
                : view === "signup"
                  ? "Create Account"
                  : view === "forgot"
                    ? "Send reset link"
                    : "Set new password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          {view === "login" && (
            <button onClick={() => setView("signup")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Don't have an account? Sign up
            </button>
          )}
          {view === "signup" && (
            <button onClick={() => setView("login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Already have an account? Sign in
            </button>
          )}
          {view === "forgot" && (
            <button onClick={() => setView("login")} className="text-sm font-semibold text-primary hover:underline">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
