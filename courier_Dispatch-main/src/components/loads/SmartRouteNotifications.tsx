import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  ScanLine,
  Camera,
  FileCheck,
  Receipt,
  Mail,
  CheckCircle2,
  X,
  Car,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Load } from "./LoadsTable";
import { VinScannerDialog } from "./VinScannerDialog";
import { PhotoCaptureDialog } from "./PhotoCaptureDialog";
import { EmailDocumentsDialog } from "./EmailDocumentsDialog";
import { useGeolocation, isWithinProximity, calculateDistance } from "@/hooks/useGeolocation";
import { useBolManager } from "@/hooks/useBolManager";
import { generateInvoice } from "@/utils/generateInvoice";
import { toast } from "sonner";

type NotificationType = 
  | "arrived_pickup" 
  | "pickup_complete" 
  | "arrived_delivery" 
  | "capture_photos"
  | "docs_ready"
  | "delivery_complete";

interface ActiveNotification {
  id: string;
  type: NotificationType;
  load: Load;
  timestamp: Date;
}

interface SmartRouteNotificationsProps {
  loads: Load[];
  onLoadUpdate?: (loadId: string, status: string) => void;
}

// Generate consistent coordinates from load data
const getLoadCoordinates = (load: Load) => {
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

const NOTIFICATION_CONFIG: Record<NotificationType, { 
  title: string; 
  description: string; 
  icon: any; 
  gradient: string;
  action: string;
}> = {
  arrived_pickup: {
    title: "You've arrived at pickup!",
    description: "Scan the vehicle VIN to confirm pickup",
    icon: MapPin,
    gradient: "from-amber-500 to-orange-500",
    action: "Scan VIN",
  },
  pickup_complete: {
    title: "Pickup confirmed!",
    description: "BOL generated. Ready to start delivery",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-500",
    action: "Start Navigation",
  },
  arrived_delivery: {
    title: "You've arrived at delivery!",
    description: "Scan VIN to confirm delivery",
    icon: MapPin,
    gradient: "from-emerald-500 to-teal-500",
    action: "Scan VIN",
  },
  capture_photos: {
    title: "Capture vehicle photos",
    description: "Document the vehicle condition",
    icon: Camera,
    gradient: "from-sky-500 to-cyan-500",
    action: "Take Photos",
  },
  docs_ready: {
    title: "Documents ready!",
    description: "BOL & Invoice generated. Send to shipper",
    icon: FileCheck,
    gradient: "from-violet-500 to-purple-500",
    action: "Send Email",
  },
  delivery_complete: {
    title: "Delivery complete! 🎉",
    description: "All documents sent to shipper",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-green-500",
    action: "Done",
  },
};

// Track which loads have been processed at each stage
const processedLoads = new Map<string, Set<string>>();

export const SmartRouteNotifications = ({ 
  loads, 
  onLoadUpdate 
}: SmartRouteNotificationsProps) => {
  const [notifications, setNotifications] = useState<ActiveNotification[]>([]);
  const [vinScannerOpen, setVinScannerOpen] = useState(false);
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [activeLoad, setActiveLoad] = useState<Load | null>(null);
  const [scanMode, setScanMode] = useState<"pickup" | "delivery">("pickup");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [generatingDocs, setGeneratingDocs] = useState(false);

  const { addBol, addInvoice, getBolForLoad, getInvoiceForLoad } = useBolManager();
  const geo = useGeolocation({ watchPosition: true });

  // Filter to only pickup status loads
  const pickupLoads = loads.filter(l => l.status === "pickup");

  // Check proximity to pickup/delivery locations
  useEffect(() => {
    if (!geo.latitude || !geo.longitude) return;

    pickupLoads.forEach((load) => {
      const coords = getLoadCoordinates(load);
      const loadProcessed = processedLoads.get(load.id) || new Set();
      
      // Check if arrived at pickup
      const atPickup = isWithinProximity(
        geo.latitude!, 
        geo.longitude!, 
        coords.pickup[0], 
        coords.pickup[1], 
        0.3
      );

      // Check if arrived at delivery (only if pickup is done)
      const atDelivery = isWithinProximity(
        geo.latitude!, 
        geo.longitude!, 
        coords.delivery[0], 
        coords.delivery[1], 
        0.3
      );

      const hasBol = !!getBolForLoad(load.id);

      // Show pickup notification
      if (atPickup && !hasBol && !loadProcessed.has("arrived_pickup")) {
        addNotification("arrived_pickup", load);
        loadProcessed.add("arrived_pickup");
        processedLoads.set(load.id, loadProcessed);
      }

      // Show delivery notification (only if BOL exists, meaning pickup was done)
      if (atDelivery && hasBol && !loadProcessed.has("arrived_delivery")) {
        addNotification("arrived_delivery", load);
        loadProcessed.add("arrived_delivery");
        processedLoads.set(load.id, loadProcessed);
      }
    });
  }, [geo.latitude, geo.longitude, pickupLoads]);

  const addNotification = (type: NotificationType, load: Load) => {
    const id = `${type}-${load.id}-${Date.now()}`;
    
    // Remove any existing notification for this load/type combo
    setNotifications(prev => prev.filter(n => 
      !(n.load.id === load.id && n.type === type)
    ));

    setNotifications(prev => [...prev, {
      id,
      type,
      load,
      timestamp: new Date(),
    }]);

    // Play notification sound (optional)
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2DgYWFhIWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYU=");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationAction = (notification: ActiveNotification) => {
    setActiveLoad(notification.load);

    switch (notification.type) {
      case "arrived_pickup":
        setScanMode("pickup");
        setVinScannerOpen(true);
        dismissNotification(notification.id);
        break;

      case "pickup_complete":
        // Open navigation to delivery
        const pickupCoords = getLoadCoordinates(notification.load);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pickupCoords.delivery[0]},${pickupCoords.delivery[1]}&travelmode=driving`;
        window.open(mapsUrl, "_blank");
        dismissNotification(notification.id);
        break;

      case "arrived_delivery":
        setScanMode("delivery");
        setVinScannerOpen(true);
        dismissNotification(notification.id);
        break;

      case "capture_photos":
        setPhotoCaptureOpen(true);
        dismissNotification(notification.id);
        break;

      case "docs_ready":
        setEmailDialogOpen(true);
        dismissNotification(notification.id);
        break;

      case "delivery_complete":
        dismissNotification(notification.id);
        if (onLoadUpdate) {
          onLoadUpdate(notification.load.id, "done");
        }
        break;
    }
  };

  const handleVinScanned = (vin: string) => {
    if (!activeLoad) return;

    if (scanMode === "pickup") {
      // Generate BOL on pickup
      addBol(activeLoad.id, vin, activeLoad.loadId);
      toast.success("Pickup confirmed!", {
        description: "BOL generated successfully",
      });
      
      // Show pickup complete notification
      addNotification("pickup_complete", activeLoad);
    } else {
      // Delivery scan complete - show photo capture notification
      toast.success("Delivery VIN verified!", {
        description: "Now capture vehicle photos",
      });
      
      addNotification("capture_photos", activeLoad);
    }
  };

  const handlePhotosConfirmed = async (photos: string[]) => {
    if (!activeLoad) return;
    
    setCapturedPhotos(photos);
    setGeneratingDocs(true);

    toast.success(`${photos.length} photos captured!`);

    // Generate invoice
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const invoiceUrl = generateInvoice(activeLoad);
      addInvoice(activeLoad.id, activeLoad.loadId, invoiceUrl);
      
      // Show docs ready notification
      addNotification("docs_ready", activeLoad);
    } catch {
      toast.error("Failed to generate documents");
    } finally {
      setGeneratingDocs(false);
    }
  };

  const handleEmailSent = () => {
    if (!activeLoad) return;
    
    // Show delivery complete notification
    addNotification("delivery_complete", activeLoad);
    
    toast.success("Delivery complete!", {
      description: "All documents sent to shipper",
    });
  };

  // Demo: Simulate arrival for testing
  const simulateArrival = (type: "pickup" | "delivery", load: Load) => {
    if (type === "pickup") {
      addNotification("arrived_pickup", load);
    } else {
      addNotification("arrived_delivery", load);
    }
    setActiveLoad(load);
  };

  return (
    <>
      {/* Floating Notification Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-4 max-w-[360px]">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => {
            const config = NOTIFICATION_CONFIG[notification.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 80, scale: 0.8, rotateX: -15 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1, 
                  rotateX: 0,
                  transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 350,
                    delay: index * 0.1
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 150, 
                  scale: 0.8,
                  rotateY: 15,
                  transition: { duration: 0.3, ease: "easeIn" }
                }}
                className="relative group"
                style={{ perspective: "1000px" }}
              >
                {/* Outer glow effect */}
                <div className={cn(
                  "absolute -inset-1 rounded-[1.75rem] opacity-60 blur-lg transition-opacity duration-500 group-hover:opacity-80",
                  `bg-gradient-to-r ${config.gradient}`
                )} />

                {/* Main card with solid background */}
                <div className="relative overflow-hidden rounded-[1.5rem_2rem_1.5rem_2rem] border border-border/50 bg-card shadow-xl">
                  
                  {/* Gradient accent strip at top */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                    config.gradient
                  )} />

                  {/* Subtle shimmer overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Decorative orbs */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />

                  {/* Content */}
                  <div className="relative p-5 pt-6">
                    {/* Close button */}
                    <motion.button
                      onClick={() => dismissNotification(notification.id)}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </motion.button>

                    {/* Animated icon with pulse ring */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        {/* Pulse rings */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-primary/30"
                          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-primary/20"
                          animate={{ scale: [1, 1.8, 1.8], opacity: [0.3, 0, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                        />
                        
                        {/* Icon container */}
                        <motion.div 
                          className={cn(
                            "relative h-12 w-12 rounded-2xl flex items-center justify-center border shadow-lg bg-gradient-to-br",
                            config.gradient,
                            "border-primary/20"
                          )}
                          animate={{ 
                            rotate: notification.type === "pickup_complete" ? [0, 5, -5, 0] : 0 
                          }}
                          transition={{ duration: 0.5, repeat: notification.type === "pickup_complete" ? Infinity : 0, repeatDelay: 2 }}
                        >
                          <Icon className="h-6 w-6 text-primary-foreground drop-shadow-lg" />
                        </motion.div>
                      </div>

                      <div className="flex-1 min-w-0 pr-6 pt-1">
                        <motion.h4 
                          className="font-bold text-foreground text-base leading-tight"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {config.title}
                        </motion.h4>
                        <motion.p 
                          className="text-sm text-muted-foreground mt-1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {config.description}
                        </motion.p>
                      </div>
                    </div>

                    {/* Vehicle info with sleek design */}
                    <motion.div 
                      className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-xl border border-border/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Car className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-semibold truncate block">
                          {notification.load.vehicleInfo.year} {notification.load.vehicleInfo.make} {notification.load.vehicleInfo.model}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {notification.load.loadId}
                        </span>
                      </div>
                      <Sparkles className="h-4 w-4 text-primary/50" />
                    </motion.div>

                    {/* Action button with hover effects */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={() => handleNotificationAction(notification)}
                        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 group/btn overflow-hidden relative"
                      >
                        <motion.span 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.6 }}
                        />
                        <span className="relative flex items-center justify-center gap-2">
                          {notification.type === "arrived_pickup" || notification.type === "arrived_delivery" ? (
                            <ScanLine className="h-4 w-4 group-hover/btn:animate-pulse" />
                          ) : notification.type === "capture_photos" ? (
                            <Camera className="h-4 w-4 group-hover/btn:animate-pulse" />
                          ) : notification.type === "docs_ready" ? (
                            <Mail className="h-4 w-4 group-hover/btn:animate-pulse" />
                          ) : notification.type === "pickup_complete" ? (
                            <Navigation className="h-4 w-4 group-hover/btn:animate-pulse" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 group-hover/btn:animate-pulse" />
                          )}
                          {config.action}
                          <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-300" />
                        </span>
                      </Button>
                    </motion.div>

                    {/* Step indicator dots */}
                    <div className="flex justify-center gap-1.5 mt-4">
                      {["arrived_pickup", "pickup_complete", "arrived_delivery", "capture_photos", "docs_ready", "delivery_complete"].map((step, i) => (
                        <motion.div
                          key={step}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            step === notification.type 
                              ? "w-6 bg-primary" 
                              : "w-1.5 bg-muted-foreground/30"
                          )}
                          animate={step === notification.type ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Demo trigger buttons (for testing) */}
        {pickupLoads.length > 0 && notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-card backdrop-blur-xl rounded-[1.25rem] border border-border shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Test Smart Notifications</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => simulateArrival("pickup", pickupLoads[0])}
                className="flex-1 h-9 text-xs bg-warning/10 border-warning/40 text-warning hover:bg-warning/20 rounded-xl font-medium"
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                At Pickup
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => simulateArrival("delivery", pickupLoads[0])}
                className="flex-1 h-9 text-xs bg-success/10 border-success/40 text-success hover:bg-success/20 rounded-xl font-medium"
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                At Delivery
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <VinScannerDialog
        open={vinScannerOpen}
        onOpenChange={setVinScannerOpen}
        onVinScanned={handleVinScanned}
        existingVin={activeLoad?.vehicleInfo.vin}
        mode={scanMode === "pickup" ? "bol" : "invoice"}
      />

      <PhotoCaptureDialog
        open={photoCaptureOpen}
        onOpenChange={setPhotoCaptureOpen}
        onPhotosConfirmed={handlePhotosConfirmed}
      />

      {activeLoad && (
        <EmailDocumentsDialog
          open={emailDialogOpen}
          onOpenChange={(open) => {
            setEmailDialogOpen(open);
            if (!open) {
              handleEmailSent();
            }
          }}
          shipperName={activeLoad.shipper.name}
          loadId={activeLoad.loadId}
          vehicleInfo={`${activeLoad.vehicleInfo.year} ${activeLoad.vehicleInfo.make} ${activeLoad.vehicleInfo.model}`}
          hasBol={!!getBolForLoad(activeLoad.id)}
          hasInvoice={!!getInvoiceForLoad(activeLoad.id)}
          hasPhotos={capturedPhotos.length > 0}
        />
      )}

      {/* Generating docs overlay */}
      {generatingDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-stone-600 font-medium">Generating documents...</p>
          </div>
        </div>
      )}
    </>
  );
};
