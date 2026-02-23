import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Navigation, Route, DollarSign, Clock, Truck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Estimate price based on distance
const estimatePrice = (distanceMiles: number): { low: number; high: number; average: number } => {
  const baseRate = 200;
  const perMileRateLow = 0.50;
  const perMileRateHigh = 0.85;
  
  const low = Math.round(baseRate + distanceMiles * perMileRateLow);
  const high = Math.round(baseRate + distanceMiles * perMileRateHigh);
  const average = Math.round((low + high) / 2);
  
  return { low, high, average };
};

// Estimate transit time based on distance
const estimateTransitTime = (distanceMiles: number): { min: number; max: number } => {
  const milesPerDay = 500;
  const minDays = Math.ceil(distanceMiles / (milesPerDay * 1.2));
  const maxDays = Math.ceil(distanceMiles / (milesPerDay * 0.8));
  
  return { min: Math.max(1, minDays), max: Math.max(1, maxDays) };
};

// Get coordinates for cities/states
const getCoordinates = (city: string, state: string): { lat: number; lng: number } => {
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'new york,ny': { lat: 40.7128, lng: -74.0060 },
    'los angeles,ca': { lat: 34.0522, lng: -118.2437 },
    'chicago,il': { lat: 41.8781, lng: -87.6298 },
    'houston,tx': { lat: 29.7604, lng: -95.3698 },
    'phoenix,az': { lat: 33.4484, lng: -112.0740 },
    'philadelphia,pa': { lat: 39.9526, lng: -75.1652 },
    'san antonio,tx': { lat: 29.4241, lng: -98.4936 },
    'san diego,ca': { lat: 32.7157, lng: -117.1611 },
    'dallas,tx': { lat: 32.7767, lng: -96.7970 },
    'san jose,ca': { lat: 37.3382, lng: -121.8863 },
    'austin,tx': { lat: 30.2672, lng: -97.7431 },
    'jacksonville,fl': { lat: 30.3322, lng: -81.6557 },
    'fort worth,tx': { lat: 32.7555, lng: -97.3308 },
    'columbus,oh': { lat: 39.9612, lng: -82.9988 },
    'indianapolis,in': { lat: 39.7684, lng: -86.1581 },
    'charlotte,nc': { lat: 35.2271, lng: -80.8431 },
    'seattle,wa': { lat: 47.6062, lng: -122.3321 },
    'denver,co': { lat: 39.7392, lng: -104.9903 },
    'boston,ma': { lat: 42.3601, lng: -71.0589 },
    'nashville,tn': { lat: 36.1627, lng: -86.7816 },
    'detroit,mi': { lat: 42.3314, lng: -83.0458 },
    'portland,or': { lat: 45.5152, lng: -122.6784 },
    'las vegas,nv': { lat: 36.1699, lng: -115.1398 },
    'memphis,tn': { lat: 35.1495, lng: -90.0490 },
    'miami,fl': { lat: 25.7617, lng: -80.1918 },
    'atlanta,ga': { lat: 33.7490, lng: -84.3880 },
    'orlando,fl': { lat: 28.5383, lng: -81.3792 },
    'tampa,fl': { lat: 27.9506, lng: -82.4572 },
    'minneapolis,mn': { lat: 44.9778, lng: -93.2650 },
    'cleveland,oh': { lat: 41.4993, lng: -81.6944 },
  };
  
  const stateCoords: Record<string, { lat: number; lng: number }> = {
    'al': { lat: 32.806671, lng: -86.791130 }, 'ak': { lat: 61.370716, lng: -152.404419 },
    'az': { lat: 33.729759, lng: -111.431221 }, 'ar': { lat: 34.969704, lng: -92.373123 },
    'ca': { lat: 36.116203, lng: -119.681564 }, 'co': { lat: 39.059811, lng: -105.311104 },
    'ct': { lat: 41.597782, lng: -72.755371 }, 'de': { lat: 39.318523, lng: -75.507141 },
    'fl': { lat: 27.766279, lng: -81.686783 }, 'ga': { lat: 33.040619, lng: -83.643074 },
    'hi': { lat: 21.094318, lng: -157.498337 }, 'id': { lat: 44.240459, lng: -114.478828 },
    'il': { lat: 40.349457, lng: -88.986137 }, 'in': { lat: 39.849426, lng: -86.258278 },
    'ia': { lat: 42.011539, lng: -93.210526 }, 'ks': { lat: 38.526600, lng: -96.726486 },
    'ky': { lat: 37.668140, lng: -84.670067 }, 'la': { lat: 31.169546, lng: -91.867805 },
    'me': { lat: 44.693947, lng: -69.381927 }, 'md': { lat: 39.063946, lng: -76.802101 },
    'ma': { lat: 42.230171, lng: -71.530106 }, 'mi': { lat: 43.326618, lng: -84.536095 },
    'mn': { lat: 45.694454, lng: -93.900192 }, 'ms': { lat: 32.741646, lng: -89.678696 },
    'mo': { lat: 38.456085, lng: -92.288368 }, 'mt': { lat: 46.921925, lng: -110.454353 },
    'ne': { lat: 41.125370, lng: -98.268082 }, 'nv': { lat: 38.313515, lng: -117.055374 },
    'nh': { lat: 43.452492, lng: -71.563896 }, 'nj': { lat: 40.298904, lng: -74.521011 },
    'nm': { lat: 34.840515, lng: -106.248482 }, 'ny': { lat: 42.165726, lng: -74.948051 },
    'nc': { lat: 35.630066, lng: -79.806419 }, 'nd': { lat: 47.528912, lng: -99.784012 },
    'oh': { lat: 40.388783, lng: -82.764915 }, 'ok': { lat: 35.565342, lng: -96.928917 },
    'or': { lat: 44.572021, lng: -122.070938 }, 'pa': { lat: 40.590752, lng: -77.209755 },
    'ri': { lat: 41.680893, lng: -71.511780 }, 'sc': { lat: 33.856892, lng: -80.945007 },
    'sd': { lat: 44.299782, lng: -99.438828 }, 'tn': { lat: 35.747845, lng: -86.692345 },
    'tx': { lat: 31.054487, lng: -97.563461 }, 'ut': { lat: 40.150032, lng: -111.862434 },
    'vt': { lat: 44.045876, lng: -72.710686 }, 'va': { lat: 37.769337, lng: -78.169968 },
    'wa': { lat: 47.400902, lng: -121.490494 }, 'wv': { lat: 38.491226, lng: -80.954453 },
    'wi': { lat: 44.268543, lng: -89.616508 }, 'wy': { lat: 42.755966, lng: -107.302490 },
  };
  
  const cityKey = `${city.toLowerCase()},${state.toLowerCase()}`;
  if (cityCoords[cityKey]) {
    return cityCoords[cityKey];
  }
  
  const stateKey = state.toLowerCase();
  if (stateCoords[stateKey]) {
    return stateCoords[stateKey];
  }
  
  return { lat: 39.8283, lng: -98.5795 }; // Center of US
};

