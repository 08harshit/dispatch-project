import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Clock, Truck, Route, MapPin, Navigation, Zap } from "lucide-react";
import RouteLeafletMap from "@/components/shipping/route-map/RouteLeafletMap";
import { useGeocodeLocation } from "@/hooks/useGeocodeLocation";

interface RouteMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickupLocation: string;
  pickupCity: string;
  pickupState: string;
  deliveryLocation: string;
  deliveryCity: string;
  deliveryState: string;
}

const haversineMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const estimatePrice = (distanceMiles: number) => {
  const baseRate = 200;
  const low = Math.round(baseRate + distanceMiles * 0.5);
  const high = Math.round(baseRate + distanceMiles * 0.85);
  return { low, high, average: Math.round((low + high) / 2) };
};

const estimateTransitTime = (distanceMiles: number) => {
  const milesPerDay = 500;
  const minDays = Math.ceil(distanceMiles / (milesPerDay * 1.2));
  const maxDays = Math.ceil(distanceMiles / (milesPerDay * 0.8));
  return { min: Math.max(1, minDays), max: Math.max(1, maxDays) };
};

const buildQuery = (full: string, city: string, state: string) => {
  const base = (full || "").trim() || `${city || ""}${state ? `, ${state}` : ""}`.trim();
  return base.replace(/,+\s*$/, "");
};

export default function RouteMapModalLive({
  open,
  onOpenChange,
  pickupLocation,
  pickupCity,
  pickupState,
  deliveryLocation,
  deliveryCity,
  deliveryState,
}: RouteMapModalProps) {
  const pickupQuery = useMemo(
    () => buildQuery(pickupLocation, pickupCity, pickupState),
    [pickupLocation, pickupCity, pickupState]
  );
  const deliveryQuery = useMemo(
    () => buildQuery(deliveryLocation, deliveryCity, deliveryState),
    [deliveryLocation, deliveryCity, deliveryState]
  );

  const { coords: pickupGeo, loading: pickupLoading } = useGeocodeLocation(pickupQuery, open);
  const { coords: deliveryGeo, loading: deliveryLoading } = useGeocodeLocation(deliveryQuery, open);

  const calculating = pickupLoading || deliveryLoading || !pickupGeo || !deliveryGeo;

  const routeInfo = useMemo(() => {
    if (!pickupGeo || !deliveryGeo) return null;
    const distance = haversineMiles(pickupGeo.lat, pickupGeo.lng, deliveryGeo.lat, deliveryGeo.lng);
    return {
      distance,
      price: estimatePrice(distance),
      transitTime: estimateTransitTime(distance),
    };
  }, [pickupGeo, deliveryGeo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[950px] h-[88vh] p-0 overflow-hidden rounded-2xl border-0 bg-background/95 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-teal-500/5" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/25">
                <Route className="h-5 w-5 text-white" />
              </div>
              Route Overview
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Map Section */}
          <div className="flex-1 relative min-h-[320px] lg:min-h-[400px] bg-slate-100">
            {pickupGeo && deliveryGeo ? (
              <RouteLeafletMap
                open={open}
                pickup={{ ...pickupGeo, label: pickupQuery }}
                delivery={{ ...deliveryGeo, label: deliveryQuery }}
                distance={routeInfo?.distance}
                className="h-full w-full"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}

            {calculating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-[1001]">
                <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/90 shadow-xl border border-white/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary animate-bounce" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Calculating route...</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="w-full lg:w-80 max-h-[400px] lg:max-h-full border-t lg:border-t-0 lg:border-l border-border/30 flex flex-col shrink-0 overflow-y-scroll scrollbar-visible">
              <div className="p-5 space-y-4">
                {/* Location Cards */}
                <div className="space-y-3">
                  {/* Pickup */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/5 border border-primary/20 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-sm">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">Pickup</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{pickupQuery || "—"}</p>
                  </div>

                  {/* Connection line */}
                  <div className="flex items-center justify-center py-1">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-primary via-muted-foreground to-teal-500 rounded-full" />
                  </div>

                  {/* Delivery */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
                        <Navigation className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Delivery</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{deliveryQuery || "—"}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="space-y-3 pt-2">
                  {/* Distance */}
                  <div className="p-4 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="text-lg font-bold text-foreground">
                          {routeInfo ? `${Math.round(routeInfo.distance).toLocaleString()} mi` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transit Time */}
                  <div className="p-4 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Transit Time</p>
                        <p className="text-lg font-bold text-foreground">
                          {routeInfo ? `${routeInfo.transitTime.min}-${routeInfo.transitTime.max} days` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Price */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Price</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {routeInfo ? `$${routeInfo.price.average.toLocaleString()}` : "—"}
                        </p>
                      </div>
                    </div>
                    {routeInfo && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-emerald-500/20">
                        <span>Range: ${routeInfo.price.low.toLocaleString()}</span>
                        <span>—</span>
                        <span>${routeInfo.price.high.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick hint */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Prices based on current market rates
                    </p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
