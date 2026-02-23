import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, X, LocateFixed, Navigation2, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface AddressMapPickerProps {
  address: string;
  onAddressChange: (address: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  className?: string;
}

interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
}

const AddressMapPicker = ({ address, onAddressChange, onCoordinatesChange, className }: AddressMapPickerProps) => {
  const [searchQuery, setSearchQuery] = useState(address);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Reverse geocode from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    setSelectedCoords({ lat, lng });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await response.json();
      if (data.display_name) {
        setSearchQuery(data.display_name);
        onAddressChange(data.display_name);
        onCoordinatesChange?.(lat, lng);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [onAddressChange, onCoordinatesChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on US
    const map = L.map(mapContainerRef.current, {
      center: [39.8283, -98.5795],
      zoom: 4,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add tile layer - using a cleaner style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Handle map click
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
      }
      
      // Reverse geocode the clicked location
      reverseGeocode(lat, lng);
    });

    mapRef.current = map;

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [reverseGeocode]);

  // Search for address suggestions
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: GeocodingResult[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
      
      // Auto-zoom to first result as user types
      if (data.length > 0 && mapRef.current) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);
        
        // Pan map to first result (preview mode)
        mapRef.current.setView([lat, lng], 12, { animate: true });
        
        // Update marker position for preview
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(mapRef.current);
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (result: GeocodingResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSearchQuery(result.display_name);
    onAddressChange(result.display_name);
    onCoordinatesChange?.(lat, lng);
    setSelectedCoords({ lat, lng });
    setShowSuggestions(false);
    setSuggestions([]);

    // Update map
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(mapRef.current);
      }
    }
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update map
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
            
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            } else {
              markerRef.current = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(mapRef.current);
            }
          }
          
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  // Clear selection
  const handleClear = () => {
    setSearchQuery("");
    onAddressChange("");
    setSuggestions([]);
    setSelectedCoords(null);
    
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Sync external address changes
  useEffect(() => {
    if (address !== searchQuery) {
      setSearchQuery(address);
    }
  }, [address]);

  return (
    <div className={cn("space-y-0", className)}>
      {/* Map Container with integrated search */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/20">
        {/* Floating Search Bar */}
        <div className="absolute top-3 left-3 right-3 z-[1000]">
          <div className="relative">
            <div className="relative bg-background/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 overflow-hidden">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 border-r border-border/30">
                  {(isSearching || isReverseGeocoding) ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search for an address..."
                  className="flex-1 border-0 h-12 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                />
                <div className="flex items-center gap-1 pr-2">
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-muted/80"
                      onClick={handleClear}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-muted/80"
                    onClick={handleGetCurrentLocation}
                    title="Use current location"
                  >
                    <Crosshair className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute w-full mt-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-start gap-3 border-b border-border/30 last:border-0"
                    onClick={() => handleSelectSuggestion(result)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 flex-shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 text-foreground/60" />
                    </div>
                    <span className="line-clamp-2 text-foreground/80">{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {isReverseGeocoding && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] z-[999] flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-background/95 px-4 py-2.5 rounded-xl shadow-lg border border-border/50">
              <Loader2 className="h-4 w-4 animate-spin text-foreground/70" />
              <span className="text-sm text-foreground/80">Getting address...</span>
            </div>
          </div>
        )}

        {/* Map */}
        <div 
          ref={mapContainerRef} 
          className="h-[280px] w-full"
          style={{ zIndex: 1 }}
        />

        {/* Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000]">
          <div className="bg-gradient-to-t from-background/90 via-background/60 to-transparent pt-8 pb-3 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <Navigation2 className="h-3.5 w-3.5" />
                <span>Click anywhere on the map to select</span>
              </div>
              {selectedCoords && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border/30">
                  <LocateFixed className="h-3 w-3 text-foreground/50" />
                  <span className="text-[10px] font-mono text-foreground/60">
                    {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressMapPicker;
