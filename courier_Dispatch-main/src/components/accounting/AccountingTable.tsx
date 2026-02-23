import { useState } from "react";
import { MoreHorizontal, FileText, Package, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccountingDocsDialog } from "./AccountingDocsDialog";
interface AccountingRecord {
  id: string;
  listingId: string;
  cost: number;
  dispatched: "Dispatched" | "Pending" | "Canceled";
  payout: "Paid" | "Processing" | "Pending";
}

const mockRecords: AccountingRecord[] = [
  { id: "1", listingId: "SHP-001", cost: 850, dispatched: "Dispatched", payout: "Processing" },
  { id: "2", listingId: "SHP-002", cost: 620, dispatched: "Dispatched", payout: "Paid" },
  { id: "3", listingId: "SHP-003", cost: 450, dispatched: "Dispatched", payout: "Paid" },
  { id: "4", listingId: "SHP-004", cost: 1200, dispatched: "Pending", payout: "Pending" },
  { id: "5", listingId: "SHP-005", cost: 380, dispatched: "Dispatched", payout: "Processing" },
  { id: "6", listingId: "SHP-006", cost: 720, dispatched: "Canceled", payout: "Pending" },
];

const getDispatchedBadge = (status: string) => {
  const styles: Record<string, { bg: string; icon: typeof CheckCircle }> = {
    Dispatched: { bg: "bg-emerald-500 text-white shadow-sm shadow-emerald-200/30", icon: CheckCircle },
    Pending: { bg: "bg-amber-500 text-white shadow-sm shadow-amber-200/30", icon: Clock },
    Canceled: { bg: "bg-stone-400 text-white shadow-sm shadow-stone-200/30", icon: XCircle },
  };
  const config = styles[status] || styles.Pending;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider", config.bg)}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
};

const getPayoutBadge = (status: string) => {
  const styles: Record<string, { bg: string; icon: typeof CheckCircle }> = {
    Paid: { bg: "bg-emerald-500 text-white shadow-sm shadow-emerald-200/30", icon: CheckCircle },
    Processing: { bg: "bg-teal-500 text-white shadow-sm shadow-teal-200/30", icon: Clock },
    Pending: { bg: "bg-amber-400 text-white shadow-sm shadow-amber-200/30", icon: Clock },
  };
  const config = styles[status] || styles.Pending;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider", config.bg)}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
};

interface AccountingTableProps {
  activeTab: string;
}

export const AccountingTable = ({ activeTab }: AccountingTableProps) => {
  const [selectedRecord, setSelectedRecord] = useState<AccountingRecord | null>(null);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);

  const filteredRecords = mockRecords.filter((record) => {
    if (activeTab === "all") return true;
    if (activeTab === "paid") return record.payout === "Paid";
    if (activeTab === "processing") return record.payout === "Processing";
    if (activeTab === "pending") return record.payout === "Pending";
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Alternating amber and emerald accent colors
  const accents = [
    { bg: 'from-amber-400 to-orange-400', light: 'bg-amber-50', text: 'text-amber-600', shadow: 'shadow-amber-200/20', border: 'hover:border-amber-200' },
    { bg: 'from-emerald-400 to-teal-400', light: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-200/20', border: 'hover:border-emerald-200' },
  ];

  if (filteredRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Package className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-stone-700">No records found</p>
            <p className="text-sm text-stone-400 mt-1">Try adjusting your filters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredRecords.map((record, index) => {
        const accent = accents[index % accents.length];

        return (
          <div
            key={record.id}
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
              {/* Listing ID & Icon */}
              <div className="flex items-center gap-4 min-w-[180px]">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300", accent.light)}>
                  <Package className={cn("h-6 w-6", accent.text)} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold text-sm", accent.text)}>{record.listingId}</span>
                    <div className={cn("h-2 w-2 rounded-full bg-gradient-to-r animate-pulse", accent.bg)} />
                  </div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">Listing</p>
                </div>
              </div>

              {/* Cost */}
              <div className="flex items-center gap-3 min-w-[140px] p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Cost</p>
                  <p className="text-lg font-bold text-stone-700">{formatCurrency(record.cost)}</p>
                </div>
              </div>

              {/* Dispatched Status */}
              <div className="min-w-[140px]">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Dispatched</p>
                {getDispatchedBadge(record.dispatched)}
              </div>

              {/* Payout Status */}
              <div className="min-w-[140px]">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Payout</p>
                {getPayoutBadge(record.payout)}
              </div>

              {/* Documents */}
              <div className="flex-1">
                <button 
                  onClick={() => {
                    setSelectedRecord(record);
                    setDocsDialogOpen(true);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r transition-all duration-300 hover:shadow-lg",
                    accent.light
                  )}
                >
                  <FileText className={cn("h-4 w-4", accent.text)} strokeWidth={2} />
                  <span className={cn("text-sm font-semibold", accent.text)}>View Docs</span>
                </button>
              </div>

              {/* Actions */}
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
                  <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 text-stone-600 hover:bg-stone-100">
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 text-stone-600 hover:bg-stone-100">
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}

      <AccountingDocsDialog
        open={docsDialogOpen}
        onOpenChange={setDocsDialogOpen}
        record={selectedRecord}
      />
    </div>
  );
};
