import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ColumnFilters {
  pickupState: string;
  deliveryState: string;
  status: string;
  pickupType: string;
  deliveryType: string;
  paymentMethod: string;
  available: string;
}

interface ColumnFiltersBarProps {
  filters: ColumnFilters;
  onFiltersChange: (filters: ColumnFilters) => void;
  availableOptions: {
    pickupStates: string[];
    deliveryStates: string[];
    statuses: string[];
    locationTypes: string[];
    paymentMethods: string[];
    availableStatuses: string[];
  };
  className?: string;
}

const filterLabels: Record<keyof ColumnFilters, string> = {
  pickupState: "Pickup State",
  deliveryState: "Delivery State",
  status: "Status",
  pickupType: "Pickup Type",
  deliveryType: "Delivery Type",
  paymentMethod: "Payment",
  available: "Available",
};

export default function ColumnFiltersBar({
  filters,
  onFiltersChange,
  availableOptions,
  className,
}: ColumnFiltersBarProps) {
  const updateFilter = (key: keyof ColumnFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof ColumnFilters) => {
    onFiltersChange({ ...filters, [key]: "" });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      pickupState: "",
      deliveryState: "",
      status: "",
      pickupType: "",
      deliveryType: "",
      paymentMethod: "",
      available: "",
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const FilterSelect = ({
    filterKey,
    options,
    placeholder,
  }: {
    filterKey: keyof ColumnFilters;
    options: string[];
    placeholder: string;
  }) => (
    <div className="relative">
      <Select
        value={filters[filterKey] || "all"}
        onValueChange={(v) => updateFilter(filterKey, v === "all" ? "" : v)}
      >
        <SelectTrigger
          className={cn(
            "h-9 min-w-[130px] text-xs font-medium rounded-lg border-border/50 bg-background/80 backdrop-blur-sm",
            "hover:border-primary/40 hover:bg-background transition-all",
            filters[filterKey] && "border-primary/50 bg-primary/5"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border/50 shadow-xl">
          <SelectItem value="all" className="text-xs">
            All {placeholder}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-xs">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filters[filterKey] && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            clearFilter(filterKey);
          }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors z-10"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Filter className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Column Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold bg-primary/10 text-primary">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs text-muted-foreground hover:text-primary"
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          filterKey="pickupState"
          options={availableOptions.pickupStates}
          placeholder="Pickup State"
        />
        <FilterSelect
          filterKey="deliveryState"
          options={availableOptions.deliveryStates}
          placeholder="Delivery State"
        />
        <FilterSelect
          filterKey="status"
          options={availableOptions.statuses}
          placeholder="Status"
        />
        <FilterSelect
          filterKey="pickupType"
          options={availableOptions.locationTypes}
          placeholder="Pickup Type"
        />
        <FilterSelect
          filterKey="deliveryType"
          options={availableOptions.locationTypes}
          placeholder="Delivery Type"
        />
        <FilterSelect
          filterKey="paymentMethod"
          options={availableOptions.paymentMethods}
          placeholder="Payment"
        />
        <FilterSelect
          filterKey="available"
          options={availableOptions.availableStatuses}
          placeholder="Available"
        />
      </div>

      {/* Active filters summary */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1">Active:</span>
          {(Object.entries(filters) as [keyof ColumnFilters, string][])
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <Badge
                key={key}
                variant="outline"
                className="h-6 px-2 text-[10px] font-medium bg-background border-primary/30 text-foreground gap-1"
              >
                <span className="text-muted-foreground">{filterLabels[key]}:</span>
                <span className="font-semibold">{value}</span>
                <button
                  onClick={() => clearFilter(key)}
                  className="ml-0.5 hover:text-primary transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
