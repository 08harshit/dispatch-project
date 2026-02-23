import { cn } from "@/lib/utils";
import { Package, Clock, CheckCircle, Sparkles } from "lucide-react";

interface LoadStatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    all: number;
    pickup: number;
    late: number;
    done: number;
  };
}

export const LoadStatusTabs = ({ activeTab, onTabChange, counts }: LoadStatusTabsProps) => {
  const tabs = [
    { 
      id: "all", 
      label: "All", 
      icon: Package, 
      count: counts.all, 
      gradient: "from-stone-400 to-stone-500",
      lightBg: "bg-stone-50",
      text: "text-stone-600",
      shadow: "shadow-stone-200/30"
    },
    { 
      id: "pickup", 
      label: "To be picked up", 
      icon: Package, 
      count: counts.pickup, 
      gradient: "from-amber-400 to-orange-400",
      lightBg: "bg-amber-50",
      text: "text-amber-600",
      shadow: "shadow-amber-200/30"
    },
    { 
      id: "late", 
      label: "Late", 
      icon: Clock, 
      count: counts.late, 
      gradient: "from-orange-400 to-rose-400",
      lightBg: "bg-orange-50",
      text: "text-orange-600",
      shadow: "shadow-orange-200/30"
    },
    { 
      id: "done", 
      label: "Done", 
      icon: CheckCircle, 
      count: counts.done, 
      gradient: "from-emerald-400 to-teal-400",
      lightBg: "bg-emerald-50",
      text: "text-emerald-600",
      shadow: "shadow-emerald-200/30"
    },
  ];

  return (
    <div className="relative">
      {/* Container with subtle gradient border */}
      <div className="flex items-center gap-1 p-1.5 bg-white rounded-2xl shadow-md shadow-stone-200/50 border border-stone-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                isActive
                  ? `${tab.lightBg} shadow-lg ${tab.shadow}`
                  : "text-stone-400 hover:text-stone-600 hover:bg-amber-50/50"
              )}
            >
              {/* Animated gradient border for active */}
              {isActive && (
                <>
                  <div className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-r opacity-20",
                    tab.gradient
                  )} />
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b",
                    tab.gradient
                  )} />
                </>
              )}
              
              {/* Icon container with gradient */}
              <div className={cn(
                "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                isActive 
                  ? `bg-gradient-to-br ${tab.gradient} shadow-md ${tab.shadow}`
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
                isActive ? tab.text : "text-stone-500"
              )}>
                {tab.label}
              </span>
              
              {/* Count badge with gradient */}
              <div className={cn(
                "relative min-w-[26px] h-6 px-2 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                isActive
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md ${tab.shadow}`
                  : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
              )}>
                {tab.count}
              </div>
              
              {/* Hover glow effect */}
              {!isActive && (
                <div className={cn(
                  "absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                  tab.gradient
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
