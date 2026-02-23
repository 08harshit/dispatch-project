import { MapPin, ArrowRight, X, Route, DollarSign, Navigation, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface RoutePlannerPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoutePlannerPanel = ({ open, onOpenChange }: RoutePlannerPanelProps) => {
  const { selectedLoads, removeLoad, clearRoute } = useRoutePlanner();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalDistance = selectedLoads.reduce((sum, load) => sum + load.distance, 0);
  const totalEarnings = selectedLoads.reduce((sum, load) => sum + load.price, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-stone-50 border-l border-stone-200 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 p-6">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Route className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Route Planner</span>
                <p className="text-white/80 text-sm font-normal mt-0.5">
                  {selectedLoads.length} {selectedLoads.length === 1 ? 'load' : 'loads'} selected
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Stats */}
        <div className="p-4 bg-white border-b border-stone-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="h-4 w-4 text-amber-500" />
                <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">Total Distance</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{totalDistance.toLocaleString()} mi</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">Total Earnings</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalEarnings)}</p>
            </div>
          </div>
        </div>

        {/* Loads List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {selectedLoads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                <Route className="h-7 w-7 text-stone-400" />
              </div>
              <p className="font-semibold text-stone-600">No loads in route</p>
              <p className="text-sm text-stone-400 mt-1">Add loads from the Available tab</p>
            </div>
          ) : (
            selectedLoads.map((load, index) => (
              <div
                key={load.id}
                className="group bg-white rounded-2xl border border-stone-100 p-4 hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                {/* Step indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-emerald-400" />
                
                <div className="flex items-start gap-3 pl-3">
                  {/* Step number */}
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm">
                    {index + 1}
                  </div>
                  
                  {/* Load info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-stone-800 text-sm">
                        {load.vehicle.year} {load.vehicle.make} {load.vehicle.model}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLoad(load.id)}
                        className="h-7 w-7 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Route */}
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-stone-600 font-medium">{load.pickup.city}, {load.pickup.state}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-stone-300" />
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-stone-600 font-medium">{load.delivery.city}, {load.delivery.state}</span>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-stone-400">{load.distance} mi</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(load.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {selectedLoads.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-100 space-y-3">
            <Button
              onClick={clearRoute}
              variant="outline"
              className="w-full h-11 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Route
            </Button>
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white shadow-lg"
            >
              <Route className="h-4 w-4 mr-2" />
              Optimize & Accept All ({formatCurrency(totalEarnings)})
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