const RouteMapModal = ({
  open,
  onOpenChange,
  pickupCity,
  pickupState,
  deliveryCity,
  deliveryState,
}: RouteMapModalProps) => {
  const pickupCoords = useMemo(() => getCoordinates(pickupCity, pickupState), [pickupCity, pickupState]);
  const deliveryCoords = useMemo(() => getCoordinates(deliveryCity, deliveryState), [deliveryCity, deliveryState]);

  // Calculate distance and estimates
  const routeInfo = useMemo(() => {
    const distance = calculateDistance(
      pickupCoords.lat, pickupCoords.lng,
      deliveryCoords.lat, deliveryCoords.lng
    );
    const price = estimatePrice(distance);
    const transitTime = estimateTransitTime(distance);
    
    return { distance, price, transitTime };
  }, [pickupCoords, deliveryCoords]);

  // Generate OpenStreetMap static embed URL with route visualization
  const mapUrl = useMemo(() => {
    const centerLat = (pickupCoords.lat + deliveryCoords.lat) / 2;
    const centerLng = (pickupCoords.lng + deliveryCoords.lng) / 2;
    
    // Calculate zoom level based on distance
    const latDiff = Math.abs(pickupCoords.lat - deliveryCoords.lat);
    const lngDiff = Math.abs(pickupCoords.lng - deliveryCoords.lng);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 4;
    if (maxDiff < 2) zoom = 7;
    else if (maxDiff < 5) zoom = 6;
    else if (maxDiff < 10) zoom = 5;
    else if (maxDiff < 20) zoom = 4;
    else zoom = 3;
    
    // Use OpenStreetMap embed with markers
    return `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(pickupCoords.lng, deliveryCoords.lng) - 2},${Math.min(pickupCoords.lat, deliveryCoords.lat) - 1},${Math.max(pickupCoords.lng, deliveryCoords.lng) + 2},${Math.max(pickupCoords.lat, deliveryCoords.lat) + 1}&layer=mapnik&marker=${pickupCoords.lat},${pickupCoords.lng}`;
  }, [pickupCoords, deliveryCoords]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] p-0 overflow-hidden rounded-2xl border-0 bg-background/95 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-teal-500/5" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <Route className="h-5 w-5 text-white" />
              </div>
              Route Overview
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Map Section - Real Static Map with Tiles */}
          <div className="flex-1 relative h-[300px] lg:h-auto lg:min-h-[400px] bg-slate-100 overflow-hidden">
            {/* Static Map Image from OpenStreetMap Static Map API */}
            <img
              src={`https://static-maps.yandex.ru/v1?lang=en_US&ll=${(pickupCoords.lng + deliveryCoords.lng) / 2},${(pickupCoords.lat + deliveryCoords.lat) / 2}&z=${Math.max(3, 10 - Math.floor(routeInfo.distance / 300))}&size=650,450&l=map&pt=${pickupCoords.lng},${pickupCoords.lat},pm2gnm~${deliveryCoords.lng},${deliveryCoords.lat},pm2blm`}
              alt="Route Map"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a different static map provider
                const target = e.target as HTMLImageElement;
                target.src = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=650&height=450&center=lonlat:${(pickupCoords.lng + deliveryCoords.lng) / 2},${(pickupCoords.lat + deliveryCoords.lat) / 2}&zoom=${Math.max(3, 10 - Math.floor(routeInfo.distance / 300))}&marker=lonlat:${pickupCoords.lng},${pickupCoords.lat};color:%23f59e0b;size:large|lonlat:${deliveryCoords.lng},${deliveryCoords.lat};color:%2314b8a6;size:large&apiKey=demo`;
              }}
            />
            
            {/* Gradient overlay for better marker visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
            
            {/* Custom markers overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Pickup marker */}
              <div 
                className="absolute z-10 flex flex-col items-center animate-fade-in"
                style={{ 
                  left: '30%', 
                  top: '55%',
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-primary/40 rounded-full animate-ping" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 border-3 border-white">
                    <MapPin className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>
                <div className="mt-3 px-4 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-primary/30">
                  <p className="text-sm font-bold text-primary">{pickupCity}</p>
                  <p className="text-xs text-muted-foreground">{pickupState}</p>
                </div>
              </div>

              {/* Delivery marker */}
              <div 
                className="absolute z-10 flex flex-col items-center animate-fade-in"
                style={{ 
                  left: '70%', 
                  top: '45%',
                  transform: 'translate(-50%, -100%)',
                  animationDelay: '0.2s'
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-teal-500/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-teal-500/50 border-3 border-white">
                    <Navigation className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>
                <div className="mt-3 px-4 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-teal-500/30">
                  <p className="text-sm font-bold text-teal-600">{deliveryCity}</p>
                  <p className="text-xs text-muted-foreground">{deliveryState}</p>
                </div>
              </div>

              {/* Animated route line */}
              <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                <defs>
                  <linearGradient id="routeGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <path 
                  d="M 30% 55% C 40% 35%, 60% 35%, 70% 45%" 
                  fill="none" 
                  stroke="url(#routeGradient2)" 
                  strokeWidth="5" 
                  strokeDasharray="15 8"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                <path 
                  d="M 30% 55% C 40% 35%, 60% 35%, 70% 45%" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeDasharray="15 8"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>

              {/* Distance badge */}
              <div 
                className="absolute z-20 px-5 py-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50"
                style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-lg font-bold text-foreground">
                      {Math.round(routeInfo.distance).toLocaleString()} mi
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Map branding */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Live Route</span>
            </div>
          </div>

          {/* Info Panel with ScrollArea */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/30 flex flex-col min-h-0">
            <ScrollArea className="flex-1 h-full">
              <div className="p-6 bg-gradient-to-b from-muted/30 to-muted/10">
                {/* Location Cards */}
                <div className="space-y-3 mb-6">
                  {/* Pickup */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/5 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">Pickup</span>
                    </div>
                    <p className="font-semibold text-foreground">{pickupCity}, {pickupState}</p>
                  </div>

                  {/* Connection line */}
                  <div className="flex items-center justify-center py-1">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-primary via-muted-foreground to-teal-500 rounded-full" />
                  </div>

                  {/* Delivery */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <Navigation className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Delivery</span>
                    </div>
                    <p className="font-semibold text-foreground">{deliveryCity}, {deliveryState}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="space-y-3">
                  {/* Distance */}
                  <div className="p-4 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round(routeInfo.distance).toLocaleString()} mi
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transit Time */}
                  <div className="p-4 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Transit Time</p>
                        <p className="text-lg font-bold text-foreground">
                          {routeInfo.transitTime.min}-{routeInfo.transitTime.max} days
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
                          ${routeInfo.price.average.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-emerald-500/20">
                      <span>Range: ${routeInfo.price.low.toLocaleString()}</span>
                      <span>—</span>
                      <span>${routeInfo.price.high.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Quick action hint */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      Prices based on current market rates
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouteMapModal;
