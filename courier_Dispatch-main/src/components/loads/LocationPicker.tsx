import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Crosshair, X, Route, Loader2, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export interface RouteStep {
  instruction: string;
  distance: number; // in miles
  duration: number; // in minutes
  maneuver: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  steps: RouteStep[];
  coordinates: [number, number][];
}

interface LocationPickerProps {
  startLocation: string;
  arrivalPoint: string;
  startCoordinates: [number, number] | null;
  arrivalCoordinates: [number, number] | null;
  onStartLocationChange: (value: string, coords?: [number, number]) => void;
  onArrivalPointChange: (value: string, coords?: [number, number]) => void;
  onDistanceChange?: (distance: number | null) => void;
  onRouteChange?: (route: RouteInfo | null) => void;
}

// Export the distance calculation function for reuse
export function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map click handler component
function MapClickHandler({ 
  activeField, 
  onLocationSelect 
}: { 
  activeField: "start" | "arrival" | null;
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

// Component to fit bounds when both points exist
function FitBoundsToMarkers({ 
  start, 
  end 
}: { 
  start: [number, number] | null; 
  end: [number, number] | null;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (start && end) {
      const bounds = L.latLngBounds([start, end]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (start) {
      map.setView(start, 8);
    } else if (end) {
      map.setView(end, 8);
    }
  }, [start, end, map]);
  
  return null;
}

export const LocationPicker = ({
  startLocation,
  arrivalPoint,
  startCoordinates,
  arrivalCoordinates,
  onStartLocationChange,
  onArrivalPointChange,
  onDistanceChange,
  onRouteChange,
}: LocationPickerProps) => {
  const [activeField, setActiveField] = useState<"start" | "arrival" | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // Default center (USA)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  
  // Determine map center based on markers
  const mapCenter = startCoordinates || arrivalCoordinates || defaultCenter;

  // Fetch route from OSRM when both coordinates are set
  const fetchRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    setIsLoadingRoute(true);
    try {
      // OSRM uses lon,lat order (opposite of Leaflet's lat,lon)
      // Add steps=true to get turn-by-turn directions
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();
      
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Distance in meters, convert to miles
        const distanceInMiles = route.distance / 1609.34;
        // Duration in seconds, convert to minutes
        const durationInMinutes = route.duration / 60;
        
        // Extract route geometry (GeoJSON coordinates are [lon, lat], need to flip to [lat, lon])
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        
        // Extract turn-by-turn steps from legs
        const steps: RouteStep[] = [];
        if (route.legs) {
          for (const leg of route.legs) {
            if (leg.steps) {
              for (const step of leg.steps) {
                if (step.maneuver && step.name) {
                  steps.push({
                    instruction: formatInstruction(step.maneuver.type, step.maneuver.modifier, step.name),
                    distance: step.distance / 1609.34, // Convert to miles
                    duration: step.duration / 60, // Convert to minutes
                    maneuver: step.maneuver.type,
                  });
                }
              }
            }
          }
        }
        
        setRouteCoordinates(coordinates);
        setRoadDistance(distanceInMiles);
        setEstimatedTime(durationInMinutes);
        onDistanceChange?.(distanceInMiles);
        onRouteChange?.({
          distance: distanceInMiles,
          duration: durationInMinutes,
          steps,
          coordinates,
        });
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
      // Fallback to straight line distance
      const straightLineDistance = calculateDistance(start[0], start[1], end[0], end[1]);
      setRoadDistance(straightLineDistance);
      setRouteCoordinates([start, end]);
      onDistanceChange?.(straightLineDistance);
      onRouteChange?.(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [onDistanceChange, onRouteChange]);

  // Format instruction from OSRM maneuver
  const formatInstruction = (type: string, modifier: string | undefined, name: string): string => {
    const roadName = name || "the road";
    switch (type) {
      case "depart":
        return `Start on ${roadName}`;
      case "arrive":
        return `Arrive at destination`;
      case "turn":
        return `Turn ${modifier || "right"} onto ${roadName}`;
      case "merge":
        return `Merge onto ${roadName}`;
      case "on ramp":
        return `Take the ramp onto ${roadName}`;
      case "off ramp":
        return `Take exit onto ${roadName}`;
      case "fork":
        return `Keep ${modifier || "right"} at fork onto ${roadName}`;
      case "end of road":
        return `Turn ${modifier || "right"} onto ${roadName}`;
      case "continue":
        return `Continue on ${roadName}`;
      case "roundabout":
        return `Enter roundabout and exit onto ${roadName}`;
      case "rotary":
        return `Enter rotary and exit onto ${roadName}`;
      case "new name":
        return `Continue onto ${roadName}`;
      case "notification":
        return name || "Continue";
      default:
        return modifier ? `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} onto ${roadName}` : `Continue on ${roadName}`;
    }
  };

  // Fetch route when both coordinates change
  useEffect(() => {
    if (startCoordinates && arrivalCoordinates) {
      fetchRoute(startCoordinates, arrivalCoordinates);
    } else {
      setRouteCoordinates([]);
      setRoadDistance(null);
      setEstimatedTime(null);
      onDistanceChange?.(null);
      onRouteChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCoordinates, arrivalCoordinates]);

  // Reverse geocode to get address from coordinates
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

  // Forward geocode to get coordinates from address
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
      onStartLocationChange(address, coords);
    } else if (activeField === "arrival") {
      onArrivalPointChange(address, coords);
    }
    
    setActiveField(null);
  };

  // Handle search
  const handleSearch = async (field: "start" | "arrival") => {
    setIsSearching(true);
    const address = field === "start" ? startLocation : arrivalPoint;
    const coords = await forwardGeocode(address);
    
    if (coords) {
      if (field === "start") {
        onStartLocationChange(startLocation, coords);
      } else {
        onArrivalPointChange(arrivalPoint, coords);
      }
    }
    setIsSearching(false);
  };

  // Clear location
  const handleClear = (field: "start" | "arrival") => {
    if (field === "start") {
      onStartLocationChange("", undefined);
    } else {
      onArrivalPointChange("", undefined);
    }
  };

  return (
    <div className="space-y-4">
      {/* Interactive Map */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-stone-200 h-56 shadow-inner">
        <MapContainer
          center={mapCenter}
          zoom={startCoordinates || arrivalCoordinates ? 6 : 4}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ minHeight: "224px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler 
            activeField={activeField} 
            onLocationSelect={handleLocationSelect} 
          />
          
          <FitBoundsToMarkers start={startCoordinates} end={arrivalCoordinates} />
          
          {startCoordinates && (
            <Marker position={startCoordinates} icon={startIcon} />
          )}
          
          {arrivalCoordinates && (
            <Marker position={arrivalCoordinates} icon={endIcon} />
          )}

          {/* Actual road route line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ 
                color: "#f97316", 
                weight: 4, 
                opacity: 0.9
              }}
            />
          )}
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

        {/* Distance & Time Display Overlay */}
        {roadDistance !== null && !isLoadingRoute && (
          <div className="absolute top-3 right-3 z-[1000]">
            <div className="bg-gradient-to-r from-amber-500 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Route className="h-4 w-4" />
                  <span className="font-bold">{roadDistance.toFixed(1)} mi</span>
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
        
        {/* Overlay instruction */}
        {activeField && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-[1000]">
            <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
              <Crosshair className={cn(
                "h-5 w-5",
                activeField === "start" ? "text-amber-500" : "text-emerald-500"
              )} />
              <span className="font-semibold text-stone-700">
                Click to set {activeField === "start" ? "start" : "arrival"} point
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Location Inputs */}
      <div className="space-y-3">
        {/* Start Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            Start Location
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter or click map to select..."
                value={startLocation}
                onChange={(e) => onStartLocationChange(e.target.value)}
                onFocus={() => setActiveField("start")}
                className={cn(
                  "h-12 rounded-xl border-2 pr-10 transition-all",
                  activeField === "start" 
                    ? "border-amber-400 ring-2 ring-amber-100" 
                    : "border-stone-200"
                )}
              />
              {startLocation && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClear("start")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-stone-400 hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSearch("start")}
              disabled={!startLocation || isSearching}
              className={cn(
                "h-12 w-12 rounded-xl border-2 transition-all",
                activeField === "start" ? "border-amber-400" : "border-stone-200"
              )}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant={activeField === "start" ? "default" : "outline"}
              size="icon"
              onClick={() => setActiveField(activeField === "start" ? null : "start")}
              className={cn(
                "h-12 w-12 rounded-xl border-2 transition-all",
                activeField === "start" 
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" 
                  : "border-stone-200"
              )}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
          {startCoordinates && (
            <p className="text-xs text-stone-400 pl-1">
              📍 {startCoordinates[0].toFixed(4)}, {startCoordinates[1].toFixed(4)}
            </p>
          )}
        </div>

        {/* Arrival Point */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-600 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <MapPin className="h-3 w-3 text-emerald-600" />
            </div>
            Arrival Point
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter or click map to select..."
                value={arrivalPoint}
                onChange={(e) => onArrivalPointChange(e.target.value)}
                onFocus={() => setActiveField("arrival")}
                className={cn(
                  "h-12 rounded-xl border-2 pr-10 transition-all",
                  activeField === "arrival" 
                    ? "border-emerald-400 ring-2 ring-emerald-100" 
                    : "border-stone-200"
                )}
              />
              {arrivalPoint && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClear("arrival")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-stone-400 hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSearch("arrival")}
              disabled={!arrivalPoint || isSearching}
              className={cn(
                "h-12 w-12 rounded-xl border-2 transition-all",
                activeField === "arrival" ? "border-emerald-400" : "border-stone-200"
              )}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant={activeField === "arrival" ? "default" : "outline"}
              size="icon"
              onClick={() => setActiveField(activeField === "arrival" ? null : "arrival")}
              className={cn(
                "h-12 w-12 rounded-xl border-2 transition-all",
                activeField === "arrival" 
                  ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white" 
                  : "border-stone-200"
              )}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
          {arrivalCoordinates && (
            <p className="text-xs text-stone-400 pl-1">
              📍 {arrivalCoordinates[0].toFixed(4)}, {arrivalCoordinates[1].toFixed(4)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
