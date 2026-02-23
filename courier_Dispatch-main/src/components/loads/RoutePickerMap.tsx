import { useState, useEffect, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  MapPin, Search, Crosshair, X, Route, Loader2, Car, 
  DollarSign, Plus, ShoppingCart, Navigation, Sparkles 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadNotification } from "@/hooks/useLoadNotifications";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";
import { toast } from "sonner";

// Custom marker icons
const startIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Color coded markers for loads
const createLoadIcon = (color: string, inRoute: boolean) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: ${color};
        width: ${inRoute ? 32 : 24}px;
        height: ${inRoute ? 32 : 24}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        border: ${inRoute ? '3px solid #22c55e' : '2px solid white'};
        transition: all 0.2s ease;
      ">
        <span style="color: white; font-size: ${inRoute ? 14 : 10}px;">🚗</span>
      </div>
    `,
    iconSize: [inRoute ? 32 : 24, inRoute ? 32 : 24],
    iconAnchor: [inRoute ? 16 : 12, inRoute ? 16 : 12],
    popupAnchor: [0, inRoute ? -16 : -12],
  });
};

interface RoutePickerMapProps {
  loads: LoadNotification[];
  onAddToRoute: (load: LoadNotification) => void;
  isInRoute: (loadId: string) => boolean;
}

interface LoadWithDistance extends LoadNotification {
  distanceToRoute: number;
  detourMiles: number;
}

// Calculate distance from a point to a line segment
const pointToLineDistance = (
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number => {
  const R = 3959; // Earth's radius in miles
  
  // Convert to radians
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const lat1 = toRad(lineStart[0]);
  const lon1 = toRad(lineStart[1]);
  const lat2 = toRad(lineEnd[0]);
  const lon2 = toRad(lineEnd[1]);
  const lat3 = toRad(point[0]);
  const lon3 = toRad(point[1]);
  
  // Cross-track distance formula (simplified)
  const d13 = Math.acos(
    Math.sin(lat1) * Math.sin(lat3) + 
    Math.cos(lat1) * Math.cos(lat3) * Math.cos(lon3 - lon1)
  ) * R;
  
  const bearing12 = Math.atan2(
    Math.sin(lon2 - lon1) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  );
  
  const bearing13 = Math.atan2(
    Math.sin(lon3 - lon1) * Math.cos(lat3),
    Math.cos(lat1) * Math.sin(lat3) - Math.sin(lat1) * Math.cos(lat3) * Math.cos(lon3 - lon1)
  );
  
  const crossTrack = Math.abs(Math.asin(Math.sin(d13 / R) * Math.sin(bearing13 - bearing12)) * R);
  
  return crossTrack;
};

// Calculate Haversine distance
const haversineDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const R = 3959;
  const lat1 = coord1[0] * Math.PI / 180;
  const lat2 = coord2[0] * Math.PI / 180;
  const deltaLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const deltaLon = (coord2[1] - coord1[1]) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Map click handler
function MapClickHandler({ 
  activeField, 
  onLocationSelect 
}: { 
  activeField: "start" | "end" | null;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (activeField) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Fit bounds component
function FitBoundsToPoints({ 
  start, 
  end,
  loads
}: { 
  start: [number, number] | null; 
  end: [number, number] | null;
  loads: LoadNotification[];
}) {
  const map = useMap();
  
  useEffect(() => {
    const allCoords: [number, number][] = [];
    
    if (start) allCoords.push(start);
    if (end) allCoords.push(end);
    
    loads.forEach(load => {
      if (load.pickup.coordinates[0] !== 0) allCoords.push(load.pickup.coordinates);
      if (load.delivery.coordinates[0] !== 0) allCoords.push(load.delivery.coordinates);
    });
    
    if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (allCoords.length === 1) {
      map.setView(allCoords[0], 8);
    }
  }, [start, end, loads, map]);
  
  return null;
}

export const RoutePickerMap = ({ loads, onAddToRoute, isInRoute }: RoutePickerMapProps) => {
  const [activeField, setActiveField] = useState<"start" | "end" | null>(null);
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  
  const { selectedLoads } = useRoutePlanner();

  const defaultCenter: [number, number] = [39.8283, -98.5795];

  // Reverse geocode
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  // Forward geocode
  const forwardGeocode = useCallback(async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Handle map click
  const handleLocationSelect = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    const coords: [number, number] = [lat, lng];
    
    if (activeField === "start") {
      setStartCoords(coords);
      setStartAddress(address);
    } else if (activeField === "end") {
      setEndCoords(coords);
      setEndAddress(address);
    }
    
    setActiveField(null);
  };

  // Handle search
  const handleSearch = async (field: "start" | "end") => {
    const address = field === "start" ? startAddress : endAddress;
    const coords = await forwardGeocode(address);
    
    if (coords) {
      if (field === "start") {
        setStartCoords(coords);
      } else {
        setEndCoords(coords);
      }
    }
  };

  // Fetch route from OSRM
  const fetchRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    setIsLoadingRoute(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.code === "Ok" && data.routes?.[0]) {
        const route = data.routes[0];
        const distanceInMiles = route.distance / 1609.34;
        const durationInMinutes = route.duration / 60;
        
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        
        setRouteCoordinates(coordinates);
        setRoadDistance(distanceInMiles);
        setEstimatedTime(durationInMinutes);
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
      // Fallback to straight line
      setRouteCoordinates([start, end]);
      setRoadDistance(haversineDistance(start, end));
    } finally {
      setIsLoadingRoute(false);
    }
  }, []);

  // Fetch route when both coords are set
  useEffect(() => {
    if (startCoords && endCoords) {
      fetchRoute(startCoords, endCoords);
    } else {
      setRouteCoordinates([]);
      setRoadDistance(null);
      setEstimatedTime(null);
    }
  }, [startCoords, endCoords, fetchRoute]);

  // Calculate loads with distance to route
  const loadsWithDistance = useMemo((): LoadWithDistance[] => {
    if (!startCoords || !endCoords) return [];
    
    return loads.map(load => {
      // Calculate distance from load pickup to the route line
      const pickupDist = pointToLineDistance(load.pickup.coordinates, startCoords, endCoords);
      const deliveryDist = pointToLineDistance(load.delivery.coordinates, startCoords, endCoords);
      
      // Calculate detour: how many extra miles to include this load
      const directRoute = haversineDistance(startCoords, endCoords);
      const withLoad = 
        haversineDistance(startCoords, load.pickup.coordinates) +
        load.distance +
        haversineDistance(load.delivery.coordinates, endCoords);
      const detourMiles = Math.max(0, withLoad - directRoute);
      
      return {
        ...load,
        distanceToRoute: Math.min(pickupDist, deliveryDist),
        detourMiles,
      };
    }).sort((a, b) => a.distanceToRoute - b.distanceToRoute);
  }, [loads, startCoords, endCoords]);

  // Filtered loads near the route (within 150 miles)
  const nearbyLoads = useMemo(() => {
    return loadsWithDistance.filter(l => l.distanceToRoute < 150);
  }, [loadsWithDistance]);

  // Build combined route with selected loads
  const combinedRouteCoords = useMemo(() => {
    if (!startCoords) return [];
    
    const coords: [number, number][] = [startCoords];
    
    // Add selected loads pickups and deliveries in order
    selectedLoads.forEach(load => {
      coords.push(load.pickup.coordinates);
      coords.push(load.delivery.coordinates);
    });
    
    if (endCoords) coords.push(endCoords);
    
    return coords;
  }, [startCoords, endCoords, selectedLoads]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddLoad = (load: LoadNotification) => {
    if (isInRoute(load.id)) {
      toast.info(`${load.vehicle.make} ${load.vehicle.model} is already in your route`);
      return;
    }
    onAddToRoute(load);
    toast.success(`Added ${load.vehicle.year} ${load.vehicle.make} ${load.vehicle.model} to route`);
  };

  return (
    <div className="space-y-4">
      {/* Location Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            Start Point
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter or click map..."
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
                onFocus={() => setActiveField("start")}
                className={cn(
                  "h-10 rounded-xl border-2 pr-8 transition-all text-sm",
                  activeField === "start" 
                    ? "border-amber-400 ring-2 ring-amber-100" 
                    : "border-stone-200"
                )}
              />
              {startAddress && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setStartAddress(""); setStartCoords(null); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-stone-400 hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSearch("start")}
              disabled={!startAddress}
              className="h-10 w-10 rounded-xl border-2 border-stone-200"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant={activeField === "start" ? "default" : "outline"}
              size="icon"
              onClick={() => setActiveField(activeField === "start" ? null : "start")}
              className={cn(
                "h-10 w-10 rounded-xl border-2 transition-all",
                activeField === "start" 
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" 
                  : "border-stone-200"
              )}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* End Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            Destination
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter or click map..."
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
                onFocus={() => setActiveField("end")}
                className={cn(
                  "h-10 rounded-xl border-2 pr-8 transition-all text-sm",
                  activeField === "end" 
                    ? "border-emerald-400 ring-2 ring-emerald-100" 
                    : "border-stone-200"
                )}
              />
              {endAddress && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setEndAddress(""); setEndCoords(null); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-stone-400 hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSearch("end")}
              disabled={!endAddress}
              className="h-10 w-10 rounded-xl border-2 border-stone-200"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant={activeField === "end" ? "default" : "outline"}
              size="icon"
              onClick={() => setActiveField(activeField === "end" ? null : "end")}
              className={cn(
                "h-10 w-10 rounded-xl border-2 transition-all",
                activeField === "end" 
                  ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white" 
                  : "border-stone-200"
              )}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-stone-200 h-80 shadow-inner">
        <MapContainer
          center={defaultCenter}
          zoom={4}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler 
            activeField={activeField} 
            onLocationSelect={handleLocationSelect} 
          />
          
          <FitBoundsToPoints 
            start={startCoords} 
            end={endCoords}
            loads={selectedLoads}
          />
          
          {/* Start marker */}
          {startCoords && (
            <Marker position={startCoords} icon={startIcon}>
              <Popup>
                <strong className="text-amber-600">Start Point</strong>
              </Popup>
            </Marker>
          )}
          
          {/* End marker */}
          {endCoords && (
            <Marker position={endCoords} icon={endIcon}>
              <Popup>
                <strong className="text-emerald-600">Destination</strong>
              </Popup>
            </Marker>
          )}

          {/* Main route line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ 
                color: "#9ca3af", 
                weight: 4, 
                opacity: 0.6,
                dashArray: "10, 10"
              }}
            />
          )}

          {/* Combined route with selected loads */}
          {selectedLoads.length > 0 && combinedRouteCoords.length > 1 && (
            <Polyline
              positions={combinedRouteCoords}
              pathOptions={{ 
                color: "#f97316", 
                weight: 5, 
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
          )}

          {/* Selected loads individual routes */}
          {selectedLoads.map((load, idx) => (
            <Polyline
              key={`selected-${load.id}`}
              positions={[load.pickup.coordinates, load.delivery.coordinates]}
              pathOptions={{ 
                color: "#22c55e", 
                weight: 3, 
                opacity: 0.7,
                dashArray: "5, 5"
              }}
            />
          ))}

          {/* Load markers */}
          {nearbyLoads.map((load) => {
            const inRoute = isInRoute(load.id);
            return (
              <Marker
                key={load.id}
                position={load.pickup.coordinates}
                icon={createLoadIcon(inRoute ? "#22c55e" : "#f59e0b", inRoute)}
              >
                <Popup>
                  <div className="min-w-[220px] p-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-stone-800">
                        {load.vehicle.year} {load.vehicle.make} {load.vehicle.model}
                      </span>
                      {inRoute && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                          IN ROUTE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mb-2">
                      {load.pickup.city}, {load.pickup.state} → {load.delivery.city}, {load.delivery.state}
                    </div>
                    <div className="flex items-center gap-3 mb-3 text-sm">
                      <span className="flex items-center gap-1 font-bold text-emerald-600">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(load.price)}
                      </span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <Route className="h-3 w-3" />
                        {load.distance} mi
                      </span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Navigation className="h-3 w-3" />
                        +{Math.round(load.detourMiles)} mi detour
                      </span>
                    </div>
                    {!inRoute && (
                      <Button
                        size="sm"
                        onClick={() => handleAddLoad(load)}
                        className="w-full h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Route
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Loading indicator */}
        {isLoadingRoute && (
          <div className="absolute top-3 right-3 z-[1000]">
            <div className="bg-white/95 text-stone-600 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Calculating route...</span>
            </div>
          </div>
        )}

        {/* Route info overlay */}
        {roadDistance !== null && !isLoadingRoute && (
          <div className="absolute top-3 right-3 z-[1000]">
            <div className="bg-gradient-to-r from-amber-500 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Route className="h-4 w-4" />
                  <span className="font-bold">{roadDistance.toFixed(0)} mi</span>
                </div>
                {estimatedTime !== null && (
                  <>
                    <div className="w-px h-4 bg-white/40" />
                    <div className="flex items-center gap-1.5">
                      <Car className="h-4 w-4" />
                      <span className="font-bold">
                        {estimatedTime >= 60 
                          ? `${Math.floor(estimatedTime / 60)}h ${Math.round(estimatedTime % 60)}m`
                          : `${Math.round(estimatedTime)}m`
                        }
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Click instruction overlay */}
        {activeField && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-[1000]">
            <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
              <Crosshair className={cn(
                "h-5 w-5",
                activeField === "start" ? "text-amber-500" : "text-emerald-500"
              )} />
              <span className="font-semibold text-stone-700">
                Click to set {activeField === "start" ? "start" : "destination"} point
              </span>
            </div>
          </div>
        )}

        {/* Basket indicator */}
        {selectedLoads.length > 0 && (
          <div className="absolute bottom-3 left-3 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-stone-200">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-stone-700">
                  {selectedLoads.length} load{selectedLoads.length > 1 ? 's' : ''} in route
                </span>
              </div>
              <p className="text-[10px] text-stone-500">
                Total: {formatCurrency(selectedLoads.reduce((sum, l) => sum + l.price, 0))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nearby Loads List */}
      {startCoords && endCoords && nearbyLoads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h4 className="font-bold text-stone-700">Loads Along Your Route</h4>
            <span className="text-xs text-stone-400">({nearbyLoads.length} available)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyLoads.slice(0, 6).map((load) => {
              const inRoute = isInRoute(load.id);
              const pricePerMile = load.price / load.distance;
              
              return (
                <div
                  key={load.id}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all",
                    inRoute 
                      ? "bg-emerald-50/50 border-emerald-300" 
                      : "bg-white border-stone-200 hover:border-amber-300 hover:shadow-md"
                  )}
                >
                  {inRoute && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <ShoppingCart className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-stone-800 text-sm">
                        {load.vehicle.year} {load.vehicle.make}
                      </p>
                      <p className="text-xs text-stone-500">{load.vehicle.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(load.price)}</p>
                      <p className={cn(
                        "text-[10px] font-medium",
                        pricePerMile >= 1.5 ? "text-emerald-600" : 
                        pricePerMile >= 1.0 ? "text-amber-600" : "text-rose-500"
                      )}>
                        ${pricePerMile.toFixed(2)}/mi
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-stone-500 mb-2">
                    <p>{load.pickup.city}, {load.pickup.state} →</p>
                    <p>{load.delivery.city}, {load.delivery.state}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 text-[10px]">
                    <span className="px-2 py-0.5 bg-stone-100 rounded-full text-stone-600">
                      {load.distance} mi
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 rounded-full text-amber-700">
                      +{Math.round(load.detourMiles)} mi detour
                    </span>
                  </div>
                  
                  {!inRoute && (
                    <Button
                      size="sm"
                      onClick={() => handleAddLoad(load)}
                      className="w-full h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add to Route
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {startCoords && endCoords && nearbyLoads.length === 0 && (
        <div className="text-center py-8">
          <Navigation className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <p className="text-stone-500 font-medium">No loads found along this route</p>
          <p className="text-xs text-stone-400">Try a different route or expand your search area</p>
        </div>
      )}
    </div>
  );
};
