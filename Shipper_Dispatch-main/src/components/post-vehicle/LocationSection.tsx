import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Map, Type, User, Phone, Mail, ChevronDown } from "lucide-react";
import { LocationContact } from "@/types/vehicle";
import AddressMapPicker from "./AddressMapPicker";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LocationSectionProps {
  type: "pickup" | "delivery";
  address: string;
  locationType: string;
  contact: LocationContact;
  onAddressChange: (value: string) => void;
  onLocationTypeChange: (value: string) => void;
  onContactChange: (field: keyof LocationContact, value: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

const locationTypes = [
  { value: "auction", label: "Auction" },
  { value: "dealer", label: "Dealer" },
  { value: "private", label: "Private" },
  { value: "other", label: "Other" },
];

const LocationSection = ({
  type,
  address,
  locationType,
  contact,
  onAddressChange,
  onLocationTypeChange,
  onContactChange,
  onCoordinatesChange,
}: LocationSectionProps) => {
  const isPickup = type === "pickup";
  const Icon = isPickup ? MapPin : Navigation;
  const [inputMode, setInputMode] = useState<"map" | "text">("map");
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center border transition-colors",
              isPickup 
                ? "bg-amber-500/10 border-amber-500/20" 
                : "bg-teal-500/10 border-teal-500/20"
            )}>
              <Icon size={16} className={isPickup ? "text-amber-600" : "text-teal-600"} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {isPickup ? "Pickup" : "Delivery"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isPickup ? "Origin location" : "Destination"}
              </p>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-lg">
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all",
                inputMode === "map" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setInputMode("map")}
            >
              <Map className="h-3 w-3" />
              Map
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all",
                inputMode === "text" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setInputMode("text")}
            >
              <Type className="h-3 w-3" />
              Text
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Address Input */}
        {inputMode === "map" ? (
          <AddressMapPicker
            address={address}
            onAddressChange={onAddressChange}
            onCoordinatesChange={onCoordinatesChange}
          />
        ) : (
          <div className="space-y-1.5">
            <Input
              placeholder="Enter full address..."
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              className="h-12 bg-muted/30 border-border/50 focus:bg-background"
            />
            <p className="text-[10px] text-muted-foreground px-1">
              Street, City, State ZIP
            </p>
          </div>
        )}

        {/* Location Type */}
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Type</Label>
          <Select value={locationType} onValueChange={onLocationTypeChange}>
            <SelectTrigger className="h-9 bg-muted/30 border-border/50 text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {locationTypes.map((lt) => (
                <SelectItem key={lt.value} value={lt.value}>
                  {lt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact Collapsible */}
        <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground/80">Contact Information</span>
                {(contact.name || contact.phone) && (
                  <span className="text-[10px] text-muted-foreground">
                    • {contact.name || contact.phone}
                  </span>
                )}
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                contactOpen && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <Label className="text-[10px] text-muted-foreground">Name</Label>
                  </div>
                  <Input
                    placeholder="Contact name"
                    value={contact.name}
                    onChange={(e) => onContactChange("name", e.target.value)}
                    className="h-9 text-sm bg-background/50 border-border/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <Label className="text-[10px] text-muted-foreground">Phone</Label>
                  </div>
                  <Input
                    placeholder="(555) 123-4567"
                    value={contact.phone}
                    onChange={(e) => onContactChange("phone", e.target.value)}
                    className="h-9 text-sm bg-background/50 border-border/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <Label className="text-[10px] text-muted-foreground">Email</Label>
                </div>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={contact.email}
                  onChange={(e) => onContactChange("email", e.target.value)}
                  className="h-9 text-sm bg-background/50 border-border/30"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default LocationSection;
