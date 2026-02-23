import { 
  Car, 
  Check,
  X,
  FileText,
  Calendar,
  Gauge,
  Lightbulb,
  Wrench,
  Droplets,
  AlertTriangle,
  AlertCircle,
  Minus,
  Camera,
  DollarSign,
  MessageSquare,
  Circle,
  History,
  Shield,
  Users,
  Star,
  Megaphone,
  ExternalLink,
  Sofa,
  Settings,
  Palette,
  Fuel,
  MapPin,
  Disc,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConditionReport, ConditionStatus, DamageItem } from "@/types/conditionReport";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import VehicleDiagram from "./condition-report/VehicleDiagram";
import ConditionIconButton from "./condition-report/ConditionIconButton";
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
} from "./condition-report/ConditionIcons";

interface ConditionReportPreviewProps {
  report: ConditionReport;
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    vin: string;
  };
  pdfFile?: File | null;
}

const getStatusIcon = (status: ConditionStatus) => {
  switch (status) {
    case 'okay':
      return <Check className="h-3 w-3" />;
    case 'may_need_future':
      return <AlertTriangle className="h-3 w-3" />;
    case 'attention':
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <Minus className="h-3 w-3" />;
  }
};

const getStatusColor = (status: ConditionStatus) => {
  switch (status) {
    case 'okay':
      return 'bg-emerald-500 text-white';
    case 'may_need_future':
      return 'bg-amber-400 text-white';
    case 'attention':
      return 'bg-rose-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDamageConditionColor = (condition: string) => {
  switch (condition) {
    case 'severe_damage':
    case 'broken':
    case 'cracked':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    case 'worn':
    case 'gouged':
    case 'dent':
    case 'scratched':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'missing':
    case 'flat':
      return 'bg-rose-600/10 text-rose-700 border-rose-600/20';
    default:
      return 'bg-muted/30 text-muted-foreground border-border/30';
  }
};

interface ChecklistPreviewProps {
  title: string;
  icon: React.ReactNode;
  items: { label: string; status: ConditionStatus }[];
}

const ChecklistPreview = ({ title, icon, items }: ChecklistPreviewProps) => {
  const checkedItems = items.filter(item => item.status !== 'not_checked');
  if (checkedItems.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checkedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/20 border border-border/20"
          >
            <div className={cn("w-5 h-5 rounded flex items-center justify-center", getStatusColor(item.status))}>
              {getStatusIcon(item.status)}
            </div>
            <span className="text-[10px] flex-1 truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DamageTableProps {
  title: string;
  icon: React.ReactNode;
  items: DamageItem[];
  bgColor?: string;
}

const DamageTable = ({ title, icon, items, bgColor = 'bg-rose-500/5' }: DamageTableProps) => {
  if (items.length === 0) return null;

  return (
    <div className={cn("rounded-xl border overflow-hidden", bgColor)}>
      <div className="flex items-center gap-2 px-4 py-2 bg-background/50 border-b">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Condition</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Additional Info</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-background/30' : 'bg-background/50'}>
                <td className="px-3 py-2 font-medium">{item.description}</td>
                <td className="px-3 py-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", getDamageConditionColor(item.condition))}>
                    {item.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{item.additionalInfo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ConditionReportPreview = ({ report, vehicleInfo, pdfFile }: ConditionReportPreviewProps) => {
  const vehicleTitle = `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`;

  // If PDF is uploaded, show PDF preview
  if (pdfFile && report.pdfReportUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
          <FileText className="h-6 w-6 text-rose-600" />
          <div>
            <p className="font-medium">{pdfFile.name}</p>
            <p className="text-sm text-muted-foreground">Uploaded PDF Condition Report</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/20">
          <iframe 
            src={report.pdfReportUrl} 
            className="w-full h-[500px]"
            title="Condition Report PDF"
          />
        </div>
      </div>
    );
  }

  // Show form-based report preview
  const getDrivabilityStatus = () => {
    if (report.runsAndDrives === 'yes') return { label: 'Runs & Drives', variant: 'positive' as const };
    if (report.notDrivable) return { label: 'Non Runner', variant: 'negative' as const };
    return { label: 'Run Only', variant: 'warning' as const };
  };

  const drivability = getDrivabilityStatus();

  const exteriorItems = [
    { label: 'Head Lights', status: report.exteriorChecklist.headLights },
    { label: 'Tail Lights', status: report.exteriorChecklist.tailLights },
    { label: 'Turn Signals', status: report.exteriorChecklist.turnSignals },
    { label: 'Wipers', status: report.exteriorChecklist.windshieldWipers },
    { label: 'Windshield', status: report.exteriorChecklist.windshieldCondition },
    { label: 'Mirrors', status: report.exteriorChecklist.mirrors },
    { label: 'Horn', status: report.exteriorChecklist.horn },
    { label: 'Interior', status: report.exteriorChecklist.carpetUpholstery },
  ];

  const underVehicleItems = [
    { label: 'Shocks', status: report.underVehicle.shockAbsorbers },
    { label: 'Steering', status: report.underVehicle.steeringLinkage },
    { label: 'Exhaust', status: report.underVehicle.mufflerExhaust },
    { label: 'Oil Leaks', status: report.underVehicle.engineOilLeaks },
    { label: 'Brake Lines', status: report.underVehicle.brakeLines },
    { label: 'Drive Shaft', status: report.underVehicle.driveShaft },
    { label: 'Transmission', status: report.underVehicle.transmission },
    { label: 'Fuel Lines', status: report.underVehicle.fuelLines },
  ];

  const underHoodItems = [
    { label: 'Fluids', status: report.underHood.fluidLevels },
    { label: 'Air Filter', status: report.underHood.engineAirFilter },
    { label: 'Belts', status: report.underHood.driveBelts },
    { label: 'Cooling', status: report.underHood.coolingSystem },
    { label: 'Radiator', status: report.underHood.radiator },
    { label: 'Battery', status: report.underHood.battery },
    { label: 'Coolant', status: report.underHood.coolantReservoir },
  ];

  const hasDamage = Object.values(report.damageAreas).some(v => v);
  const totalDamageItems = report.exteriorDamageItems.length + report.interiorDamageItems.length + report.mechanicalIssues.length + report.structuralIssues.length;

  return (
    <div className="space-y-6 pb-4">
        {/* Header */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between relative">
            <div>
              <h2 className="text-xl font-bold">{vehicleTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">VIN: {vehicleInfo.vin || 'N/A'}</p>
              {report.mileage && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span className="font-medium">{report.mileage} miles</span>
                </div>
              )}
              {/* Vehicle specs line */}
              {(report.vehicleDetails.driveType || report.vehicleDetails.engine || report.vehicleDetails.fuelType) && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {report.vehicleDetails.driveType && <span>{report.vehicleDetails.driveType}</span>}
                  {report.vehicleDetails.engine && <><span>•</span><span>{report.vehicleDetails.engine}</span></>}
                  {report.vehicleDetails.fuelType && <><span>•</span><span>{report.vehicleDetails.fuelType}</span></>}
                  {report.vehicleDetails.transmission && <><span>•</span><span>{report.vehicleDetails.transmission}</span></>}
                  {report.vehicleDetails.seatMaterial && <><span>•</span><span>{report.vehicleDetails.seatMaterial}</span></>}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(report.updatedAt, 'MMM dd, yyyy')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">ID: {report.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Announcements */}
        {report.announcements.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <Megaphone className="h-4 w-4" />
              Announcements
            </div>
            <ul className="space-y-1">
              {report.announcements.map((announcement, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {announcement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* High Value Options */}
        {report.highValueOptions.length > 0 && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Star className="h-4 w-4" />
              High Value Options
            </div>
            <div className="flex flex-wrap gap-1.5">
              {report.highValueOptions.map((option, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Drivability Status - Main Badge */}
        <div className="flex justify-center">
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-2xl border-2 shadow-lg",
            drivability.variant === 'positive' 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : drivability.variant === 'negative'
                ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              drivability.variant === 'positive' 
                ? "bg-emerald-500/20"
                : drivability.variant === 'negative'
                  ? "bg-rose-500/20"
                  : "bg-amber-500/20"
            )}>
              <Car className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xl font-bold">{drivability.label}</p>
              <p className="text-xs opacity-80">Drivability Status</p>
            </div>
          </div>
        </div>

        {/* Quick Icons Grid */}
        <div className="flex flex-wrap justify-center gap-2">
          <ConditionIconButton
            icon={<ConditionDetailsIcon className="h-10 w-10" />}
            label="Condition Details"
            isActive
            variant="neutral"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<NoStructuralDamageIcon className="h-10 w-10" />}
            label="No Structural Damage"
            isActive={report.noStructuralDamage}
            variant="positive"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<PriorPaintIcon className="h-10 w-10" />}
            label="Prior Paint"
            isActive={report.priorPaint}
            variant="negative"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<TiresIcon className="h-10 w-10" />}
            label="Tires"
            isActive
            variant={report.tiresCondition === 'good' ? 'positive' : report.tiresCondition === 'fair' ? 'neutral' : 'negative'}
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<CleanIcon className="h-10 w-10" />}
            label="Clean"
            isActive={report.clean}
            variant="positive"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<NotDrivableIcon className="h-10 w-10" />}
            label="Not Drivable"
            isActive={report.notDrivable}
            variant="negative"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<StartsIcon className="h-10 w-10" />}
            label="Starts"
            isActive={report.starts}
            variant="positive"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<OtherOdorIcon className="h-10 w-10" />}
            label="Other Odor"
            isActive={report.otherOdor}
            variant="negative"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<SmokeOdorIcon className="h-10 w-10" />}
            label="Smoke Odor"
            isActive={report.smokeOdor}
            variant="negative"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<KeysIcon className="h-10 w-10" count={report.keysAvailable ? 1 : 0} />}
            label="Keys"
            isActive={report.keysAvailable}
            variant="positive"
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<KeyFobsIcon className="h-10 w-10" count={report.keyFobs} />}
            label="Fobs"
            isActive={report.keyFobs > 0}
            variant={report.keyFobs > 0 ? 'positive' : 'neutral'}
            onClick={() => {}}
            useCustomIcon
          />
          <ConditionIconButton
            icon={<InvoiceIcon className="h-10 w-10" />}
            label="Invoice"
            isActive={report.invoiceAvailable}
            variant="positive"
            onClick={() => {}}
            useCustomIcon
          />
        </div>

        {/* Vehicle Details */}
        {(report.vehicleDetails.exteriorColor || report.vehicleDetails.interiorColor || report.vehicleDetails.titleState) && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Car className="h-4 w-4 text-primary" />
              Vehicle Details
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {report.vehicleDetails.exteriorColor && (
                <div className="flex items-center gap-2">
                  <Palette className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Exterior:</span>
                  <span className="font-medium">{report.vehicleDetails.exteriorColor}</span>
                </div>
              )}
              {report.vehicleDetails.interiorColor && (
                <div className="flex items-center gap-2">
                  <Palette className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Interior:</span>
                  <span className="font-medium">{report.vehicleDetails.interiorColor}</span>
                </div>
              )}
              {report.vehicleDetails.titleState && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Title State:</span>
                  <span className="font-medium">{report.vehicleDetails.titleState}</span>
                </div>
              )}
              {report.vehicleDetails.msrp && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">MSRP:</span>
                  <span className="font-medium">{report.vehicleDetails.msrp}</span>
                </div>
              )}
              {report.vehicleDetails.inspectionLocation && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Inspection:</span>
                  <span className="font-medium">{report.vehicleDetails.inspectionLocation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body Damage Diagram */}
        {hasDamage && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <VehicleDiagram
              damageAreas={report.damageAreas}
              onChange={() => {}}
              readOnly
            />
          </div>
        )}

        {/* Damage Items Tables */}
        {totalDamageItems > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Condition Details
              <Badge variant="destructive" className="text-xs">{totalDamageItems} items</Badge>
            </div>

            <DamageTable
              title="Exterior"
              icon={<ExternalLink className="h-4 w-4 text-rose-500" />}
              items={report.exteriorDamageItems}
              bgColor="bg-rose-500/5 border-rose-500/20"
            />

            <DamageTable
              title="Interior"
              icon={<Sofa className="h-4 w-4 text-amber-500" />}
              items={report.interiorDamageItems}
              bgColor="bg-amber-500/5 border-amber-500/20"
            />

            <DamageTable
              title="Mechanical"
              icon={<Settings className="h-4 w-4 text-blue-500" />}
              items={report.mechanicalIssues}
              bgColor="bg-blue-500/5 border-blue-500/20"
            />

            <DamageTable
              title="Structural"
              icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
              items={report.structuralIssues}
              bgColor="bg-rose-600/5 border-rose-600/20"
            />
          </div>
        )}

        <Separator />

        {/* Inspection Checklists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChecklistPreview
            title="Interior / Exterior"
            icon={<Lightbulb className="h-3 w-3 text-primary" />}
            items={exteriorItems}
          />
          <ChecklistPreview
            title="Under Vehicle"
            icon={<Wrench className="h-3 w-3 text-primary" />}
            items={underVehicleItems}
          />
          <ChecklistPreview
            title="Under Hood"
            icon={<Droplets className="h-3 w-3 text-primary" />}
            items={underHoodItems}
          />
        </div>

        {/* Tires & Wheels Table */}
        {(report.tiresWheels.leftFront.tread || report.tiresWheels.rightFront.tread || report.tiresWheels.leftRear.tread || report.tiresWheels.rightRear.tread) && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Disc className="h-4 w-4 text-primary" />
              Tires & Wheels
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Wheels</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Left Front</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Right Front</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Left Rear</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Right Rear</th>
                    {report.tiresWheels.spare && (
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Spare</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/10">
                    <td className="py-2 px-2 font-medium text-muted-foreground">Type</td>
                    <td className="py-2 px-2 text-center capitalize">{report.tiresWheels.leftFront.type}</td>
                    <td className="py-2 px-2 text-center capitalize">{report.tiresWheels.rightFront.type}</td>
                    <td className="py-2 px-2 text-center capitalize">{report.tiresWheels.leftRear.type}</td>
                    <td className="py-2 px-2 text-center capitalize">{report.tiresWheels.rightRear.type}</td>
                    {report.tiresWheels.spare && (
                      <td className="py-2 px-2 text-center capitalize">{report.tiresWheels.spare.type}</td>
                    )}
                  </tr>
                  <tr className="border-b border-border/10">
                    <td className="py-2 px-2 font-medium text-muted-foreground">Tread</td>
                    <td className="py-2 px-2 text-center font-mono">{report.tiresWheels.leftFront.tread || '-'}</td>
                    <td className="py-2 px-2 text-center font-mono">{report.tiresWheels.rightFront.tread || '-'}</td>
                    <td className="py-2 px-2 text-center font-mono">{report.tiresWheels.leftRear.tread || '-'}</td>
                    <td className="py-2 px-2 text-center font-mono">{report.tiresWheels.rightRear.tread || '-'}</td>
                    {report.tiresWheels.spare && (
                      <td className="py-2 px-2 text-center font-mono">{report.tiresWheels.spare.tread || 'N/A'}</td>
                    )}
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-medium text-muted-foreground">Size</td>
                    <td className="py-2 px-2 text-center font-mono text-[10px]">{report.tiresWheels.leftFront.size || '-'}</td>
                    <td className="py-2 px-2 text-center font-mono text-[10px]">{report.tiresWheels.rightFront.size || '-'}</td>
                    <td className="py-2 px-2 text-center font-mono text-[10px]">{report.tiresWheels.leftRear.size || '-'}</td>
                    <td className="py-2 px-2 text-center font-mono text-[10px]">{report.tiresWheels.rightRear.size || '-'}</td>
                    {report.tiresWheels.spare && (
                      <td className="py-2 px-2 text-center font-mono text-[10px]">{report.tiresWheels.spare.size || 'N/A'}</td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Brakes Summary */}
        {(report.brakesTires.brakePads !== 'not_checked' || report.brakesTires.rotorsDrums !== 'not_checked') && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Circle className="h-3 w-3 text-primary" />
              Brakes
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {report.brakesTires.brakePads !== 'not_checked' && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-background/50 border border-border/20">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center", getStatusColor(report.brakesTires.brakePads))}>
                    {getStatusIcon(report.brakesTires.brakePads)}
                  </div>
                  <span className="text-[10px]">Brake Pads</span>
                </div>
              )}
              {report.brakesTires.rotorsDrums !== 'not_checked' && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-background/50 border border-border/20">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center", getStatusColor(report.brakesTires.rotorsDrums))}>
                    {getStatusIcon(report.brakesTires.rotorsDrums)}
                  </div>
                  <span className="text-[10px]">Rotors/Drums</span>
                </div>
              )}
              {report.brakesTires.alignmentNeeded && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] text-amber-700">Alignment Needed</span>
                </div>
              )}
              {report.brakesTires.wheelBalanceNeeded && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] text-amber-700">Balance Needed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vehicle History */}
        {(report.vehicleHistory.historicalEvents > 0 || report.vehicleHistory.calculatedOwners > 0 || report.vehicleHistory.titleCheck) && (
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
              <History className="h-4 w-4" />
              Vehicle History
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {report.vehicleHistory.historicalEvents > 0 && (
                <div className="p-2 rounded-lg bg-background/50 border border-border/20 text-center">
                  <p className="text-lg font-bold text-blue-600">{report.vehicleHistory.historicalEvents}</p>
                  <p className="text-[10px] text-muted-foreground">Historical Events</p>
                </div>
              )}
              {report.vehicleHistory.calculatedOwners > 0 && (
                <div className="p-2 rounded-lg bg-background/50 border border-border/20 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <p className="text-lg font-bold">{report.vehicleHistory.calculatedOwners}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Owners</p>
                </div>
              )}
              <div className="p-2 rounded-lg bg-background/50 border border-border/20 text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className={cn("h-4 w-4", report.vehicleHistory.calculatedAccidents === 0 ? "text-emerald-500" : "text-rose-500")} />
                  <p className="text-lg font-bold">{report.vehicleHistory.calculatedAccidents}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Accidents</p>
              </div>
              {report.vehicleHistory.lastReportedMileage && (
                <div className="p-2 rounded-lg bg-background/50 border border-border/20 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Gauge className="h-4 w-4 text-blue-500" />
                    <p className="text-lg font-bold">{report.vehicleHistory.lastReportedMileage}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Last Mileage</p>
                </div>
              )}
            </div>
            {(report.vehicleHistory.titleCheck || report.vehicleHistory.odometerCheck) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {report.vehicleHistory.titleCheck && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700">
                    <Shield className="h-3 w-3" />
                    Title: {report.vehicleHistory.titleCheck}
                  </div>
                )}
                {report.vehicleHistory.odometerCheck && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700">
                    <Gauge className="h-3 w-3" />
                    Odometer: {report.vehicleHistory.odometerCheck}
                  </div>
                )}
                {report.vehicleHistory.buybackProtection && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                    <Shield className="h-3 w-3" />
                    {report.vehicleHistory.buybackProtection}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {report.photos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Camera className="h-3 w-3 text-primary" />
              Damage Photos ({report.photos.length})
            </div>
            <div className="grid grid-cols-4 gap-2">
              {report.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden border border-border/30"
                >
                  <img
                    src={photo}
                    alt={`Damage photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {(report.conditionNotes || report.mechanicComments || report.estimatedRepairCost) && (
          <div className="space-y-3">
            {report.conditionNotes && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                  <MessageSquare className="h-3 w-3 text-primary" />
                  Additional Notes
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.conditionNotes}
                </p>
              </div>
            )}
            
            {report.mechanicComments && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-blue-700 dark:text-blue-400">
                  <Wrench className="h-3 w-3" />
                  Mechanic Comments
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.mechanicComments}
                </p>
              </div>
            )}
            
            {report.estimatedRepairCost && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <DollarSign className="h-3 w-3 text-primary" />
                    Estimated Repair Cost
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {report.estimatedRepairCost}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );
};

export default ConditionReportPreview;
