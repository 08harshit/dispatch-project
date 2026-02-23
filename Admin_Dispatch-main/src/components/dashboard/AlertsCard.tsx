import { AlertTriangle, Clock, FileWarning, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  description: string;
  type: "warning" | "urgent" | "info";
  time: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "License Expiring Soon",
    description: "3 couriers have licenses expiring within 30 days",
    type: "warning",
    time: "2 hours ago",
  },
  {
    id: "2",
    title: "Insurance Update Required",
    description: "Swift Logistics needs updated insurance documents",
    type: "urgent",
    time: "5 hours ago",
  },
  {
    id: "3",
    title: "New Shipper Registration",
    description: "ABC Manufacturing pending approval",
    type: "info",
    time: "1 day ago",
  },
];

const alertStyles = {
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    icon: AlertTriangle,
  },
  urgent: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    icon: FileWarning,
  },
  info: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    icon: Clock,
  },
};

export function AlertsCard() {
  return (
    <Card className="animate-fade-in overflow-hidden" style={{ animationDelay: "300ms" }}>
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="relative">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning animate-pulse" />
          </div>
          Alerts
          <span className="ml-auto rounded-full bg-gradient-to-r from-destructive to-destructive/80 px-2.5 py-1 text-xs font-bold text-destructive-foreground shadow-sm">
            {mockAlerts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {mockAlerts.map((alert, index) => {
          const styles = alertStyles[alert.type];
          const Icon = styles.icon;
          return (
            <div
              key={alert.id}
              className={cn(
                "group flex items-start gap-3 rounded-xl border p-4 transition-all duration-300 hover:shadow-soft cursor-pointer animate-fade-in",
                styles.border,
                "hover:-translate-y-0.5"
              )}
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <div className={cn("rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-110", styles.bg)}>
                <Icon className={cn("h-4 w-4", styles.text)} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground truncate">{alert.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.time}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
            </div>
          );
        })}
        <Button variant="ghost" className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/5">
          View All Alerts
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
