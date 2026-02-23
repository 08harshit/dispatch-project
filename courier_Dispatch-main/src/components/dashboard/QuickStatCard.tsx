import { LucideIcon } from "lucide-react";

interface QuickStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  onClick?: () => void;
}

export const QuickStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
}: QuickStatCardProps) => {
  return (
    <button 
      onClick={onClick}
      className="quick-stat-card premium-shine luxury-glow w-full group"
    >
      <div className="stat-card-icon relative z-10">
        <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium text-foreground tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </button>
  );
};
