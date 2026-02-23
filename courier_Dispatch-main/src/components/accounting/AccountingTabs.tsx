import { DollarSign, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountingTabsProps {
  activeTab: "revenue" | "costs";
  onTabChange: (tab: "revenue" | "costs") => void;
  totalRevenue: number;
  totalCosts: number;
}

export const AccountingTabs = ({ activeTab, onTabChange, totalRevenue, totalCosts }: AccountingTabsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const netProfit = totalRevenue - totalCosts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Revenue Card */}
      <button
        onClick={() => onTabChange("revenue")}
        className={cn(
          "group relative rounded-[1.5rem_2.5rem_1.5rem_2.5rem] p-6 transition-all duration-500 overflow-hidden text-left",
          activeTab === "revenue"
            ? "bg-gradient-to-br from-emerald-50 via-teal-50/80 to-emerald-100/50 shadow-lg shadow-emerald-100/50 ring-2 ring-emerald-200/50"
            : "bg-white hover:bg-emerald-50/30 border border-stone-100 hover:border-emerald-200/50 hover:shadow-md"
        )}
      >
        {/* Decorative orbs */}
        <div className={cn(
          "absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br transition-all duration-500 blur-2xl",
          activeTab === "revenue" ? "from-emerald-300/40 to-teal-300/20" : "from-emerald-200/20 to-teal-200/10"
        )} />
        <div className={cn(
          "absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br transition-all duration-500 blur-2xl",
          activeTab === "revenue" ? "from-teal-300/30 to-emerald-300/10" : "from-teal-200/10 to-emerald-200/5"
        )} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                activeTab === "revenue" 
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200/50" 
                  : "bg-emerald-100 group-hover:bg-emerald-200"
              )}>
                <TrendingUp className={cn(
                  "h-5 w-5 transition-colors",
                  activeTab === "revenue" ? "text-white" : "text-emerald-600"
                )} strokeWidth={2} />
              </div>
              <div>
                <p className={cn(
                  "text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors",
                  activeTab === "revenue" ? "text-emerald-600" : "text-stone-400"
                )}>Income</p>
                <h3 className={cn(
                  "text-lg font-bold transition-colors",
                  activeTab === "revenue" ? "text-emerald-800" : "text-stone-600"
                )}>Revenue</h3>
              </div>
            </div>
            
            {/* Active indicator */}
            {activeTab === "revenue" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <span className={cn(
              "text-3xl font-bold transition-colors",
              activeTab === "revenue" ? "text-emerald-700" : "text-stone-700"
            )}>
              {formatCurrency(totalRevenue)}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs transition-colors",
              activeTab === "revenue" ? "text-emerald-600" : "text-stone-400"
            )}>
              Click to view revenue details
            </span>
            <ArrowRight className={cn(
              "h-4 w-4 transition-all duration-300 group-hover:translate-x-1",
              activeTab === "revenue" ? "text-emerald-500" : "text-stone-300"
            )} />
          </div>
        </div>
      </button>

      {/* Costs Card */}
      <button
        onClick={() => onTabChange("costs")}
        className={cn(
          "group relative rounded-[2.5rem_1.5rem_2.5rem_1.5rem] p-6 transition-all duration-500 overflow-hidden text-left",
          activeTab === "costs"
            ? "bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100/50 shadow-lg shadow-amber-100/50 ring-2 ring-amber-200/50"
            : "bg-white hover:bg-amber-50/30 border border-stone-100 hover:border-amber-200/50 hover:shadow-md"
        )}
      >
        {/* Decorative orbs */}
        <div className={cn(
          "absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br transition-all duration-500 blur-2xl",
          activeTab === "costs" ? "from-amber-300/40 to-orange-300/20" : "from-amber-200/20 to-orange-200/10"
        )} />
        <div className={cn(
          "absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br transition-all duration-500 blur-2xl",
          activeTab === "costs" ? "from-orange-300/30 to-amber-300/10" : "from-orange-200/10 to-amber-200/5"
        )} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                activeTab === "costs" 
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-200/50" 
                  : "bg-amber-100 group-hover:bg-amber-200"
              )}>
                <TrendingDown className={cn(
                  "h-5 w-5 transition-colors",
                  activeTab === "costs" ? "text-white" : "text-amber-600"
                )} strokeWidth={2} />
              </div>
              <div>
                <p className={cn(
                  "text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors",
                  activeTab === "costs" ? "text-amber-600" : "text-stone-400"
                )}>Expenses</p>
                <h3 className={cn(
                  "text-lg font-bold transition-colors",
                  activeTab === "costs" ? "text-amber-800" : "text-stone-600"
                )}>Costs</h3>
              </div>
            </div>
            
            {/* Active indicator */}
            {activeTab === "costs" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Active</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <span className={cn(
              "text-3xl font-bold transition-colors",
              activeTab === "costs" ? "text-amber-700" : "text-stone-700"
            )}>
              {formatCurrency(totalCosts)}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs transition-colors",
              activeTab === "costs" ? "text-amber-600" : "text-stone-400"
            )}>
              Fuel, Insurance, Parking & more
            </span>
            <ArrowRight className={cn(
              "h-4 w-4 transition-all duration-300 group-hover:translate-x-1",
              activeTab === "costs" ? "text-amber-500" : "text-stone-300"
            )} />
          </div>
        </div>
      </button>
    </div>
  );
};
