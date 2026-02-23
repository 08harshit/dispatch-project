import { useMemo, useState, useCallback } from "react";
import { 
  Calendar, Clock, MapPin, Route, Zap, ChevronRight, 
  TrendingUp, Navigation, Car, Sparkles, SlidersHorizontal,
  DollarSign, Target, X, LayoutGrid, LocateFixed, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadNotification } from "@/hooks/useLoadNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RouteDayPlannerProps {
  loads: LoadNotification[];
  onAddToRoute: (load: LoadNotification) => void;
  isInRoute: (loadId: string) => boolean;
}

interface BundleFilters {
  mode: "earnings" | "mileage";
  targetEarnings: number;
  targetMileage: number;
  minDistance: number;
  maxDistance: number;
  minPerMile: number;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  availableSpots: number;
  dateFrom: string;
  dateTo: string;
}

interface DayGroup {
  date: string;
  displayDate: string;
  loads: LoadNotification[];
}

interface CorridorGroup {
  id: string;
  name: string;
  direction: string;
  loads: LoadNotification[];
  totalDistance: number;
  totalEarnings: number;
  savings: number; // Miles saved by bundling
}

// Calculate if two routes share a similar corridor
const calculateCorridorMatch = (load1: LoadNotification, load2: LoadNotification): number => {
  const p1 = load1.pickup.coordinates;
  const d1 = load1.delivery.coordinates;
  const p2 = load2.pickup.coordinates;
  const d2 = load2.delivery.coordinates;

  // Calculate direction vectors
  const dir1 = { lat: d1[0] - p1[0], lon: d1[1] - p1[1] };
  const dir2 = { lat: d2[0] - p2[0], lon: d2[1] - p2[1] };

  // Normalize vectors
  const mag1 = Math.sqrt(dir1.lat ** 2 + dir1.lon ** 2);
  const mag2 = Math.sqrt(dir2.lat ** 2 + dir2.lon ** 2);
  
  if (mag1 === 0 || mag2 === 0) return 0;

  const norm1 = { lat: dir1.lat / mag1, lon: dir1.lon / mag1 };
  const norm2 = { lat: dir2.lat / mag2, lon: dir2.lon / mag2 };

  // Dot product gives similarity (-1 to 1)
  const dotProduct = norm1.lat * norm2.lat + norm1.lon * norm2.lon;

  // Check if pickup points are within reasonable distance (300 miles)
  const pickupDist = Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) * 69; // Rough miles conversion

  if (pickupDist > 300) return 0;

  // Return similarity score (0-100)
  return Math.max(0, dotProduct * 100 * (1 - pickupDist / 500));
};

// Get corridor name from coordinates
const getCorridorName = (loads: LoadNotification[]): { name: string; direction: string } => {
  if (loads.length === 0) return { name: "Unknown", direction: "" };
  
  const avgStartLat = loads.reduce((sum, l) => sum + l.pickup.coordinates[0], 0) / loads.length;
  const avgEndLat = loads.reduce((sum, l) => sum + l.delivery.coordinates[0], 0) / loads.length;
  const avgStartLon = loads.reduce((sum, l) => sum + l.pickup.coordinates[1], 0) / loads.length;
  const avgEndLon = loads.reduce((sum, l) => sum + l.delivery.coordinates[1], 0) / loads.length;

  const latDiff = avgEndLat - avgStartLat;
  const lonDiff = avgEndLon - avgStartLon;

  let direction = "";
  if (Math.abs(latDiff) > Math.abs(lonDiff)) {
    direction = latDiff > 0 ? "Northbound" : "Southbound";
  } else {
    direction = lonDiff > 0 ? "Eastbound" : "Westbound";
  }

  // Use first and last cities
  const startCity = loads[0].pickup.city;
  const endCity = loads[loads.length - 1].delivery.city;

  return { 
    name: `${startCity} → ${endCity} Corridor`,
    direction
  };
};

