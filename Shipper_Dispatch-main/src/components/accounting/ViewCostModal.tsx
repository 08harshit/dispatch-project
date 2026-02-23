import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Receipt, DollarSign, Car, CreditCard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountingRecord {
  id: string;
  listingId: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  cost: number;
  paymentMethod: "cod" | "ach" | "wire" | "check";
  payoutStatus: "paid" | "pending" | "processing";
  hasDocs: boolean;
}

interface ViewCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AccountingRecord | null;
}

const StatusBadge = ({ status, type }: { status: string; type: "payment" | "payout" }) => {
  const getColors = () => {
    if (type === "payment") {
      switch (status) {
        case "cod": return "from-amber-500 to-orange-500 text-white";
        case "ach": return "from-blue-500 to-indigo-500 text-white";
        case "wire": return "from-purple-500 to-violet-500 text-white";
        case "check": return "from-slate-500 to-gray-500 text-white";
        default: return "from-muted to-muted text-muted-foreground";
      }
    } else {
      switch (status) {
        case "paid": return "from-teal-500 to-cyan-500 text-white";
        case "processing": return "from-blue-500 to-indigo-500 text-white";
        case "pending": return "from-amber-500 to-orange-500 text-white";
        default: return "from-muted to-muted text-muted-foreground";
      }
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold",
      "bg-gradient-to-r uppercase",
      getColors()
    )}>
      {status}
    </span>
  );
};

const InfoCard = ({ icon: Icon, label, value, className }: { 
  icon: React.ElementType; 
  label: string; 
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={cn(
    "flex items-center gap-4 p-4 rounded-2xl",
    "bg-gradient-to-br from-card to-muted/30",
    "border border-border/50",
    className
  )}>
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
      <Icon size={20} className="text-primary" />
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  </div>
);

const ViewCostModal = ({ open, onOpenChange, record }: ViewCostModalProps) => {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 p-6 border-b border-border/30">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <Receipt size={28} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{record.listingId}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Cost Record Details</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Vehicle Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Car size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Vehicle Info</span>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {record.vehicleYear} {record.vehicleMake} {record.vehicleModel}
              </p>
              <p className="text-sm text-muted-foreground">
                VIN: <span className="text-primary font-mono">{record.vin}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                STK#: <span className="text-foreground font-medium">{record.stockNumber}</span>
              </p>
            </div>
          </div>

          <InfoCard 
            icon={DollarSign} 
            label="Total Cost" 
            value={`$${record.cost.toLocaleString()}`}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Payment Method</span>
              </div>
              <StatusBadge status={record.paymentMethod} type="payment" />
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Payout Status</span>
              </div>
              <StatusBadge status={record.payoutStatus} type="payout" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                record.hasDocs ? "bg-teal-500" : "bg-amber-500"
              )} />
              <span className="text-sm font-medium text-foreground">
                {record.hasDocs ? "Documents attached" : "No documents"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCostModal;
