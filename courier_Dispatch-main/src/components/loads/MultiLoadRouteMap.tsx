import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LoadNotification } from "@/hooks/useLoadNotifications";
import { MapPin, Clock, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Color palette for different loads
const LOAD_COLORS = [
  { pickup: "#f59e0b", delivery: "#10b981", line: "#f97316" }, // Amber/Emerald
  { pickup: "#3b82f6", delivery: "#14b8a6", line: "#0891b2" }, // Blue/Teal
  { pickup: "#f97316", delivery: "#06b6d4", line: "#fb923c" }, // Orange/Cyan
  { pickup: "#84cc16", delivery: "#0d9488", line: "#22c55e" }, // Lime/Teal
  { pickup: "#eab308", delivery: "#22c55e", line: "#facc15" }, // Yellow/Green
];

const createColoredIcon = (color: string, label: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 11px;
        ">${label}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

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

interface ClusterGroup {
  stops: OptimizedStop[];
  centerCoordinates: [number, number];
  radius: number; // miles
}

interface MultiLoadRouteMapProps {
  loads: LoadNotification[];
  startCoordinates?: [number, number] | null;
  arrivalCoordinates?: [number, number] | null;
  className?: string;
  showOptimizedRoute?: boolean;
  onRouteCalculated?: (route: OptimizedStop[], clusters: ClusterGroup[]) => void;
}

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const R = 3959; // Earth's radius in miles
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

// Find clusters of nearby stops (within threshold miles)
const findClusters = (stops: OptimizedStop[], thresholdMiles: number = 50): ClusterGroup[] => {
  const clusters: ClusterGroup[] = [];
  const assigned = new Set<number>();

  stops.forEach((stop, i) => {
    if (assigned.has(i)) return;

    const clusterStops: OptimizedStop[] = [stop];
    assigned.add(i);

    stops.forEach((otherStop, j) => {
      if (i === j || assigned.has(j)) return;
      const distance = calculateDistance(stop.coordinates, otherStop.coordinates);
      if (distance <= thresholdMiles) {
        clusterStops.push(otherStop);
        assigned.add(j);
      }
    });

    if (clusterStops.length > 1) {
      const centerLat = clusterStops.reduce((sum, s) => sum + s.coordinates[0], 0) / clusterStops.length;
      const centerLon = clusterStops.reduce((sum, s) => sum + s.coordinates[1], 0) / clusterStops.length;
      const maxDist = Math.max(...clusterStops.map(s => 
        calculateDistance([centerLat, centerLon], s.coordinates)
      ));

      clusters.push({
        stops: clusterStops,
        centerCoordinates: [centerLat, centerLon],
        radius: maxDist,
      });
    }
  });

  return clusters;
};

// Optimize stop order using nearest neighbor algorithm
const optimizeRoute = (
  stops: OptimizedStop[],
  startCoord?: [number, number] | null
): OptimizedStop[] => {
  if (stops.length <= 1) return stops;

  const optimized: OptimizedStop[] = [];
  const remaining = [...stops];
  let currentCoord = startCoord || remaining[0].coordinates;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((stop, idx) => {
      // Only consider pickups, or deliveries whose pickup is already done
      const isDelivery = stop.type === "delivery";
      const pickupDone = isDelivery 
        ? optimized.some(s => s.type === "pickup" && s.loadIndex === stop.loadIndex)
        : true;

      if (pickupDone) {
        const dist = calculateDistance(currentCoord, stop.coordinates);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      }
    });

    const nextStop = remaining.splice(nearestIdx, 1)[0];
    optimized.push(nextStop);
    currentCoord = nextStop.coordinates;
  }

  return optimized;
};

function FitBoundsToLoads({ loads, startCoord, arrivalCoord }: { 
  loads: LoadNotification[]; 
  startCoord?: [number, number] | null;
  arrivalCoord?: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const allCoords: [number, number][] = [];
    
    if (startCoord) allCoords.push(startCoord);
    if (arrivalCoord) allCoords.push(arrivalCoord);
    
    loads.forEach(load => {
      if (load.pickup.coordinates[0] !== 0) {
        allCoords.push(load.pickup.coordinates);
      }
      if (load.delivery.coordinates[0] !== 0) {
        allCoords.push(load.delivery.coordinates);
      }
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, loads, startCoord, arrivalCoord]);

  return null;
}

export const MultiLoadRouteMap = ({ 
  loads, 
  startCoordinates, 
  arrivalCoordinates,
  className,
  showOptimizedRoute = true,
  onRouteCalculated
}: MultiLoadRouteMapProps) => {
  const [optimizedStops, setOptimizedStops] = useState<OptimizedStop[]>([]);
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);

  // Build all stops from loads
  const allStops = useMemo(() => {
    const stops: OptimizedStop[] = [];
    
    loads.forEach((load, loadIndex) => {
      const colors = LOAD_COLORS[loadIndex % LOAD_COLORS.length];
      
      if (load.pickup.coordinates[0] !== 0) {
        stops.push({
          type: "pickup",
          loadIndex,
          load,
          coordinates: load.pickup.coordinates,
          city: load.pickup.city,
          state: load.pickup.state,
          date: load.pickup.date,
          time: load.pickup.time,
          color: colors.pickup,
          label: `P${loadIndex + 1}`,
        });
      }
      
      if (load.delivery.coordinates[0] !== 0) {
        stops.push({
          type: "delivery",
          loadIndex,
          load,
          coordinates: load.delivery.coordinates,
          city: load.delivery.city,
          state: load.delivery.state,
          date: load.delivery.date,
          time: load.delivery.time,
          color: colors.delivery,
          label: `D${loadIndex + 1}`,
        });
      }
    });
    
    return stops;
  }, [loads]);

  // Optimize route and find clusters
  useEffect(() => {
    if (allStops.length === 0) return;

    const optimized = showOptimizedRoute 
      ? optimizeRoute(allStops, startCoordinates)
      : allStops;
    
    const foundClusters = findClusters(allStops, 50);
    
    setOptimizedStops(optimized);
    setClusters(foundClusters);
    
    if (onRouteCalculated) {
      onRouteCalculated(optimized, foundClusters);
    }
  }, [allStops, startCoordinates, showOptimizedRoute, onRouteCalculated]);

  // Build route polyline coordinates
  const routeCoordinates = useMemo(() => {
    const coords: [number, number][] = [];
    
    if (startCoordinates) {
      coords.push(startCoordinates);
    }
    
    optimizedStops.forEach(stop => {
      coords.push(stop.coordinates);
    });
    
    if (arrivalCoordinates) {
      coords.push(arrivalCoordinates);
    }
    
    return coords;
  }, [optimizedStops, startCoordinates, arrivalCoordinates]);

  // Calculate map center
  const center: [number, number] = useMemo(() => {
    if (loads.length === 0) return [39.8283, -98.5795]; // US center
    
    const allCoords = allStops.map(s => s.coordinates);
    if (startCoordinates) allCoords.push(startCoordinates);
    if (arrivalCoordinates) allCoords.push(arrivalCoordinates);
    
    if (allCoords.length === 0) return [39.8283, -98.5795];
    
    const avgLat = allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length;
    const avgLon = allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length;
    
    return [avgLat, avgLon];
  }, [loads, allStops, startCoordinates, arrivalCoordinates]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loads.length === 0) {
    return (
      <div className={cn("bg-stone-100 rounded-2xl flex items-center justify-center", className)}>
        <div className="text-center p-8">
          <MapPin className="h-8 w-8 text-stone-400 mx-auto mb-2" />
          <p className="text-stone-500">Add loads to see route</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full rounded-2xl"
        style={{ minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBoundsToLoads 
          loads={loads} 
          startCoord={startCoordinates} 
          arrivalCoord={arrivalCoordinates}
        />

        {/* Cluster circles */}
        {clusters.map((cluster, idx) => (
          <Polyline
            key={`cluster-${idx}`}
            positions={cluster.stops.map(s => s.coordinates)}
            pathOptions={{ 
              color: "#22c55e", 
              weight: 2, 
              dashArray: "5, 10",
              opacity: 0.5 
            }}
          />
        ))}

        {/* Optimized route line */}
        {showOptimizedRoute && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ 
              color: "#f97316", 
              weight: 4, 
              opacity: 0.8,
              lineCap: "round",
              lineJoin: "round"
            }}
          />
        )}

        {/* Individual load route lines */}
        {loads.map((load, idx) => {
          if (load.pickup.coordinates[0] === 0) return null;
          const colors = LOAD_COLORS[idx % LOAD_COLORS.length];
          return (
            <Polyline
              key={`load-line-${load.id}`}
              positions={[load.pickup.coordinates, load.delivery.coordinates]}
              pathOptions={{ 
                color: colors.line, 
                weight: 2, 
                dashArray: "8, 8",
                opacity: 0.6 
              }}
            />
          );
        })}

        {/* Start marker */}
        {startCoordinates && (
          <Marker 
            position={startCoordinates} 
            icon={createColoredIcon("#1e40af", "S")}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-blue-800">Start Point</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Stop markers */}
        {optimizedStops.map((stop, idx) => (
          <Marker
            key={`${stop.type}-${stop.loadIndex}-${idx}`}
            position={stop.coordinates}
            icon={createColoredIcon(stop.color, stop.label)}
          >
            <Popup>
              <div className="min-w-[200px] p-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-bold text-white",
                    stop.type === "pickup" ? "bg-amber-500" : "bg-emerald-500"
                  )}>
                    {stop.type === "pickup" ? "PICKUP" : "DELIVERY"}
                  </span>
                  <span className="text-xs text-stone-500">Stop #{idx + 1}</span>
                </div>
                <p className="font-semibold text-stone-800">
                  {stop.load.vehicle.year} {stop.load.vehicle.make} {stop.load.vehicle.model}
                </p>
                <p className="text-sm text-stone-600">
                  {stop.city}, {stop.state}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {stop.date} {stop.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(stop.load.price)}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Arrival marker */}
        {arrivalCoordinates && (
          <Marker 
            position={arrivalCoordinates} 
            icon={createColoredIcon("#166534", "A")}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-emerald-800">Arrival Point</strong>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Cluster info overlay */}
      {clusters.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-stone-200 max-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-stone-700">Nearby Stops</span>
          </div>
          <p className="text-[10px] text-stone-500">
            {clusters.reduce((sum, c) => sum + c.stops.length, 0)} stops can be grouped. 
            Complete them together to save time!
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-stone-200">
        <div className="text-[10px] font-semibold text-stone-600 mb-2">LEGEND</div>
        <div className="space-y-1.5">
          {loads.map((load, idx) => {
            const colors = LOAD_COLORS[idx % LOAD_COLORS.length];
            return (
              <div key={load.id} className="flex items-center gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors.pickup }}
                  />
                  <span className="text-stone-400">P{idx + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors.delivery }}
                  />
                  <span className="text-stone-400">D{idx + 1}</span>
                </div>
                <span className="text-stone-600 truncate max-w-[80px]">
                  {load.vehicle.make} {load.vehicle.model}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