// Find corridor groups
const findCorridors = (loads: LoadNotification[]): CorridorGroup[] => {
  const corridors: CorridorGroup[] = [];
  const assigned = new Set<string>();

  loads.forEach((load, i) => {
    if (assigned.has(load.id)) return;

    const similarLoads = [load];
    assigned.add(load.id);

    loads.forEach((otherLoad, j) => {
      if (i === j || assigned.has(otherLoad.id)) return;
      
      const similarity = calculateCorridorMatch(load, otherLoad);
      if (similarity > 30) { // 30% similarity threshold
        similarLoads.push(otherLoad);
        assigned.add(otherLoad.id);
      }
    });

    if (similarLoads.length > 1) {
      const { name, direction } = getCorridorName(similarLoads);
      const totalDistance = similarLoads.reduce((sum, l) => sum + l.distance, 0);
      const totalEarnings = similarLoads.reduce((sum, l) => sum + l.price, 0);
      
      // Calculate potential savings (rough estimate of miles saved)
      const directDistance = totalDistance;
      const bundledDistance = Math.max(...similarLoads.map(l => l.distance)) + 
        similarLoads.slice(1).reduce((sum, l) => sum + 30, 0); // Assume ~30mi detour per extra load
      const savings = Math.max(0, directDistance - bundledDistance);

      corridors.push({
        id: `corridor-${i}`,
        name,
        direction,
        loads: similarLoads,
        totalDistance,
        totalEarnings,
        savings
      });
    }
  });

  return corridors;
};

