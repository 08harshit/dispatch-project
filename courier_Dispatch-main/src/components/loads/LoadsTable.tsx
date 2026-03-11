import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Eye, MapPin, ArrowRight, Car, FileText, FileCheck, ScanLine } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VinScannerDialog } from "./VinScannerDialog";
import { generateBOL, downloadBOL } from "@/utils/generateBOL";
import { toast } from "sonner";

export interface LoadDocument {
  type: "bol" | "invoice" | "vcr";
  url: string;
  name: string;
  // VCR-specific fields (from shipper)
  shipperName?: string;
  inspectionDate?: string;
  damageNotes?: string[];
}

export interface Load {
  id: string;
  loadId: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    vin: string;
    stc: string;
    condition?: {
      runs: boolean;
      starts: boolean;
      drivable: boolean;
      rolls: boolean;
    };
  };
  price: number;
  paymentMethod: string;
  pickup: {
    ampId: string;
    city: string;
    state: string;
    zipcode: string;
    type: "Auction" | "Dealer" | "Private";
  };
  delivery: {
    city: string;
    state: string;
    zipcode: string;
  };
  pickupCoords?: [number, number];
  deliveryCoords?: [number, number];
  pickupDate: string;
  deliveryDate: string;
  status: "pickup" | "late" | "done";
  shipper: {
    name: string;
    company: string;
    phone: string;
  };
  documents?: LoadDocument[];
}

interface LoadsTableProps {
  loads: Load[];
  onEdit: (load: Load) => void;
  onDelete: (loadId: string) => void;
  onView: (load: Load) => void;
}

const getTypeBadge = (type: string) => {
  const styles = {
    Auction: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Dealer: "bg-amber-100 text-amber-700 border border-amber-200",
    Private: "bg-stone-100 text-stone-600 border border-stone-200",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
      styles[type as keyof typeof styles]
    )}>
      {type}
    </span>
  );
};

const getPaymentBadge = (method: string) => {
  const styles = {
    COD: "bg-amber-500 text-white shadow-sm shadow-amber-200/30",
    COP: "bg-emerald-500 text-white shadow-sm shadow-emerald-200/30",
    Wire: "bg-teal-500 text-white shadow-sm shadow-teal-200/30",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
      styles[method as keyof typeof styles] || "bg-stone-100 text-stone-600"
    )}>
      {method}
    </span>
  );
};

