import { cn } from "@/lib/utils";
import { Package, Truck, Bookmark } from "lucide-react";

interface LoadsTypeTabsProps {
  activeTab: "available" | "assigned" | "bookmarked";
  onTabChange: (tab: "available" | "assigned" | "bookmarked") => void;
  availableCount: number;
  assignedCount: number;
  bookmarkedCount: number;
}

export const LoadsTypeTabs = ({ 
  activeTab, 
  onTabChange, 
  availableCount, 
  assignedCount,
  bookmarkedCount,
}: LoadsTypeTabsProps) => {
  const tabs = [
    {
      id: "available" as const,
      label: "Loads Available",
      count: availableCount,
      icon: Package,
      gradient: "from-amber-400 via-orange-400 to-amber-500",
      glowColor: "shadow-amber-300/50",
      iconBg: "bg-white/30",
      inactiveBg: "bg-amber-50/80",
      inactiveBorder: "border-amber-200/60",
      inactiveText: "text-amber-700",
      inactiveIcon: "bg-amber-100",
    },
    {
      id: "assigned" as const,
      label: "Loads Assigned",
      count: assignedCount,
      icon: Truck,
      gradient: "from-emerald-400 via-teal-400 to-emerald-500",
      glowColor: "shadow-emerald-300/50",
      iconBg: "bg-white/30",
      inactiveBg: "bg-emerald-50/80",
      inactiveBorder: "border-emerald-200/60",
      inactiveText: "text-emerald-700",
      inactiveIcon: "bg-emerald-100",
    },
    {
      id: "bookmarked" as const,
      label: "Loads Saved",
      count: bookmarkedCount,
      icon: Bookmark,
      gradient: "from-amber-500 via-orange-500 to-rose-400",
      glowColor: "shadow-amber-400/50",
      iconBg: "bg-white/30",
      inactiveBg: "bg-gradient-to-br from-amber-50/80 to-orange-50/60",
      inactiveBorder: "border-amber-200/80",
      inactiveText: "text-amber-700",
      inactiveIcon: "bg-amber-100",
    },
  ];

  return (
    <div className="overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-stone-400">
      <div className="flex gap-4 justify-start min-w-max px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group relative flex items-center gap-4 px-6 py-4 font-medium transition-all duration-500 ease-out overflow-hidden",
                "rounded-[1.5rem_2.5rem_1.5rem_2.5rem]",
                isActive
                  ? cn(
                      "bg-gradient-to-r text-white shadow-xl",
                      tab.gradient,
                      tab.glowColor,
                      "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:rounded-[1.5rem_2.5rem_1.5rem_2.5rem]"
                    )
                  : cn(
                      "backdrop-blur-sm border-2",
                      tab.inactiveBg,
                      tab.inactiveBorder,
                      tab.inactiveText,
                      "hover:shadow-lg hover:scale-[1.02] hover:border-opacity-100"
                    )
              )}
            >
              {isActive && (
                <div className="absolute inset-0 overflow-hidden rounded-[1.5rem_2.5rem_1.5rem_2.5rem]">
                  <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] skew-x-12" />
                </div>
              )}
              
              {isActive && (
                <>
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10 blur-xl animate-pulse" />
                  <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-white/15 blur-lg" />
                </>
              )}
              
              <div className={cn(
                "relative flex items-center justify-center transition-all duration-300 h-12 w-12",
                "rounded-[0.8rem_1.2rem_0.8rem_1.2rem]",
                isActive 
                  ? cn(tab.iconBg, "shadow-inner") 
                  : cn(tab.inactiveIcon, "group-hover:scale-110")
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300 relative z-10",
                  isActive ? "text-white" : tab.inactiveText,
                  tab.id === "bookmarked" && isActive && "fill-white/60"
                )} strokeWidth={1.5} />
                
                {isActive && (
                  <div className="absolute inset-0 bg-white/20 rounded-[0.8rem_1.2rem_0.8rem_1.2rem] blur-sm animate-pulse" />
                )}
              </div>
              
              <div className="text-left relative z-10">
                <p className={cn(
                  "text-sm font-semibold tracking-wide transition-all duration-300",
                  isActive ? "text-white" : "text-stone-700"
                )}>
                  {tab.label}
                </p>
                <p className={cn(
                  "text-xs transition-all duration-300",
                  isActive ? "text-white/80" : "text-stone-400"
                )}>
                  {tab.count} {tab.count === 1 ? 'load' : 'loads'}
                </p>
              </div>

              {isActive && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white shadow-lg animate-bounce flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" />
                </div>
              )}

              {!isActive && (
                <div className={cn(
                  "absolute inset-0 rounded-[1.5rem_2.5rem_1.5rem_2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-r",
                  tab.gradient,
                  "blur-xl -z-10 scale-110"
                )} style={{ opacity: 0.1 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
