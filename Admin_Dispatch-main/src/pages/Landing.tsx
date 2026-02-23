import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Truck, Package, ArrowLeftRight, Shield, BarChart3, FileCheck,
  CheckCircle2, ArrowRight, Zap, Globe, Clock, Users
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Courier Management",
    description: "Track fleet details, USDOT, MC numbers, insurance, and compliance status in one place.",
  },
  {
    icon: Package,
    title: "Shipper Management",
    description: "Manage dealer and auction accounts with business info, licenses, and tax details.",
  },
  {
    icon: ArrowLeftRight,
    title: "Load Tracking",
    description: "Create, assign, and track vehicle shipments from pickup through delivery.",
  },
  {
    icon: Shield,
    title: "Compliance Monitoring",
    description: "Real-time compliance dashboards with automated alerts for expiring documents.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Powerful insights into operations, revenue, and performance metrics.",
  },
  {
    icon: FileCheck,
    title: "Document Management",
    description: "Securely store BOLs, proof of delivery, insurance certificates, and more.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "10K+", label: "Loads Managed" },
  { value: "500+", label: "Couriers" },
  { value: "< 2s", label: "Response Time" },
];

const benefits = [
  "Real-time compliance tracking",
  "Automated document expiry alerts",
  "Full audit trail on every action",
  "Integrated ticketing system",
  "Multi-role access control",
  "Accounting & payment tracking",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">Dispatch</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="btn-primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, hsl(37 90% 51% / 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(145 60% 45% / 0.1) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Built for modern logistics teams
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Streamline Your{" "}
              <span className="text-gradient">Vehicle Transport</span>{" "}
              Operations
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              The all-in-one dispatch management platform for auto transport brokers. Manage couriers, shippers, loads, compliance, and accounting — all from a single dashboard.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="btn-primary text-base px-8 h-12">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border/50 bg-card">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground">Everything you need to dispatch smarter</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Purpose-built tools for auto transport brokers, from first call to final delivery.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="card-hover border-border/50 group">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="gradient-hero border-y border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Why teams choose Dispatch</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Built from the ground up for auto transport operations. Every feature is designed to save time, reduce errors, and keep your fleet compliant.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link to="/auth" className="inline-block mt-8">
                <Button size="lg" className="btn-primary">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Globe, label: "Nationwide Coverage", value: "50 States" },
                { icon: Clock, label: "Avg. Response", value: "< 2 min" },
                { icon: Users, label: "Active Users", value: "1,200+" },
                { icon: Shield, label: "Compliance Rate", value: "98.5%" },
              ].map((item) => (
                <Card key={item.label} className="stat-card text-center">
                  <CardContent className="p-6">
                    <item.icon className="h-8 w-8 text-primary mx-auto" />
                    <div className="mt-3 text-2xl font-bold text-foreground">{item.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Card className="overflow-hidden border-0" style={{ background: "var(--gradient-primary)" }}>
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">
              Ready to transform your dispatch operations?
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
              Join hundreds of auto transport brokers who've streamlined their workflow with Dispatch.
            </p>
            <Link to="/auth" className="inline-block mt-8">
              <Button size="lg" variant="secondary" className="text-base px-8 h-12 font-semibold">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card">
        <div className="mx-auto max-w-7xl px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Dispatch</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Dispatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
