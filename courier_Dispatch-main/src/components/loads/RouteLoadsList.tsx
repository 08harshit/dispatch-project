import { MapPin, ArrowRight, X, Clock, DollarSign, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadNotification } from "@/hooks/useLoadNotifications";

// Color palette matching the map
const LOAD_COLORS = [
  { pickup: "#f59e0b", delivery: "#10b981", gradient: "from-amber-400 to-emerald-400" },
  { pickup: "#3b82f6", delivery: "#14b8a6", gradient: "from-blue-400 to-teal-400" },
  { pickup: "#f97316", delivery: "#06b6d4", gradient: "from-orange-400 to-cyan-400" },
  { pickup: "#84cc16", delivery: "#0d9488", gradient: "from-lime-400 to-teal-500" },
  { pickup: "#eab308", delivery: "#22c55e", gradient: "from-yellow-400 to-green-400" },
];

interface OptimizedStop {
  type: "pickup" | "delivery";
  loadIndex: number;
  load: LoadNotification;
  coordinates: [number, number];
  city: string;
  state: string;
  date: string;
  time: string;
  color: string;
  label: string;
}

interface RouteLoadsListProps {
  loads: LoadNotification[];
  optimizedStops?: OptimizedStop[];
  onRemoveLoad: (loadId: string) => void;
  compact?: boolean;
}

export const RouteLoadsList = ({ 
  loads, 
  optimizedStops,
  onRemoveLoad,
  compact = false
}: RouteLoadsListProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loads.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <p className="text-sm">No loads added to route</p>
      </div>
    );
  }

  // If we have optimized stops, show them in order
  if (optimizedStops && optimizedStops.length > 0) {
    return (
      <div className="space-y-2">
        {optimizedStops.map((stop, idx) => {
          const colors = LOAD_COLORS[stop.loadIndex % LOAD_COLORS.length];
          const pricePerMile = stop.load.price / stop.load.distance;
          const isProfitable = pricePerMile >= 1.5;
          
          return (
            <div
              key={`${stop.type}-${stop.loadIndex}-${idx}`}
              className={cn(
                "group bg-white rounded-xl border border-stone-100 transition-all hover:shadow-md relative overflow-hidden",
                compact ? "p-2" : "p-3"
              )}
            >
              {/* Color indicator */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: stop.color }}
              />
              
              <div className="flex items-center gap-3 pl-3">
                {/* Stop number */}
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0",
                    compact ? "h-6 w-6" : "h-8 w-8"
                  )}
                  style={{ backgroundColor: stop.color }}
                >
                  {idx + 1}
                </div>
                
                {/* Stop info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase",
                      stop.type === "pickup" ? "bg-amber-500" : "bg-emerald-500"
                    )}>
                      {stop.type}
                    </span>
                    <span className="text-xs text-stone-500 truncate">
                      {stop.city}, {stop.state}
                    </span>
                  </div>
                  <p className={cn(
                    "font-semibold text-stone-800 truncate",
                    compact ? "text-xs" : "text-sm"
                  )}>
                    {stop.load.vehicle.year} {stop.load.vehicle.make} {stop.load.vehicle.model}
                  </p>
                  {!compact && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {stop.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {stop.load.distance} mi
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Price (only for deliveries to avoid duplication) */}
                {stop.type === "delivery" && (
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      "font-bold text-emerald-600",
                      compact ? "text-sm" : "text-base"
                    )}>
                      {formatCurrency(stop.load.price)}
                    </p>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded",
                      isProfitable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      ${pricePerMile.toFixed(2)}/mi
                    </span>
                  </div>
                )}
                
                {/* Remove button (only on pickup to remove entire load) */}
                {stop.type === "pickup" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveLoad(stop.load.id)}
                    className="h-6 w-6 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: show loads in original order
  return (
    <div className="space-y-2">
      {loads.map((load, index) => {
        const colors = LOAD_COLORS[index % LOAD_COLORS.length];
        const pricePerMile = load.price / load.distance;
        const isProfitable = pricePerMile >= 1.5;
        
        return (
          <div
            key={load.id}
            className={cn(
              "group bg-white rounded-xl border border-stone-100 transition-all hover:shadow-md relative overflow-hidden",
              compact ? "p-2" : "p-3"
            )}
          >
            {/* Gradient indicator */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
              colors.gradient
            )} />
            
            <div className="flex items-center gap-3 pl-3">
              {/* Load number */}
              <div className={cn(
                "rounded-full bg-gradient-to-r flex items-center justify-center text-white font-bold text-xs flex-shrink-0",
                colors.gradient,
                compact ? "h-6 w-6" : "h-8 w-8"
              )}>
                {index + 1}
              </div>
              
              {/* Load info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold text-stone-800 truncate",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {load.vehicle.year} {load.vehicle.make} {load.vehicle.model}
                </p>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" style={{ color: colors.pickup }} />
                    <span className="truncate">{load.pickup.city}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-stone-300 flex-shrink-0" />
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" style={{ color: colors.delivery }} />
                    <span className="truncate">{load.delivery.city}</span>
                  </div>
                </div>
                {!compact && (
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                    <span>{load.distance} mi</span>
                    <span>{load.pickup.date}</span>
                  </div>
                )}
              </div>
              
              {/* Price and actions */}
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "font-bold text-emerald-600",
                  compact ? "text-sm" : "text-base"
                )}>
                  {formatCurrency(load.price)}
                </p>
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded",
                  isProfitable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  ${pricePerMile.toFixed(2)}/mi
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveLoad(load.id)}
                className="h-6 w-6 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
