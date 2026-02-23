import { useState } from "react";
import { format } from "date-fns";
import { Search, Calendar, X, Sparkles, Filter, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  fromDate: Date | undefined;
  toDate: Date | undefined;
  onFromDateChange: (date: Date | undefined) => void;
  onToDateChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
}

export const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search by VIN, ID, or Location...",
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
}: SearchFilterBarProps) => {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hasDateFilter = fromDate || toDate;
  const hasAnyFilter = searchQuery || hasDateFilter;

  const getDateLabel = () => {
    if (fromDate && toDate) {
      return `${format(fromDate, "MMM dd")} - ${format(toDate, "MMM dd")}`;
    }
    if (fromDate) return `From ${format(fromDate, "MMM dd")}`;
    if (toDate) return `To ${format(toDate, "MMM dd")}`;
    return "Dates";
  };

  return (
    <div className="relative group/bar">
      {/* Animated background glow */}
      <div className={cn(
        "absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 opacity-0 blur-xl transition-all duration-500",
        isFocused && "opacity-30"
      )} />
      
      {/* Main container */}
      <div className={cn(
        "relative bg-white/80 backdrop-blur-xl rounded-2xl transition-all duration-500 overflow-hidden",
        isFocused 
          ? "shadow-2xl shadow-amber-500/10" 
          : "shadow-lg shadow-stone-200/60 hover:shadow-xl"
      )}>
        {/* Animated gradient border */}
        <div className={cn(
          "absolute inset-0 rounded-2xl p-[1.5px] transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-500"
               style={{ 
                 backgroundSize: '200% 100%',
                 animation: isFocused ? 'shimmer 2s linear infinite' : 'none'
               }} />
          <div className="absolute inset-[1.5px] rounded-[14px] bg-white/95 backdrop-blur-xl" />
        </div>

        <div className="relative flex items-center gap-1 p-1.5">
          {/* Search Section */}
          <div className="relative flex-1 flex items-center gap-2 px-2">
            {/* Search icon with animated container */}
            <div className="relative">
              <div className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                isFocused 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 scale-105" 
                  : "bg-stone-100/80"
              )}>
                <Search className={cn(
                  "h-4 w-4 transition-all duration-300",
                  isFocused ? "text-white" : "text-stone-500"
                )} strokeWidth={2.5} />
              </div>
              {/* Pulsing ring on focus */}
              {isFocused && (
                <div className="absolute inset-0 rounded-xl bg-amber-400 animate-ping opacity-20" />
              )}
            </div>
            
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 h-9 bg-transparent border-0 text-stone-700 placeholder:text-stone-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium"
            />
            
            {/* Active filter indicator */}
            {hasAnyFilter && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50">
                <Zap className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Filtered</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-7 w-px bg-gradient-to-b from-transparent via-stone-200 to-transparent" />

          {/* Date Range Button */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "relative h-9 px-3.5 flex items-center gap-2 rounded-xl font-medium text-sm transition-all duration-300 group",
                  hasDateFilter 
                    ? "text-white" 
                    : "text-stone-600 hover:text-stone-800 hover:bg-stone-100"
                )}
              >
                {/* Gradient background for active state */}
                {hasDateFilter && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-md shadow-amber-400/30" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 blur-md opacity-40" />
                  </>
                )}
                
                <div className={cn(
                  "relative h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-200",
                  hasDateFilter 
                    ? "bg-white/20" 
                    : "bg-stone-200 group-hover:bg-stone-300"
                )}>
                  <Calendar className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    hasDateFilter ? "text-white" : "text-stone-600"
                  )} strokeWidth={2} />
                </div>
                
                <span className="relative">{getDateLabel()}</span>
                
                {hasDateFilter && (
                  <div 
                    className="relative h-5 w-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFromDateChange(undefined);
                      onToDateChange(undefined);
                    }}
                  >
                    <X className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl shadow-amber-500/10 rounded-2xl overflow-hidden" align="end">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                <div className="relative flex items-center gap-2 text-white">
                  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold">Date Range</span>
                    <p className="text-xs text-white/70">Filter by pickup dates</p>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">A</span>
                      </div>
                      <p className="text-xs font-semibold text-stone-600">Start Date</p>
                    </div>
                    <CalendarComponent
                      mode="single"
                      selected={fromDate}
                      onSelect={onFromDateChange}
                      className="pointer-events-auto rounded-xl border border-stone-100"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-px h-16 bg-gradient-to-b from-transparent via-stone-200 to-transparent" />
                    <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center my-2">
                      <span className="text-stone-400 text-xs font-bold">→</span>
                    </div>
                    <div className="w-px h-16 bg-gradient-to-b from-transparent via-stone-200 to-transparent" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">B</span>
                      </div>
                      <p className="text-xs font-semibold text-stone-600">End Date</p>
                    </div>
                    <CalendarComponent
                      mode="single"
                      selected={toDate}
                      onSelect={onToDateChange}
                      className="pointer-events-auto rounded-xl border border-stone-100"
                    />
                  </div>
                </div>
                
                {/* Quick actions */}
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-stone-100">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mr-2">Quick:</span>
                  {[
                    { label: "Today", days: 0 },
                    { label: "7 days", days: 7 },
                    { label: "30 days", days: 30 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      className="px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-50 hover:bg-gradient-to-r hover:from-amber-100 hover:to-orange-100 hover:text-amber-700 rounded-lg transition-all duration-200"
                      onClick={() => {
                        const today = new Date();
                        if (preset.days === 0) {
                          onFromDateChange(today);
                          onToDateChange(today);
                        } else {
                          const past = new Date(today.getTime() - preset.days * 24 * 60 * 60 * 1000);
                          onFromDateChange(past);
                          onToDateChange(today);
                        }
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear All Button */}
          {hasAnyFilter && (
            <button
              onClick={onClearFilters}
              className="h-9 px-3 flex items-center gap-1.5 text-rose-500 hover:text-white hover:bg-gradient-to-r hover:from-rose-400 hover:to-red-500 rounded-xl text-xs font-semibold transition-all duration-300"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
