import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as matchingService from "@/services/matchingService";
import { MapPin, Navigation, Truck, Loader2, Locate, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Driver {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  isAvailable: boolean;
  capacity: number;
}

interface DriverMapViewProps {
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  selectedDriverId?: string | null;
  showRoute?: boolean;
  driverLocation?: { lat: number; lng: number } | null;
  className?: string;
}

// Clean, simple custom icons
const createIcon = (color: string, type: "pickup" | "delivery" | "driver", isSelected = false) => {
  const size = isSelected ? 40 : 32;
  
  if (type === "driver") {
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${isSelected ? '#8b5cf6' : color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M8.5 17H4v-2.5a3.5 3.5 0 0 1 3.5-3.5h1.7a.8.8 0 0 0 .8-.8V9h4v1.2a.8.8 0 0 0 .8.8h1.7a3.5 3.5 0 0 1 3.5 3.5V17h-4.5"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      `,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size + 8}px;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    className: "",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -size],
  });
};

const pickupIcon = createIcon("#22c55e", "pickup");
const deliveryIcon = createIcon("#ef4444", "delivery");
const driverIcon = createIcon("#3b82f6", "driver");
const selectedDriverIcon = createIcon("#8b5cf6", "driver", true);

const DriverMapView = ({
  pickupLatitude,
  pickupLongitude,
  deliveryLatitude,
  deliveryLongitude,
  selectedDriverId,
  showRoute = false,
  driverLocation,
  className,
}: DriverMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const distanceLinesRef = useRef<L.Polyline[]>([]);
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch nearby drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await matchingService.getNearbyDrivers(pickupLatitude, pickupLongitude, 50000);
        const driversWithDistance: Driver[] = data.map((d) => ({
          id: d.id,
          name: d.name,
          latitude: d.latitude,
          longitude: d.longitude,
          distance: d.distance,
          isAvailable: d.is_available,
          capacity: 0,
        }));
        setDrivers(driversWithDistance.sort((a, b) => a.distance - b.distance));
      } catch {
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [pickupLatitude, pickupLongitude]);

  // Initialize map with custom styling
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [pickupLatitude, pickupLongitude],
      zoom: 12,
      zoomControl: false, // We'll add custom controls
    });

    // Use CartoDB Voyager for a cleaner, modern look
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clear existing route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // Clear existing distance lines
    distanceLinesRef.current.forEach((line) => line.remove());
    distanceLinesRef.current = [];

    const bounds: [number, number][] = [];

    // Add pickup marker
    const pickupMarker = L.marker([pickupLatitude, pickupLongitude], { icon: pickupIcon })
      .addTo(map)
      .bindPopup("<strong>Pickup Location</strong>");
    markersRef.current.push(pickupMarker);
    bounds.push([pickupLatitude, pickupLongitude]);

    // Add delivery marker if provided
    if (deliveryLatitude && deliveryLongitude) {
      const deliveryMarker = L.marker([deliveryLatitude, deliveryLongitude], { icon: deliveryIcon })
        .addTo(map)
        .bindPopup("<strong>Delivery Location</strong>");
      markersRef.current.push(deliveryMarker);
      bounds.push([deliveryLatitude, deliveryLongitude]);
    }

    // Add driver markers (clean - no distance lines/labels cluttering the map)
    drivers.forEach((driver) => {
      const isSelected = driver.id === selectedDriverId;
      const icon = isSelected ? selectedDriverIcon : driverIcon;
      const distanceText = driver.distance < 1000 
        ? `${Math.round(driver.distance)}m` 
        : `${(driver.distance / 1000).toFixed(1)}km`;

      // Only show distance line for selected driver
      if (isSelected) {
        const distanceLine = L.polyline(
          [[pickupLatitude, pickupLongitude], [driver.latitude, driver.longitude]],
          {
            color: "#8b5cf6",
            weight: 3,
            opacity: 0.8,
            dashArray: "8, 8",
          }
        ).addTo(map);
        distanceLinesRef.current.push(distanceLine);
      }
      
      const marker = L.marker([driver.latitude, driver.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 140px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #1e293b;">${driver.name}</div>
            <div style="display: flex; flex-direction: column; gap: 4px; color: #64748b; font-size: 12px;">
              <div><strong style="color: #3b82f6;">${distanceText}</strong> away</div>
              <div>Capacity: <strong style="color: #22c55e;">${driver.capacity}</strong></div>
            </div>
          </div>
        `);
      markersRef.current.push(marker);
      bounds.push([driver.latitude, driver.longitude]);
    });

    // Add live driver location if tracking
    if (driverLocation) {
      const liveMarker = L.marker([driverLocation.lat, driverLocation.lng], { icon: selectedDriverIcon })
        .addTo(map)
        .bindPopup("<strong>Driver (Live)</strong>");
      markersRef.current.push(liveMarker);
      bounds.push([driverLocation.lat, driverLocation.lng]);
    }

    // Draw route if accepted
    if (showRoute && deliveryLatitude && deliveryLongitude) {
      const routePoints: [number, number][] = [];
      
      if (driverLocation) {
        routePoints.push([driverLocation.lat, driverLocation.lng]);
      }
      routePoints.push([pickupLatitude, pickupLongitude]);
      routePoints.push([deliveryLatitude, deliveryLongitude]);

      routeLayerRef.current = L.polyline(routePoints, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.8,
        dashArray: driverLocation ? undefined : "10, 10",
      }).addTo(map);
    }

    // Fit bounds
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [drivers, pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude, selectedDriverId, showRoute, driverLocation]);

  const nearbyCount = drivers.filter((d) => d.distance <= 50000).length;

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    mapInstanceRef.current?.setView([pickupLatitude, pickupLongitude], 12);
  };

  return (
    <div className={cn("relative rounded-xl overflow-hidden border shadow-lg", className)}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <div ref={mapRef} className="h-full w-full min-h-[300px]" />
      
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-background shadow-md border"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-background shadow-md border"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-background shadow-md border"
          onClick={handleRecenter}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-background rounded-lg px-3 py-2 shadow-md border">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="font-medium">Pickup</span>
          </div>
          {deliveryLatitude && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="font-medium">Delivery</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-medium">{nearbyCount} Drivers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverMapView;
