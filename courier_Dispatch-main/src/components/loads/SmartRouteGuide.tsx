import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Navigation,
  ScanLine,
  Camera,
  FileCheck,
  Receipt,
  Mail,
  CheckCircle2,
  ArrowRight,
  Locate,
  AlertCircle,
  Loader2,
  Car,
  Route,
  Clock,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Load } from "./LoadsTable";
import { VinScannerDialog } from "./VinScannerDialog";
import { PhotoCaptureDialog } from "./PhotoCaptureDialog";
import { EmailDocumentsDialog } from "./EmailDocumentsDialog";
import { useGeolocation, isWithinProximity, calculateDistance } from "@/hooks/useGeolocation";
import { useBolManager } from "@/hooks/useBolManager";
import { generateInvoice } from "@/utils/generateInvoice";
import { toast } from "sonner";

type GuideStep =
  | "idle"
  | "en_route_pickup"
  | "at_pickup"
  | "pickup_scan"
  | "en_route_delivery"
  | "at_delivery"
  | "delivery_scan"
  | "capture_photos"
  | "generate_docs"
  | "send_email"
  | "completed";

interface SmartRouteGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  load: Load;
  onComplete: () => void;
}

// Mock coordinates for demo - in production these would come from the load data
const getLoadCoordinates = (load: Load) => {
  // Simple hash function to generate consistent coordinates from city names
  const hashCity = (city: string, state: string) => {
    const str = city + state;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  };

  const pickupHash = hashCity(load.pickup.city, load.pickup.state);
  const deliveryHash = hashCity(load.delivery.city, load.delivery.state);

  return {
    pickup: [33 + (pickupHash % 10) / 10, -117 - (pickupHash % 20) / 10] as [number, number],
    delivery: [34 + (deliveryHash % 10) / 10, -118 - (deliveryHash % 20) / 10] as [number, number],
  };
};

const STEP_CONFIG: Record<GuideStep, { title: string; description: string; icon: any; color: string }> = {
  idle: { title: "Ready to Start", description: "Begin your route guide", icon: Route, color: "stone" },
  en_route_pickup: { title: "Heading to Pickup", description: "Navigate to pickup location", icon: Navigation, color: "amber" },
  at_pickup: { title: "Arrived at Pickup", description: "You've arrived! Scan the vehicle VIN", icon: MapPin, color: "amber" },
  pickup_scan: { title: "Scan Vehicle VIN", description: "Verify vehicle identity", icon: ScanLine, color: "teal" },
  en_route_delivery: { title: "En Route to Delivery", description: "Navigate to delivery location", icon: Navigation, color: "emerald" },
  at_delivery: { title: "Arrived at Delivery", description: "You've arrived! Scan VIN to confirm delivery", icon: MapPin, color: "emerald" },
  delivery_scan: { title: "Confirm Delivery", description: "Scan VIN to verify delivery", icon: ScanLine, color: "teal" },
  capture_photos: { title: "Capture Photos", description: "Document vehicle condition", icon: Camera, color: "sky" },
  generate_docs: { title: "Generate Documents", description: "Creating BOL and Invoice", icon: FileCheck, color: "violet" },
  send_email: { title: "Send to Shipper", description: "Email documents to shipper", icon: Mail, color: "orange" },
  completed: { title: "Delivery Complete", description: "All steps completed successfully", icon: CheckCircle2, color: "emerald" },
};

const STEP_ORDER: GuideStep[] = [
  "idle",
  "en_route_pickup",
  "at_pickup",
  "pickup_scan",
  "en_route_delivery",
  "at_delivery",
  "delivery_scan",
  "capture_photos",
  "generate_docs",
  "send_email",
  "completed",
];