export const LoadsTable = ({ loads, onEdit, onDelete, onView }: LoadsTableProps) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleScanClick = (load: Load) => {
    setSelectedLoad(load);
    setScannerOpen(true);
  };

  const handleVinScanned = (scannedVin: string) => {
    if (!selectedLoad) return;

    try {
      const { blob, fileName } = generateBOL(selectedLoad, scannedVin);
      downloadBOL(blob, fileName);
      
      toast.success("BOL Generated!", {
        description: `Bill of Lading saved as ${fileName}`,
      });
    } catch (error) {
      console.error("Error generating BOL:", error);
      toast.error("Failed to generate BOL", {
        description: "Please try again.",
      });
    }

    setSelectedLoad(null);
  };

  if (loads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Car className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-stone-700">No loads found</p>
            <p className="text-sm text-stone-400 mt-1">Try adjusting your filters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loads.map((load, index) => {
        // Alternate between amber and emerald for visual interest
        const accents = [
          { bg: 'from-amber-400 to-orange-400', light: 'bg-amber-50', text: 'text-amber-600', shadow: 'shadow-amber-200/20', border: 'hover:border-amber-200' },
          { bg: 'from-emerald-400 to-teal-400', light: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-200/20', border: 'hover:border-emerald-200' },
        ];
        const accent = accents[index % accents.length];

        return (
        <div 
          key={load.id}
          className={cn(
            "group bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden",
            accent.border, accent.shadow
          )}
        >
          {/* Decorative accent bar */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", accent.bg)} />
          
          {/* Decorative corner accent */}
          <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br opacity-5", accent.bg)} />
          
          <div className="flex items-center gap-6 pl-4">
            {/* Load ID & Vehicle */}
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300", accent.light)}>
                <Car className={cn("h-6 w-6", accent.text)} strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("font-bold text-sm", accent.text)}>{load.loadId}</span>
                  <div className={cn("h-2 w-2 rounded-full bg-gradient-to-r animate-pulse", accent.bg)} />
                </div>
                <p className="font-semibold text-stone-800 mt-0.5">
                  {load.vehicleInfo.year} {load.vehicleInfo.make}
                </p>
                <p className="text-stone-500 text-sm">{load.vehicleInfo.model}</p>
              </div>
            </div>

            {/* VIN/STC Info */}
            <div className="hidden xl:block min-w-[140px] p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
              <p className="text-[9px] text-amber-600 uppercase tracking-wider font-bold">VIN</p>
              <p className="text-xs font-mono text-stone-700 mt-0.5 truncate">{load.vehicleInfo.vin}</p>
              <p className="text-[9px] text-stone-400 mt-1.5">STC: <span className="text-stone-600 font-medium">{load.vehicleInfo.stc}</span></p>
            </div>

            {/* Price & Payment */}
            <div className="min-w-[110px] text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-stone-800 to-stone-600 bg-clip-text text-transparent">{formatCurrency(load.price)}</p>
              <div className="mt-2">
                {getPaymentBadge(load.paymentMethod)}
              </div>
            </div>

            {/* Route Visual */}
            <div className="flex-1 flex items-center gap-4 px-4 py-3 bg-stone-50/50 rounded-2xl border border-stone-100">
              {/* Pickup */}
              <div className="flex items-center gap-3 flex-1">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">{load.pickup.ampId}</p>
                  <p className="text-sm font-semibold text-stone-700 truncate">{load.pickup.city}, {load.pickup.state}</p>
                  <div className="mt-1">{getTypeBadge(load.pickup.type)}</div>
                </div>
              </div>

              {/* Animated Arrow */}
              <div className="flex items-center gap-1 px-3">
                <div className="h-0.5 w-6 bg-amber-200 rounded-full" />
                <div className="h-0.5 w-4 bg-amber-300 rounded-full animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 flex items-center justify-center shadow-sm">
                  <ArrowRight className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <div className="h-0.5 w-4 bg-emerald-300 rounded-full animate-pulse" />
                <div className="h-0.5 w-6 bg-emerald-200 rounded-full" />
              </div>

              {/* Delivery */}
              <div className="flex items-center gap-3 flex-1">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-700 truncate">{load.delivery.city}, {load.delivery.state}</p>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">{load.delivery.zipcode}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="hidden lg:flex items-center gap-3 min-w-[200px]">
              <div className="text-center p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-[8px] text-amber-600 uppercase tracking-wider font-bold">Pickup</p>
                <p className="text-sm font-semibold text-amber-700 mt-0.5">{load.pickupDate}</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[8px] text-emerald-600 uppercase tracking-wider font-bold">Delivery</p>
                <p className="text-sm font-semibold text-emerald-700 mt-0.5">{load.deliveryDate}</p>
              </div>
            </div>

            {/* Scan Column */}
            <div className="flex items-center justify-center min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleScanClick(load)}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 hover:from-violet-100 hover:to-purple-100 text-violet-600 hover:text-violet-700 transition-all group"
                title="Scan VIN & Generate BOL"
              >
                <ScanLine className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </Button>
            </div>

            {/* Docs Column */}
            <div className="hidden xl:flex items-center gap-2 min-w-[100px]">
              {load.documents && load.documents.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  {load.documents.some(d => d.type === "bol") && (
                    <a
                      href={load.documents.find(d => d.type === "bol")?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors group"
                      title="View Bill of Lading"
                    >
                      <FileCheck className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-[9px] font-bold text-teal-700 uppercase">BOL</span>
                    </a>
                  )}
                  {load.documents.some(d => d.type === "invoice") && (
                    <a
                      href={load.documents.find(d => d.type === "invoice")?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group"
                      title="View Invoice"
                    >
                      <FileText className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[9px] font-bold text-amber-700 uppercase">INV</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-100">
                  <FileText className="h-3.5 w-3.5 text-stone-300" />
                  <span className="text-[9px] font-medium text-stone-400">No docs</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(load)}
                className="h-10 w-10 rounded-xl hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition-all"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-2xl shadow-2xl border-stone-200/60 p-1.5">
                  <DropdownMenuItem 
                    onClick={() => onEdit(load)} 
                    className="cursor-pointer rounded-xl py-2.5 text-stone-600 hover:bg-stone-100"
                  >
                    <Edit className="mr-2 h-4 w-4 text-stone-400" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(load.id)}
                    className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-xl py-2.5"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        );
      })}
      <VinScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onVinScanned={handleVinScanned}
        existingVin={selectedLoad?.vehicleInfo.vin}
      />
    </div>
  );
};
