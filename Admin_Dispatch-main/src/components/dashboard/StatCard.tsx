import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
  delay?: number;
}

const variantStyles = {
  default: "",
  success: "border-l-4 border-l-success",
  warning: "border-l-4 border-l-warning",
  danger: "border-l-4 border-l-destructive",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

const valueVariantStyles = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default", className, delay = 0 }: StatCardProps) {
  return (
    <div 
      className={cn(
        "stat-card animate-fade-in",
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className={cn("stat-icon rounded-2xl p-3", iconVariantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold flex items-center gap-1",
                trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              <span className="text-[10px]">{trend.isPositive ? "▲" : "▼"}</span>
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className={cn("mt-1 text-3xl font-bold", valueVariantStyles[variant])}>{value}</p>
        </div>
      </div>
    </div>
  );
}
