import { Circle, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ConditionStatus } from "@/types/conditionReport";

interface TireData {
  tread: string;
  pressure: string;
}

interface BrakesTiresData {
  brakePads: ConditionStatus;
  rotorsDrums: ConditionStatus;
  leftFrontTire: TireData;
  rightFrontTire: TireData;
  leftRearTire: TireData;
  rightRearTire: TireData;
  alignmentNeeded: boolean;
  wheelBalanceNeeded: boolean;
}

interface TireSectionProps {
  data: BrakesTiresData;
  onChange: (updates: Partial<BrakesTiresData>) => void;
}

const statusOptions: { value: ConditionStatus; label: string; color: string }[] = [
  { value: 'okay', label: 'OK', color: 'bg-emerald-500' },
  { value: 'may_need_future', label: 'May Need', color: 'bg-amber-400' },
  { value: 'attention', label: 'Needs Repair', color: 'bg-rose-500' },
];

const TireSection = ({ data, onChange }: TireSectionProps) => {
  const updateTire = (position: keyof Pick<BrakesTiresData, 'leftFrontTire' | 'rightFrontTire' | 'leftRearTire' | 'rightRearTire'>, field: keyof TireData, value: string) => {
    onChange({
      [position]: {
        ...data[position],
        [field]: value
      }
    });
  };

  const TireInput = ({ 
    position, 
    label 
  }: { 
    position: keyof Pick<BrakesTiresData, 'leftFrontTire' | 'rightFrontTire' | 'leftRearTire' | 'rightRearTire'>;
    label: string;
  }) => (
    <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Tread (32nds)</Label>
          <Input
            value={data[position].tread}
            onChange={(e) => updateTire(position, 'tread', e.target.value)}
            placeholder="32"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Pressure (PSI)</Label>
          <Input
            value={data[position].pressure}
            onChange={(e) => updateTire(position, 'pressure', e.target.value)}
            placeholder="35"
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Circle className="h-4 w-4 text-primary" />
        Brakes & Tires
      </div>

      {/* Brake Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Brake Pads</Label>
          <div className="flex gap-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ brakePads: option.value })}
                className={cn(
                  "flex-1 py-2 px-2 rounded-lg text-[10px] font-medium transition-all",
                  data.brakePads === option.value
                    ? cn(option.color, "text-white")
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Rotors/Drums</Label>
          <div className="flex gap-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ rotorsDrums: option.value })}
                className={cn(
                  "flex-1 py-2 px-2 rounded-lg text-[10px] font-medium transition-all",
                  data.rotorsDrums === option.value
                    ? cn(option.color, "text-white")
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tire Diagram */}
      <div className="grid grid-cols-2 gap-3">
        <TireInput position="leftFrontTire" label="Left Front" />
        <TireInput position="rightFrontTire" label="Right Front" />
        <TireInput position="leftRearTire" label="Left Rear" />
        <TireInput position="rightRearTire" label="Right Rear" />
      </div>

      {/* Additional Checks */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={data.alignmentNeeded}
            onCheckedChange={(checked) => onChange({ alignmentNeeded: !!checked })}
          />
          <span>Alignment Needed</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={data.wheelBalanceNeeded}
            onCheckedChange={(checked) => onChange({ wheelBalanceNeeded: !!checked })}
          />
          <span>Wheel Balance Needed</span>
        </label>
      </div>
    </div>
  );
};

export default TireSection;
