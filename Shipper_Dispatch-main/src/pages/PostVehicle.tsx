import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LocationSection from "@/components/post-vehicle/LocationSection";
import VehicleEntryCard from "@/components/post-vehicle/VehicleEntryCard";
import VehicleSelector from "@/components/post-vehicle/VehicleSelector";
import ShippingDetailsSection from "@/components/post-vehicle/ShippingDetailsSection";
import { VehicleEntry, LocationContact, PostVehicleFormData } from "@/types/vehicle";
import { Plus, Send, ArrowLeft, Truck, Package, MapPin, Navigation, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const createEmptyVehicle = (): VehicleEntry => ({
  id: crypto.randomUUID(),
  vin: "",
  year: "",
  make: "",
  model: "",
  type: "",
  color: "",
  condition: {
    runs: true,
    rolls: true,
    starts: true,
    damaged: false,
  },
  conditionNotes: "",
  conditionPhotos: [],
});

const createEmptyContact = (): LocationContact => ({
  name: "",
  phone: "",
  email: "",
});

const PostVehicle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<VehicleEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState<PostVehicleFormData>({
    pickupAddress: "",
    pickupLocationType: "",
    pickupContact: createEmptyContact(),
    pickupCoordinates: { latitude: null, longitude: null },
    deliveryAddress: "",
    deliveryLocationType: "",
    deliveryContact: createEmptyContact(),
    deliveryCoordinates: { latitude: null, longitude: null },
    vehicles: [],
    dateAvailable: undefined,
    etaDeliveryFrom: undefined,
    etaDeliveryTo: undefined,
    price: "",
    paymentType: "",
    notes: "",
  });

  // Update pickup contact
  const updatePickupContact = (field: keyof LocationContact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      pickupContact: { ...prev.pickupContact, [field]: value },
    }));
  };

  // Update delivery contact
  const updateDeliveryContact = (field: keyof LocationContact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      deliveryContact: { ...prev.deliveryContact, [field]: value },
    }));
  };

  // Remove vehicle
  const removeVehicle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
    }));
  };

  // Handle add new vehicle click
  const handleAddNewVehicle = () => {
    setNewVehicle(createEmptyVehicle());
    setShowNewVehicleForm(true);
  };

  // Update new vehicle
  const updateNewVehicle = (id: string, updates: Partial<VehicleEntry>) => {
    if (newVehicle) {
      setNewVehicle({ ...newVehicle, ...updates });
    }
  };

  // Save new vehicle
  const handleSaveNewVehicle = () => {
    if (newVehicle && newVehicle.vin && newVehicle.year && newVehicle.make && newVehicle.model) {
      setFormData((prev) => ({
        ...prev,
        vehicles: [...prev.vehicles, newVehicle],
      }));
      setNewVehicle(null);
      setShowNewVehicleForm(false);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in VIN, Year, Make, and Model.",
        variant: "destructive",
      });
    }
  };

  // Cancel new vehicle
  const handleCancelNewVehicle = () => {
    setNewVehicle(null);
    setShowNewVehicleForm(false);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in pickup and delivery addresses.",
        variant: "destructive",
      });
      return;
    }

    if (formData.vehicles.length === 0) {
      toast({
        title: "No Vehicles",
        description: "Please add at least one vehicle to ship.",
        variant: "destructive",
      });
      return;
    }

    // Success - in a real app, this would send to an API
    console.log("Form submitted:", formData);
    toast({
      title: "Vehicle Posted Successfully",
      description: "Your vehicle listing has been created.",
    });
    
    navigate("/shipping");
  };

  // Progress steps
  const steps = [
    { icon: MapPin, label: "Pickup", complete: !!formData.pickupAddress },
    { icon: Navigation, label: "Delivery", complete: !!formData.deliveryAddress },
    { icon: Truck, label: "Vehicles", complete: formData.vehicles.length > 0 },
    { icon: Package, label: "Details", complete: !!formData.price },
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Minimal Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 -ml-2 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          
          {/* Title Section */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-foreground/5 to-foreground/10 border border-border/50 flex items-center justify-center">
                <Send size={22} className="text-foreground/70" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border/50 flex items-center justify-center">
                <Plus size={12} className="text-muted-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Post Vehicle</h1>
              <p className="text-sm text-muted-foreground">Create a new shipping listing</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="relative">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.label} className="flex flex-col items-center relative z-10">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border",
                      step.complete 
                        ? "bg-foreground/10 border-foreground/20" 
                        : activeStep === index
                          ? "bg-muted border-border"
                          : "bg-muted/30 border-border/30"
                    )}
                  >
                    {step.complete ? (
                      <CheckCircle2 size={18} className="text-foreground/70" />
                    ) : (
                      <step.icon size={16} className={cn(
                        "transition-colors",
                        activeStep === index ? "text-foreground/70" : "text-muted-foreground/50"
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] mt-1.5 font-medium transition-colors",
                    step.complete || activeStep === index ? "text-foreground/70" : "text-muted-foreground/50"
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress Line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-px bg-border/50 -z-0" />
            <div 
              className="absolute top-5 left-[10%] h-px bg-foreground/20 transition-all duration-500 -z-0"
              style={{ width: `${(steps.filter(s => s.complete).length / steps.length) * 80}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Locations Container */}
          <div className="relative">
            {/* Pickup Location */}
            <div onFocus={() => setActiveStep(0)}>
              <LocationSection
                type="pickup"
                address={formData.pickupAddress}
                locationType={formData.pickupLocationType}
                contact={formData.pickupContact}
                onAddressChange={(value) =>
                  setFormData((prev) => ({ ...prev, pickupAddress: value }))
                }
                onLocationTypeChange={(value) =>
                  setFormData((prev) => ({ ...prev, pickupLocationType: value }))
                }
                onContactChange={updatePickupContact}
              />
            </div>

            {/* Route Visual */}
            <div className="flex justify-center py-4">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-gradient-to-b from-border to-muted-foreground/20" />
                <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center my-1">
                  <ArrowLeft size={12} className="text-muted-foreground rotate-[-90deg]" />
                </div>
                <div className="w-px h-4 bg-gradient-to-b from-muted-foreground/20 to-border" />
              </div>
            </div>

            {/* Delivery Location */}
            <div onFocus={() => setActiveStep(1)}>
              <LocationSection
                type="delivery"
                address={formData.deliveryAddress}
                locationType={formData.deliveryLocationType}
                contact={formData.deliveryContact}
                onAddressChange={(value) =>
                  setFormData((prev) => ({ ...prev, deliveryAddress: value }))
                }
                onLocationTypeChange={(value) =>
                  setFormData((prev) => ({ ...prev, deliveryLocationType: value }))
                }
                onContactChange={updateDeliveryContact}
              />
            </div>
          </div>

          {/* Vehicles Section */}
          <div className="space-y-4" onFocus={() => setActiveStep(2)}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                  <Truck size={14} className="text-foreground/60" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Vehicles</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {formData.vehicles.length > 0 
                      ? `${formData.vehicles.length} vehicle${formData.vehicles.length > 1 ? 's' : ''} selected` 
                      : "Select from inventory or add new"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Vehicle Selector or New Vehicle Form */}
            {showNewVehicleForm && newVehicle ? (
              <div className="space-y-3 animate-fade-in">
                <VehicleEntryCard
                  vehicle={newVehicle}
                  index={formData.vehicles.length}
                  onUpdate={updateNewVehicle}
                  onRemove={() => {}}
                  canRemove={false}
                />
                <div className="flex items-center justify-end gap-2 px-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelNewVehicle}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveNewVehicle}
                    className="gap-1.5"
                  >
                    <Plus size={14} />
                    Add Vehicle
                  </Button>
                </div>
              </div>
            ) : (
              <VehicleSelector
                selectedVehicles={formData.vehicles}
                onRemoveVehicle={removeVehicle}
                onAddNewVehicle={handleAddNewVehicle}
              />
            )}
          </div>

          {/* Shipping Details */}
          <div onFocus={() => setActiveStep(3)}>
            <ShippingDetailsSection
              dateAvailable={formData.dateAvailable}
              etaDeliveryFrom={formData.etaDeliveryFrom}
              etaDeliveryTo={formData.etaDeliveryTo}
              price={formData.price}
              paymentType={formData.paymentType}
              notes={formData.notes}
              onDateAvailableChange={(date) =>
                setFormData((prev) => ({ ...prev, dateAvailable: date }))
              }
              onEtaDeliveryFromChange={(date) =>
                setFormData((prev) => ({ ...prev, etaDeliveryFrom: date }))
              }
              onEtaDeliveryToChange={(date) =>
                setFormData((prev) => ({ ...prev, etaDeliveryTo: date }))
              }
              onPriceChange={(value) =>
                setFormData((prev) => ({ ...prev, price: value }))
              }
              onPaymentTypeChange={(value) =>
                setFormData((prev) => ({ ...prev, paymentType: value }))
              }
              onNotesChange={(value) =>
                setFormData((prev) => ({ ...prev, notes: value }))
              }
            />
          </div>

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-4 pb-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="lg"
              className="gap-2 px-8"
            >
              <Send size={16} />
              Post Vehicle
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default PostVehicle;