export const SmartRouteGuide = ({
  open,
  onOpenChange,
  load,
  onComplete,
}: SmartRouteGuideProps) => {
  const [currentStep, setCurrentStep] = useState<GuideStep>("idle");
  const [vinScannerOpen, setVinScannerOpen] = useState(false);
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pickupVin, setPickupVin] = useState("");
  const [deliveryVin, setDeliveryVin] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [scanMode, setScanMode] = useState<"pickup" | "delivery">("pickup");
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [generatingDocs, setGeneratingDocs] = useState(false);

  const { addBol, addInvoice, getBolForLoad, getInvoiceForLoad } = useBolManager();
  const geo = useGeolocation({ watchPosition: true });
  const coords = getLoadCoordinates(load);

  // Calculate distances
  const distanceToPickup = geo.latitude && geo.longitude
    ? calculateDistance(geo.latitude, geo.longitude, coords.pickup[0], coords.pickup[1])
    : null;
  const distanceToDelivery = geo.latitude && geo.longitude
    ? calculateDistance(geo.latitude, geo.longitude, coords.delivery[0], coords.delivery[1])
    : null;

  // Auto-detect arrival at locations
  useEffect(() => {
    if (!autoDetectEnabled || !geo.latitude || !geo.longitude) return;

    const atPickup = isWithinProximity(geo.latitude, geo.longitude, coords.pickup[0], coords.pickup[1], 0.3);
    const atDelivery = isWithinProximity(geo.latitude, geo.longitude, coords.delivery[0], coords.delivery[1], 0.3);

    if (currentStep === "en_route_pickup" && atPickup) {
      setCurrentStep("at_pickup");
      toast.info("📍 You've arrived at the pickup location!", {
        description: "Tap to scan the vehicle VIN",
      });
    }

    if (currentStep === "en_route_delivery" && atDelivery) {
      setCurrentStep("at_delivery");
      toast.info("📍 You've arrived at the delivery location!", {
        description: "Tap to scan the vehicle VIN for delivery confirmation",
      });
    }
  }, [geo.latitude, geo.longitude, currentStep, autoDetectEnabled, coords]);

  const handleStart = () => {
    setCurrentStep("en_route_pickup");
  };

  const handleOpenNavigation = useCallback((destination: "pickup" | "delivery") => {
    const destCoords = destination === "pickup" ? coords.pickup : coords.delivery;
    const destCity = destination === "pickup" 
      ? `${load.pickup.city}, ${load.pickup.state}`
      : `${load.delivery.city}, ${load.delivery.state}`;
    
    // Open in Google Maps or Apple Maps
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destCoords[0]},${destCoords[1]}&travelmode=driving`;
    window.open(mapsUrl, "_blank");
    
    toast.success("Navigation opened", {
      description: `Directions to ${destCity}`,
    });
  }, [coords, load]);

  const handleArrivalConfirm = (location: "pickup" | "delivery") => {
    if (location === "pickup") {
      setScanMode("pickup");
      setCurrentStep("pickup_scan");
      setVinScannerOpen(true);
    } else {
      setScanMode("delivery");
      setCurrentStep("delivery_scan");
      setVinScannerOpen(true);
    }
  };

  const handleVinScanned = (vin: string) => {
    if (scanMode === "pickup") {
      setPickupVin(vin);
      // Generate BOL
      addBol(load.id, vin, load.loadId);
      toast.success("Pickup confirmed!", {
        description: "BOL generated. Ready to start delivery route.",
      });
      setCurrentStep("en_route_delivery");
    } else {
      setDeliveryVin(vin);
      toast.success("Delivery VIN verified!", {
        description: "Now capture vehicle condition photos.",
      });
      setCurrentStep("capture_photos");
      setPhotoCaptureOpen(true);
    }
  };

  const handlePhotosConfirmed = (capturedPhotos: string[]) => {
    setPhotos(capturedPhotos);
    toast.success(`${capturedPhotos.length} photos captured!`);
    setCurrentStep("generate_docs");
    generateDocuments();
  };

  const generateDocuments = async () => {
    setGeneratingDocs(true);
    
    // Simulate document generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Generate invoice
      const invoiceUrl = generateInvoice(load);
      addInvoice(load.id, load.loadId, invoiceUrl);
      
      toast.success("Documents generated!", {
        description: "BOL and Invoice are ready",
      });
      
      setCurrentStep("send_email");
    } catch (error) {
      toast.error("Failed to generate documents");
    } finally {
      setGeneratingDocs(false);
    }
  };

  const handleEmailSent = () => {
    setCurrentStep("completed");
  };

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
    
    // Reset state
    setCurrentStep("idle");
    setPickupVin("");
    setDeliveryVin("");
    setPhotos([]);
  };

  const skipToStep = (step: GuideStep) => {
    setCurrentStep(step);
    
    if (step === "pickup_scan") {
      setScanMode("pickup");
      setVinScannerOpen(true);
    } else if (step === "delivery_scan") {
      setScanMode("delivery");
      setVinScannerOpen(true);
    } else if (step === "capture_photos") {
      setPhotoCaptureOpen(true);
    } else if (step === "send_email") {
      setEmailDialogOpen(true);
    }
  };

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = (currentStepIndex / (STEP_ORDER.length - 1)) * 100;
  const stepConfig = STEP_CONFIG[currentStep];
  const StepIcon = stepConfig.icon;

  const hasBol = !!getBolForLoad(load.id) || !!pickupVin;
  const hasInvoice = !!getInvoiceForLoad(load.id);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 px-6 py-5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Smart Route Guide</h2>
                  <p className="text-sm text-white/80">{load.loadId}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-xl text-white/80 hover:text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 mt-4">
              <Progress value={progress} className="h-2 bg-white/20" />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-white/70">Step {currentStepIndex + 1} of {STEP_ORDER.length}</span>
                <span className="text-xs text-white/70">{Math.round(progress)}% complete</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Step Card */}
            <div className={cn(
              "p-5 rounded-2xl border-2 transition-all",
              `border-${stepConfig.color}-200 bg-${stepConfig.color}-50/50`
            )} style={{
              borderColor: `var(--${stepConfig.color}-200, #e5e7eb)`,
              backgroundColor: `var(--${stepConfig.color}-50, #f9fafb)`,
            }}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                  currentStep === "completed" ? "bg-emerald-100" : "bg-amber-100"
                )}>
                  <StepIcon className={cn(
                    "h-7 w-7",
                    currentStep === "completed" ? "text-emerald-600" : "text-amber-600"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-stone-800">{stepConfig.title}</h3>
                  <p className="text-sm text-stone-500 mt-1">{stepConfig.description}</p>
                </div>
              </div>

              {/* Location Info */}
              {(currentStep === "en_route_pickup" || currentStep === "at_pickup") && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800">{load.pickup.city}, {load.pickup.state}</p>
                      <p className="text-xs text-stone-500">{load.pickupDate}</p>
                    </div>
                    {distanceToPickup !== null && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">{distanceToPickup.toFixed(1)} mi</p>
                        <p className="text-xs text-stone-400">away</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(currentStep === "en_route_delivery" || currentStep === "at_delivery") && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800">{load.delivery.city}, {load.delivery.state}</p>
                      <p className="text-xs text-stone-500">{load.deliveryDate}</p>
                    </div>
                    {distanceToDelivery !== null && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{distanceToDelivery.toFixed(1)} mi</p>
                        <p className="text-xs text-stone-400">away</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center">
                <Car className="h-6 w-6 text-stone-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-stone-800">
                  {load.vehicleInfo.year} {load.vehicleInfo.make} {load.vehicleInfo.model}
                </p>
                <p className="text-xs text-stone-500 font-mono">{load.vehicleInfo.vin}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">${load.price.toLocaleString()}</p>
                <p className="text-xs text-stone-400">{load.paymentMethod}</p>
              </div>
            </div>

            {/* Geolocation Status */}
            {geo.loading && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Acquiring location...</span>
              </div>
            )}
            {geo.error && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700">{geo.error}</span>
                <Button size="sm" variant="ghost" onClick={geo.refresh} className="ml-auto h-7 text-xs">
                  Retry
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {currentStep === "idle" && (
                <Button
                  onClick={handleStart}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-lg font-semibold"
                >
                  <Route className="h-5 w-5 mr-2" />
                  Start Route Guide
                </Button>
              )}

              {currentStep === "en_route_pickup" && (
                <>
                  <Button
                    onClick={() => handleOpenNavigation("pickup")}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Open Navigation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleArrivalConfirm("pickup")}
                    className="w-full h-11 rounded-xl border-amber-200 hover:bg-amber-50"
                  >
                    <Locate className="h-4 w-4 mr-2" />
                    I've Arrived - Scan VIN
                  </Button>
                </>
              )}

              {currentStep === "at_pickup" && (
                <Button
                  onClick={() => handleArrivalConfirm("pickup")}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-lg"
                >
                  <ScanLine className="h-5 w-5 mr-2" />
                  Scan Vehicle VIN
                </Button>
              )}

              {currentStep === "en_route_delivery" && (
                <>
                  <Button
                    onClick={() => handleOpenNavigation("delivery")}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Navigate to Delivery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleArrivalConfirm("delivery")}
                    className="w-full h-11 rounded-xl border-emerald-200 hover:bg-emerald-50"
                  >
                    <Locate className="h-4 w-4 mr-2" />
                    I've Arrived - Confirm Delivery
                  </Button>
                </>
              )}

              {currentStep === "at_delivery" && (
                <Button
                  onClick={() => handleArrivalConfirm("delivery")}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-lg"
                >
                  <ScanLine className="h-5 w-5 mr-2" />
                  Scan VIN for Delivery
                </Button>
              )}

              {currentStep === "generate_docs" && generatingDocs && (
                <div className="flex items-center justify-center gap-3 p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  <span className="text-stone-600">Generating documents...</span>
                </div>
              )}

              {currentStep === "send_email" && (
                <Button
                  onClick={() => setEmailDialogOpen(true)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Send Documents to Shipper
                </Button>
              )}

              {currentStep === "completed" && (
                <div className="text-center space-y-4">
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-700">Delivery Complete!</p>
                      <p className="text-sm text-stone-500">All steps have been completed successfully</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleComplete}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Finish & Close
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Skip Options (for demo/testing) */}
            {currentStep !== "idle" && currentStep !== "completed" && (
              <div className="pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-2">Quick actions (for testing):</p>
                <div className="flex flex-wrap gap-2">
                  {currentStepIndex < STEP_ORDER.indexOf("at_pickup") && (
                    <Button size="sm" variant="ghost" onClick={() => skipToStep("at_pickup")} className="h-7 text-xs">
                      Skip to Pickup
                    </Button>
                  )}
                  {currentStepIndex < STEP_ORDER.indexOf("at_delivery") && currentStepIndex >= STEP_ORDER.indexOf("pickup_scan") && (
                    <Button size="sm" variant="ghost" onClick={() => skipToStep("at_delivery")} className="h-7 text-xs">
                      Skip to Delivery
                    </Button>
                  )}
                  {currentStepIndex < STEP_ORDER.indexOf("send_email") && currentStepIndex >= STEP_ORDER.indexOf("delivery_scan") && (
                    <Button size="sm" variant="ghost" onClick={() => skipToStep("send_email")} className="h-7 text-xs">
                      Skip to Email
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <VinScannerDialog
        open={vinScannerOpen}
        onOpenChange={setVinScannerOpen}
        onVinScanned={handleVinScanned}
        existingVin={load.vehicleInfo.vin}
        mode={scanMode === "pickup" ? "bol" : "invoice"}
      />

      <PhotoCaptureDialog
        open={photoCaptureOpen}
        onOpenChange={setPhotoCaptureOpen}
        onPhotosConfirmed={handlePhotosConfirmed}
      />

      <EmailDocumentsDialog
        open={emailDialogOpen}
        onOpenChange={(open) => {
          setEmailDialogOpen(open);
          if (!open && currentStep === "send_email") {
            handleEmailSent();
          }
        }}
        shipperName={load.shipper.name}
        loadId={load.loadId}
        vehicleInfo={`${load.vehicleInfo.year} ${load.vehicleInfo.make} ${load.vehicleInfo.model}`}
        hasBol={hasBol}
        hasInvoice={hasInvoice}
        hasPhotos={photos.length > 0}
      />
    </>
  );
};
