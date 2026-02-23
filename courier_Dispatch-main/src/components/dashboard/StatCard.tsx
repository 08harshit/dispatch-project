import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
}: StatCardProps) => {
  return (
    <div className="stat-card premium-shine group">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-muted-foreground font-medium tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-foreground mt-3 tracking-tight">{value}</p>
        </div>
        <div className="stat-card-icon">
          <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      {trend && (
        <div className={cn(
          "stat-trend relative z-10",
          trend.direction === "up" ? "stat-trend-up" : "stat-trend-down"
        )}>
          {trend.direction === "up" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>{trend.value} from last month</span>
        </div>
      )}
    </div>
  );
};
