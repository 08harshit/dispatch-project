import { useState, useEffect } from "react";
import { DollarSign, Fuel, Car, Shield, CreditCard, ParkingCircle, Wrench, Calendar, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CostRecord } from "./CostsTable";

interface EditCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CostRecord | null;
  onSave: (record: CostRecord) => void;
}

const categories = [
  { value: "Fuel", icon: Fuel, gradient: "from-amber-400 to-orange-400", light: "bg-amber-50", text: "text-amber-600" },
  { value: "Parking", icon: ParkingCircle, gradient: "from-teal-400 to-emerald-400", light: "bg-teal-50", text: "text-teal-600" },
  { value: "Insurance", icon: Shield, gradient: "from-emerald-400 to-teal-400", light: "bg-emerald-50", text: "text-emerald-600" },
  { value: "Washing", icon: Car, gradient: "from-teal-400 to-cyan-400", light: "bg-teal-50", text: "text-teal-600" },
  { value: "Maintenance", icon: Wrench, gradient: "from-stone-400 to-stone-500", light: "bg-stone-100", text: "text-stone-600" },
  { value: "Credits", icon: CreditCard, gradient: "from-amber-500 to-orange-500", light: "bg-amber-50", text: "text-amber-600" },
] as const;

const paymentMethods = ["Card", "Cash", "Wire", "Check"];

export const EditCostDialog = ({ open, onOpenChange, record, onSave }: EditCostDialogProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CostRecord["category"]>("Fuel");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Card");

  useEffect(() => {
    if (record) {
      setAmount(record.amount.toString());
      setCategory(record.category);
      setDescription(record.description);
      const [month, day, year] = record.date.split("-");
      setDate(`${year}-${month}-${day}`);
      setPaymentMethod(record.paymentMethod);
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !record) return;

    const [year, month, day] = date.split("-");
    const formattedDate = `${month}-${day}-${year}`;

    onSave({
      ...record,
      amount: parseFloat(amount),
      category,
      description,
      date: formattedDate,
      paymentMethod,
    });
    onOpenChange(false);
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 rounded-[1.5rem_2.5rem_1.5rem_2.5rem] overflow-hidden border-0 shadow-2xl flex flex-col">
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex-shrink-0">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <DialogHeader className="relative">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              Edit Cost
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Amount *</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
              <Input
                type="number" step="0.01" min="0" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 pl-12 rounded-xl text-lg font-semibold border-stone-200 focus:border-amber-300 focus:ring-amber-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300",
                      isSelected ? `${cat.light} ring-2 ring-offset-1 ring-${cat.text.replace("text-", "")}/30` : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", isSelected ? `bg-gradient-to-br ${cat.gradient}` : "bg-stone-200")}>
                      <Icon className={cn("h-5 w-5", isSelected ? "text-white" : "text-stone-500")} />
                    </div>
                    <span className={cn("text-xs font-medium", isSelected ? cat.text : "text-stone-500")}>{cat.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Description *</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-stone-200 focus:border-amber-300 focus:ring-amber-100 resize-none" rows={2} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="h-11 pl-10 rounded-xl border-stone-200 focus:border-amber-300 focus:ring-amber-100" required />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Payment Method</label>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map((method) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)}
                    className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      paymentMethod === method ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    )}>{method}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50">Cancel</Button>
            <Button type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
