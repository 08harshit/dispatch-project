import { useState } from "react";
import { MapPin, ArrowRight, Car, Phone, MessageCircle, ScanLine, Receipt, FileCheck, Eye, Pencil, Trash2, X, ClipboardCheck, MoreHorizontal, Bookmark, Clock } from "lucide-react";
import { ConditionIcons, type VehicleCondition } from "./ConditionIcons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Load, LoadDocument } from "./LoadsTable";
import { ShipperChatDialog } from "./ShipperChatDialog";
import { VinScannerDialog } from "./VinScannerDialog";
import { BOLViewerDialog } from "./BOLViewerDialog";
import { InvoiceViewerDialog } from "./InvoiceViewerDialog";
import { VCRViewerDialog } from "./VCRViewerDialog";
import { useBolManager, BOLDocument, InvoiceDocument, VCRDocument } from "@/hooks/useBolManager";
import { generateInvoice } from "@/utils/generateInvoice";
import { toast } from "sonner";
import { differenceInDays, parse } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AssignedLoadsTableProps {
  loads: Load[];
  onEdit: (load: Load) => void;
  onDelete: (loadId: string) => void;
  onView: (load: Load) => void;
  onCancel?: (loadId: string) => void;
  onUpdateDocuments?: (loadId: string, documents: LoadDocument[]) => void;
  onAddDemoLoads?: () => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pickup: "bg-amber-100 text-amber-700 border border-amber-200",
    late: "bg-rose-100 text-rose-700 border border-rose-200",
    done: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  const labels: Record<string, string> = {
    pickup: "To Be Picked Up",
    late: "Late",
    done: "Done",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
      styles[status] || styles.pickup
    )}>
      {labels[status] || status}
    </span>
  );
};

const getPaymentBadge = (method: string) => {
  const styles: Record<string, string> = {
    COD: "bg-amber-500 text-white",
    COP: "bg-emerald-500 text-white",
    Wire: "bg-teal-500 text-white",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
      styles[method] || "bg-stone-100 text-stone-600"
    )}>
      {method}
    </span>
  );
};

