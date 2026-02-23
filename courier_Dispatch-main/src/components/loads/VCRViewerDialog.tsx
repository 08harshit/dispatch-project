import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Load } from "./LoadsTable";
import { VCRDocument } from "@/hooks/useBolManager";
import { ClipboardCheck, Car, User, Calendar, AlertTriangle, X, Download } from "lucide-react";

interface VCRViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  load: Load | null;
  vcrDocument: VCRDocument | null;
}

export const VCRViewerDialog = ({ open, onOpenChange, load, vcrDocument }: VCRViewerDialogProps) => {
  if (!load || !vcrDocument) return null;

  const handleDownload = () => {
    const reportText = `
VEHICLE CONDITION REPORT
========================
Document: ${vcrDocument.name}
Inspector: ${vcrDocument.shipperName || load.shipper.name}
Date: ${vcrDocument.inspectionDate || "N/A"}

VEHICLE
-------
${load.vehicleInfo.year} ${load.vehicleInfo.make} ${load.vehicleInfo.model}
VIN: ${load.vehicleInfo.vin}

DAMAGE NOTES
------------
${vcrDocument.damageNotes?.length ? vcrDocument.damageNotes.join('\n') : 'No damage noted'}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vcrDocument.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border-stone-200">
        <DialogHeader className="pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-stone-800">Vehicle Condition Report</DialogTitle>
              <p className="text-xs text-stone-400 mt-0.5">From Shipper</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                <User className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Inspector</span>
              </div>
              <p className="text-sm font-medium text-stone-700">{vcrDocument.shipperName || load.shipper.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Date</span>
              </div>
              <p className="text-sm font-medium text-stone-700">{vcrDocument.inspectionDate || "N/A"}</p>
            </div>
          </div>

          {/* Vehicle */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-500 mb-1">
              <Car className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Vehicle</span>
            </div>
            <p className="text-sm font-medium text-stone-700">
              {load.vehicleInfo.year} {load.vehicleInfo.make} {load.vehicleInfo.model}
            </p>
            <p className="text-xs text-stone-500 font-mono mt-1">{load.vehicleInfo.vin}</p>
          </div>

          {/* Damage Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-stone-600">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Damage Notes</span>
            </div>
            {vcrDocument.damageNotes && vcrDocument.damageNotes.length > 0 ? (
              <div className="space-y-2">
                {vcrDocument.damageNotes.map((note, index) => (
                  <div key={index} className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-sm text-stone-700">
                    {note}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 italic">No damage noted</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            <X className="h-4 w-4 mr-1.5" />
            Close
          </Button>
          <Button 
            size="sm"
            onClick={handleDownload}
            className="rounded-lg bg-violet-500 hover:bg-violet-600 text-white"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
