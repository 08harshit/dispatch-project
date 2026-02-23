import { cn } from "@/lib/utils";
import { Car, Cog, Navigation, Circle, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type VehicleCondition = {
  runs: boolean;
  starts: boolean;
  drivable: boolean;
  rolls: boolean;
};

const conditionItems = [
  { key: "runs" as const, label: "Runner", negLabel: "Non-Runner", icon: Car, desc: "Engine runs", negDesc: "Engine does not run" },
  { key: "starts" as const, label: "Starts", negLabel: "No Start", icon: Cog, desc: "Vehicle starts", negDesc: "Vehicle does not start" },
  { key: "drivable" as const, label: "Drivable", negLabel: "Not Drivable", icon: Navigation, desc: "Can be driven", negDesc: "Cannot be driven" },
  { key: "rolls" as const, label: "Rolls", negLabel: "No Roll", icon: Circle, desc: "Wheels roll freely", negDesc: "Wheels do not roll" },
] as const;

interface ConditionIconsProps {
  condition: VehicleCondition;
  size?: "sm" | "md";
}

export const ConditionIcons = ({ condition, size = "sm" }: ConditionIconsProps) => {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const badgeSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const badgeIconSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1.5">
        {conditionItems.map(({ key, label, negLabel, icon: Icon, desc, negDesc }) => {
          const isPositive = condition[key];
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "relative flex items-center justify-center rounded-xl transition-colors cursor-default",
                    size === "sm" ? "h-8 w-8" : "h-9 w-9",
                    isPositive
                      ? "bg-emerald-50 text-emerald-500"
                      : "bg-stone-50 text-stone-300"
                  )}
                >
                  <Icon className={iconSize} strokeWidth={1.5} />
                  {/* Status badge */}
                  <div className={cn(
                    "absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center",
                    badgeSize,
                    isPositive
                      ? "bg-emerald-400 text-white"
                      : "bg-rose-400 text-white"
                  )}>
                    {isPositive 
                      ? <Check className={badgeIconSize} strokeWidth={3} />
                      : <X className={badgeIconSize} strokeWidth={3} />
                    }
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isPositive ? "bg-emerald-500" : "bg-rose-400"
                  )} />
                  <div>
                    <p className="font-semibold text-xs">{isPositive ? label : negLabel}</p>
                    <p className="text-[10px] text-muted-foreground">{isPositive ? desc : negDesc}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

// Helper to get a condition score for sorting (higher = better)
export const getConditionScore = (condition: VehicleCondition): number => {
  return (condition.runs ? 8 : 0) + (condition.starts ? 4 : 0) + (condition.drivable ? 2 : 0) + (condition.rolls ? 1 : 0);
};
