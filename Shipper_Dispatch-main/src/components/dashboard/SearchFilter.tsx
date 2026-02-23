import { useState } from "react";
import { Search, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

const SearchFilter = ({ 
  searchValue, 
  onSearchChange, 
  dateRange,
  onDateRangeChange 
}: SearchFilterProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const activeDateRange = dateRange ?? localDateRange;
  const setActiveDateRange = onDateRangeChange ?? setLocalDateRange;

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setActiveDateRange({ from: range.from, to: range.to });
    }
  };

  const clearDateRange = () => {
    setActiveDateRange({ from: undefined, to: undefined });
    setIsCalendarOpen(false);
  };

  const hasDateFilter = activeDateRange.from || activeDateRange.to;

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="relative flex-1 group">
        <Search
          size={20}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
        />
        <Input
          type="text"
          placeholder="Search by VIN, ID, or Location..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-14 pr-12 h-14 text-base bg-white border-border/50 rounded-xl shadow-sm focus:shadow-md focus:border-primary/30 transition-all duration-300"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>
      
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className={cn(
              "gap-2 h-11 rounded-xl border-border/50 shadow-sm hover:shadow-md transition-all duration-300",
              hasDateFilter && "border-primary bg-primary/5 text-primary"
            )}
          >
            <Calendar size={16} />
            {hasDateFilter ? (
              <span className="hidden sm:inline text-sm">
                {activeDateRange.from && format(activeDateRange.from, "MMM d")}
                {activeDateRange.to && ` - ${format(activeDateRange.to, "MMM d")}`}
              </span>
            ) : (
              <span className="hidden sm:inline">Date Range</span>
            )}
            {hasDateFilter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearDateRange();
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-border/50" align="end">
          <div className="p-4 border-b border-border/50">
            <h4 className="font-semibold text-foreground">Select Date Range</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Filter vehicles by pickup or delivery date
            </p>
          </div>
          <CalendarComponent
            mode="range"
            selected={{ from: activeDateRange.from, to: activeDateRange.to }}
            onSelect={handleSelect}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="p-3 border-t border-border/50 flex items-center justify-between gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearDateRange}
              className="text-muted-foreground"
            >
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsCalendarOpen(false)}
              className="rounded-lg"
            >
              Apply Filter
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchFilter;
