import {
  Car,
  Check,
  X,
  HelpCircle,
  Plus,
  Minus,
  Gauge,
  AlertTriangle,
  Sofa,
  Settings,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ConditionReport,
  commonExteriorParts,
  commonInteriorParts,
  commonMechanicalParts,
} from "@/types/conditionReport";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import PhotoUploadSection from "./condition-report/PhotoUploadSection";
import VehicleDiagram from "./condition-report/VehicleDiagram";
import DamageItemsSection from "./condition-report/DamageItemsSection";
import VehicleHistorySection from "./condition-report/VehicleHistorySection";
import VehicleDetailsSection from "./condition-report/VehicleDetailsSection";
import AnnouncementsSection from "./condition-report/AnnouncementsSection";
import TiresWheelsSection from "./condition-report/TiresWheelsSection";
import VehicleSummaryHeader from "./condition-report/VehicleSummaryHeader";
import { KeyFobsIcon } from "./condition-report/ConditionIcons";
import QuickStatusIcons from "./condition-report/QuickStatusIcons";

interface ConditionReportFormProps {
  report: ConditionReport;
  onChange: (updates: Partial<ConditionReport>) => void;
  onComplete: () => void;
}

const ConditionReportForm = ({ report, onChange, onComplete }: ConditionReportFormProps) => {
  return (
    <div className="space-y-6 pb-4">
      <div className="space-y-6 pb-4">
        {/* Section 1: Vehicle Summary Header (specs strip) */}
        <div className="space-y-3">
          <VehicleSummaryHeader mileage={report.mileage} vehicleDetails={report.vehicleDetails} />
          
          {/* Mileage Input */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gauge className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Current Mileage</Label>
              <Input
                value={report.mileage}
                onChange={(e) => onChange({ mileage: e.target.value })}
                placeholder="Enter mileage..."
                className="mt-1 font-semibold text-lg h-10"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Quick Status Icons */}
        <QuickStatusIcons report={report} onChange={onChange} />

        <Separator className="my-4" />

        {/* Section 3: Announcements */}
        <AnnouncementsSection
          announcements={report.announcements}
          highValueOptions={report.highValueOptions}
          onAnnouncementsChange={(announcements) => onChange({ announcements })}
          onHighValueOptionsChange={(highValueOptions) => onChange({ highValueOptions })}
        />

        <Separator className="my-4" />

        {/* Section 4: Drivability Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Car className="h-4 w-4 text-primary" />
            Drivability Status
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Does the vehicle run and drive?</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ runsAndDrives: "yes", notDrivable: false })}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all flex-1 min-w-[120px]",
                  report.runsAndDrives === "yes"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center",
                    report.runsAndDrives === "yes" ? "bg-emerald-500/20" : "bg-muted/50"
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Runs & Drives</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ runsAndDrives: "no", notDrivable: false })}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all flex-1 min-w-[120px]",
                  report.runsAndDrives === "no" && !report.notDrivable
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center",
                    report.runsAndDrives === "no" && !report.notDrivable
                      ? "bg-amber-500/20"
                      : "bg-muted/50"
                  )}
                >
                  <HelpCircle className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Run Only</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ runsAndDrives: "no", notDrivable: true })}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all flex-1 min-w-[120px]",
                  report.notDrivable
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center",
                    report.notDrivable ? "bg-rose-500/20" : "bg-muted/50"
                  )}
                >
                  <X className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Non Runner</span>
              </button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Section 5: Condition Details - Damage Items */}
        <div id="condition-details" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Condition Details
          </div>

          {/* Vehicle Damage Diagram */}
          <VehicleDiagram
            damageAreas={report.damageAreas}
            onChange={(updates) => onChange({ damageAreas: { ...report.damageAreas, ...updates } })}
          />

          {/* Exterior Damage */}
          <DamageItemsSection
            title="Exterior Damage"
            icon={<ExternalLink className="h-4 w-4 text-rose-500" />}
            items={report.exteriorDamageItems}
            onChange={(items) => onChange({ exteriorDamageItems: items })}
            commonParts={commonExteriorParts}
            defaultType="paint_and_body"
          />

          {/* Interior Damage */}
          <DamageItemsSection
            title="Interior Damage"
            icon={<Sofa className="h-4 w-4 text-amber-500" />}
            items={report.interiorDamageItems}
            onChange={(items) => onChange({ interiorDamageItems: items })}
            commonParts={commonInteriorParts}
            defaultType="interior"
          />

          {/* Other / Mechanical */}
          <DamageItemsSection
            title="Other / Mechanical"
            icon={<Settings className="h-4 w-4 text-blue-500" />}
            items={report.mechanicalIssues}
            onChange={(items) => onChange({ mechanicalIssues: items })}
            commonParts={commonMechanicalParts}
            defaultType="mechanical"
          />

          {/* Structural Issues */}
          <DamageItemsSection
            title="Structural Issues"
            icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
            items={report.structuralIssues}
            onChange={(items) => onChange({ structuralIssues: items })}
            commonParts={[
              "Frame",
              "Unibody",
              "A-Pillar",
              "B-Pillar",
              "C-Pillar",
              "Floor Pan",
              "Firewall",
              "Roof Rail",
            ]}
            defaultType="structural"
          />
        </div>

        <Separator className="my-4" />

        {/* Section 6: Tires & Wheels */}
        <div id="tires-condition" className="scroll-mt-24">
          <TiresWheelsSection
            data={report.tiresWheels}
            onChange={(tiresWheels) => onChange({ tiresWheels })}
          />
        </div>

        <Separator className="my-4" />

        {/* Section 7: History */}
        <VehicleHistorySection
          data={report.vehicleHistory}
          onChange={(updates) =>
            onChange({ vehicleHistory: { ...report.vehicleHistory, ...updates } })
          }
        />

        <Separator className="my-4" />

        {/* Section 8: Details */}
        <VehicleDetailsSection
          data={report.vehicleDetails}
          onChange={(updates) =>
            onChange({ vehicleDetails: { ...report.vehicleDetails, ...updates } })
          }
        />

        <Separator className="my-4" />

        {/* Section 9: Keys & Accessories */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <KeyFobsIcon className="h-5 w-5 text-primary" count={report.keyFobs} />
            Keys & Accessories
          </div>

          <div
            id="key-fobs-controls"
            className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/40 bg-muted/30 scroll-mt-24 max-w-xs"
          >
            <span className="text-xs font-medium text-muted-foreground">Key Fobs Count</span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onChange({ keyFobs: Math.max(0, report.keyFobs - 1) })}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg">{report.keyFobs}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onChange({ keyFobs: report.keyFobs + 1 })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Section 10: Photos */}
        <PhotoUploadSection photos={report.photos} onChange={(photos) => onChange({ photos })} />

        {/* Section 11: Additional Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Additional Condition Notes</Label>
          <Textarea
            placeholder="Describe any additional damage, issues, or notes about the vehicle condition..."
            value={report.conditionNotes}
            onChange={(e) => onChange({ conditionNotes: e.target.value })}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Section 12: Mechanic Comments & Estimates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mechanic Comments</Label>
            <Textarea
              placeholder="Add mechanic's assessment notes..."
              value={report.mechanicComments}
              onChange={(e) => onChange({ mechanicComments: e.target.value })}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Estimated Repair Cost</Label>
            <Input
              value={report.estimatedRepairCost}
              onChange={(e) => onChange({ estimatedRepairCost: e.target.value })}
              placeholder="$0.00"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionReportForm;
