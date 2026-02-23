import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, icon, trend, className }: StatsCardProps) => {
  return (
    <div className={cn("dashboard-card", className)}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <div className="text-primary">{icon}</div>
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold",
            trend.positive ? "text-emerald-600" : "text-red-600"
          )}>
            {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
