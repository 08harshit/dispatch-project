import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Receipt, Printer, ArrowRight, Share2 } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Load } from "./LoadsTable";
import { EmailDocumentsDialog } from "./EmailDocumentsDialog";

interface InvoiceViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  load: Load | null;
  invoiceUrl: string;
}

export const InvoiceViewerDialog = ({ open, onOpenChange, load, invoiceUrl }: InvoiceViewerDialogProps) => {
  const [shareOpen, setShareOpen] = useState(false);
  if (!load) return null;

  const invoiceNumber = `INV-${load.loadId.replace("LD-", "")}-${Date.now().toString().slice(-6)}`;
  const issueDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const handleDownload = () => {
    if (invoiceUrl) {
      const link = document.createElement("a");
      link.href = invoiceUrl;
      link.download = `Invoice-${load.loadId}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 rounded-2xl overflow-hidden border-0 shadow-2xl bg-white flex flex-col" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Invoice for {load.loadId}</DialogTitle>
          <DialogDescription>Invoice viewer for load {load.loadId}</DialogDescription>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border-b border-amber-200/50 flex-shrink-0">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/20 blur-2xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-sm">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-800">Invoice</h2>
                <p className="text-xs text-stone-500">
                  {load.loadId} • {load.vehicleInfo.year} {load.vehicleInfo.make} {load.vehicleInfo.model}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShareOpen(true)}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 shadow-sm"
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 shadow-sm"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download PDF
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

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0">
          {/* Company Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">AutoHaul</h1>
              <p className="text-sm text-stone-500">Premium Vehicle Transport</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-500">INVOICE</p>
              <p className="text-sm text-stone-500">{invoiceNumber}</p>
            </div>
          </div>

          {/* Info Boxes */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-600">INVOICE NO.</p>
              <p className="text-sm font-semibold text-stone-800 truncate">{invoiceNumber.slice(0, 14)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-600">ISSUE DATE</p>
              <p className="text-sm font-semibold text-stone-800">{issueDate}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-600">DUE DATE</p>
              <p className="text-sm font-semibold text-stone-800">{dueDate}</p>
            </div>
            <div className="bg-emerald-500 rounded-xl p-3">
              <p className="text-xs font-bold text-white">TOTAL DUE</p>
              <p className="text-sm font-bold text-white">${load.price.toLocaleString()}</p>
            </div>
          </div>

          {/* Bill To & Load Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-emerald-600 mb-1">BILL TO</p>
              <p className="font-semibold text-stone-800">{load.shipper.name}</p>
              {load.shipper.company && <p className="text-sm text-stone-500">{load.shipper.company}</p>}
              <p className="text-sm text-stone-500">{load.shipper.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-600 mb-1">LOAD DETAILS</p>
              <p className="text-sm text-stone-500">Load ID: <span className="font-semibold text-stone-800">{load.loadId}</span></p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-600 mb-2">VEHICLE INFORMATION</p>
            <p className="font-semibold text-stone-800">{load.vehicleInfo.year} {load.vehicleInfo.make} {load.vehicleInfo.model}</p>
            <p className="text-sm text-stone-500">VIN: {load.vehicleInfo.vin}</p>
            <p className="text-sm text-stone-500">STC: {load.vehicleInfo.stc}</p>
          </div>

          {/* Route */}
          <div>
            <p className="text-xs font-bold text-amber-600 mb-2">TRANSPORT ROUTE</p>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-600">PICKUP</p>
                <p className="font-semibold text-stone-800">{load.pickup.city}, {load.pickup.state}</p>
                <p className="text-xs text-stone-500">{load.pickupDate}</p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs font-bold text-emerald-600">DELIVERY</p>
                <p className="font-semibold text-stone-800">{load.delivery.city}, {load.delivery.state}</p>
                <p className="text-xs text-stone-500">{load.deliveryDate}</p>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div>
            <p className="text-xs font-bold text-emerald-600 mb-2">SERVICES</p>
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 grid grid-cols-4">
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Unit Price</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="bg-stone-50 px-4 py-3 grid grid-cols-4 text-sm">
                <span className="text-stone-800">Vehicle Transport Service</span>
                <span className="text-center text-stone-600">1</span>
                <span className="text-center text-stone-600">${load.price.toLocaleString()}.00</span>
                <span className="text-right font-semibold text-stone-800">${load.price.toLocaleString()}.00</span>
              </div>
              <div className="px-4 py-2 text-xs text-stone-500 italic border-t border-stone-100">
                {load.pickup.city}, {load.pickup.state} → {load.delivery.city}, {load.delivery.state}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-48 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal:</span>
                <span className="text-stone-800">${load.price.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Tax (0%):</span>
                <span className="text-stone-800">$0.00</span>
              </div>
              <div className="flex justify-between bg-emerald-500 text-white rounded-lg px-3 py-2 font-bold">
                <span>TOTAL DUE:</span>
                <span>${load.price.toLocaleString()}.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-stone-500">
              <span>Total: <span className="font-bold text-stone-700">${load.price.toLocaleString()}</span></span>
              <span>•</span>
              <span>Payment: <span className="font-medium text-stone-600">{load.paymentMethod}</span></span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-stone-500 hover:text-stone-700"
            >
              Close
            </Button>
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
        hasBol={false}
        hasInvoice={true}
        hasVcr={false}
      />
    </Dialog>
  );
};