// Group loads by date
const groupByDate = (loads: LoadNotification[]): DayGroup[] => {
  const groups: Record<string, LoadNotification[]> = {};
  
  loads.forEach(load => {
    const date = load.pickup.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(load);
  });

  return Object.entries(groups)
    .map(([date, loads]) => {
      const d = new Date(date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let displayDate = d.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });

      if (d.toDateString() === today.toDateString()) {
        displayDate = "Today";
      } else if (d.toDateString() === tomorrow.toDateString()) {
        displayDate = "Tomorrow";
      }

      return { date, displayDate, loads };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const RouteDayPlanner = ({ loads, onAddToRoute, isInRoute }: RouteDayPlannerProps) => {
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  const defaultFilters: BundleFilters = {
    mode: "earnings",
    targetEarnings: 2000,
    targetMileage: 500,
    minDistance: 0,
    maxDistance: 1000,
    minPerMile: 1.0,
    pickupCity: "",
    pickupState: "",
    deliveryCity: "",
    deliveryState: "",
    availableSpots: 0,
    dateFrom: "",
    dateTo: "",
  };

  const [filters, setFilters] = useState<BundleFilters>(defaultFilters);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fillFromGPS = useCallback(async (target: "pickup" | "delivery") => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || "";
      const state = data.address?.state || "";
      // Extract 2-letter state abbreviation
      const stateAbbr = state.length === 2 ? state.toUpperCase() : "";
      if (target === "pickup") {
        setFilters(f => ({ ...f, pickupCity: city, pickupState: stateAbbr }));
      } else {
        setFilters(f => ({ ...f, deliveryCity: city, deliveryState: stateAbbr }));
      }
    } catch {
      // silently fail
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const dayGroups = useMemo(() => groupByDate(loads), [loads]);
  const corridors = useMemo(() => findCorridors(loads), [loads]);

  // Apply filters to corridors
  const filteredCorridors = useMemo(() => {
    return corridors.filter(corridor => {
      const perMile = corridor.totalEarnings / corridor.totalDistance;
      
      if (perMile < filters.minPerMile) return false;
      if (corridor.totalDistance < filters.minDistance) return false;
      if (corridor.totalDistance > filters.maxDistance) return false;

      // Filter by pickup location
      if (filters.pickupCity && !corridor.loads.some(l => 
        l.pickup.city.toLowerCase().includes(filters.pickupCity.toLowerCase())
      )) return false;
      if (filters.pickupState && !corridor.loads.some(l => 
        l.pickup.state.toUpperCase() === filters.pickupState.toUpperCase()
      )) return false;

      // Filter by delivery location
      if (filters.deliveryCity && !corridor.loads.some(l => 
        l.delivery.city.toLowerCase().includes(filters.deliveryCity.toLowerCase())
      )) return false;
      if (filters.deliveryState && !corridor.loads.some(l => 
        l.delivery.state.toUpperCase() === filters.deliveryState.toUpperCase()
      )) return false;

      // Filter by available spots (courier's truck capacity - only show bundles that fit)
      if (filters.availableSpots > 0 && corridor.loads.length > filters.availableSpots) return false;

      // Filter by date range
      if (filters.dateFrom) {
        const hasLoadAfter = corridor.loads.some(l => l.pickup.date >= filters.dateFrom);
        if (!hasLoadAfter) return false;
      }
      if (filters.dateTo) {
        const hasLoadBefore = corridor.loads.some(l => l.pickup.date <= filters.dateTo);
        if (!hasLoadBefore) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by target criteria
      if (filters.mode === "earnings") {
        // Prioritize bundles closer to target earnings
        const diffA = Math.abs(a.totalEarnings - filters.targetEarnings);
        const diffB = Math.abs(b.totalEarnings - filters.targetEarnings);
        return diffA - diffB;
      } else {
        // Prioritize bundles closer to target mileage
        const diffA = Math.abs(a.totalDistance - filters.targetMileage);
        const diffB = Math.abs(b.totalDistance - filters.targetMileage);
        return diffA - diffB;
      }
    });
  }, [corridors, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-[2rem_3rem_2rem_3rem] bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-stone-400" />
        </div>
        <p className="font-semibold text-stone-600">No loads available</p>
        <p className="text-sm text-stone-400 mt-1">Check back later for new opportunities</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[1rem_1.5rem_1rem_1.5rem] bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="font-bold text-stone-800">Smart Bundles</h3>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-9 px-4 rounded-xl border-stone-200 transition-all",
            showFilters && "bg-amber-50 border-amber-200 text-amber-700"
          )}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {(filters.minPerMile > 1 || filters.minDistance > 0 || filters.maxDistance < 1000 || filters.pickupCity || filters.pickupState || filters.deliveryCity || filters.deliveryState || filters.availableSpots > 0 || filters.dateFrom || filters.dateTo) && (
            <span className="ml-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </Button>
      </div>

      {corridors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[1rem_1.5rem_1rem_1.5rem] bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800">Smart Route Bundles</h3>
              <p className="text-xs text-stone-500">Loads on similar roads - pick up together!</p>
            </div>
          </div>

          {/* Innovative Filter Panel */}
          {showFilters && (
            <div className="relative overflow-hidden rounded-[1.5rem_2.5rem_1.5rem_2.5rem] animate-fade-in">
              {/* Glassmorphic background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-amber-50/40 to-emerald-50/30 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-emerald-200/20" />
              
              {/* Animated border */}
              <div className="absolute inset-0 rounded-[1.5rem_2.5rem_1.5rem_2.5rem] p-[1px] bg-gradient-to-r from-amber-300/50 via-stone-200 to-emerald-300/50" />
              
              <div className="relative p-6">
                {/* Header with animated icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-[0.8rem_1.2rem_0.8rem_1.2rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-800">Bundle Criteria</h4>
                      <p className="text-[10px] text-stone-500">AI-powered route optimization</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters(defaultFilters)}
                    className="h-8 px-3 text-xs text-stone-500 hover:text-stone-700 rounded-xl hover:bg-stone-100/50"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>

                {/* Optimization Mode Toggle - Innovative Design */}
                <div className="mb-6">
                  <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-3 block">
                    Optimize For
                  </Label>
                  <div className="relative p-1 rounded-2xl bg-stone-100/80 backdrop-blur">
                    {/* Animated slider background */}
                    <div 
                      className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-500 ease-out",
                        "bg-gradient-to-r shadow-lg",
                        filters.mode === "earnings" 
                          ? "left-1 from-emerald-500 to-teal-500 shadow-emerald-200/50" 
                          : "left-[calc(50%+2px)] from-amber-500 to-orange-500 shadow-amber-200/50"
                      )}
                    />
                    <div className="relative grid grid-cols-2 gap-1">
                      <button
                        onClick={() => setFilters(f => ({ ...f, mode: "earnings" }))}
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300",
                          filters.mode === "earnings" 
                            ? "text-white font-bold" 
                            : "text-stone-500 hover:text-stone-700"
                        )}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Target Earnings</span>
                      </button>
                      <button
                        onClick={() => setFilters(f => ({ ...f, mode: "mileage" }))}
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300",
                          filters.mode === "mileage" 
                            ? "text-white font-bold" 
                            : "text-stone-500 hover:text-stone-700"
                        )}
                      >
                        <Navigation className="h-4 w-4" />
                        <span className="text-sm">Target Mileage</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Target Value with Visual Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                      {filters.mode === "earnings" ? "Target Earnings" : "Target Mileage"}
                    </Label>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      filters.mode === "earnings" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {filters.mode === "earnings" 
                        ? `$${filters.targetEarnings.toLocaleString()}` 
                        : `${filters.targetMileage} mi`
                      }
                    </div>
                  </div>
                  <div className="relative">
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center rounded-l-xl",
                      filters.mode === "earnings" 
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                        : "bg-gradient-to-r from-amber-500 to-amber-400"
                    )}>
                      {filters.mode === "earnings" 
                        ? <DollarSign className="h-5 w-5 text-white" />
                        : <Navigation className="h-5 w-5 text-white" />
                      }
                    </div>
                    <Input
                      type="number"
                      value={filters.mode === "earnings" ? filters.targetEarnings : filters.targetMileage}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (filters.mode === "earnings") {
                          setFilters(f => ({ ...f, targetEarnings: value }));
                        } else {
                          setFilters(f => ({ ...f, targetMileage: value }));
                        }
                      }}
                      className="h-12 pl-16 pr-4 rounded-xl border-stone-200 text-lg font-bold focus:ring-2 focus:ring-amber-300"
                      placeholder={filters.mode === "earnings" ? "2000" : "500"}
                    />
                  </div>
                </div>

                {/* Minimum $/Mile with Distribution Visual */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                      Minimum $/Mile
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-300",
                        filters.minPerMile >= 2 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/50" 
                          : filters.minPerMile >= 1.5 
                            ? "bg-amber-100 text-amber-700" 
                            : "bg-stone-100 text-stone-600"
                      )}>
                        ${filters.minPerMile.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual distribution bar */}
                  <div className="relative h-3 mb-2 rounded-full overflow-hidden bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-200">
                    {/* Marker for current value */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-stone-800 rounded-full shadow-lg transition-all duration-300"
                      style={{ left: `${((filters.minPerMile - 0.5) / 2.5) * 100}%` }}
                    />
                    {/* Shaded area for filtered out */}
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-stone-400/30 transition-all duration-300"
                      style={{ width: `${((filters.minPerMile - 0.5) / 2.5) * 100}%` }}
                    />
                  </div>
                  
                  <Slider
                    value={[filters.minPerMile]}
                    onValueChange={([value]) => setFilters(f => ({ ...f, minPerMile: value }))}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span className="text-rose-500 font-medium">$0.50 Low</span>
                    <span className="text-amber-500 font-medium">$1.50 Fair</span>
                    <span className="text-emerald-500 font-medium">$3.00 Premium</span>
                  </div>
                </div>

                {/* Distance Range - Dual Handle Visual */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                      Distance Range
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                        {filters.minDistance} mi
                      </span>
                      <ChevronRight className="h-3 w-3 text-stone-400" />
                      <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                        {filters.maxDistance} mi
                      </span>
                    </div>
                  </div>
                  
                  {/* Visual range indicator */}
                  <div className="relative h-12 mb-4 rounded-2xl overflow-hidden bg-gradient-to-r from-stone-100 to-stone-50 border border-stone-200">
                    {/* Active range highlight */}
                    <div 
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-400/30 via-orange-300/20 to-emerald-400/30 transition-all duration-300"
                      style={{ 
                        left: `${(filters.minDistance / 1500) * 100}%`,
                        right: `${100 - (filters.maxDistance / 1500) * 100}%`
                      }}
                    />
                    
                    {/* Min handle */}
                    <div 
                      className="absolute top-1 bottom-1 w-1 rounded-full bg-amber-500 shadow-lg transition-all duration-300"
                      style={{ left: `${Math.max(2, (filters.minDistance / 1500) * 100)}%` }}
                    />
                    
                    {/* Max handle */}
                    <div 
                      className="absolute top-1 bottom-1 w-1 rounded-full bg-emerald-500 shadow-lg transition-all duration-300"
                      style={{ left: `${Math.min(98, (filters.maxDistance / 1500) * 100)}%` }}
                    />
                    
                    {/* Labels inside */}
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <span className="text-xs font-medium text-stone-400">0 mi</span>
                      <span className="text-xs font-medium text-stone-400">1500 mi</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center rounded-l-xl bg-amber-500">
                        <span className="text-white text-xs font-bold">MIN</span>
                      </div>
                      <Input
                        type="number"
                        value={filters.minDistance}
                        onChange={(e) => setFilters(f => ({ 
                          ...f, 
                          minDistance: Math.min(parseInt(e.target.value) || 0, f.maxDistance) 
                        }))}
                        className="h-11 pl-14 rounded-xl border-stone-200 text-center font-bold"
                        placeholder="0"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center rounded-l-xl bg-emerald-500">
                        <span className="text-white text-xs font-bold">MAX</span>
                      </div>
                      <Input
                        type="number"
                        value={filters.maxDistance}
                        onChange={(e) => setFilters(f => ({ 
                          ...f, 
                          maxDistance: Math.max(parseInt(e.target.value) || 0, f.minDistance) 
                        }))}
                        className="h-11 pl-14 rounded-xl border-stone-200 text-center font-bold"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                </div>

                {/* Pickup & Delivery Location Filters */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                      Pickup Location
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fillFromGPS("pickup")}
                      disabled={gpsLoading}
                      className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg gap-1"
                    >
                      {gpsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                      Use GPS
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="City"
                      value={filters.pickupCity}
                      onChange={(e) => setFilters(f => ({ ...f, pickupCity: e.target.value }))}
                      className="h-10 rounded-xl border-stone-200 text-sm placeholder:text-stone-300"
                    />
                    <Input
                      placeholder="State (e.g. CA)"
                      value={filters.pickupState}
                      onChange={(e) => setFilters(f => ({ ...f, pickupState: e.target.value.toUpperCase() }))}
                      maxLength={2}
                      className="h-10 rounded-xl border-stone-200 text-sm placeholder:text-stone-300 uppercase"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                      Delivery Location
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fillFromGPS("delivery")}
                      disabled={gpsLoading}
                      className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg gap-1"
                    >
                      {gpsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                      Use GPS
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="City"
                      value={filters.deliveryCity}
                      onChange={(e) => setFilters(f => ({ ...f, deliveryCity: e.target.value }))}
                      className="h-10 rounded-xl border-stone-200 text-sm placeholder:text-stone-300"
                    />
                    <Input
                      placeholder="State (e.g. TX)"
                      value={filters.deliveryState}
                      onChange={(e) => setFilters(f => ({ ...f, deliveryState: e.target.value.toUpperCase() }))}
                      maxLength={2}
                      className="h-10 rounded-xl border-stone-200 text-sm placeholder:text-stone-300 uppercase"
                    />
                  </div>
                </div>

                {/* Available Spots & Date Range */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-3 block">
                      Available Spots on Trailer
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={filters.availableSpots || ""}
                      onChange={(e) => setFilters(f => ({ ...f, availableSpots: Math.min(12, Math.max(0, parseInt(e.target.value) || 0)) }))}
                      placeholder="e.g. 7"
                      className="h-10 rounded-xl border-stone-200 text-sm placeholder:text-stone-300"
                    />
                    <p className="text-[9px] text-stone-400 mt-1">Max vehicles your trailer can carry</p>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-3 block">
                      Date Range
                    </Label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                        className="h-10 rounded-xl border-stone-200 text-sm"
                      />
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                        className="h-10 rounded-xl border-stone-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Results Summary - Animated */}
                <div className="relative p-4 rounded-2xl bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
                  </div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Route className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Matching Bundles</p>
                        <p className="text-white font-bold text-lg">
                          {filteredCorridors.length} <span className="text-white/50 text-sm font-normal">of {corridors.length}</span>
                        </p>
                      </div>
                    </div>
                    
                    {filteredCorridors.length > 0 && (
                      <div className="text-right">
                        <p className="text-white/60 text-xs mb-1">Best Match</p>
                        <div className={cn(
                          "px-4 py-2 rounded-xl font-bold text-sm animate-pulse",
                          "bg-gradient-to-r",
                          filters.mode === "earnings" 
                            ? "from-emerald-500 to-teal-500 text-white" 
                            : "from-amber-500 to-orange-500 text-white"
                        )}>
                          {filters.mode === "earnings" 
                            ? `$${filteredCorridors[0]?.totalEarnings.toLocaleString()}`
                            : `${filteredCorridors[0]?.totalDistance} mi`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredCorridors.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-stone-200">
                <p className="text-stone-500 text-sm">No bundles match your criteria</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setFilters(defaultFilters)}
                  className="text-amber-600 mt-2"
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              filteredCorridors.map((corridor) => (
              <div
                key={corridor.id}
                className={cn(
                  "group relative overflow-hidden transition-all duration-500",
                  "rounded-[1.5rem_2.5rem_1.5rem_2.5rem]",
                  "bg-gradient-to-br from-white via-white to-amber-50/50",
                  "border border-stone-100",
                  "hover:shadow-xl hover:shadow-amber-100/50",
                  "hover:border-amber-200",
                  selectedCorridor === corridor.id && "ring-2 ring-amber-400 ring-offset-2"
                )}
                onClick={() => {
                  const isClosing = selectedCorridor === corridor.id;
                  setSelectedCorridor(isClosing ? null : corridor.id);
                  if (!isClosing) {
                    // Auto-open filters and pre-populate with corridor's locations
                    setShowFilters(true);
                    setFilters(f => ({
                      ...f,
                      pickupCity: corridor.loads[0]?.pickup.city || "",
                      pickupState: corridor.loads[0]?.pickup.state || "",
                      deliveryCity: corridor.loads[0]?.delivery.city || "",
                      deliveryState: corridor.loads[0]?.delivery.state || "",
                    }));
                  }
                }}
              >
                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 rounded-[1.5rem_2.5rem_1.5rem_2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-[-2px] rounded-[1.5rem_2.5rem_1.5rem_2.5rem] bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 animate-pulse opacity-20" />
                </div>

                {/* Content */}
                <div className="relative p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                            <Route className="h-6 w-6 text-white" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
                            {corridor.loads.length}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-800">{corridor.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-amber-600 font-medium">{corridor.direction}</span>
                            <span className="text-xs text-stone-400">•</span>
                            <span className="text-xs text-stone-500">{corridor.loads.length} vehicles</span>
                          </div>
                        </div>
                      </div>

                    {/* Savings badge */}
                    {corridor.savings > 0 && (
                      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">Save {Math.round(corridor.savings)} mi</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Navigation className="h-3 w-3 text-amber-500" />
                        <span className="text-[9px] uppercase tracking-wider text-amber-600 font-bold">Distance</span>
                      </div>
                      <p className="text-lg font-bold text-amber-700">{corridor.totalDistance} mi</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">Earnings</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(corridor.totalEarnings)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/50 border border-stone-100/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="h-3 w-3 text-stone-500" />
                        <span className="text-[9px] uppercase tracking-wider text-stone-600 font-bold">$/Mile</span>
                      </div>
                      <p className="text-lg font-bold text-stone-700">
                        ${(corridor.totalEarnings / corridor.totalDistance).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Expandable loads */}
                  {selectedCorridor === corridor.id && (
                    <div className="space-y-2 animate-fade-in border-t border-stone-100 pt-4 mt-4">
                      {corridor.loads.map((load, idx) => {
                        const inRoute = isInRoute(load.id);
                        return (
                          <div
                            key={load.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl transition-all",
                              "bg-gradient-to-r from-stone-50 to-transparent",
                              "border border-stone-100",
                              inRoute && "border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {/* Vehicle indicator */}
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center",
                              idx === 0 ? "bg-amber-100" : "bg-emerald-100"
                            )}>
                              <Car className={cn(
                                "h-5 w-5",
                                idx === 0 ? "text-amber-600" : "text-emerald-600"
                              )} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-800 text-sm truncate">
                                {load.vehicle.year} {load.vehicle.make} {load.vehicle.model}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-stone-500">
                                <span>{load.pickup.city}</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>{load.delivery.city}</span>
                                <span className="text-stone-300">•</span>
                                <span>{load.distance} mi</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-emerald-600">{formatCurrency(load.price)}</p>
                            </div>

                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToRoute(load);
                              }}
                              disabled={inRoute}
                              className={cn(
                                "h-8 px-3 rounded-lg transition-all",
                                inRoute 
                                  ? "bg-emerald-100 text-emerald-600" 
                                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                              )}
                            >
                              {inRoute ? "Added" : "Add"}
                            </Button>
                          </div>
                        );
                      })}

                      {/* Add all button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          corridor.loads.forEach(load => {
                            if (!isInRoute(load.id)) onAddToRoute(load);
                          });
                        }}
                        className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-600 hover:via-orange-600 hover:to-emerald-600 text-white shadow-lg"
                      >
                        <Route className="h-4 w-4 mr-2" />
                        Add Entire Bundle ({formatCurrency(corridor.totalEarnings)})
                      </Button>
                    </div>
                  )}

                  {/* Expand indicator */}
                  {selectedCorridor !== corridor.id && (
                    <div className="flex items-center justify-center pt-2">
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        Click to expand
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Day Timeline */}
      {(
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[1rem_1.5rem_1rem_1.5rem] bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800">Daily Schedule</h3>
            <p className="text-xs text-stone-500">Loads organized by pickup date</p>
          </div>
        </div>

        {dayGroups.map((group) => (
          <div key={group.date} className="space-y-3">
            {/* Day header */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-4 py-2 rounded-full",
                "bg-gradient-to-r from-stone-800 to-stone-700",
                "text-white font-bold text-sm"
              )}>
                {group.displayDate}
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-stone-200 to-transparent" />
              <span className="text-xs text-stone-400">{group.loads.length} loads</span>
            </div>

            {/* Loads for this day */}
            <div className="grid gap-3 pl-4 border-l-2 border-stone-100">
              {group.loads.map((load) => {
                const inRoute = isInRoute(load.id);
                const pricePerMile = load.price / load.distance;
                const isProfitable = pricePerMile >= 1.5;
                
                // Check if this load is part of a corridor
                const corridorMatch = corridors.find(c => 
                  c.loads.some(l => l.id === load.id)
                );

                return (
                  <div
                    key={load.id}
                    className={cn(
                      "group relative overflow-hidden transition-all duration-300",
                      "rounded-[1rem_2rem_1rem_2rem]",
                      "bg-white border border-stone-100",
                      "hover:shadow-lg hover:border-stone-200",
                      inRoute && "ring-2 ring-emerald-400 ring-offset-1"
                    )}
                  >
                    {/* Accent bar */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      "bg-gradient-to-b",
                      isProfitable 
                        ? "from-emerald-400 to-teal-400" 
                        : "from-amber-400 to-orange-400"
                    )} />

                    <div className="p-4 pl-5">
                      <div className="flex items-start gap-4">
                        {/* Time badge */}
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center",
                            "bg-gradient-to-br from-stone-100 to-stone-50"
                          )}>
                            <Clock className="h-5 w-5 text-stone-500" />
                          </div>
                          <span className="text-[10px] text-stone-400 mt-1 font-medium">
                            {load.pickup.time || "TBD"}
                          </span>
                        </div>

                        {/* Load info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-stone-800">
                              {load.vehicle.year} {load.vehicle.make} {load.vehicle.model}
                            </p>
                            {corridorMatch && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[9px] font-bold uppercase">
                                Bundle
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-stone-600">{load.pickup.city}, {load.pickup.state}</span>
                            </div>
                            <ChevronRight className="h-3 w-3 text-stone-300" />
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-stone-600">{load.delivery.city}, {load.delivery.state}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-stone-400">{load.distance} mi</span>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              isProfitable 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-amber-100 text-amber-700"
                            )}>
                              ${pricePerMile.toFixed(2)}/mi
                            </span>
                          </div>
                        </div>

                        {/* Price and action */}
                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(load.price)}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => onAddToRoute(load)}
                            disabled={inRoute}
                            className={cn(
                              "h-9 px-4 rounded-xl transition-all",
                              inRoute
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-gradient-to-r from-amber-500 to-emerald-500 text-white hover:from-amber-600 hover:to-emerald-600"
                            )}
                          >
                            {inRoute ? "In Route" : "Add to Route"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
