import { cn } from "@/lib/utils";
import { Package, Truck, CheckCircle, XCircle, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface StatusTab {
  id: string;
  label: string;
  count: number;
}

interface StatusTabsProps {
  tabs: StatusTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
}

const getTabIcon = (tabId: string) => {
  const iconProps = { size: 18, strokeWidth: 2.5 };
  switch (tabId) {
    case "all":
      return <Package {...iconProps} />;
    case "not_assigned":
      return <XCircle {...iconProps} />;
    case "assigned":
      return <Truck {...iconProps} />;
    case "picked_up":
      return <Clock {...iconProps} />;
    case "delivered":
      return <CheckCircle {...iconProps} />;
    case "canceled":
      return <AlertTriangle {...iconProps} />;
    default:
      return <Package {...iconProps} />;
  }
};

const getTabColors = (tabId: string) => {
  switch (tabId) {
    case "not_assigned":
      return { 
        gradient: "from-slate-400 via-slate-500 to-slate-600",
        glow: "shadow-slate-500/40",
        light: "bg-slate-50 text-slate-600 border-slate-300",
        dot: "bg-slate-400",
        pulse: "bg-slate-400",
        ring: "ring-slate-400/30",
        particle: "#64748b"
      };
    case "assigned":
      return { 
        gradient: "from-amber-400 via-orange-500 to-red-500",
        glow: "shadow-amber-500/50",
        light: "bg-amber-50 text-amber-600 border-amber-300",
        dot: "bg-amber-400",
        pulse: "bg-amber-400",
        ring: "ring-amber-400/30",
        particle: "#f59e0b"
      };
    case "picked_up":
      return { 
        gradient: "from-blue-400 via-blue-500 to-indigo-500",
        glow: "shadow-blue-500/50",
        light: "bg-blue-50 text-blue-600 border-blue-300",
        dot: "bg-blue-400",
        pulse: "bg-blue-400",
        ring: "ring-blue-400/30",
        particle: "#3b82f6"
      };
    case "delivered":
      return { 
        gradient: "from-emerald-400 via-green-500 to-teal-500",
        glow: "shadow-emerald-500/50",
        light: "bg-emerald-50 text-emerald-600 border-emerald-300",
        dot: "bg-emerald-400",
        pulse: "bg-emerald-400",
        ring: "ring-emerald-400/30",
        particle: "#10b981"
      };
    case "canceled":
      return { 
        gradient: "from-red-400 via-rose-500 to-pink-500",
        glow: "shadow-red-500/50",
        light: "bg-red-50 text-red-600 border-red-300",
        dot: "bg-red-400",
        pulse: "bg-red-400",
        ring: "ring-red-400/30",
        particle: "#ef4444"
      };
    default:
      return { 
        gradient: "from-primary via-primary to-primary/80",
        glow: "shadow-primary/50",
        light: "bg-primary/10 text-primary border-primary/30",
        dot: "bg-primary",
        pulse: "bg-primary",
        ring: "ring-primary/30",
        particle: "hsl(36, 100%, 50%)"
      };
  }
};

const StatusTabs = ({ tabs, activeTab, onTabChange }: StatusTabsProps) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  // Particle burst effect on tab change
  const createParticleBurst = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const velocity = 2 + Math.random() * 3;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        size: 3 + Math.random() * 4,
        opacity: 1,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;
    
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            opacity: p.opacity - 0.05,
            velocityY: p.velocityY + 0.1,
          }))
          .filter(p => p.opacity > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  // Handle mouse move for magnetic effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  useEffect(() => {
    const activeButton = tabRefs.current[activeTab];
    const container = containerRef.current;
    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      setSliderStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeTab, tabs]);

  const handleTabClick = (tab: StatusTab, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      createParticleBurst(
        rect.left - containerRect.left + rect.width / 2,
        rect.top - containerRect.top + rect.height / 2,
        getTabColors(tab.id).particle
      );
    }
    onTabChange(tab.id);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex items-center gap-1 p-2 rounded-2xl bg-gradient-to-br from-white via-white to-muted/40 border border-border/60 shadow-xl shadow-black/8 w-full overflow-hidden backdrop-blur-sm"
    >
      {/* Ambient glow effect */}
      <div 
        className="absolute inset-0 opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${getTabColors(hoveredTab || activeTab).particle}20, transparent 40%)`,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              background: getTabColors(activeTab).particle,
              boxShadow: `0 0 ${particle.size * 2}px ${getTabColors(activeTab).particle}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Animated background slider */}
      <div
        className={cn(
          "absolute top-2 bottom-2 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          `bg-gradient-to-r ${getTabColors(activeTab).gradient}`,
          getTabColors(activeTab).glow,
          "shadow-2xl",
          isPressed && "scale-[0.98]"
        )}
        style={{
          left: sliderStyle.left,
          width: sliderStyle.width,
        }}
      >
        {/* 3D depth effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-xl bg-gradient-to-t from-black/10 to-transparent" />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Sparkle effect */}
        <div className="absolute top-1 right-2 opacity-80">
          <Sparkles size={12} className="text-white/60 animate-pulse" />
        </div>

        {/* Edge glow */}
        <div className={cn(
          "absolute -inset-1 rounded-xl opacity-50 blur-md -z-10",
          `bg-gradient-to-r ${getTabColors(activeTab).gradient}`
        )} />
      </div>

      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id;
        const colors = getTabColors(tab.id);

        return (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            onClick={(e) => handleTabClick(tab, e)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ease-out whitespace-nowrap group",
              isActive
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Magnetic hover background */}
            {!isActive && (
              <div 
                className={cn(
                  "absolute inset-1 rounded-xl transition-all duration-500",
                  isHovered ? "bg-muted/70 scale-100 opacity-100" : "scale-90 opacity-0",
                  colors.ring,
                  isHovered && "ring-2"
                )}
                style={{
                  transform: isHovered 
                    ? `scale(1) translate(${(mousePosition.x - (tabRefs.current[tab.id]?.offsetLeft || 0) - (tabRefs.current[tab.id]?.offsetWidth || 0) / 2) * 0.02}px, ${(mousePosition.y - 30) * 0.05}px)`
                    : 'scale(0.9)',
                }}
              />
            )}

            {/* Animated status indicator */}
            <span className="relative flex items-center justify-center w-3 h-3">
              <span className={cn(
                "absolute w-2.5 h-2.5 rounded-full transition-all duration-500",
                isActive 
                  ? "bg-white scale-100 shadow-lg shadow-white/50" 
                  : `${colors.dot} scale-75 opacity-80`
              )} />
              {/* Triple pulse for active */}
              {isActive && (
                <>
                  <span className="absolute w-2.5 h-2.5 rounded-full bg-white/60 animate-ping" />
                  <span className="absolute w-4 h-4 rounded-full bg-white/30 animate-[ping_1.5s_ease-out_infinite]" />
                  <span className="absolute w-5 h-5 rounded-full bg-white/20 animate-[ping_2s_ease-out_infinite]" />
                </>
              )}
              {/* Heartbeat for alerts */}
              {!isActive && (tab.id === "canceled" || tab.id === "not_assigned") && tab.count > 0 && (
                <span className={cn(
                  "absolute w-4 h-4 rounded-full animate-[ping_1s_ease-out_infinite]",
                  colors.pulse,
                  "opacity-40"
                )} />
              )}
            </span>
            
            {/* Icon with 3D transform */}
            <span className={cn(
              "relative transition-all duration-300 ease-out",
              isActive && "scale-125 drop-shadow-lg",
              isHovered && !isActive && "scale-110 -translate-y-1 rotate-3"
            )}>
              {getTabIcon(tab.id)}
            </span>
            
            {/* Label with gradient reveal */}
            <span className={cn(
              "relative transition-all duration-300 font-medium",
              isActive && "font-bold tracking-wide text-shadow-sm"
            )}>
              {tab.label}
              {isActive && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-white/40 rounded-full" />
              )}
            </span>
            
            {/* Count badge with bounce */}
            <span className={cn(
              "relative min-w-[26px] h-[26px] px-2 flex items-center justify-center rounded-xl text-[11px] font-bold transition-all duration-300 border-2",
              isActive
                ? "bg-white/30 text-white border-white/40 shadow-lg shadow-black/10 backdrop-blur-sm"
                : cn(colors.light, "border-transparent", isHovered && "scale-110 shadow-md -translate-y-0.5")
            )}>
              {tab.count}
              {/* Animated glow for high counts */}
              {tab.count > 5 && (
                <span className={cn(
                  "absolute inset-0 rounded-xl -z-10 animate-pulse",
                  isActive ? "bg-white/20 blur-sm" : `${colors.dot} opacity-30 blur-md`
                )} />
              )}
              {/* New indicator dot */}
              {tab.count > 0 && !isActive && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                  colors.dot,
                  "ring-2 ring-white shadow-sm"
                )} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StatusTabs;