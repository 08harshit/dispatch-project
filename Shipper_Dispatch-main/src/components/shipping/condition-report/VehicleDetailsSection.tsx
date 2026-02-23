import { Car, Palette, Calendar, MapPin, Fuel, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleDetails } from "@/types/conditionReport";

interface VehicleDetailsSectionProps {
  data: VehicleDetails;
  onChange: (updates: Partial<VehicleDetails>) => void;
}

const VehicleDetailsSection = ({ data, onChange }: VehicleDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Car className="h-4 w-4 text-primary" />
        Vehicle Details
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Exterior Color */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Palette className="h-3 w-3" />
            <Label className="text-[10px]">Exterior Color</Label>
          </div>
          <Input
            value={data.exteriorColor}
            onChange={(e) => onChange({ exteriorColor: e.target.value })}
            placeholder="e.g., Silver Ice Metallic"
            className="h-8 text-xs"
          />
        </div>

        {/* Interior Color */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Palette className="h-3 w-3" />
            <Label className="text-[10px]">Interior Color</Label>
          </div>
          <Input
            value={data.interiorColor}
            onChange={(e) => onChange({ interiorColor: e.target.value })}
            placeholder="e.g., Black/Gray"
            className="h-8 text-xs"
          />
        </div>

        {/* Drive Type */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Settings className="h-3 w-3" />
            <Label className="text-[10px]">Drive Type</Label>
          </div>
          <Select value={data.driveType} onValueChange={(val) => onChange({ driveType: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FWD">FWD</SelectItem>
              <SelectItem value="RWD">RWD</SelectItem>
              <SelectItem value="AWD">AWD</SelectItem>
              <SelectItem value="4WD">4WD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Engine */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Settings className="h-3 w-3" />
            <Label className="text-[10px]">Engine</Label>
          </div>
          <Input
            value={data.engine || ""}
            onChange={(e) => onChange({ engine: e.target.value })}
            placeholder="e.g., 2.5L 4 Cyl"
            className="h-8 text-xs"
          />
        </div>

        {/* Fuel Type */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Fuel className="h-3 w-3" />
            <Label className="text-[10px]">Fuel Type</Label>
          </div>
          <Select value={data.fuelType} onValueChange={(val) => onChange({ fuelType: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gas">Gas</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="Electric">Electric</SelectItem>
              <SelectItem value="Flex Fuel">Flex Fuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transmission */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Settings className="h-3 w-3" />
            <Label className="text-[10px]">Transmission</Label>
          </div>
          <Select value={data.transmission} onValueChange={(val) => onChange({ transmission: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Auto">Automatic</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="CVT">CVT</SelectItem>
              <SelectItem value="DCT">DCT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seat Material */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Car className="h-3 w-3" />
            <Label className="text-[10px]">Seat Material</Label>
          </div>
          <Select value={data.seatMaterial} onValueChange={(val) => onChange({ seatMaterial: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cloth">Cloth</SelectItem>
              <SelectItem value="Leather">Leather</SelectItem>
              <SelectItem value="Leatherette">Leatherette</SelectItem>
              <SelectItem value="Vinyl">Vinyl</SelectItem>
              <SelectItem value="Premium Cloth">Premium Cloth</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title Received */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <Label className="text-[10px]">Title Received</Label>
          </div>
          <Input
            type="date"
            value={data.titleReceived || ""}
            onChange={(e) => onChange({ titleReceived: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        {/* Title State */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <Label className="text-[10px]">Title State</Label>
          </div>
          <Input
            value={data.titleState || ""}
            onChange={(e) => onChange({ titleState: e.target.value })}
            placeholder="e.g., PA"
            className="h-8 text-xs uppercase"
            maxLength={2}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Work Order */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <Label className="text-[10px] text-muted-foreground">Work Order #</Label>
          <Input
            value={data.workOrder || ""}
            onChange={(e) => onChange({ workOrder: e.target.value })}
            placeholder="e.g., 2940936"
            className="h-8 text-xs"
          />
        </div>

        {/* MSRP */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <Label className="text-[10px] text-muted-foreground">MSRP</Label>
          <Input
            value={data.msrp || ""}
            onChange={(e) => onChange({ msrp: e.target.value })}
            placeholder="$0.00"
            className="h-8 text-xs"
          />
        </div>

        {/* Inspection Location */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <Label className="text-[10px] text-muted-foreground">Inspection Location</Label>
          <Input
            value={data.inspectionLocation || ""}
            onChange={(e) => onChange({ inspectionLocation: e.target.value })}
            placeholder="e.g., Manheim Pittsburgh"
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsSection;
