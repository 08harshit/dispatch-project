import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";

interface RoutePlannerButtonProps {
  onClick: () => void;
}

export const RoutePlannerButton = ({ onClick }: RoutePlannerButtonProps) => {
  const { selectedLoads } = useRoutePlanner();
  const count = selectedLoads.length;

  return (
    <Button
      onClick={onClick}
      className={cn(
        "h-12 px-6 rounded-2xl font-semibold transition-all duration-300 relative overflow-hidden group border-0",
        count > 0
          ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-600 hover:via-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-200/40"
          : "bg-stone-100 hover:bg-stone-200 text-stone-500"
      )}
    >
      {/* Subtle inner glow when active */}
      {count > 0 && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/15 pointer-events-none" />
      )}
      
      <Route className="h-4 w-4 mr-2.5 relative z-10" strokeWidth={2} />
      <span className="relative z-10 tracking-wide">Plan Route</span>
      
      {count > 0 && (
        <span className="ml-3 h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold flex items-center justify-center relative z-10 ring-1 ring-white/30">
          {count}
        </span>
      )}
    </Button>
  );
};
