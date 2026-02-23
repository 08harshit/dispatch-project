import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Eye, MapPin, Calendar, Link2, UserCheck, History, Plane, ArrowRight, FileText, ScanBarcode, Navigation } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RouteMapModal from "@/components/shipping/RouteMapModalLive";
import VinScannerModal from "@/components/shipping/VinScannerModal";

export type LocationType = "auction" | "dealer" | "private";
export type PaymentMethod = "cod" | "ach" | "wire" | "check";

export interface Vehicle {
  id: string;
  listingId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  stockNumber: string;
  pickupLocation: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  pickupType: LocationType;
  deliveryLocation: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  deliveryType: LocationType;
  pickupDate: string;
  deliveryDate: string;
  deliveryDateMax?: string;
  status: "not_assigned" | "assigned" | "picked_up" | "delivered" | "canceled";
  isActive: boolean;
  cost: number;
  paymentMethod: PaymentMethod;
  documents?: string[];
  hasConditionReport?: boolean;
}

interface VehicleTableProps {
  vehicles: Vehicle[];
  conditionReports?: Record<string, unknown>;
  onView?: (vehicle: Vehicle) => void;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  onAssign?: (vehicle: Vehicle) => void;
  onChain?: (vehicle: Vehicle) => void;
  onHistory?: (vehicle: Vehicle) => void;
  onViewDocs?: (vehicle: Vehicle) => void;
  onStatusChange?: (vehicle: Vehicle, newStatus: Vehicle["status"]) => void;
  onToggleActive?: (vehicle: Vehicle, isActive: boolean) => void;
}

