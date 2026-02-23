import { useState } from "react";
import { DollarSign, Calendar, CreditCard, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RevenueRecord } from "./RevenueTable";

interface AddRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (record: Omit<RevenueRecord, "id">) => void;
}

const paymentMethods = [
  { value: "COD", label: "COD", description: "Cash on Delivery" },
  { value: "COP", label: "COP", description: "Card on Pickup" },
  { value: "Wire", label: "Wire", description: "Wire Transfer" },
  { value: "Check", label: "Check", description: "Check Payment" },
];

export const AddRevenueDialog = ({ open, onOpenChange, onAdd }: AddRevenueDialogProps) => {
  const [revenue, setRevenue] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!revenue || !bookingId) return;

    // Format date as MM-DD-YYYY
    const [year, month, day] = date.split("-");
    const formattedDate = `${month}-${day}-${year}`;

    onAdd({
      revenue: parseFloat(revenue),
      bookingId,
      date: formattedDate,
      paymentMethod,
      hasDocs: true,
    });

    // Reset form
    setRevenue("");
    setBookingId("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("COD");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-[1.5rem_2.5rem_1.5rem_2.5rem] overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <DialogHeader className="relative">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Add New Revenue
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Revenue Amount */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Revenue Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="h-12 pl-12 rounded-xl text-lg font-semibold border-border focus:border-emerald-300 focus:ring-emerald-100"
                required
              />
            </div>
          </div>

          {/* Booking ID */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Booking ID *
            </label>
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
              <Input
                type="text"
                placeholder="e.g., BK-2024-001"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="h-12 pl-12 rounded-xl font-medium border-border focus:border-emerald-300 focus:ring-emerald-100"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 pl-12 rounded-xl border-border focus:border-emerald-300 focus:ring-emerald-100"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                    paymentMethod === method.value
                      ? "bg-emerald-50 ring-2 ring-emerald-500/30 ring-offset-1"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                    paymentMethod === method.value
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                      : "bg-muted-foreground/10"
                  )}>
                    <CreditCard className={cn(
                      "h-4 w-4",
                      paymentMethod === method.value ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-left">
                    <p className={cn(
                      "text-sm font-semibold",
                      paymentMethod === method.value ? "text-emerald-700" : "text-foreground"
                    )}>{method.label}</p>
                    <p className="text-[10px] text-muted-foreground">{method.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200/50"
            >
              Add Revenue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
