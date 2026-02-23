import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Car, ImagePlus, Check, X, ChevronDown, AlertTriangle } from "lucide-react";
import { VehicleEntry } from "@/types/vehicle";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface VehicleEntryCardProps {
  vehicle: VehicleEntry;
  index: number;
  onUpdate: (id: string, updates: Partial<VehicleEntry>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const VehicleEntryCard = ({ vehicle, index, onUpdate, onRemove, canRemove }: VehicleEntryCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(true);
  
  const updateCondition = (key: keyof typeof vehicle.condition, value: boolean) => {
    onUpdate(vehicle.id, {
      condition: { ...vehicle.condition, [key]: value }
    });
  };

  const vehicleTitle = vehicle.year && vehicle.make 
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model || ''}`.trim() 
    : `Vehicle ${index + 1}`;

  const conditionItems = [
    { key: 'runs', label: 'Runs', positive: true },
    { key: 'rolls', label: 'Rolls', positive: true },
    { key: 'starts', label: 'Starts', positive: true },
    { key: 'damaged', label: 'Damaged', positive: false }
  ] as const;

  return (
    <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center">
              <Car size={16} className="text-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{vehicleTitle}</h3>
              {vehicle.vin && (
                <p className="text-[10px] font-mono text-muted-foreground">{vehicle.vin}</p>
              )}
            </div>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(vehicle.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* VIN Input - Always Visible */}
      <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-foreground/80">VIN</Label>
            {vehicle.vin && (
              <span className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded",
                vehicle.vin.length === 17 
                  ? "bg-teal-500/10 text-teal-600" 
                  : "bg-muted text-muted-foreground"
              )}>
                {vehicle.vin.length}/17
              </span>
            )}
          </div>
          <Input
            placeholder="Enter 17-character VIN"
            value={vehicle.vin}
            onChange={(e) => onUpdate(vehicle.id, { vin: e.target.value.toUpperCase() })}
            maxLength={17}
            className="font-mono uppercase h-11 bg-background border-border/50 tracking-widest text-sm"
          />
        </div>
      </div>

      {/* Vehicle Details Collapsible */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-medium text-foreground/70">Vehicle Details</span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              detailsOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-4">
            {/* Year, Make, Model Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Year</Label>
                <Input
                  placeholder="2024"
                  value={vehicle.year}
                  onChange={(e) => onUpdate(vehicle.id, { year: e.target.value })}
                  maxLength={4}
                  className="h-9 text-sm bg-muted/30 border-border/40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Make</Label>
                <Input
                  placeholder="Toyota"
                  value={vehicle.make}
                  onChange={(e) => onUpdate(vehicle.id, { make: e.target.value })}
                  className="h-9 text-sm bg-muted/30 border-border/40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Model</Label>
                <Input
                  placeholder="Camry"
                  value={vehicle.model}
                  onChange={(e) => onUpdate(vehicle.id, { model: e.target.value })}
                  className="h-9 text-sm bg-muted/30 border-border/40"
                />
              </div>
            </div>

            {/* Type & Color */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Type</Label>
                <Input
                  placeholder="Sedan, SUV..."
                  value={vehicle.type}
                  onChange={(e) => onUpdate(vehicle.id, { type: e.target.value })}
                  className="h-9 text-sm bg-muted/30 border-border/40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Color</Label>
                <Input
                  placeholder="White"
                  value={vehicle.color}
                  onChange={(e) => onUpdate(vehicle.id, { color: e.target.value })}
                  className="h-9 text-sm bg-muted/30 border-border/40"
                />
              </div>
            </div>

            {/* Condition Pills */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">Condition</Label>
              <div className="flex flex-wrap gap-2">
                {conditionItems.map((item) => {
                  const isChecked = vehicle.condition[item.key];
                  const isDamaged = item.key === 'damaged';
                  
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateCondition(item.key, !isChecked)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        isChecked
                          ? isDamaged
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-700"
                            : "bg-foreground/5 border-foreground/20 text-foreground"
                          : "bg-muted/30 border-border/30 text-muted-foreground hover:border-border"
                      )}
                    >
                      {isChecked ? (
                        isDamaged ? (
                          <AlertTriangle size={12} />
                        ) : (
                          <Check size={12} />
                        )
                      ) : (
                        <X size={12} className="opacity-50" />
                      )}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condition Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/80">Notes</Label>
              <Textarea
                placeholder="Describe any damage or issues..."
                value={vehicle.conditionNotes}
                onChange={(e) => onUpdate(vehicle.id, { conditionNotes: e.target.value })}
                rows={2}
                className="text-sm bg-muted/30 border-border/40 resize-none"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/80">Photos</Label>
              <div className="border border-dashed border-border/50 rounded-xl p-6 text-center hover:border-foreground/30 hover:bg-muted/20 transition-all cursor-pointer group">
                <div className="w-10 h-10 mx-auto rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ImagePlus className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Drop photos here or click to upload
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default VehicleEntryCard;
