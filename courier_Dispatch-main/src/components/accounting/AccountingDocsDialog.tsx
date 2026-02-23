import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, ClipboardCheck, Download, X, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountingRecord {
  id: string;
  listingId: string;
  cost: number;
  dispatched: "Dispatched" | "Pending" | "Canceled";
  payout: "Paid" | "Processing" | "Pending";
}

interface AccountingDocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AccountingRecord | null;
}

// Mock documents for demo
const getMockDocs = (listingId: string) => {
  const docs = [
    { type: "bol", name: `BOL-${listingId}`, icon: FileText, color: "bg-amber-50 text-amber-600 border-amber-200" },
    { type: "invoice", name: `INV-${listingId}`, icon: Receipt, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  ];
  
  // Add VCR for some records
  if (["SHP-001", "SHP-003", "SHP-005"].includes(listingId)) {
    docs.push({ type: "vcr", name: `VCR-${listingId}`, icon: ClipboardCheck, color: "bg-violet-50 text-violet-600 border-violet-200" });
  }
  
  return docs;
};

export const AccountingDocsDialog = ({ open, onOpenChange, record }: AccountingDocsDialogProps) => {
  if (!record) return null;

  const docs = getMockDocs(record.listingId);

  const handleDownload = (docName: string) => {
    // Mock download - in real app would download actual file
    const content = `Document: ${docName}\nListing: ${record.listingId}\nCost: $${record.cost}\nStatus: ${record.dispatched}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Documents</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{record.listingId}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <div
                key={doc.type}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-sm",
                  doc.color
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs opacity-70 capitalize">{doc.type === "bol" ? "Bill of Lading" : doc.type === "vcr" ? "Vehicle Condition Report" : "Invoice"}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-background/50"
                  onClick={() => handleDownload(doc.name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            <X className="h-4 w-4 mr-1.5" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
