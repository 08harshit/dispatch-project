import { 
  ArrowRight, ArrowLeft, ArrowUp, CornerUpRight, CornerUpLeft, 
  Merge, GitFork, RotateCw, Navigation, Clock, Route, X, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { RouteStep, RouteInfo } from "./LocationPicker";

interface RouteDirectionsPanelProps {
  route: RouteInfo | null;
  startLocation: string;
  arrivalPoint: string;
  onClose: () => void;
}

// Get icon for maneuver type
const getManeuverIcon = (maneuver: string, instruction: string) => {
  const isLeft = instruction.toLowerCase().includes("left");
  const isRight = instruction.toLowerCase().includes("right");
  
  switch (maneuver) {
    case "depart":
      return <Navigation className="h-4 w-4" />;
    case "arrive":
      return <MapPin className="h-4 w-4" />;
    case "turn":
      return isLeft ? <CornerUpLeft className="h-4 w-4" /> : <CornerUpRight className="h-4 w-4" />;
    case "merge":
      return <Merge className="h-4 w-4" />;
    case "fork":
      return <GitFork className="h-4 w-4" />;
    case "roundabout":
    case "rotary":
      return <RotateCw className="h-4 w-4" />;
    case "continue":
    case "new name":
      return <ArrowUp className="h-4 w-4" />;
    default:
      if (isLeft) return <ArrowLeft className="h-4 w-4" />;
      if (isRight) return <ArrowRight className="h-4 w-4" />;
      return <ArrowUp className="h-4 w-4" />;
  }
};

export const RouteDirectionsPanel = ({ 
  route, 
  startLocation, 
  arrivalPoint, 
  onClose 
}: RouteDirectionsPanelProps) => {
  if (!route) return null;

  const formatDistance = (miles: number) => {
    if (miles < 0.1) return `${Math.round(miles * 5280)} ft`;
    return `${miles.toFixed(1)} mi`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return "< 1 min";
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${Math.round(minutes)} min`;
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-emerald-500 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Route className="h-5 w-5" />
            Directions
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Navigation className="h-4 w-4" />
            <span className="font-semibold">{formatDistance(route.distance)}</span>
          </div>
          <div className="w-px h-4 bg-white/40" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">{formatDuration(route.duration)}</span>
          </div>
        </div>
      </div>

      {/* Route endpoints */}
      <div className="p-3 border-b border-stone-100 bg-stone-50/50">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <div className="w-0.5 h-4 bg-stone-300" />
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-medium text-stone-700 truncate">
              {startLocation || "Start location"}
            </p>
            <p className="text-sm font-medium text-stone-700 truncate">
              {arrivalPoint || "Destination"}
            </p>
          </div>
        </div>
      </div>

      {/* Steps list */}
      <ScrollArea className="h-64 [&>[data-radix-scroll-area-viewport]]:!overflow-y-scroll [&_[data-radix-scroll-area-scrollbar]]:!opacity-100 [&_[data-radix-scroll-area-thumb]]:!bg-stone-300">
        <div className="p-3 space-y-1">
          {route.steps.filter(step => step.distance > 0.01).map((step, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl transition-all",
                step.maneuver === "arrive" 
                  ? "bg-emerald-50 border border-emerald-100"
                  : step.maneuver === "depart"
                    ? "bg-amber-50 border border-amber-100"
                    : "hover:bg-stone-50"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                step.maneuver === "arrive" 
                  ? "bg-emerald-100 text-emerald-600"
                  : step.maneuver === "depart"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-stone-100 text-stone-600"
              )}>
                {getManeuverIcon(step.maneuver, step.instruction)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800">
                  {step.instruction}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                  <span>{formatDistance(step.distance)}</span>
                  <span>•</span>
                  <span>{formatDuration(step.duration)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
