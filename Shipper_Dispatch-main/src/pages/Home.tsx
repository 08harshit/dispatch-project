import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Package, DollarSign, Clock, Truck, BarChart3, ArrowUpRight, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useShipperDashboard } from "@/hooks/useShipperDashboard";

const Home = () => {
  const currentDate = format(new Date(), "EEE, MMM d");
  const { data: overview } = useShipperDashboard();

  const stats = [
    { label: "Active Shipments", value: overview?.activeShipments?.toString() ?? "-", trend: "+0%", icon: Package, positive: true, path: "/shipping" },
    { label: "Spends", value: overview?.spends ?? "-", trend: "+0%", icon: DollarSign, positive: true, path: "/accounting" },
    { label: "Total Shipment", value: overview?.totalShipment?.toString() ?? "-", trend: "+0%", icon: Truck, positive: true, path: "/shipping" },
    { label: "On-Time Rate", value: overview?.onTimeRate ?? "-", trend: "+0%", icon: Clock, positive: true, path: "/analytics" },
  ];

  const quickActions = [
    { label: "View Shipping", description: "Manage shipments", icon: Truck, path: "/shipping" },
    { label: "Accounting", description: "Financial overview", icon: DollarSign, path: "/accounting" },
    { label: "Analytics", description: "Performance insights", icon: BarChart3, path: "/analytics" },
  ];

  const recentActivity = (overview?.recentActivity?.length ?? 0) > 0
    ? overview!.recentActivity.map((a) => ({
        type: a.type,
        message: a.message,
        time: a.time,
        icon: a.type === "delivered" ? Package : a.type === "transit" ? Truck : Sparkles,
      }))
    : [
        { type: "empty", message: "No recent activity yet", time: "", icon: Package },
      ];

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case "delivered": return "text-emerald-500 bg-emerald-50";
      case "payment": return "text-primary bg-primary/10";
      case "request": return "text-amber-500 bg-amber-50";
      case "transit": return "text-blue-500 bg-blue-50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {currentDate}
          </div>
          <button className="relative p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Dashboard</p>
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-foreground">Live</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.path} className="block focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
              <Card className="dashboard-card border-border cursor-pointer hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className={`text-xs font-semibold ${stat.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.path} className="block focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
                <Card className="dashboard-card border-border cursor-pointer hover:border-primary/30 transition-colors h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <action.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Section: Activity + Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent Activity */}
          <Card className="dashboard-card border-border lg:col-span-3">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Recent Activity</h3>
                </div>
                <button className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getActivityIconColor(activity.type)}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="dashboard-card border-border lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Performance</p>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-foreground mt-4">+24.5%</p>
              <p className="text-sm text-muted-foreground mt-1">vs last month</p>
              
              {/* Mini Chart Bars */}
              <div className="flex items-end gap-2 mt-6 h-16">
                {[40, 55, 45, 60, 70, 65, 75].map((height, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-md ${i % 2 === 0 ? 'bg-emerald-200' : 'bg-amber-200'}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-muted-foreground">Spends</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <span className="text-xs text-muted-foreground">Shipments</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
