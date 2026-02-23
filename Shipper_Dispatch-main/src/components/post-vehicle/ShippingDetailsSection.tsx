import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, DollarSign, CalendarIcon, CreditCard, FileText, Package } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ShippingDetailsSectionProps {
  dateAvailable: Date | undefined;
  etaDeliveryFrom: Date | undefined;
  etaDeliveryTo: Date | undefined;
  price: string;
  paymentType: string;
  notes: string;
  onDateAvailableChange: (date: Date | undefined) => void;
  onEtaDeliveryFromChange: (date: Date | undefined) => void;
  onEtaDeliveryToChange: (date: Date | undefined) => void;
  onPriceChange: (value: string) => void;
  onPaymentTypeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

const paymentTypes = [
  { value: "cod", label: "COD" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
];

const ShippingDetailsSection = ({
  dateAvailable,
  etaDeliveryFrom,
  etaDeliveryTo,
  price,
  paymentType,
  notes,
  onDateAvailableChange,
  onEtaDeliveryFromChange,
  onEtaDeliveryToChange,
  onPriceChange,
  onPaymentTypeChange,
  onNotesChange,
}: ShippingDetailsSectionProps) => {
  return (
    <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center">
            <Package size={16} className="text-foreground/60" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Shipping Details</h3>
            <p className="text-[11px] text-muted-foreground">Dates, pricing & payment</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Dates Row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-muted-foreground" />
            <Label className="text-xs font-medium text-foreground/80">Schedule</Label>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {/* Available Date */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Available</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs bg-muted/30 border-border/40",
                      !dateAvailable && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {dateAvailable ? format(dateAvailable, "MMM d") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateAvailable}
                    onSelect={onDateAvailableChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* ETA From */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">ETA From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs bg-muted/30 border-border/40",
                      !etaDeliveryFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {etaDeliveryFrom ? format(etaDeliveryFrom, "MMM d") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={etaDeliveryFrom}
                    onSelect={onEtaDeliveryFromChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* ETA To */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">ETA To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs bg-muted/30 border-border/40",
                      !etaDeliveryTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {etaDeliveryTo ? format(etaDeliveryTo, "MMM d") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={etaDeliveryTo}
                    onSelect={onEtaDeliveryToChange}
                    disabled={(date) => etaDeliveryFrom ? date < etaDeliveryFrom : false}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Price & Payment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-muted-foreground" />
            <Label className="text-xs font-medium text-foreground/80">Payment</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => onPriceChange(e.target.value)}
                  className="pl-8 h-9 text-sm bg-muted/30 border-border/40"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Method</Label>
              <Select value={paymentType} onValueChange={onPaymentTypeChange}>
                <SelectTrigger className="h-9 text-sm bg-muted/30 border-border/40">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-muted-foreground" />
            <Label className="text-xs font-medium text-foreground/80">Notes</Label>
          </div>
          <Textarea
            placeholder="Special instructions or additional information..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            className="text-sm bg-muted/30 border-border/40 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingDetailsSection;