export const AssignedLoadsTable = ({
  loads,
  onEdit,
  onDelete,
  onView,
  onCancel,
  onUpdateDocuments,
  onAddDemoLoads,
  isBookmarked,
  onToggleBookmark,
}: AssignedLoadsTableProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLoad, setScanLoad] = useState<Load | null>(null);
  const [bolViewerOpen, setBolViewerOpen] = useState(false);
  const [bolViewerLoad, setBolViewerLoad] = useState<Load | null>(null);
  const [bolViewerVin, setBolViewerVin] = useState("");
  const [invoiceViewerOpen, setInvoiceViewerOpen] = useState(false);
  const [invoiceViewerLoad, setInvoiceViewerLoad] = useState<Load | null>(null);
  const [invoiceViewerUrl, setInvoiceViewerUrl] = useState("");
  const [vcrViewerOpen, setVcrViewerOpen] = useState(false);
  const [vcrViewerLoad, setVcrViewerLoad] = useState<Load | null>(null);
  const [vcrViewerDoc, setVcrViewerDoc] = useState<VCRDocument | null>(null);

  const { addBol, deleteBol, getDocsForLoad, addInvoice, deleteInvoice } = useBolManager();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenChat = (load: Load) => {
    setSelectedLoad(load);
    setChatOpen(true);
  };

  const handleScanClick = (load: Load) => {
    setScanLoad(load);
    setScannerOpen(true);
  };

  const getLoadDocuments = (load: Load): (BOLDocument | InvoiceDocument | VCRDocument)[] => {
    const localDocs = getDocsForLoad(load.id);
    const vcrFromShipper = load.documents?.find((d) => d.type === "vcr");
    if (vcrFromShipper && !localDocs.find((d) => d.type === "vcr")) {
      return [...localDocs, vcrFromShipper as VCRDocument];
    }
    return localDocs;
  };

  const handleOpenVcrViewer = (load: Load, doc: VCRDocument) => {
    setVcrViewerLoad(load);
    setVcrViewerDoc(doc);
    setVcrViewerOpen(true);
  };

  const handleGenerateInvoice = (load: Load) => {
    try {
      const invoiceUrl = generateInvoice(load);
      addInvoice(load.id, load.loadId, invoiceUrl);
      toast.success("Invoice Generated!", { description: "Click on INV badge to view." });
    } catch {
      toast.error("Failed to generate invoice");
    }
  };

  const handleDeleteInvoice = (load: Load) => {
    deleteInvoice(load.id);
    toast.success("Invoice Deleted");
  };

  const handleOpenInvoiceViewer = (load: Load, invoiceUrl: string) => {
    setInvoiceViewerLoad(load);
    setInvoiceViewerUrl(invoiceUrl);
    setInvoiceViewerOpen(true);
  };

  const handleVinScanned = (scannedVin: string) => {
    if (!scanLoad) return;
    try {
      addBol(scanLoad.id, scannedVin, scanLoad.loadId);
      if (onUpdateDocuments) {
        onUpdateDocuments(scanLoad.id, getDocsForLoad(scanLoad.id));
      }
      toast.success("BOL Generated!", { description: "Click on BOL badge to view." });
    } catch {
      toast.error("Failed to generate BOL");
    }
    setScanLoad(null);
  };

  const handleOpenBolViewer = (load: Load, doc: BOLDocument) => {
    setBolViewerLoad(load);
    setBolViewerVin(doc.scannedVin || load.vehicleInfo.vin);
    setBolViewerOpen(true);
  };

  const handleDeleteBol = (load: Load) => {
    deleteBol(load.id);
    if (onUpdateDocuments) onUpdateDocuments(load.id, []);
    toast.success("BOL Deleted");
  };

  const handleModifyBol = (load: Load) => {
    setScanLoad(load);
    setScannerOpen(true);
  };

  if (loads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Car className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-stone-700">No assigned loads</p>
            <p className="text-sm text-stone-400 mt-1">Accept loads from the Available tab to see them here</p>
          </div>
          {onAddDemoLoads && (
            <Button variant="outline" onClick={onAddDemoLoads} className="mt-2 rounded-xl">
              Add demo assigned loads
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100 pb-2">
        <div className="min-w-[1100px] space-y-4">
          {loads.map((load, index) => {
            const accents = [
              { bg: "from-amber-400 to-orange-400", light: "bg-amber-50", text: "text-amber-600", shadow: "shadow-amber-200/20", border: "hover:border-amber-200" },
              { bg: "from-emerald-400 to-teal-400", light: "bg-emerald-50", text: "text-emerald-600", shadow: "shadow-emerald-200/20", border: "hover:border-emerald-200" },
            ];
            const accent = accents[index % accents.length];
            const docs = getLoadDocuments(load);
            const bolDoc = docs.find((d) => d.type === "bol") as BOLDocument | undefined;
            const invoiceDoc = docs.find((d) => d.type === "invoice") as InvoiceDocument | undefined;
            const vcrDoc = docs.find((d) => d.type === "vcr") as VCRDocument | undefined;

            return (
              <div
                key={load.id}
                className={cn(
                  "group bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden",
                  accent.border,
                  accent.shadow
                )}
              >
                {/* Decorative accent bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", accent.bg)} />
                {/* Decorative corner accent */}
                <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br opacity-5", accent.bg)} />

                <div className="flex flex-col gap-4 pl-4">
                  {/* Top Row: Load ID, Vehicle, Route, Price */}
                  <div className="flex items-start gap-6">
                    {/* Load ID & Vehicle */}
                    <div className="flex items-center gap-4 min-w-[200px]">
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
                        {/* Days Listed Badge */}
                        {(() => {
                          const daysListed = differenceInDays(new Date(), parse(load.pickupDate, "MM-dd-yyyy", new Date()));
                          return (
                            <span className={cn(
                              "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                              daysListed >= 3 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-stone-50 text-stone-500 border border-stone-100"
                            )}>
                              <Clock className="h-3 w-3" />
                              {daysListed <= 0 ? "Today" : `${daysListed}d ago`}
                            </span>
                          );
                        })()}
                        {/* Condition Icons */}
                        {(load.vehicleInfo as any).condition && (
                          <div className="mt-1">
                            <ConditionIcons condition={(load.vehicleInfo as any).condition as VehicleCondition} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="min-w-[100px]">
                      {getStatusBadge(load.status)}
                      <div className="mt-2">{getPaymentBadge(load.paymentMethod)}</div>
                    </div>

                    {/* Pickup/Delivery Route */}
                    <div className="flex-1 flex items-center gap-4 px-4 py-3 bg-stone-50/50 rounded-2xl border border-stone-100">
                      {/* Pickup */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Pickup</p>
                          <p className="text-sm font-semibold text-stone-700 truncate">
                            {load.pickup.city}, {load.pickup.state}
                          </p>
                          <p className="text-xs text-stone-400">{load.pickupDate}</p>
                        </div>
                      </div>

                      {/* Animated Arrow */}
                      <div className="flex items-center gap-1 px-2">
                        <div className="h-0.5 w-4 bg-amber-200 rounded-full" />
                        <div className="h-7 w-7 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 flex items-center justify-center shadow-sm">
                          <ArrowRight className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                        </div>
                        <div className="h-0.5 w-4 bg-emerald-200 rounded-full" />
                      </div>

                      {/* Delivery */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Delivery</p>
                          <p className="text-sm font-semibold text-stone-700 truncate">
                            {load.delivery.city}, {load.delivery.state}
                          </p>
                          <p className="text-xs text-stone-400">{load.deliveryDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="min-w-[120px] text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[9px] text-emerald-600 uppercase tracking-wider font-bold mb-1">Price</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(load.price)}</p>
                    </div>
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    {/* Bookmark + Contact */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleBookmark(load.id)}
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-[1.2rem_1.8rem_1.2rem_1.8rem] transition-all duration-500 group/bm overflow-hidden border-2",
                          isBookmarked(load.id)
                            ? "bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 border-amber-300 shadow-lg shadow-amber-300/50 scale-[1.03]"
                            : "bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 border-amber-200 shadow-sm hover:from-amber-200 hover:via-orange-200 hover:to-rose-200 hover:shadow-md hover:shadow-amber-200/40 hover:scale-[1.03]"
                        )}
                      >
                        {isBookmarked(load.id) && (
                          <>
                            <div className="absolute -inset-1 rounded-[1.4rem_2rem_1.4rem_2rem] bg-gradient-to-br from-amber-300 to-orange-400 animate-[glow-pulse_2s_ease-in-out_infinite] opacity-50 blur-md" />
                            <div className="absolute inset-0 rounded-[1.2rem_1.8rem_1.2rem_1.8rem] overflow-hidden">
                              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2.5s_infinite] skew-x-12" />
                            </div>
                          </>
                        )}
                        <Bookmark className={cn(
                          "h-[18px] w-[18px] relative z-10 transition-all duration-300",
                          isBookmarked(load.id) 
                            ? "fill-white text-white drop-shadow-md" 
                            : "text-amber-500 group-hover/bm:scale-110 group-hover/bm:rotate-[-8deg]"
                        )} strokeWidth={isBookmarked(load.id) ? 0 : 1.5} />
                        <span className={cn(
                          "relative z-10 text-[10px] font-bold uppercase tracking-wider",
                          isBookmarked(load.id) ? "text-white" : "text-amber-600"
                        )}>
                          {isBookmarked(load.id) ? "Saved" : "Save"}
                        </span>
                      </button>
                      <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold mr-2">Contact</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => load.shipper.phone && window.open(`tel:${load.shipper.phone}`, "_self")}
                        disabled={!load.shipper.phone}
                        className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 disabled:opacity-50"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenChat(load)}
                        className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Documents */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold mr-2">Docs</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleScanClick(load)}
                        className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 hover:text-teal-700 border border-teal-100"
                        title="Scan VIN & Generate BOL"
                      >
                        <ScanLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateInvoice(load)}
                        className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 border border-amber-100"
                        title="Generate Invoice"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      {bolDoc && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 text-xs font-medium hover:bg-teal-100 transition-colors cursor-pointer">
                              <FileCheck className="h-3.5 w-3.5" />
                              BOL
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-xl border-stone-200/60 p-1">
                            <DropdownMenuItem onClick={() => handleOpenBolViewer(load, bolDoc)} className="cursor-pointer rounded-lg py-2">
                              <Eye className="mr-2 h-3.5 w-3.5 text-stone-400" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleModifyBol(load)} className="cursor-pointer rounded-lg py-2">
                              <Pencil className="mr-2 h-3.5 w-3.5 text-stone-400" />
                              Modify
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteBol(load)} className="cursor-pointer rounded-lg py-2 text-rose-600">
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {invoiceDoc && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer">
                              <Receipt className="h-3.5 w-3.5" />
                              INV
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-xl border-stone-200/60 p-1">
                            <DropdownMenuItem onClick={() => handleOpenInvoiceViewer(load, invoiceDoc.url)} className="cursor-pointer rounded-lg py-2">
                              <Eye className="mr-2 h-3.5 w-3.5 text-stone-400" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteInvoice(load)} className="cursor-pointer rounded-lg py-2 text-rose-600">
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {vcrDoc && (
                        <button
                          onClick={() => handleOpenVcrViewer(load, vcrDoc)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          VCR
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {load.status === "pickup" && onCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancel(load.id)}
                          className="h-9 px-4 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Cancel
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-xl border-stone-200/60 p-1">
                          <DropdownMenuItem onClick={() => onView(load)} className="cursor-pointer rounded-lg py-2">
                            <Eye className="mr-2 h-3.5 w-3.5 text-stone-400" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(load)} className="cursor-pointer rounded-lg py-2">
                            <Pencil className="mr-2 h-3.5 w-3.5 text-stone-400" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(load.id)} className="cursor-pointer rounded-lg py-2 text-rose-600">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialogs */}
      {selectedLoad && (
        <ShipperChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          shipper={selectedLoad.shipper}
          loadId={selectedLoad.loadId}
        />
      )}
      <VinScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onVinScanned={handleVinScanned} />
      {bolViewerLoad && (
        <BOLViewerDialog
          open={bolViewerOpen}
          onOpenChange={setBolViewerOpen}
          load={bolViewerLoad}
          scannedVin={bolViewerVin}
        />
      )}
      {invoiceViewerLoad && (
        <InvoiceViewerDialog
          open={invoiceViewerOpen}
          onOpenChange={setInvoiceViewerOpen}
          load={invoiceViewerLoad}
          invoiceUrl={invoiceViewerUrl}
        />
      )}
      {vcrViewerLoad && vcrViewerDoc && (
        <VCRViewerDialog
          open={vcrViewerOpen}
          onOpenChange={setVcrViewerOpen}
          load={vcrViewerLoad}
          vcrDocument={vcrViewerDoc}
        />
      )}
    </>
  );
};
