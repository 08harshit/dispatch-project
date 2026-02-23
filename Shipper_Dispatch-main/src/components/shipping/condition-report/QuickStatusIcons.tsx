import * as React from "react";
import { ConditionReport } from "@/types/conditionReport";
import ConditionIconButton from "./ConditionIconButton";
import {
  CleanIcon,
  ConditionDetailsIcon,
  InvoiceIcon,
  KeyFobsIcon,
  KeysIcon,
  NoStructuralDamageIcon,
  NotDrivableIcon,
  OtherOdorIcon,
  PriorPaintIcon,
  StartsIcon,
  TiresIcon,
  SmokeOdorIcon,
} from "./ConditionIcons";

type Props = {
  report: ConditionReport;
  onChange: (updates: Partial<ConditionReport>) => void;
};

const scrollToId = (id: string) => {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const QuickStatusIcons = ({ report, onChange }: Props) => {
  const tiresVariant = (() => {
    switch (report.tiresCondition) {
      case "good":
        return "positive" as const;
      case "fair":
        return "neutral" as const;
      case "poor":
      case "needs_replacement":
        return "negative" as const;
      default:
        return "neutral" as const;
    }
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ConditionDetailsIcon className="h-5 w-5 text-primary" />
        Quick Icons
      </div>

      <div className="flex flex-wrap gap-2">
        <ConditionIconButton
          icon={<ConditionDetailsIcon className="h-10 w-10" />}
          label="Condition Details"
          isActive
          variant="neutral"
          onClick={() => scrollToId("condition-details")}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<NoStructuralDamageIcon className="h-10 w-10" />}
          label="No Structural Damage"
          isActive={report.noStructuralDamage}
          variant="positive"
          onClick={() => onChange({ noStructuralDamage: !report.noStructuralDamage })}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<PriorPaintIcon className="h-10 w-10" />}
          label="Prior Paint"
          isActive={report.priorPaint}
          variant="negative"
          onClick={() => onChange({ priorPaint: !report.priorPaint })}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<TiresIcon className="h-10 w-10" />}
          label="Tires"
          isActive
          variant={tiresVariant}
          onClick={() => scrollToId("tires-condition")}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<CleanIcon className="h-10 w-10" />}
          label="Clean"
          isActive={report.clean}
          variant="positive"
          onClick={() => onChange({ clean: !report.clean })}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<NotDrivableIcon className="h-10 w-10" />}
          label="Not Drivable"
          isActive={report.notDrivable}
          variant="negative"
          onClick={() =>
            onChange({
              notDrivable: !report.notDrivable,
              // keep existing meaning consistent with current 3-state drivability UI
              runsAndDrives: !report.notDrivable ? "no" : report.runsAndDrives,
            })
          }
          useCustomIcon
        />

        <ConditionIconButton
          icon={<StartsIcon className="h-10 w-10" />}
          label="Starts"
          isActive={report.starts}
          variant="positive"
          onClick={() => onChange({ starts: !report.starts })}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<OtherOdorIcon className="h-10 w-10" />}
          label="Other Odor"
          isActive={report.otherOdor}
          variant="negative"
          onClick={() => onChange({ otherOdor: !report.otherOdor })}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<SmokeOdorIcon className="h-10 w-10" />}
          label="Smoke Odor"
          isActive={report.smokeOdor}
          variant="negative"
          onClick={() => onChange({ smokeOdor: !report.smokeOdor })}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<KeysIcon className="h-10 w-10" count={report.keysAvailable ? 1 : 0} />}
          label="Keys"
          isActive={report.keysAvailable}
          variant="positive"
          onClick={() => onChange({ keysAvailable: !report.keysAvailable })}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<KeyFobsIcon className="h-10 w-10" count={report.keyFobs} />}
          label="Fobs"
          isActive={report.keyFobs > 0}
          variant={report.keyFobs > 0 ? "positive" : "neutral"}
          onClick={() => scrollToId("key-fobs-controls")}
          useCustomIcon
        />

        <ConditionIconButton
          icon={<InvoiceIcon className="h-10 w-10" />}
          label="Invoice"
          isActive={report.invoiceAvailable}
          variant="positive"
          onClick={() => onChange({ invoiceAvailable: !report.invoiceAvailable })}
          useCustomIcon
        />
      </div>
    </div>
  );
};

export default QuickStatusIcons;
