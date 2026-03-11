import { useState, useRef } from "react";
import { DollarSign, Fuel, Car, Shield, CreditCard, ParkingCircle, Wrench, Calendar, FileText, Upload, X, Loader2, File } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (record: Omit<CostRecord, "id">) => void | Promise<void>;
  isSubmitting?: boolean;
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

export const AddCostDialog = ({ open, onOpenChange, onAdd, isSubmitting = false }: AddCostDialogProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CostRecord["category"]>("Fuel");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, PNG, and WebP files are allowed");
        return;
      }
      setInvoiceFile(file);
    }
  };

  const removeFile = () => {
    setInvoiceFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadInvoice = async (file: File): Promise<{ url: string; name: string; filePath: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Failed to upload invoice");
        return null;
      }

      // Use signed URL instead of public URL (expires in 1 year)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('invoices')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedError || !signedData?.signedUrl) {
        console.error('Signed URL error:', signedError);
        toast.error("Failed to generate invoice URL");
        return null;
      }

      return { url: signedData.signedUrl, name: file.name, filePath };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload invoice");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) return;

    setIsUploading(true);

    try {
      let invoiceUrl: string | undefined;
      let invoiceName: string | undefined;

      if (invoiceFile) {
        const result = await uploadInvoice(invoiceFile);
        if (result) {
          invoiceUrl = result.url;
          invoiceName = result.name;
        }
      }

      // Date from input is YYYY-MM-DD; pass as-is for API (service converts if needed)
      const [year, month, day] = date.split("-");
      const formattedDate = `${month}-${day}-${year}`;

      await onAdd({
        amount: parseFloat(amount),
        category,
        description,
        date: formattedDate,
        paymentMethod,
        hasDocs: !!invoiceFile,
        invoiceUrl,
        invoiceName,
      });

      // Reset form
      setAmount("");
      setCategory("Fuel");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("Card");
      setInvoiceFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCategoryConfig = categories.find(c => c.value === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 rounded-[1.5rem_2.5rem_1.5rem_2.5rem] overflow-hidden border-0 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex-shrink-0">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <DialogHeader className="relative">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Add New Cost
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 pl-12 rounded-xl text-lg font-semibold border-stone-200 focus:border-amber-300 focus:ring-amber-100"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300",
                      isSelected
                        ? `${cat.light} ring-2 ring-offset-1 ring-${cat.text.replace("text-", "")}/30`
                        : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                      isSelected ? `bg-gradient-to-br ${cat.gradient}` : "bg-stone-200"
                    )}>
                      <Icon className={cn("h-5 w-5", isSelected ? "text-white" : "text-stone-500")} />
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isSelected ? cat.text : "text-stone-500"
                    )}>{cat.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">
              Description *
            </label>
            <Textarea
              placeholder="Enter expense description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-stone-200 focus:border-amber-300 focus:ring-amber-100 resize-none"
              rows={2}
              required
            />
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 pl-10 rounded-xl border-stone-200 focus:border-amber-300 focus:ring-amber-100"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">
                Payment Method
              </label>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      paymentMethod === method
                        ? "bg-amber-500 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invoice Upload */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">
              Invoice / Receipt
            </label>
            
            {!invoiceFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-stone-400" />
                </div>
                <p className="text-sm font-medium text-stone-600">Click to upload invoice</p>
                <p className="text-xs text-stone-400 mt-1">PDF, JPG, PNG or WebP (max 10MB)</p>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <File className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 truncate">{invoiceFile.name}</p>
                  <p className="text-xs text-emerald-600">{(invoiceFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="h-8 w-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-emerald-600" />
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
              disabled={isUploading || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
              disabled={isUploading || isSubmitting}
            >
              {(isUploading || isSubmitting) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Add Cost"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
