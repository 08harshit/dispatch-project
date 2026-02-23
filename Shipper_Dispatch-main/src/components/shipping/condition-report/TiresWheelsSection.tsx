import { Circle, Disc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TireWheelData } from "@/types/conditionReport";

interface TiresWheelsSectionProps {
  data: {
    leftFront: TireWheelData;
    rightFront: TireWheelData;
    leftRear: TireWheelData;
    rightRear: TireWheelData;
    spare: TireWheelData | null;
  };
  onChange: (data: TiresWheelsSectionProps["data"]) => void;
}

const wheelPositions = [
  { key: "leftFront", label: "Left Front" },
  { key: "rightFront", label: "Right Front" },
  { key: "leftRear", label: "Left Rear" },
  { key: "rightRear", label: "Right Rear" },
  { key: "spare", label: "Spare" },
] as const;

const wheelTypes = [
  { value: "aluminum", label: "Aluminum" },
  { value: "steel", label: "Steel" },
  { value: "alloy", label: "Alloy" },
  { value: "other", label: "Other" },
];

const TiresWheelsSection = ({ data, onChange }: TiresWheelsSectionProps) => {
  const handleUpdate = (
    position: keyof typeof data,
    field: keyof TireWheelData,
    value: string
  ) => {
    if (position === "spare" && data.spare === null) {
      onChange({
        ...data,
        spare: { type: "aluminum", tread: "", size: "", [field]: value },
      });
    } else {
      onChange({
        ...data,
        [position]: {
          ...data[position],
          [field]: value,
        },
      });
    }
  };

  const toggleSpare = () => {
    onChange({
      ...data,
      spare: data.spare ? null : { type: "aluminum", tread: "", size: "" },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Disc className="h-4 w-4 text-primary" />
        Tires & Wheels
      </div>

      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Position</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Wheel Type</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Tread</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Size</th>
            </tr>
          </thead>
          <tbody>
            {wheelPositions.map(({ key, label }) => {
              const wheelData = key === "spare" ? data.spare : data[key];
              const isSpare = key === "spare";

              if (isSpare && !data.spare) {
                return (
                  <tr key={key} className="border-b border-border/10">
                    <td className="py-2 px-2 font-medium">{label}</td>
                    <td colSpan={3} className="py-2 px-2">
                      <button
                        type="button"
                        onClick={toggleSpare}
                        className="text-primary hover:underline text-xs"
                      >
                        + Add Spare
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={key} className="border-b border-border/10">
                  <td className="py-2 px-2 font-medium flex items-center gap-1.5">
                    <Circle className="h-3 w-3 text-muted-foreground" />
                    {label}
                    {isSpare && (
                      <button
                        type="button"
                        onClick={toggleSpare}
                        className="text-destructive text-[10px] hover:underline ml-1"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    <Select
                      value={wheelData?.type || "aluminum"}
                      onValueChange={(val) =>
                        handleUpdate(key, "type", val as TireWheelData["type"])
                      }
                    >
                      <SelectTrigger className="h-7 text-xs min-w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {wheelTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      value={wheelData?.tread || ""}
                      onChange={(e) => handleUpdate(key, "tread", e.target.value)}
                      placeholder="6/32"
                      className="h-7 text-xs w-16"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      value={wheelData?.size || ""}
                      onChange={(e) => handleUpdate(key, "size", e.target.value)}
                      placeholder="215/60R16"
                      className="h-7 text-xs w-24"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TiresWheelsSection;
