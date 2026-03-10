import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

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

interface EditCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AccountingRecord | null;
  onSave: (record: AccountingRecord) => void;
}

const EditCostModal = ({ open, onOpenChange, record, onSave }: EditCostModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    listingId: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vin: "",
    stockNumber: "",
    cost: "",
    paymentMethod: "cod" as "cod" | "ach" | "wire" | "check",
    payoutStatus: "pending" as "paid" | "pending" | "processing",
    hasDocs: false,
  });

  useEffect(() => {
    if (record) {
      setFormData({
        listingId: record.listingId,
        vehicleYear: record.vehicleYear,
        vehicleMake: record.vehicleMake,
        vehicleModel: record.vehicleModel,
        vin: record.vin,
        stockNumber: record.stockNumber,
        cost: record.cost.toString(),
        paymentMethod: record.paymentMethod,
        payoutStatus: record.payoutStatus,
        hasDocs: record.hasDocs,
      });
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!record) return;

    if (!formData.listingId.trim()) {
      toast({
        title: "Error",
        description: "Listing ID is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid cost amount",
        variant: "destructive",
      });
      return;
    }

    onSave({
      id: record.id,
      listingId: formData.listingId.trim(),
      vehicleYear: formData.vehicleYear || new Date().getFullYear().toString(),
      vehicleMake: formData.vehicleMake || "Unknown",
      vehicleModel: formData.vehicleModel || "Vehicle",
      vin: formData.vin || "N/A",
      stockNumber: formData.stockNumber || "N/A",
      cost: parseFloat(formData.cost),
      date: record.date,
      paymentMethod: formData.paymentMethod,
      payoutStatus: formData.payoutStatus,
      hasDocs: formData.hasDocs,
    });

    toast({
      title: "Record Updated",
      description: `${formData.listingId} has been updated successfully.`,
    });

    onOpenChange(false);
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
              <Pencil size={18} className="text-primary" />
            </div>
            <div>
              <DialogTitle>Edit Record</DialogTitle>
              <DialogDescription>
                Update the cost record details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="listingId">Listing ID</Label>
              <Input
                id="listingId"
                placeholder="e.g., LD-2024-001"
                value={formData.listingId}
                onChange={(e) => setFormData({ ...formData, listingId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Year</Label>
              <Input
                id="vehicleYear"
                placeholder={new Date().getFullYear().toString()}
                value={formData.vehicleYear}
                onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleMake">Make</Label>
              <Input
                id="vehicleMake"
                placeholder="Toyota"
                value={formData.vehicleMake}
                onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Model</Label>
              <Input
                id="vehicleModel"
                placeholder="Camry"
                value={formData.vehicleModel}
                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                placeholder="1HGBH41JXMN109186"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockNumber">Stock Number</Label>
              <Input
                id="stockNumber"
                placeholder="TC2024-01"
                value={formData.stockNumber}
                onChange={(e) => setFormData({ ...formData, stockNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: "cod" | "ach" | "wire" | "check") =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="wire">Wire</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutStatus">Payout Status</Label>
              <Select
                value={formData.payoutStatus}
                onValueChange={(value: "paid" | "pending" | "processing") =>
                  setFormData({ ...formData, payoutStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasDocs"
              checked={formData.hasDocs}
              onChange={(e) => setFormData({ ...formData, hasDocs: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="hasDocs" className="font-normal">Has documents attached</Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCostModal;
