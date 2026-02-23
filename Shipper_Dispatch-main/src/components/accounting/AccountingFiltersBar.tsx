import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AccountingFilters {
  paymentMethod: string;
  payoutStatus: string;
  hasDocs: string;
}

export type SortField = "cost" | "date" | null;
export type SortDirection = "asc" | "desc";

interface AccountingFiltersBarProps {
  filters: AccountingFilters;
  onFiltersChange: (filters: AccountingFilters) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const AccountingFiltersBar = ({
  filters,
  onFiltersChange,
  sortField,
  sortDirection,
  onSortChange,
}: AccountingFiltersBarProps) => {
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({
      paymentMethod: "",
      payoutStatus: "",
      hasDocs: "",
    });
  };

  const clearFilter = (key: keyof AccountingFilters) => {
    onFiltersChange({ ...filters, [key]: "" });
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        onSortChange(field, "desc");
      } else {
        onSortChange(null, "asc");
      }
    } else {
      onSortChange(field, "asc");
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSortClick(field)}
        className={cn(
          "gap-1.5 h-9 px-3 rounded-xl border transition-all duration-200",
          isActive
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-card/50 border-border/50 text-muted-foreground hover:bg-muted/50"
        )}
      >
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )
        ) : (
          <ArrowUpDown size={14} />
        )}
        <span className="text-xs font-medium">{label}</span>
      </Button>
    );
  };

  const FilterSelect = ({
    filterKey,
    options,
    placeholder,
  }: {
    filterKey: keyof AccountingFilters;
    options: { value: string; label: string }[];
    placeholder: string;
  }) => {
    const value = filters[filterKey];
    const hasValue = Boolean(value);

    return (
      <div className="relative group">
        <Select
          value={value || "all"}
          onValueChange={(val) =>
            onFiltersChange({ ...filters, [filterKey]: val === "all" ? "" : val })
          }
        >
          <SelectTrigger
            className={cn(
              "h-9 min-w-[140px] rounded-xl border transition-all duration-200 text-xs",
              hasValue
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card/50 border-border/50 text-muted-foreground"
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/50 bg-popover backdrop-blur-lg">
            <SelectItem value="all" className="rounded-lg text-xs">
              All {placeholder}
            </SelectItem>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="rounded-lg text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasValue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFilter(filterKey);
            }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={10} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/30 mb-6">
      {/* Filter Icon & Label */}
      <div className="flex items-center gap-2 pr-3 border-r border-border/30">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Filter size={14} className="text-primary" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Filters
        </span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          filterKey="paymentMethod"
          options={[
            { value: "cod", label: "COD" },
            { value: "ach", label: "ACH" },
            { value: "wire", label: "Wire" },
            { value: "check", label: "Check" },
          ]}
          placeholder="Payment"
        />
        <FilterSelect
          filterKey="payoutStatus"
          options={[
            { value: "paid", label: "Paid" },
            { value: "processing", label: "Processing" },
            { value: "pending", label: "Pending" },
          ]}
          placeholder="Payout"
        />
        <FilterSelect
          filterKey="hasDocs"
          options={[
            { value: "true", label: "With Docs" },
            { value: "false", label: "No Docs" },
          ]}
          placeholder="Documents"
        />
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border/30 mx-1" />

      {/* Sort Section */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sort
        </span>
        <SortButton field="cost" label="Cost" />
        <SortButton field="date" label="Date" />
      </div>

      {/* Clear All */}
      {(activeFilterCount > 0 || sortField) && (
        <>
          <div className="h-6 w-px bg-border/30 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearAllFilters();
              onSortChange(null, "asc");
            }}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive rounded-xl"
          >
            <X size={12} className="mr-1" />
            Clear all
          </Button>
        </>
      )}
    </div>
  );
};

export default AccountingFiltersBar;
