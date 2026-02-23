import { History, Shield, Car, FileText, AlertTriangle, Users, Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehicleHistoryData } from "@/types/conditionReport";
import { cn } from "@/lib/utils";

interface VehicleHistorySectionProps {
  data: VehicleHistoryData;
  onChange: (updates: Partial<VehicleHistoryData>) => void;
}

const VehicleHistorySection = ({ data, onChange }: VehicleHistorySectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="h-4 w-4 text-primary" />
        Vehicle History
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Historical Events */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3 w-3" />
            <Label className="text-[10px]">Historical Events</Label>
          </div>
          <Input
            type="number"
            value={data.historicalEvents || ""}
            onChange={(e) => onChange({ historicalEvents: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="h-8 text-sm font-semibold"
          />
        </div>

        {/* Calculated Owners */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3 w-3" />
            <Label className="text-[10px]">Owners</Label>
          </div>
          <Input
            type="number"
            value={data.calculatedOwners || ""}
            onChange={(e) => onChange({ calculatedOwners: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="h-8 text-sm font-semibold"
          />
        </div>

        {/* Calculated Accidents */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            <Label className="text-[10px]">Accidents</Label>
          </div>
          <Input
            type="number"
            value={data.calculatedAccidents || ""}
            onChange={(e) => onChange({ calculatedAccidents: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="h-8 text-sm font-semibold"
          />
        </div>

        {/* Last Reported Mileage */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="h-3 w-3" />
            <Label className="text-[10px]">Last Mileage</Label>
          </div>
          <Input
            value={data.lastReportedMileage}
            onChange={(e) => onChange({ lastReportedMileage: e.target.value })}
            placeholder="0"
            className="h-8 text-sm font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Title Check */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-3 w-3" />
            <Label className="text-[10px]">Title Check</Label>
          </div>
          <Input
            value={data.titleCheck}
            onChange={(e) => onChange({ titleCheck: e.target.value })}
            placeholder="e.g., Vehicle checks out!"
            className="h-8 text-xs"
          />
        </div>

        {/* Odometer Check */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="h-3 w-3" />
            <Label className="text-[10px]">Odometer Check</Label>
          </div>
          <Input
            value={data.odometerCheck}
            onChange={(e) => onChange({ odometerCheck: e.target.value })}
            placeholder="e.g., Vehicle checks out!"
            className="h-8 text-xs"
          />
        </div>

        {/* Use/Event Check */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Car className="h-3 w-3" />
            <Label className="text-[10px]">Use & Event Check</Label>
          </div>
          <Input
            value={data.useEventCheck}
            onChange={(e) => onChange({ useEventCheck: e.target.value })}
            placeholder="e.g., No specific events reported"
            className="h-8 text-xs"
          />
        </div>

        {/* Buyback Protection */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-3 w-3" />
            <Label className="text-[10px]">Buyback Protection</Label>
          </div>
          <Input
            value={data.buybackProtection}
            onChange={(e) => onChange({ buybackProtection: e.target.value })}
            placeholder="e.g., Qualifies Protection"
            className="h-8 text-xs"
          />
        </div>

        {/* Last Event Date */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <History className="h-3 w-3" />
            <Label className="text-[10px]">Last Event Date</Label>
          </div>
          <Input
            type="date"
            value={data.lastEventDate}
            onChange={(e) => onChange({ lastEventDate: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        {/* CARFAX URL */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3 w-3" />
            <Label className="text-[10px]">CARFAX URL (Optional)</Label>
          </div>
          <Input
            value={data.carfaxUrl || ""}
            onChange={(e) => onChange({ carfaxUrl: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleHistorySection;
