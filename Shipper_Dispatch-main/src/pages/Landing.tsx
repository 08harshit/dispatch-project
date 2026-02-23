import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import AuthForm from "@/components/auth/AuthForm";
import { Truck, Package, Shield, Zap, BarChart3, Clock, ChevronRight, MapPin } from "lucide-react";

const Landing = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const features = [
    {
      icon: MapPin,
      title: "GPS Auto-Matching",
      description: "Automatically find the nearest available driver using real-time GPS proximity.",
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your shipments are never posted publicly. Only matched drivers see your loads.",
    },
    {
      icon: Zap,
      title: "Instant Negotiation",
      description: "Streamlined offer and counter-offer system with up to 3 rounds of negotiation.",
    },
    {
      icon: BarChart3,
      title: "Full Analytics",
      description: "Track performance, costs, and delivery rates with comprehensive dashboards.",
    },
    {
      icon: Clock,
      title: "Real-Time Tracking",
      description: "Monitor every shipment from pickup to delivery with live status updates.",
    },
    {
      icon: Package,
      title: "Condition Reports",
      description: "Detailed vehicle inspections with photos, damage documentation, and tire checks.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Vehicles Shipped" },
    { value: "99.2%", label: "On-Time Rate" },
    { value: "500+", label: "Active Carriers" },
    { value: "24/7", label: "Support" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Dispatch</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#auth" className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                Auto Transport Dispatch Platform
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
                Dispatch vehicles
                <span className="text-primary"> smarter</span>,
                not harder
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                A shipper creates a transport request → the system automatically finds the nearest driver → they negotiate a price → the driver inspects, picks up, and delivers — all tracked and audited.
              </p>
              <div className="flex items-center gap-4">
                <a href="#auth" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                  Start Shipping <ChevronRight className="w-4 h-4" />
                </a>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                  Learn more →
                </a>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-6 text-center">
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need to dispatch</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From posting a vehicle to final delivery — manage the entire lifecycle in one platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">How it works</h2>
            <p className="text-muted-foreground">Four simple steps from request to delivery</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Post Vehicle", desc: "Enter pickup & delivery details, vehicle info, and your price." },
              { step: "02", title: "Auto-Match", desc: "The system finds the nearest available driver via GPS." },
              { step: "03", title: "Negotiate", desc: "Agree on a price with up to 3 counter-offer rounds." },
              { step: "04", title: "Track & Deliver", desc: "Monitor inspection, transit, and delivery with full documentation." },
            ].map((item) => (
              <div key={item.step} className="relative bg-card border border-border rounded-2xl p-6">
                <span className="text-4xl font-bold text-primary/15">{item.step}</span>
                <h3 className="font-semibold text-foreground mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth" className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Get started today</h2>
            <p className="text-muted-foreground">Create your account and start dispatching in minutes</p>
          </div>
          <AuthForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Dispatch</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Dispatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
