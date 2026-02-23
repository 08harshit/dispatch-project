import { cn } from "@/lib/utils";
import { FileText, CheckCircle, Clock, Timer, Sparkles } from "lucide-react";

interface StatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: {
    id: string;
    label: string;
    count: number;
  }[];
}

const tabConfig: Record<string, { icon: typeof FileText; gradient: string; lightBg: string; text: string; shadow: string }> = {
  all: { 
    icon: FileText, 
    gradient: "from-stone-300 to-stone-400",
    lightBg: "from-stone-50/80 to-stone-100/80",
    text: "text-stone-500",
    shadow: "shadow-stone-300/20"
  },
  paid: { 
    icon: CheckCircle, 
    gradient: "from-emerald-300 to-green-300",
    lightBg: "from-emerald-50/80 to-green-50/80",
    text: "text-emerald-500",
    shadow: "shadow-emerald-300/20"
  },
  processing: { 
    icon: Clock, 
    gradient: "from-sky-300 to-blue-400",
    lightBg: "from-sky-50/80 to-blue-50/80",
    text: "text-sky-500",
    shadow: "shadow-sky-300/20"
  },
  pending: { 
    icon: Timer, 
    gradient: "from-amber-300 to-orange-300",
    lightBg: "from-amber-50/80 to-orange-50/80",
    text: "text-amber-500",
    shadow: "shadow-amber-300/20"
  },
};

export const StatusTabs = ({ activeTab, onTabChange, tabs }: StatusTabsProps) => {
  return (
    <div className="relative">
      <div className="flex items-center gap-1 p-1.5 bg-white rounded-2xl shadow-md shadow-stone-200/50 border border-stone-100">
        {tabs.map((tab) => {
          const config = tabConfig[tab.id] || tabConfig.all;
          const Icon = config.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                isActive
                  ? `bg-gradient-to-r ${config.lightBg} shadow-lg ${config.shadow}`
                  : "text-stone-400 hover:text-stone-600 hover:bg-stone-50/80"
              )}
            >
              {/* Animated gradient border for active */}
              {isActive && (
                <>
                  <div className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-r opacity-20",
                    config.gradient
                  )} />
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b",
                    config.gradient
                  )} />
                </>
              )}
              
              {/* Icon container with gradient */}
              <div className={cn(
                "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                isActive 
                  ? `bg-gradient-to-br ${config.gradient} shadow-md ${config.shadow}`
                  : "bg-stone-100 group-hover:bg-stone-200"
              )}>
                <Icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-white" : "text-stone-400 group-hover:text-stone-500"
                )} strokeWidth={2} />
                
                {/* Sparkle effect on active */}
                {isActive && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <Sparkles className="h-2.5 w-2.5 text-white/80" />
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "relative font-semibold transition-colors",
                isActive ? config.text : "text-stone-500"
              )}>
                {tab.label}
              </span>
              
              {/* Count badge with gradient */}
              <div className={cn(
                "relative min-w-[26px] h-6 px-2 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                isActive
                  ? `bg-gradient-to-r ${config.gradient} text-white shadow-md ${config.shadow}`
                  : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
              )}>
                {tab.count}
              </div>
              
              {/* Hover glow effect */}
              {!isActive && (
                <div className={cn(
                  "absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                  config.gradient
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
