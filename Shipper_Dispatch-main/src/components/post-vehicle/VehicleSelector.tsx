import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Car, Plus, X, ChevronDown } from "lucide-react";
import { VehicleEntry } from "@/types/vehicle";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock inventory data - in production this would come from your database
const mockInventory = [
  { id: "inv-1", vin: "1HGBH41JXMN109186", year: "2024", make: "Toyota", model: "Camry", type: "Sedan", color: "White", stockNumber: "STK-001" },
  { id: "inv-2", vin: "5YFBURHE7FP324567", year: "2023", make: "Honda", model: "Accord", type: "Sedan", color: "Black", stockNumber: "STK-002" },
  { id: "inv-3", vin: "1G1YY22G965109876", year: "2024", make: "Ford", model: "F-150", type: "Truck", color: "Blue", stockNumber: "STK-003" },
  { id: "inv-4", vin: "WVWZZZ3CZWE123456", year: "2023", make: "BMW", model: "X5", type: "SUV", color: "Silver", stockNumber: "STK-004" },
  { id: "inv-5", vin: "JN1TBNT30Z0000001", year: "2024", make: "Mercedes", model: "C300", type: "Sedan", color: "Gray", stockNumber: "STK-005" },
];

interface VehicleSelectorProps {
  selectedVehicles: VehicleEntry[];
  onAddFromInventory: (vehicle: typeof mockInventory[0]) => void;
  onRemoveVehicle: (id: string) => void;
  onAddNewVehicle: () => void;
}

const VehicleSelector = ({ 
  selectedVehicles, 
  onAddFromInventory, 
  onRemoveVehicle,
  onAddNewVehicle 
}: VehicleSelectorProps) => {
  const [selectValue, setSelectValue] = useState<string>("");

  const isSelected = (vinToCheck: string) => 
    selectedVehicles.some(v => v.vin === vinToCheck);

  const availableVehicles = mockInventory.filter(v => !isSelected(v.vin));

  const handleSelectChange = (value: string) => {
    if (value === "new") {
      onAddNewVehicle();
      setSelectValue("");
    } else {
      const vehicle = mockInventory.find(v => v.id === value);
      if (vehicle) {
        onAddFromInventory(vehicle);
        setSelectValue("");
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Dropdown Selector */}
      <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
              <Car size={14} className="text-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Select Vehicle</p>
              <p className="text-[11px] text-muted-foreground">Choose from inventory or add new</p>
            </div>
          </div>

          <Select value={selectValue} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full h-12 bg-background border-border/50">
              <SelectValue placeholder="Select a vehicle..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              {/* New Vehicle Option */}
              <SelectItem value="new" className="py-3 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Plus size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Add New Vehicle</p>
                    <p className="text-[10px] text-muted-foreground">Enter vehicle details manually</p>
                  </div>
                </div>
              </SelectItem>

              {/* Separator */}
              {availableVehicles.length > 0 && (
                <div className="border-t border-border/50 my-1" />
              )}

              {/* Inventory Vehicles */}
              {availableVehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id} className="py-3 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center">
                      <Car size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {vehicle.stockNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-mono text-muted-foreground">{vehicle.vin}</p>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <p className="text-[10px] text-muted-foreground">
                          {vehicle.color} {vehicle.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}

              {availableVehicles.length === 0 && (
                <div className="py-3 px-4 text-center">
                  <p className="text-sm text-muted-foreground">All vehicles selected</p>
                </div>
              )}
            </SelectContent>
          </Select>
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
