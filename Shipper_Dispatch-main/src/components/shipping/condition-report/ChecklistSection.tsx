import { cn } from "@/lib/utils";
import { ConditionStatus } from "@/types/conditionReport";
import { Check, AlertTriangle, AlertCircle, Minus } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  value: ConditionStatus;
}

interface ChecklistSectionProps {
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
  onChange: (id: string, value: ConditionStatus) => void;
}

const statusOptions: { value: ConditionStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'okay', label: 'OK', color: 'bg-emerald-500', icon: <Check className="h-3 w-3" /> },
  { value: 'may_need_future', label: 'May Need', color: 'bg-amber-400', icon: <AlertTriangle className="h-3 w-3" /> },
  { value: 'attention', label: 'Attention', color: 'bg-rose-500', icon: <AlertCircle className="h-3 w-3" /> },
  { value: 'not_checked', label: 'N/C', color: 'bg-muted', icon: <Minus className="h-3 w-3" /> },
];

const ChecklistSection = ({ title, icon, items, onChange }: ChecklistSectionProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {statusOptions.map((option) => (
          <div key={option.value} className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 rounded flex items-center justify-center text-white", option.color)}>
              {option.icon}
            </div>
            <span className="text-muted-foreground">{option.label}</span>
          </div>
        ))}
      </div>

      {/* Items Grid */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/30"
          >
            <span className="flex-1 text-sm">{item.label}</span>
            <div className="flex gap-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(item.id, option.value)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all text-white",
                    item.value === option.value
                      ? cn(option.color, "ring-2 ring-offset-1 ring-offset-background ring-current scale-110")
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  title={option.label}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistSection;
