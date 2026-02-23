import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Truck,
  Loader2,
  MapPin,
  Shield,
  DollarSign,
  Smartphone,
  Route,
  FileText,
  ChevronRight,
  Star,
  Zap,
  Clock,
} from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const features = [
  {
    icon: MapPin,
    title: "Smart Load Board",
    description: "Browse available vehicle deliveries near you with real-time notifications and route optimization.",
  },
  {
    icon: DollarSign,
    title: "Price Negotiation",
    description: "Submit competitive offers to shippers and negotiate the best rates for every delivery.",
  },
  {
    icon: Smartphone,
    title: "VIN Scan & Photos",
    description: "Inspect vehicles with built-in VIN scanner and condition photo capture at pickup.",
  },
  {
    icon: FileText,
    title: "Auto Documents",
    description: "BOL and invoices generated automatically — no paperwork headaches.",
  },
  {
    icon: Route,
    title: "Route Navigation",
    description: "Smart turn-by-turn directions with multi-stop route planning and day planner.",
  },
  {
    icon: Shield,
    title: "Revenue Tracking",
    description: "Track earnings, log expenses, and monitor your performance analytics in one place.",
  },
];

const stats = [
  { value: "10K+", label: "Active Drivers" },
  { value: "$2.4M", label: "Monthly Payouts" },
  { value: "98%", label: "On-Time Delivery" },
  { value: "4.9★", label: "Driver Rating" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (mode: "signin" | "signup") => {
    setIsLoading(true);
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { error } =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(email, password);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in.");
        } else if (error.message.includes("Invalid login")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
      } else {
        if (mode === "signup") {
          toast.success("Account created! Check your email to verify, then sign in.");
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center" style={{ boxShadow: "var(--shadow-gold)" }}>
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Dispatch</span>
          </div>
          <a href="#auth" className="hidden sm:block">
            <Button size="sm" className="rounded-full px-6">
              Get Started <ChevronRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-mesh)" }} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-aurora)" }} />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Copy */}
            <motion.div initial="hidden" animate="visible" className="space-y-8">
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                  <Zap className="h-3.5 w-3.5" /> Now Accepting Drivers
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                Deliver Vehicles.{" "}
                <span className="text-primary">Earn More.</span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Browse loads, negotiate prices, scan VINs, generate documents, and get paid — all from one app built for auto transport couriers.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-6">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Auth Card */}
            <motion.div
              id="auth"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="neo-card p-8 lg:p-10"
            >
              <div className="relative z-10 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Start Driving Today</h2>
                  <p className="text-sm text-muted-foreground">
                    Sign in to your account or create a new one
                  </p>
                </div>

                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="si-email">Email</Label>
                      <Input id="si-email" type="email" placeholder="driver@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="si-pass">Password</Label>
                      <Input id="si-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    </div>
                    <Button className="w-full" onClick={() => handleSubmit("signin")} disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" placeholder="driver@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-pass">Password</Label>
                      <Input id="su-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    </div>
                    <Button className="w-full" onClick={() => handleSubmit("signup")} disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16 space-y-4">
            <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider">
              How It Works
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">
              From Load Board to Payday
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-2xl mx-auto">
              A driver signs up → browses available deliveries → submits a price offer → picks up the vehicle → delivers it → gets paid.
            </motion.p>
          </motion.div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Star, step: "01", title: "Browse Loads", desc: "Find vehicles that need delivery on the real-time load board." },
              { icon: DollarSign, step: "02", title: "Make an Offer", desc: "Submit your price to the shipper and negotiate the rate." },
              { icon: Truck, step: "03", title: "Pick Up & Deliver", desc: "Scan VIN, capture photos, generate BOL, and hit the road." },
              { icon: Clock, step: "04", title: "Get Paid", desc: "Track revenue, log expenses, and grow your business." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-8 text-center space-y-4"
              >
                <div className="relative z-10">
                  <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">{s.step}</span>
                  <div className="mx-auto mt-3 h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-4">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border/40 mesh-background">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16 space-y-4">
            <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider">
              Features
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything a Courier Needs
            </motion.h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="neo-card p-8 space-y-4 premium-shine"
              >
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-4">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-foreground"
          >
            Ready to Hit the Road?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Join thousands of auto transport drivers earning more with smarter tools.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <a href="#auth">
              <Button size="lg" className="rounded-full px-10 text-base" style={{ boxShadow: "var(--shadow-gold)" }}>
                Get Started Free <ChevronRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Dispatch</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Dispatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
