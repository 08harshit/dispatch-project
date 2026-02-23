import { Badge } from "@/components/ui/badge";
import { VehicleDetails } from "@/types/conditionReport";

interface VehicleSummaryHeaderProps {
  mileage: string;
  vehicleDetails: VehicleDetails;
}

const VehicleSummaryHeader = ({ mileage, vehicleDetails }: VehicleSummaryHeaderProps) => {
  const specs = [
    vehicleDetails.driveType,
    vehicleDetails.engine,
    vehicleDetails.fuelType,
    vehicleDetails.transmission,
    vehicleDetails.seatMaterial,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {mileage && (
        <Badge variant="secondary" className="font-mono text-xs">
          {mileage} mi
        </Badge>
      )}
      {specs.length > 0 && (
        <span className="text-xs">
          {specs.join(" • ")}
        </span>
      )}
    </div>
  );
};

export default VehicleSummaryHeader;
