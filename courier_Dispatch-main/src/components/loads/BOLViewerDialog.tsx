import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Copy, Printer, Check, ChevronDown, Download, ImageIcon, Car, Clock, CheckCircle2, Share2 } from "lucide-react";
import { EmailDocumentsDialog } from "./EmailDocumentsDialog";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import type { Load } from "./LoadsTable";
import "leaflet/dist/leaflet.css";

interface BOLViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  load: Load | null;
  scannedVin: string;
}

interface InspectionData {
  keys: number;
  remotes: number;
  headrests: number;
  odometer: string;
  drivable: boolean;
  windscreen: boolean;
  glass: boolean;
  title: boolean;
}

// Custom markers
const pickupIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width: 24px; height: 24px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const deliveryIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width: 24px; height: 24px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Map bounds fitter component
const MapBoundsFitter = ({ pickupCoords, deliveryCoords }: { pickupCoords: [number, number]; deliveryCoords: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    const bounds = L.latLngBounds([pickupCoords, deliveryCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, pickupCoords, deliveryCoords]);
  
  return null;
};

export const BOLViewerDialog = ({ open, onOpenChange, load, scannedVin }: BOLViewerDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [damageCodesOpen, setDamageCodesOpen] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [shareOpen, setShareOpen] = useState(false);

  // Mock inspection data
  const pickupInspection: InspectionData = {
    keys: 2,
    remotes: 1,
    headrests: 4,
    odometer: "",
    drivable: true,
    windscreen: true,
    glass: true,
    title: false,
  };

  const deliveryInspection: InspectionData = {
    keys: 2,
    remotes: 1,
    headrests: 4,
    odometer: "95294",
    drivable: true,
    windscreen: true,
    glass: true,
    title: false,
  };

  // Mock coordinates - in production these would come from the load data
  const pickupCoords: [number, number] = [42.2793, -71.4162]; // Framingham, MA
  const deliveryCoords: [number, number] = [41.8781, -87.6298]; // Chicago, IL

  // Fetch route from OSRM
  useEffect(() => {
    if (!open || !load) return;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickupCoords[1]},${pickupCoords[0]};${deliveryCoords[1]},${deliveryCoords[0]}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        if (data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          setRouteCoords(coords);
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
        // Fallback to straight line
        setRouteCoords([pickupCoords, deliveryCoords]);
      }
    };

    fetchRoute();
  }, [open, load]);

  if (!load) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/bol/${load.loadId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const timelineEvents = [
    { status: "Accepted", date: load.pickupDate, time: "11:32 AM", completed: true },
    { status: "Picked Up", date: load.pickupDate, time: "11:53 AM", location: `${load.pickup.city}, ${load.pickup.state}`, completed: true },
    { status: "Delivered", date: load.deliveryDate, time: "1:21 PM", location: `${load.delivery.city}, ${load.delivery.state}`, completed: true },
  ];

  const InspectionRow = ({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" }) => (
    <div className={cn(
      "flex items-center justify-between py-2 px-3 rounded-lg mb-1",
      highlight === "green" && "bg-emerald-50/80",
      highlight === "red" && "bg-rose-50/80",
      !highlight && "bg-stone-50/50"
    )}>
      <span className="text-sm text-stone-600">{label}</span>
      <span className={cn(
        "text-sm font-semibold",
        highlight === "green" && "text-emerald-600",
        highlight === "red" && "text-rose-600",
        !highlight && "text-stone-800"
      )}>{value}</span>
    </div>
  );

  const InspectionSection = ({ title, inspection, isPickup }: { title: string; inspection: InspectionData; isPickup: boolean }) => (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center",
          isPickup ? "bg-amber-100" : "bg-emerald-100"
        )}>
          <Car className={cn("h-4 w-4", isPickup ? "text-amber-600" : "text-emerald-600")} />
        </div>
        <h3 className="text-base font-semibold text-stone-800">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Photos Grid */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Photos & Videos</p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center border-2 border-dashed transition-all cursor-pointer",
                  "border-stone-200 bg-stone-50/50 hover:border-stone-300 hover:bg-stone-100/50"
                )}
              >
                {i === 6 ? (
                  <div className="flex items-center gap-0.5 text-stone-400">
                    <span className="text-xs font-medium">+9</span>
                    <ImageIcon className="h-3 w-3" />
                  </div>
                ) : (
                  <ImageIcon className="h-5 w-5 text-stone-300" />
                )}
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 text-xs"
          >
            <Download className="h-3 w-3 mr-1.5" />
            Download Media
          </Button>
        </div>
        
        {/* Inspection Checklist */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Inspection</p>
          <div className="space-y-1">
            <InspectionRow label="Keys" value={inspection.keys.toString()} />
            <InspectionRow label="Remotes" value={inspection.remotes.toString()} />
            <InspectionRow label="Headrests" value={inspection.headrests.toString()} />
            <InspectionRow label="Drivable" value={inspection.drivable ? "Yes" : "No"} highlight={inspection.drivable ? "green" : "red"} />
            <InspectionRow label="Windscreen" value={inspection.windscreen ? "Yes" : "No"} highlight={inspection.windscreen ? "green" : "red"} />
            <InspectionRow label="Glass" value={inspection.glass ? "Yes" : "No"} highlight={inspection.glass ? "green" : "red"} />
            <InspectionRow label="Title" value={inspection.title ? "Yes" : "No"} highlight={inspection.title ? "green" : "red"} />
            {inspection.odometer && <InspectionRow label="Odometer" value={inspection.odometer} />}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 rounded-2xl overflow-hidden border-0 shadow-2xl bg-white flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-stone-50 via-stone-100/50 to-stone-50 border-b border-stone-200/50 flex-shrink-0">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-amber-200/20 to-emerald-200/20 blur-2xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center shadow-sm">
                <MapPin className="h-5 w-5 text-stone-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-800">Online BOL</h2>
                <p className="text-xs text-stone-500">Bill of Lading #{load.loadId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShareOpen(true)}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 shadow-sm"
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
              <Button
                onClick={handleCopyLink}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 shadow-sm"
              >
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrint}
                className="h-9 w-9 rounded-xl border-stone-200 hover:bg-stone-100"
              >
                <Printer className="h-4 w-4 text-stone-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column - Map & Timeline (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Map */}
                <div className="rounded-[1.5rem_1rem_1.5rem_1rem] overflow-hidden border border-stone-200 shadow-sm h-56">
                  <MapContainer
                    center={[39.8283, -98.5795]}
                    zoom={4}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={pickupCoords} icon={pickupIcon} />
                    <Marker position={deliveryCoords} icon={deliveryIcon} />
                    {routeCoords.length > 0 && (
                      <Polyline
                        positions={routeCoords}
                        pathOptions={{
                          color: "#059669",
                          weight: 4,
                          opacity: 0.8,
                        }}
                      />
                    )}
                    <MapBoundsFitter pickupCoords={pickupCoords} deliveryCoords={deliveryCoords} />
                  </MapContainer>
                </div>

                {/* Route Summary */}
                <div className="p-4 rounded-[1rem_1.5rem_1rem_1.5rem] bg-stone-50/80 border border-stone-100 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800">{load.pickup.city}, {load.pickup.state}</p>
                      <p className="text-xs text-stone-500">{load.pickupDate}</p>
                    </div>
                  </div>
                  <div className="ml-1 border-l-2 border-dashed border-stone-200 h-4" />
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800">{load.delivery.city}, {load.delivery.state}</p>
                      <p className="text-xs text-stone-500">{load.deliveryDate}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 rounded-[1.5rem_1rem_1.5rem_1rem] bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">Delivered</span>
                  </div>
                  
                  <div className="space-y-0 ml-1">
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            event.completed ? "bg-emerald-500" : "bg-stone-300"
                          )} />
                          {index < timelineEvents.length - 1 && (
                            <div className="w-0.5 h-10 bg-emerald-200" />
                          )}
                        </div>
                        <div className="pb-3 -mt-0.5">
                          <p className="text-sm font-medium text-stone-800">{event.status}</p>
                          <p className="text-xs text-stone-500">{event.date}, {event.time}</p>
                          {event.location && (
                            <p className="text-xs text-emerald-600">{event.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Damage Codes */}
                <Collapsible open={damageCodesOpen} onOpenChange={setDamageCodesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-stone-50 rounded-xl border border-stone-100 hover:bg-stone-100/80 transition-colors">
                    <span className="text-sm font-medium text-stone-700">Damage Code Definitions</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-stone-500 transition-transform",
                      damageCodesOpen && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-stone-600">
                      <div><span className="font-semibold">S</span> - Scratch</div>
                      <div><span className="font-semibold">D</span> - Dent</div>
                      <div><span className="font-semibold">C</span> - Chip</div>
                      <div><span className="font-semibold">CR</span> - Crack</div>
                      <div><span className="font-semibold">MS</span> - Missing</div>
                      <div><span className="font-semibold">BR</span> - Broken</div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Right Column - Vehicle & Inspections (3 cols) */}
              <div className="lg:col-span-3">
                {/* Vehicle Info Card */}
                <div className="p-5 rounded-[1rem_2rem_1rem_2rem] bg-gradient-to-br from-stone-50 to-stone-100/50 border border-stone-200/50 relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-amber-100/30 to-emerald-100/30 blur-xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-stone-800">
                          {load.vehicleInfo.year} {load.vehicleInfo.make} {load.vehicleInfo.model}
                        </h2>
                        <p className="text-xs font-mono text-stone-500 mt-1 tracking-wide">{scannedVin || load.vehicleInfo.vin}</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-stone-200/50 text-xs font-semibold text-stone-600 uppercase">
                        SUV
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-200/50">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-stone-400" />
                        <span className="text-sm text-stone-600">Est. 850 mi</span>
                      </div>
                      <div className="h-4 w-px bg-stone-200" />
                      <div className="text-sm">
                        <span className="text-stone-500">Payment: </span>
                        <span className="font-semibold text-stone-700">{load.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inspections */}
                <InspectionSection title="Pickup Inspection" inspection={pickupInspection} isPickup={true} />
                <InspectionSection title="Delivery Inspection" inspection={deliveryInspection} isPickup={false} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <EmailDocumentsDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        shipperName={load.shipper.name}
        shipperEmail={load.shipper.phone?.includes("@") ? load.shipper.phone : ""}
        loadId={load.loadId}
        vehicleInfo={`${load.vehicleInfo.year} ${load.vehicleInfo.make} ${load.vehicleInfo.model}`}
        hasBol={true}
        hasInvoice={false}
        hasVcr={false}
      />
    </Dialog>
  );
};
