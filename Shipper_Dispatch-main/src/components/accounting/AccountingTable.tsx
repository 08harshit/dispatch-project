import { FileText, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface AccountingRecord {
  id: string;
  listingId: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  cost: number;
  date: string;
  paymentMethod: "cod" | "ach" | "wire" | "check";
  payoutStatus: "paid" | "pending" | "processing";
  hasDocs: boolean;
}

interface AccountingTableProps {
  records: AccountingRecord[];
  onView: (record: AccountingRecord) => void;
  onEdit: (record: AccountingRecord) => void;
  onDelete: (record: AccountingRecord) => void;
  onViewDocs?: (record: AccountingRecord) => void;
  onViewHistory?: (record: AccountingRecord) => void;
  onInlineUpdate?: (record: AccountingRecord, field: string, value: string) => void;
}

const VehicleInfoCell = ({ year, make, model, vin, stockNumber }: { 
  year: string; 
  make: string; 
  model: string; 
  vin: string; 
  stockNumber: string;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm font-semibold text-foreground">
      {year} {make} {model}
    </span>
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>VIN: <span className="font-mono text-foreground">{vin}</span></span>
      <span>STK#: <span className="font-medium text-foreground">{stockNumber}</span></span>
    </div>
  </div>
);

const PaymentMethodBadge = ({ method }: { method: AccountingRecord["paymentMethod"] }) => {
  const config = {
    cod: { label: "COD", bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
    ach: { label: "ACH", bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
    wire: { label: "Wire", bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/20" },
    check: { label: "Check", bg: "bg-slate-500/10", text: "text-slate-600", border: "border-slate-500/20" },
  };

  const style = config[method];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
      style.bg, style.text, style.border
    )}>
      {style.label}
    </span>
  );
};

const PayoutBadge = ({ status }: { status: AccountingRecord["payoutStatus"] }) => {
  const config = {
    paid: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", label: "Paid" },
    processing: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20", label: "Processing" },
    pending: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20", label: "Pending" },
  };

  const style = config[status];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
      style.bg, style.text, style.border
    )}>
      {style.label}
    </span>
  );
};

const CostDisplay = ({ cost }: { cost: number }) => (
  <span className="text-sm font-bold text-foreground">${cost.toLocaleString()}</span>
);

const ListingBadge = ({ listingId }: { listingId: string }) => (
  <span className="text-sm font-semibold text-foreground">{listingId}</span>
);

const DocsButton = ({ hasDocs, onClick }: { hasDocs: boolean; onClick?: () => void }) => (
  hasDocs ? (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick}
      className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
    >
      <FileText size={14} className="mr-1" />
      View
    </Button>
  ) : (
    <span className="text-xs text-muted-foreground">No docs</span>
  )
);


const AccountingTable = ({ records, onView, onEdit, onDelete, onViewDocs, onViewHistory, onInlineUpdate }: AccountingTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        {/* Header */}
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Listing</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Vehicle</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Amount</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Payment</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Docs</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
          </tr>
        </thead>

        {/* Records */}
        <tbody className="divide-y divide-border">
          {records.map((record) => (
            <tr
              key={record.id}
              className="group hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 px-4">
                <ListingBadge listingId={record.listingId} />
              </td>
              <td className="py-3 px-4">
                <VehicleInfoCell 
                  year={record.vehicleYear}
                  make={record.vehicleMake}
                  model={record.vehicleModel}
                  vin={record.vin}
                  stockNumber={record.stockNumber}
                />
              </td>
              {/* Editable Date */}
              <td className="py-3 px-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors cursor-pointer">
                      {format(new Date(record.date), "MMM d, yyyy")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(record.date)}
                      onSelect={(date) => {
                        if (date && onInlineUpdate) {
                          onInlineUpdate(record, "date", date.toISOString());
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </td>
              <td className="py-3 px-4">
                <CostDisplay cost={record.cost} />
              </td>
              {/* Editable Payment Method */}
              <td className="py-3 px-4">
                <Select
                  value={record.paymentMethod}
                  onValueChange={(value) => onInlineUpdate?.(record, "paymentMethod", value)}
                >
                  <SelectTrigger className="w-[100px] h-auto border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:opacity-0 group-hover:[&>svg]:opacity-100">
                    <SelectValue>
                      <PaymentMethodBadge method={record.paymentMethod} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">COD</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="wire">Wire</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              {/* Editable Payout Status */}
              <td className="py-3 px-4">
                <Select
                  value={record.payoutStatus}
                  onValueChange={(value) => onInlineUpdate?.(record, "payoutStatus", value)}
                >
                  <SelectTrigger className="w-[120px] h-auto border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:opacity-0 group-hover:[&>svg]:opacity-100">
                    <SelectValue>
                      <PayoutBadge status={record.payoutStatus} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-3 px-4">
                <DocsButton hasDocs={record.hasDocs} onClick={() => onViewDocs?.(record)} />
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-60 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onView(record)}>
                        <Eye size={14} />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit(record)}>
                        <Pencil size={14} />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={() => onDelete(record)}>
                        <Trash2 size={14} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {records.length === 0 && (
        <div className="py-16 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">No records found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountingTable;
