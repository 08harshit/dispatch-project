import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { 
  TrendingUp, 
  Truck, 
  DollarSign, 
  Clock, 
  MapPin,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type TimeFilter = "weekly" | "monthly" | "quarterly" | "yearly";

const Analytics = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

  const weeklyData = [
    { name: "Mon", shipments: 12, cost: 8 },
    { name: "Tue", shipments: 15, cost: 11 },
    { name: "Wed", shipments: 18, cost: 14 },
    { name: "Thu", shipments: 14, cost: 10 },
    { name: "Fri", shipments: 20, cost: 16 },
    { name: "Sat", shipments: 8, cost: 6 },
    { name: "Sun", shipments: 5, cost: 4 },
  ];
  const monthlyData = [
    { name: "Jan", shipments: 45, cost: 32 },
    { name: "Feb", shipments: 52, cost: 38 },
    { name: "Mar", shipments: 48, cost: 35 },
    { name: "Apr", shipments: 61, cost: 44 },
    { name: "May", shipments: 55, cost: 41 },
    { name: "Jun", shipments: 67, cost: 49 },
  ];

  const quarterlyData = [
    { name: "Jan", shipments: 45, cost: 32 },
    { name: "Feb", shipments: 52, cost: 38 },
    { name: "Mar", shipments: 48, cost: 35 },
    { name: "Apr", shipments: 61, cost: 44 },
    { name: "May", shipments: 55, cost: 41 },
    { name: "Jun", shipments: 67, cost: 49 },
    { name: "Jul", shipments: 72, cost: 54 },
    { name: "Aug", shipments: 68, cost: 51 },
    { name: "Sep", shipments: 75, cost: 58 },
  ];

  const yearlyData = [
    { name: "Q1", shipments: 145, cost: 105 },
    { name: "Q2", shipments: 183, cost: 134 },
    { name: "Q3", shipments: 215, cost: 163 },
    { name: "Q4", shipments: 198, cost: 148 },
  ];

  const getChartData = () => {
    switch (timeFilter) {
      case "weekly": return weeklyData;
      case "monthly": return monthlyData;
      case "quarterly": return quarterlyData;
      case "yearly": return yearlyData;
    }
  };

  const chartData = getChartData();

  const routeDistribution = [
    { name: "East Coast", value: 35, color: "hsl(36, 70%, 75%)" },
    { name: "West Coast", value: 28, color: "hsl(160, 45%, 70%)" },
    { name: "Midwest", value: 22, color: "hsl(200, 45%, 72%)" },
    { name: "South", value: 15, color: "hsl(280, 35%, 75%)" },
  ];

  const keyMetrics = [
    { 
      label: "Total Shipments", 
      value: "328", 
      change: 12.5, 
      positive: true,
      icon: Package,
      period: "This month"
    },
    { 
      label: "Spends", 
      value: "$189,420", 
      change: 8.3, 
      positive: true,
      icon: DollarSign,
      period: "This month"
    },
    { 
      label: "Avg. Delivery Time", 
      value: "2.4 days", 
      change: 15.2, 
      positive: true,
      icon: Clock,
      period: "vs last month"
    },
    { 
      label: "Active Routes", 
      value: "47", 
      change: 3.1, 
      positive: false,
      icon: MapPin,
      period: "This week"
    },
  ];

  const topRoutes = [
    { from: "Los Angeles, CA", to: "Phoenix, AZ", count: 24, cost: "$18,400" },
    { from: "Dallas, TX", to: "Houston, TX", count: 21, cost: "$12,600" },
    { from: "Chicago, IL", to: "Detroit, MI", count: 18, cost: "$14,200" },
    { from: "Miami, FL", to: "Atlanta, GA", count: 16, cost: "$15,800" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Analytics</p>
              <h1 className="text-2xl font-bold text-foreground">Performance Insights</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Last 30 days</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyMetrics.map((metric) => (
            <Card key={metric.label} className="dashboard-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <metric.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${metric.positive ? 'text-emerald-500' : 'text-red-400'}`}>
                    {metric.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{metric.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{metric.period}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trends Chart with Filter */}
          <Card className="dashboard-card border-border lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">Performance Overview</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Shipments & Cost trends</p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                  <button
                    onClick={() => setTimeFilter("weekly")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeFilter === "weekly" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeFilter("monthly")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeFilter === "monthly" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTimeFilter("quarterly")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeFilter === "quarterly" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    90 Days
                  </button>
                  <button
                    onClick={() => setTimeFilter("yearly")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeFilter === "yearly" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(36, 75%, 75%)" }} />
                  <span className="text-xs text-muted-foreground">Shipments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(160, 45%, 70%)" }} />
                  <span className="text-xs text-muted-foreground">Cost (K)</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={8}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(30, 10%, 50%)' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(30, 10%, 50%)' }}
                    />
                    <Bar dataKey="shipments" fill="hsl(36, 75%, 75%)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cost" fill="hsl(160, 45%, 70%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Route Distribution */}
          <Card className="dashboard-card border-border">
            <CardContent className="p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Route Distribution</h3>
                <p className="text-xs text-muted-foreground mt-0.5">By region</p>
              </div>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={routeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {routeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {routeDistribution.map((route) => (
                  <div key={route.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: route.color }} />
                    <span className="text-xs text-muted-foreground">{route.name}</span>
                    <span className="text-xs font-medium text-foreground ml-auto">{route.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Routes */}
        <Card className="dashboard-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Top Routes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Most active corridors</p>
              </div>
              <button className="text-xs text-primary font-medium hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topRoutes.map((route, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground truncate">{route.from}</span>
                      <Truck className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{route.to}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{route.count} shipments</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500">{route.cost}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Analytics;
