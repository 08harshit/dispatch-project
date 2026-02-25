import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { RecentActivityTable } from "@/components/dashboard/RecentActivityTable";
import { Truck, Package, ArrowLeftRight, AlertTriangle, TrendingUp, Bell, FileWarning, Clock, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { fetchDashboardStats, fetchRecentActivity, type DashboardStats, type RecentActivityItem } from "@/services/dashboardService";

const alerts = [
  {
    id: "1",
    title: "License Expiring Soon",
    description: "3 couriers have licenses expiring within 30 days",
    type: "warning" as const,
    time: "2 hours ago",
  },
  {
    id: "2",
    title: "Insurance Update Required",
    description: "Swift Logistics needs updated insurance documents",
    type: "urgent" as const,
    time: "5 hours ago",
  },
  {
    id: "3",
    title: "New Shipper Registration",
    description: "ABC Manufacturing pending approval",
    type: "info" as const,
    time: "1 day ago",
  },
  {
    id: "4",
    title: "Compliance Check Due",
    description: "5 couriers need quarterly compliance review",
    type: "warning" as const,
    time: "1 day ago",
  },
  {
    id: "5",
    title: "Document Expiring",
    description: "USDOT certification expires in 15 days",
    type: "urgent" as const,
    time: "2 days ago",
  },
  {
    id: "6",
    title: "New Equipment Added",
    description: "FastTrack added 2 new vehicles to fleet",
    type: "info" as const,
    time: "2 days ago",
  },
  {
    id: "7",
    title: "Rate Update Pending",
    description: "3 shippers requested rate adjustments",
    type: "info" as const,
    time: "3 days ago",
  },
];

const alertStyles = {
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    icon: AlertTriangle,
  },
  urgent: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    icon: FileWarning,
  },
  info: {
    bg: "bg-primary/10",
    text: "text-primary",
    icon: Clock,
  },
};
const Index = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [notifications, setNotifications] = useState(alerts);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => setStats(null));
    fetchRecentActivity().then(setRecentActivity).catch(() => setRecentActivity([]));
  }, []);

  const handleNotificationClick = (alert: typeof alerts[0]) => {
    setReadIds((prev) => new Set(prev).add(alert.id));
    const styles = alertStyles[alert.type];
    toast(alert.title, {
      description: alert.description,
      icon: alert.type === "urgent" ? <FileWarning className="h-4 w-4 text-destructive" /> : alert.type === "warning" ? <AlertTriangle className="h-4 w-4 text-warning" /> : <Clock className="h-4 w-4 text-primary" />,
    });
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification dismissed");
  };

  const handleMarkAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    toast.success("All notifications marked as read");
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="page-header animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary/50" />
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                  Welcome back! Here's your dispatch overview.
                </p>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative hover-scale">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Notifications</h4>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          {unreadCount} new
                        </span>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={handleMarkAllRead}>
                        <Check className="h-3 w-3 mr-1" /> Mark all read
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((alert) => {
                      const styles = alertStyles[alert.type];
                      const Icon = styles.icon;
                      const isRead = readIds.has(alert.id);
                      return (
                        <div
                          key={alert.id}
                          onClick={() => handleNotificationClick(alert)}
                          className={cn(
                            "flex items-start gap-3 rounded-lg p-2 cursor-pointer transition-colors group",
                            isRead ? "opacity-60 hover:opacity-80 hover:bg-muted/30" : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn("rounded-lg p-2", styles.bg)}>
                            <Icon className={cn("h-3.5 w-3.5", styles.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {!isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                              <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{alert.description}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">{alert.time}</p>
                          </div>
                          <button
                            onClick={(e) => handleDismiss(e, alert.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="border-t border-border/50 p-2">
                    <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 text-sm">
                      View All Alerts
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Couriers"
            value={stats?.totalCouriers ?? 0}
            icon={Truck}
            trend={{ value: 12, isPositive: true }}
            delay={100}
          />
          <StatCard
            title="Total Shippers"
            value={stats?.totalShippers ?? 0}
            icon={Package}
            trend={{ value: 8, isPositive: true }}
            delay={150}
          />
          <StatCard
            title="Total Transactions"
            value={stats?.totalTransactions ?? 0}
            icon={ArrowLeftRight}
            trend={{ value: 23, isPositive: true }}
            delay={200}
          />
          <StatCard
            title="Active Alerts"
            value={stats?.activeAlerts ?? 0}
            icon={AlertTriangle}
            variant="warning"
            delay={250}
          />
        </div>

        {/* Compliance Overview */}
        <Card className="animate-fade-in overflow-hidden" style={{ animationDelay: "300ms" }}>
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Couriers In Compliance"
                value={stats?.couriersCompliant ?? 0}
                icon={Truck}
                variant="success"
                delay={350}
              />
              <StatCard
                title="Couriers Out of Compliance"
                value={stats?.couriersNonCompliant ?? 0}
                icon={Truck}
                variant="danger"
                delay={400}
              />
              <StatCard
                title="Shippers In Compliance"
                value={stats?.shippersCompliant ?? 0}
                icon={Package}
                variant="success"
                delay={450}
              />
              <StatCard
                title="Shippers Out of Compliance"
                value={stats?.shippersNonCompliant ?? 0}
                icon={Package}
                variant="danger"
                delay={500}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivityTable activities={recentActivity} />
          </div>
          <div>
            <AlertsCard />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
