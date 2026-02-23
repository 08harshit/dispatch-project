import { cn } from "@/lib/utils";

interface DamageAreas {
  frontBumper: boolean;
  rearBumper: boolean;
  hoodRoof: boolean;
  leftSide: boolean;
  rightSide: boolean;
  windshield: boolean;
  rearWindow: boolean;
}

interface VehicleDiagramProps {
  damageAreas: DamageAreas;
  onChange: (areas: Partial<DamageAreas>) => void;
  readOnly?: boolean;
}

const VehicleDiagram = ({ damageAreas, onChange, readOnly = false }: VehicleDiagramProps) => {
  const toggleArea = (area: keyof DamageAreas) => {
    if (readOnly) return;
    onChange({ [area]: !damageAreas[area] });
  };

  const getAreaStyle = (isDamaged: boolean) => {
    if (isDamaged) {
      return "fill-rose-500/40 stroke-rose-500 cursor-pointer hover:fill-rose-500/50";
    }
    return readOnly 
      ? "fill-emerald-500/20 stroke-emerald-500/50" 
      : "fill-muted/30 stroke-border hover:fill-primary/20 hover:stroke-primary/50 cursor-pointer";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Body Damage Areas</span>
        {!readOnly && (
          <span className="text-xs text-muted-foreground">Click to mark damage</span>
        )}
      </div>
      
      <div className="flex justify-center p-6 bg-muted/20 rounded-xl border border-border/30">
        <svg
          viewBox="0 0 200 100"
          className="w-full max-w-[300px]"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        >
          {/* Car Body - Top View */}
          <g transform="translate(20, 10)">
            {/* Main body outline */}
            <path
              d="M30 0 L130 0 Q160 0 160 20 L160 60 Q160 80 130 80 L30 80 Q0 80 0 60 L0 20 Q0 0 30 0"
              className="fill-card stroke-border stroke-2"
            />
            
            {/* Front Bumper */}
            <rect
              x="140"
              y="15"
              width="18"
              height="50"
              rx="4"
              onClick={() => toggleArea('frontBumper')}
              className={cn("stroke-2 transition-all", getAreaStyle(damageAreas.frontBumper))}
            />
            
            {/* Rear Bumper */}
            <rect
              x="2"
              y="15"
              width="18"
              height="50"
              rx="4"
              onClick={() => toggleArea('rearBumper')}
              className={cn("stroke-2 transition-all", getAreaStyle(damageAreas.rearBumper))}
            />
            
            {/* Hood/Roof */}
            <rect
              x="50"
              y="20"
              width="60"
              height="40"
              rx="4"
              onClick={() => toggleArea('hoodRoof')}
              className={cn("stroke-2 transition-all", getAreaStyle(damageAreas.hoodRoof))}
            />
            
            {/* Windshield */}
            <rect
              x="115"
              y="25"
              width="20"
              height="30"
              rx="2"
              onClick={() => toggleArea('windshield')}
              className={cn("stroke-2 transition-all", getAreaStyle(damageAreas.windshield))}
            />
            
            {/* Rear Window */}
            <rect
              x="25"
              y="25"
              width="20"
              height="30"
              rx="2"
              onClick={() => toggleArea('rearWindow')}
              className={cn("stroke-2 transition-all", getAreaStyle(damageAreas.rearWindow))}
            />
            
            {/* Left Side */}
            <rect
              x="25"
              y="2"
              width="110"
              height="12"
              rx="3"
              onClick={() => toggleArea('leftSide')}
              className={cn("stroke-2 transition-all", getAreaStyle(damageAreas.leftSide))}
            />
            
            {/* Right Side */}
            <rect
              x="25"
              y="66"
              width="110"
              height="12"
              rx="3"
              onClick={() => toggleArea('rightSide')}
              className={cn("stroke-2 transition-all", getAreaStyle(damageAreas.rightSide))}
            />
            
            {/* Wheels */}
            <circle cx="40" cy="0" r="8" className="fill-foreground/20 stroke-foreground/40 stroke-2" />
            <circle cx="120" cy="0" r="8" className="fill-foreground/20 stroke-foreground/40 stroke-2" />
            <circle cx="40" cy="80" r="8" className="fill-foreground/20 stroke-foreground/40 stroke-2" />
            <circle cx="120" cy="80" r="8" className="fill-foreground/20 stroke-foreground/40 stroke-2" />
          </g>
          
          {/* Direction indicator */}
          <text x="175" y="55" className="fill-muted-foreground text-[8px] font-medium">FRONT</text>
          <text x="5" y="55" className="fill-muted-foreground text-[8px] font-medium">REAR</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-500/40 border border-rose-500" />
          <span className="text-muted-foreground">Damaged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/30 border border-border" />
          <span className="text-muted-foreground">No Damage</span>
        </div>
      </div>
    </div>
  );
};

export default VehicleDiagram;
