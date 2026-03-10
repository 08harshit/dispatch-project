import { Button } from "@/components/ui/button";
import { Car, Plus, X } from "lucide-react";
import { VehicleEntry } from "@/types/vehicle";

interface VehicleSelectorProps {
  selectedVehicles: VehicleEntry[];
  onRemoveVehicle: (id: string) => void;
  onAddNewVehicle: () => void;
}

const VehicleSelector = ({
  selectedVehicles,
  onRemoveVehicle,
  onAddNewVehicle,
}: VehicleSelectorProps) => {
  return (
    <div className="space-y-3">
      {/* Add Vehicle Button */}
      <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
              <Car size={14} className="text-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Select Vehicle</p>
              <p className="text-[11px] text-muted-foreground">Add a new vehicle with manual entry</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 justify-start gap-3"
            onClick={onAddNewVehicle}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Plus size={14} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Add New Vehicle</p>
              <p className="text-[10px] text-muted-foreground">Enter vehicle details manually</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Selected Vehicles */}
      {selectedVehicles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">
            Selected ({selectedVehicles.length})
          </p>
          {selectedVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 border border-foreground/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border/50 flex items-center justify-center">
                  <Car size={14} className="text-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-mono text-muted-foreground">{vehicle.vin}</p>
                    <span className="text-[10px] text-muted-foreground/60">•</span>
                    <p className="text-[10px] text-muted-foreground">
                      {vehicle.color} {vehicle.type}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveVehicle(vehicle.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
