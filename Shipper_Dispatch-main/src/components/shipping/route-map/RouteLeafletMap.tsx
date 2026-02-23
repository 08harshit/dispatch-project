import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, Locate, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LatLng {
  lat: number;
  lng: number;
  label?: string;
}

interface RouteLeafletMapProps {
  pickup: LatLng;
  delivery: LatLng;
  open: boolean;
  distance?: number;
  className?: string;
}

// Premium animated marker icons
const createPremiumIcon = (type: "pickup" | "delivery") => {
  const isPickup = type === "pickup";
  const bgGradient = isPickup
    ? "linear-gradient(135deg, hsl(35, 90%, 55%) 0%, hsl(45, 90%, 50%) 100%)"
    : "linear-gradient(135deg, hsl(168, 60%, 45%) 0%, hsl(180, 70%, 40%) 100%)";
  const shadowColor = isPickup ? "rgba(245, 158, 11, 0.5)" : "rgba(20, 184, 166, 0.5)";
  const letter = isPickup ? "P" : "D";

  return L.divIcon({
    className: "",
    iconSize: [48, 60],
    iconAnchor: [24, 60],
    popupAnchor: [0, -60],
    html: `
      <div style="
        position: relative;
        width: 48px;
        height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <!-- Pulse ring -->
        <div style="
          position: absolute;
          top: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${shadowColor};
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        
        <!-- Main marker -->
        <div style="
          position: relative;
          width: 44px;
          height: 44px;
          background: ${bgGradient};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 8px 24px ${shadowColor}, 0 4px 8px rgba(0,0,0,0.2);
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font: 700 16px/1 system-ui, -apple-system, sans-serif;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          ">${letter}</span>
        </div>
        
        <!-- Shadow -->
        <div style="
          width: 20px;
          height: 6px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%);
          margin-top: 4px;
        "></div>
      </div>
      
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
      </style>
    `,
  });
};

const pickupIcon = createPremiumIcon("pickup");
const deliveryIcon = createPremiumIcon("delivery");

// Map tile styles
const tileStyles = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    name: "Light",
  },
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    name: "Voyager",
  },
  positron: {
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    name: "Clean",
  },
};

export default function RouteLeafletMap({
  pickup,
  delivery,
  open,
  distance,
  className,
}: RouteLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    pickup?: L.Marker;
    delivery?: L.Marker;
    route?: L.Polyline;
    routeOutline?: L.Polyline;
    routeGlow?: L.Polyline;
    midLabel?: L.Marker;
  }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [currentStyle, setCurrentStyle] = useState<keyof typeof tileStyles>("voyager");
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    tileLayerRef.current = L.tileLayer(tileStyles[currentStyle].url, {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add subtle attribution
    L.control
      .attribution({
        prefix: false,
        position: "bottomright",
      })
      .addAttribution(
        '<a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-[10px] text-muted-foreground/60 hover:text-muted-foreground">© OpenStreetMap</a>'
      )
      .addTo(map);

    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
      tileLayerRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  // Update tile layer when style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;

    tileLayerRef.current.setUrl(tileStyles[currentStyle].url);
  }, [currentStyle]);

  // Update markers and route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // Clear existing layers
    Object.values(layersRef.current).forEach((layer) => layer?.remove());
    layersRef.current = {};

    const p: L.LatLngTuple = [pickup.lat, pickup.lng];
    const d: L.LatLngTuple = [delivery.lat, delivery.lng];

    // Route glow effect
    layersRef.current.routeGlow = L.polyline([p, d], {
      color: "hsl(35, 90%, 55%)",
      weight: 12,
      opacity: 0.15,
      lineCap: "round",
    }).addTo(map);

    // Route outline
    layersRef.current.routeOutline = L.polyline([p, d], {
      color: "#1e293b",
      weight: 6,
      opacity: 0.3,
      lineCap: "round",
    }).addTo(map);

    // Main route with gradient effect (using dashed pattern)
    layersRef.current.route = L.polyline([p, d], {
      color: "hsl(35, 90%, 55%)",
      weight: 4,
      opacity: 1,
      dashArray: "12, 8",
      lineCap: "round",
    }).addTo(map);

    // Pickup marker
    layersRef.current.pickup = L.marker(p, { icon: pickupIcon })
      .addTo(map)
      .bindPopup(
        `<div class="text-sm">
          <strong class="text-primary">Pickup Location</strong>
          <p class="text-muted-foreground mt-1">${pickup.label || "Origin"}</p>
        </div>`,
        { className: "premium-popup" }
      );

    // Delivery marker
    layersRef.current.delivery = L.marker(d, { icon: deliveryIcon })
      .addTo(map)
      .bindPopup(
        `<div class="text-sm">
          <strong class="text-teal-600">Delivery Location</strong>
          <p class="text-muted-foreground mt-1">${delivery.label || "Destination"}</p>
        </div>`,
        { className: "premium-popup" }
      );

    // Distance label at midpoint
    if (distance && distance > 0) {
      const midLat = (pickup.lat + delivery.lat) / 2;
      const midLng = (pickup.lng + delivery.lng) / 2;

      const distanceIcon = L.divIcon({
        className: "",
        iconSize: [100, 36],
        iconAnchor: [50, 18],
        html: `
          <div style="
            background: white;
            padding: 8px 16px;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            gap: 6px;
            font: 600 13px/1 system-ui, -apple-system, sans-serif;
            color: #1e293b;
            white-space: nowrap;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
            </svg>
            ${Math.round(distance).toLocaleString()} mi
          </div>
        `,
      });

      layersRef.current.midLabel = L.marker([midLat, midLng], {
        icon: distanceIcon,
        interactive: false,
      }).addTo(map);
    }

    // Fit bounds with padding
    const bounds = L.latLngBounds([p, d]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
  }, [pickup.lat, pickup.lng, pickup.label, delivery.lat, delivery.lng, delivery.label, distance, isMapReady]);

  // Fix sizing when dialog opens
  useEffect(() => {
    if (!open) return;
    const map = mapRef.current;
    if (!map) return;
    const t = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(t);
  }, [open]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const p: L.LatLngTuple = [pickup.lat, pickup.lng];
    const d: L.LatLngTuple = [delivery.lat, delivery.lng];
    map.fitBounds(L.latLngBounds([p, d]), { padding: [60, 60], maxZoom: 10 });
  };

  const cycleStyle = () => {
    const styles = Object.keys(tileStyles) as (keyof typeof tileStyles)[];
    const currentIdx = styles.indexOf(currentStyle);
    const nextIdx = (currentIdx + 1) % styles.length;
    setCurrentStyle(styles[nextIdx]);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Glassmorphic zoom controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4 text-slate-700" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4 text-slate-700" />
        </Button>
        <div className="h-px bg-slate-200/50 my-1" />
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
          onClick={handleRecenter}
        >
          <Locate className="h-4 w-4 text-slate-700" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
          onClick={cycleStyle}
          title={`Style: ${tileStyles[currentStyle].name}`}
        >
          <Layers className="h-4 w-4 text-slate-700" />
        </Button>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex items-center justify-between">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 shadow-lg">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <span className="text-xs font-medium text-slate-600">Interactive Map</span>
        </div>

        {/* Style indicator */}
        <div className="px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm">
          <span className="text-[10px] font-medium text-slate-500">
            {tileStyles[currentStyle].name} Style
          </span>
        </div>
      </div>

      {/* Custom popup styles */}
      <style>{`
        .premium-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .premium-popup .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>
    </div>
  );
}