const StatusBadge = ({ 
  status, 
  onClick 
}: { 
  status: Vehicle["status"]; 
  onClick?: () => void;
}) => {
  const statusConfig = {
    not_assigned: { label: "Not Assigned", class: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
    assigned: { label: "Assigned", class: "bg-amber-50 text-amber-600 border-amber-200", dot: "bg-amber-400" },
    picked_up: { label: "Picked Up", class: "bg-blue-50 text-blue-600 border-blue-200", dot: "bg-blue-400" },
    delivered: { label: "Delivered", class: "bg-teal-50 text-teal-600 border-teal-200", dot: "bg-teal-400" },
    canceled: { label: "Canceled", class: "bg-red-50 text-red-500 border-red-200", dot: "bg-red-400" },
  };

  const config = statusConfig[status];

  return (
    <span 
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.class,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
};

const LocationTypeBadge = ({ type }: { type: LocationType }) => {
  const config = {
    auction: { 
      label: "Auction", 
      gradient: "from-purple-500 to-indigo-600",
      glow: "shadow-purple-500/30",
      bg: "bg-gradient-to-r from-purple-50 to-indigo-50",
      border: "border-purple-200/60",
      text: "text-purple-700"
    },
    dealer: { 
      label: "Dealer", 
      gradient: "from-blue-500 to-cyan-500",
      glow: "shadow-blue-500/30",
      bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
      border: "border-blue-200/60",
      text: "text-blue-700"
    },
    private: { 
      label: "Private", 
      gradient: "from-slate-500 to-stone-500",
      glow: "shadow-slate-500/20",
      bg: "bg-gradient-to-r from-slate-50 to-stone-50",
      border: "border-slate-200/60",
      text: "text-slate-700"
    },
  };

  const c = config[type];

  return (
    <span className={cn(
      "relative inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-md group overflow-hidden",
      c.bg, c.border, c.text
    )}>
      {/* Shimmer effect on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {/* Dot indicator */}
      <span className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-br", c.gradient, "shadow-sm", c.glow)} />
      {c.label}
    </span>
  );
};

const PaymentMethodBadge = ({ method }: { method: PaymentMethod }) => {
  const config = {
    cod: { label: "COD", gradient: "from-amber-400 to-amber-500", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
    ach: { label: "ACH", gradient: "from-blue-400 to-blue-500", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
    wire: { label: "Wire", gradient: "from-teal-400 to-teal-500", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-600" },
    check: { label: "Check", gradient: "from-slate-400 to-slate-500", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-500" },
  };

  const c = config[method];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-300 hover:scale-105",
      c.bg, c.border, c.text
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-br", c.gradient)} />
      {c.label}
    </span>
  );
};

// Compact animated location card component
const LocationCard = ({ 
  state, 
  city, 
  zip, 
  type, 
  variant,
  onClick
}: { 
  state: string; 
  city: string; 
  zip: string; 
  type: LocationType; 
  variant: 'pickup' | 'delivery';
  onClick?: () => void;
}) => {
  const isPickup = variant === 'pickup';
  
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className={cn(
        "relative p-2 rounded-lg border backdrop-blur-sm transition-all duration-300",
        "bg-gradient-to-br hover:shadow-md hover:-translate-y-0.5",
        isPickup 
          ? "from-primary/5 to-amber-50/30 border-primary/20 hover:border-primary/40"
          : "from-teal-50/50 to-cyan-50/20 border-teal-200/40 hover:border-teal-300/60"
      )}>
        {/* Location header */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className={cn(
            "flex items-center justify-center w-5 h-5 rounded-md transition-all duration-300 group-hover:scale-110",
            isPickup 
              ? "bg-gradient-to-br from-primary to-amber-400 shadow-sm shadow-primary/20" 
              : "bg-gradient-to-br from-teal-400 to-cyan-500 shadow-sm shadow-teal-400/20"
          )}>
            <MapPin size={10} className="text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">
            {state}
          </span>
        </div>

        {/* City & ZIP */}
        <p className="text-[11px] text-muted-foreground pl-6.5 mb-1.5" style={{ paddingLeft: '1.625rem' }}>
          {city}, {zip}
        </p>

        {/* Location type badge */}
        <div style={{ paddingLeft: '1.625rem' }}>
          <LocationTypeBadge type={type} />
        </div>
        
        {/* Click hint on hover */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin size={10} className="text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact animated date card component
const DateCard = ({ 
  date, 
  maxDate, 
  variant 
}: { 
  date: string; 
  maxDate?: string; 
  variant: 'pickup' | 'delivery' 
}) => {
  const isPickup = variant === 'pickup';
  
  return (
    <div className="group relative">
      <div className={cn(
        "relative flex items-center gap-2 p-2 rounded-lg border backdrop-blur-sm transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        isPickup 
          ? "bg-gradient-to-br from-slate-50 to-zinc-50/30 border-slate-200/50 hover:border-slate-300/70"
          : "bg-gradient-to-br from-indigo-50/50 to-violet-50/20 border-indigo-200/40 hover:border-indigo-300/60"
      )}>
        {/* Calendar icon */}
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 group-hover:scale-105",
          isPickup 
            ? "bg-gradient-to-br from-slate-600 to-slate-700 shadow-sm" 
            : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm"
        )}>
          <Calendar size={12} className="text-white" />
        </div>

        {/* Date display */}
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-semibold",
            isPickup ? "text-slate-700" : "text-indigo-700"
          )}>
            {date}
          </span>
          
          {maxDate && (
            <span className="text-[10px] text-muted-foreground/70">
              Max: {maxDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Clean route connector between locations
const RouteConnector = () => {
  return (
    <div className="relative flex items-center justify-center w-14 h-full py-4">
      <div className="relative w-full flex items-center">
        {/* Elegant gradient line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300" />
        
        {/* Center arrow icon - refined */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm flex items-center justify-center z-10">
          <ArrowRight size={10} className="text-slate-500" />
        </div>
        
        {/* Start dot - muted primary */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400 z-10" />
        
        {/* End dot - light teal */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400 z-10" />
      </div>
    </div>
  );
};
const VehicleTable = ({ vehicles, conditionReports = {}, onView, onEdit, onDelete, onAssign, onChain, onHistory, onViewDocs, onStatusChange, onToggleActive }: VehicleTableProps) => {
  const [routeMapOpen, setRouteMapOpen] = useState(false);
  const [selectedVehicleForRoute, setSelectedVehicleForRoute] = useState<Vehicle | null>(null);
  
  // VIN Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedVehicleForScan, setSelectedVehicleForScan] = useState<Vehicle | null>(null);

  const handleLocationClick = (vehicle: Vehicle) => {
    setSelectedVehicleForRoute(vehicle);
    setRouteMapOpen(true);
  };
  
  const handleScanClick = (vehicle: Vehicle) => {
    setSelectedVehicleForScan(vehicle);
    setScannerOpen(true);
  };
  
  const handleScanSuccess = () => {
    if (selectedVehicleForScan) {
      onStatusChange?.(selectedVehicleForScan, "delivered");
    }
  };

  if (vehicles.length === 0) return null;
  
  return (
    <>
    <div className="dashboard-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-gradient-to-r from-muted/50 to-muted/30">
              <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                Active
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Listing ID#
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Vehicle Info
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pickup Location
              </th>
              <th className="text-center py-3.5 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                <span className="sr-only">Route</span>
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Delivery Location
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pickup Date
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Delivery Date
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="text-center py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Track
              </th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cost
              </th>
              <th className="text-center py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Docs
              </th>
              <th className="text-center py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                History
              </th>
              <th className="text-right py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {vehicles.map((vehicle, index) => (
              <tr
                key={vehicle.id}
                className="group hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
              {/* Active Toggle */}
                <td className="py-4 px-3 text-center">
                  <button
                    onClick={() => onToggleActive?.(vehicle, !vehicle.isActive)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                      vehicle.isActive ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                        vehicle.isActive ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </td>

              {/* Listing ID */}
                <td className="py-4 px-4">
                  <div className="group relative">
                    <div className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300",
                      "bg-orange-50/50 border-orange-200/40 hover:border-orange-300/60 hover:shadow-sm"
                    )}>
                      {/* Icon badge */}
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[hsl(35,90%,55%)] transition-all duration-300 group-hover:scale-105">
                        <span className="text-[10px] font-black text-white">#</span>
                      </div>
                      
                      {/* ID text */}
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {vehicle.listingId}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Vehicle Info */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-sm">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground font-mono">
                        VIN: {vehicle.vin}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        STK#: {vehicle.stockNumber}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Pickup Location */}
                <td className="py-4 px-4">
                  <LocationCard
                    state={vehicle.pickupState}
                    city={vehicle.pickupCity}
                    zip={vehicle.pickupZip}
                    type={vehicle.pickupType}
                    variant="pickup"
                    onClick={() => handleLocationClick(vehicle)}
                  />
                </td>

                {/* Route Connector */}
                <td className="py-4 px-1">
                  <RouteConnector />
                </td>

                {/* Delivery Location */}
                <td className="py-4 px-4">
                  <LocationCard
                    state={vehicle.deliveryState}
                    city={vehicle.deliveryCity}
                    zip={vehicle.deliveryZip}
                    type={vehicle.deliveryType}
                    variant="delivery"
                    onClick={() => handleLocationClick(vehicle)}
                  />
                </td>

                {/* Pickup Date */}
                <td className="py-4 px-4">
                  <DateCard
                    date={vehicle.pickupDate}
                    variant="pickup"
                  />
                </td>

                {/* Delivery Date */}
                <td className="py-4 px-4">
                  <DateCard
                    date={vehicle.deliveryDate}
                    maxDate={vehicle.deliveryDateMax}
                    variant="delivery"
                  />
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div>
                        <StatusBadge status={vehicle.status} onClick={() => {}} />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuItem 
                        onClick={() => onStatusChange?.(vehicle, "not_assigned")}
                        className={cn(vehicle.status === "not_assigned" && "bg-slate-50")}
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
                        Not Assigned
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => vehicle.isActive && onStatusChange?.(vehicle, "assigned")}
                        className={cn(
                          vehicle.status === "assigned" && "bg-amber-50",
                          !vehicle.isActive && "opacity-40 cursor-not-allowed"
                        )}
                        disabled={!vehicle.isActive}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                        Assigned
                        {!vehicle.isActive && <span className="text-[10px] text-muted-foreground ml-auto">(activate first)</span>}
                      </DropdownMenuItem>
                      {vehicle.status === "assigned" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onStatusChange?.(vehicle, "not_assigned")}
                            className="text-destructive focus:text-destructive"
                          >
                            <span className="w-2 h-2 rounded-full bg-destructive mr-2" />
                            Cancel Assignment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onStatusChange?.(vehicle, "picked_up")}
                        className={cn(vehicle.status === "picked_up" && "bg-blue-50")}
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                        Picked Up
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleScanClick(vehicle)}
                        className={cn(vehicle.status === "delivered" && "bg-teal-50")}
                      >
                        <ScanBarcode size={12} className="mr-2 text-teal-500" />
                        Delivered (Scan VIN)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onStatusChange?.(vehicle, "canceled")}
                        className={cn(vehicle.status === "canceled" && "bg-red-50")}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400 mr-2" />
                        Canceled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>

                {/* Track - Map icon for picked_up/delivered */}
                <td className="py-4 px-4 text-center">
                  {(vehicle.status === "picked_up" || vehicle.status === "delivered") ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-primary/10 hover:bg-primary/20 hover:scale-105 transition-all"
                      onClick={() => handleLocationClick(vehicle)}
                      title="Track vehicle live location"
                    >
                      <Navigation size={16} className="text-primary" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>

                {/* Cost */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <span className="text-base font-bold text-foreground">
                      ${vehicle.cost.toLocaleString()}
                    </span>
                    <div>
                      <PaymentMethodBadge method={vehicle.paymentMethod} />
                    </div>
                  </div>
                </td>

                {/* Docs / Condition Report */}
                <td className="py-4 px-4 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-xl relative transition-all",
                      vehicle.hasConditionReport || conditionReports[vehicle.id]
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "hover:bg-blue-500/10"
                    )}
                    onClick={() => onViewDocs?.(vehicle)}
                  >
                    <FileText 
                      size={16} 
                      className={cn(
                        vehicle.hasConditionReport || conditionReports[vehicle.id]
                          ? "text-emerald-600"
                          : "text-blue-600"
                      )} 
                    />
                    {(vehicle.hasConditionReport || conditionReports[vehicle.id]) && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </Button>
                </td>

                {/* History */}
                <td className="py-4 px-4 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-primary/10"
                    onClick={() => onHistory?.(vehicle)}
                  >
                    <History size={16} className="text-primary" />
                  </Button>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-muted rounded-xl transition-all duration-200 hover:shadow-sm">
                        <MoreHorizontal size={16} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
                      <DropdownMenuItem onClick={() => onView?.(vehicle)} className="rounded-lg gap-2">
                        <Eye size={14} />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAssign?.(vehicle)} className="rounded-lg gap-2">
                        <UserCheck size={14} />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(vehicle)} className="rounded-lg gap-2">
                        <Edit size={14} />
                        Modify
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(vehicle)}
                        className="rounded-lg gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    
    {/* Route Map Modal */}
    {selectedVehicleForRoute && (
      <RouteMapModal
        open={routeMapOpen}
        onOpenChange={setRouteMapOpen}
        pickupLocation={selectedVehicleForRoute.pickupLocation}
        pickupCity={selectedVehicleForRoute.pickupCity}
        pickupState={selectedVehicleForRoute.pickupState}
        deliveryLocation={selectedVehicleForRoute.deliveryLocation}
        deliveryCity={selectedVehicleForRoute.deliveryCity}
        deliveryState={selectedVehicleForRoute.deliveryState}
      />
    )}
    
    {/* VIN Scanner Modal */}
    {selectedVehicleForScan && (
      <VinScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        expectedVin={selectedVehicleForScan.vin}
        vehicleInfo={`${selectedVehicleForScan.year} ${selectedVehicleForScan.make} ${selectedVehicleForScan.model}`}
        onScanSuccess={handleScanSuccess}
      />
    )}
    </>
  );
};

export default VehicleTable;
