import { useState, useEffect } from "react";
import { Vehicle, LocationType, PaymentMethod } from "@/components/dashboard/VehicleTable";
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

interface EditVehicleModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vehicle: Vehicle) => void;
}

const EditVehicleModal = ({ vehicle, open, onOpenChange, onSave }: EditVehicleModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Vehicle>>({});

  useEffect(() => {
    if (vehicle) {
      setFormData({ ...vehicle });
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Vehicle);
    toast({
      title: "Vehicle Updated",
      description: `${formData.listingId} has been updated successfully.`,
    });
    onOpenChange(false);
  };

  const updateField = (field: keyof Vehicle, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Shipment</DialogTitle>
          <DialogDescription>
            Update the details for {vehicle.listingId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Vehicle Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Vehicle Information</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make || ""}
                  onChange={(e) => updateField("make", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model || ""}
                  onChange={(e) => updateField("model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year || ""}
                  onChange={(e) => updateField("year", parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={formData.vin || ""}
                  onChange={(e) => updateField("vin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockNumber">Stock Number</Label>
                <Input
                  id="stockNumber"
                  value={formData.stockNumber || ""}
                  onChange={(e) => updateField("stockNumber", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pickup Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Pickup Location</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pickupCity">City</Label>
                <Input
                  id="pickupCity"
                  value={formData.pickupCity || ""}
                  onChange={(e) => updateField("pickupCity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupState">State</Label>
                <Input
                  id="pickupState"
                  value={formData.pickupState || ""}
                  onChange={(e) => updateField("pickupState", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupZip">Zip</Label>
                <Input
                  id="pickupZip"
                  value={formData.pickupZip || ""}
                  onChange={(e) => updateField("pickupZip", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pickupType">Type</Label>
                <Select
                  value={formData.pickupType}
                  onValueChange={(value: LocationType) => updateField("pickupType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auction">Auction</SelectItem>
                    <SelectItem value="dealer">Dealer</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                  id="pickupDate"
                  value={formData.pickupDate || ""}
                  onChange={(e) => updateField("pickupDate", e.target.value)}
                  placeholder="MM-DD-YYYY"
                />
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Delivery Location</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">City</Label>
                <Input
                  id="deliveryCity"
                  value={formData.deliveryCity || ""}
                  onChange={(e) => updateField("deliveryCity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryState">State</Label>
                <Input
                  id="deliveryState"
                  value={formData.deliveryState || ""}
                  onChange={(e) => updateField("deliveryState", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryZip">Zip</Label>
                <Input
                  id="deliveryZip"
                  value={formData.deliveryZip || ""}
                  onChange={(e) => updateField("deliveryZip", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="deliveryType">Type</Label>
                <Select
                  value={formData.deliveryType}
                  onValueChange={(value: LocationType) => updateField("deliveryType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auction">Auction</SelectItem>
                    <SelectItem value="dealer">Dealer</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  value={formData.deliveryDate || ""}
                  onChange={(e) => updateField("deliveryDate", e.target.value)}
                  placeholder="MM-DD-YYYY"
                />
              </div>
            </div>
          </div>

          {/* Cost & Payment */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Cost & Payment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost || ""}
                  onChange={(e) => updateField("cost", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: PaymentMethod) => updateField("paymentMethod", value)}
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
            </div>
          </div>

          <DialogFooter>
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

export default EditVehicleModal;
