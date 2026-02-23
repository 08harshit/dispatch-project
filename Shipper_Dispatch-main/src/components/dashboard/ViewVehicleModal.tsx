import { Vehicle } from "@/components/dashboard/VehicleTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, CreditCard, Truck, Package } from "lucide-react";

interface ViewVehicleModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ViewVehicleModal = ({ vehicle, open, onOpenChange }: ViewVehicleModalProps) => {
  if (!vehicle) return null;

  const statusColors = {
    dispatched: "bg-amber-100 text-amber-700",
    delivered: "bg-emerald-100 text-emerald-700",
    canceled: "bg-stone-100 text-stone-600",
    late: "bg-red-100 text-red-700",
    alert: "bg-orange-100 text-orange-700",
  };

  const typeColors = {
    auction: "bg-purple-100 text-purple-700",
    dealer: "bg-blue-100 text-blue-700",
    private: "bg-stone-100 text-stone-600",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">{vehicle.listingId}</DialogTitle>
              <DialogDescription>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className={statusColors[vehicle.status]}>
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </Badge>
          </div>

          {/* Vehicle Info */}
          <div className="p-4 rounded-xl bg-muted/30 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Vehicle Information
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">VIN:</span>
                <p className="font-mono font-medium">{vehicle.vin}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Stock #:</span>
                <p className="font-mono font-medium">{vehicle.stockNumber}</p>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-primary" />
                Pickup
              </h4>
              <p className="font-medium">{vehicle.pickupCity}, {vehicle.pickupState}</p>
              <p className="text-sm text-muted-foreground">{vehicle.pickupZip}</p>
              <Badge className={`mt-2 ${typeColors[vehicle.pickupType]}`}>
                {vehicle.pickupType}
              </Badge>
              <div className="flex items-center gap-1.5 mt-3 text-sm">
                <Calendar size={14} className="text-muted-foreground" />
                {vehicle.pickupDate}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-emerald-600" />
                Delivery
              </h4>
              <p className="font-medium">{vehicle.deliveryCity}, {vehicle.deliveryState}</p>
              <p className="text-sm text-muted-foreground">{vehicle.deliveryZip}</p>
              <Badge className={`mt-2 ${typeColors[vehicle.deliveryType]}`}>
                {vehicle.deliveryType}
              </Badge>
              <div className="flex items-center gap-1.5 mt-3 text-sm">
                <Calendar size={14} className="text-muted-foreground" />
                {vehicle.deliveryDate}
                {vehicle.deliveryDateMax && ` - ${vehicle.deliveryDateMax}`}
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="p-4 rounded-xl bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <span className="font-medium">Total Cost</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${vehicle.cost.toLocaleString()}</p>
              <Badge className="bg-amber-100 text-amber-700 mt-1">
                {vehicle.paymentMethod.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewVehicleModal;
