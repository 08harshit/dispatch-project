import { useState, useMemo } from "react";
import { MoreHorizontal, Edit, Trash2, Eye, FileText, DollarSign, Calendar, CreditCard, Filter, ChevronDown, X, ArrowUpNarrowWide, ArrowDownWideNarrow } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parse } from "date-fns";

export interface RevenueRecord {
  id: string;
  revenue: number;
  bookingId: string;
  date: string;
  paymentMethod: string;
  hasDocs: boolean;
}

interface RevenueTableProps {
  records: RevenueRecord[];
  onEdit: (record: RevenueRecord) => void;
  onDelete: (recordId: string) => void;
  onView: (record: RevenueRecord) => void;
}

interface ColumnFilters {
  revenue: { min: string; max: string };
  bookingId: string;
  date: string;
  paymentMethod: string[];
  hasDocs: "all" | "yes" | "no";
}

type SortDirection = "asc" | "desc" | null;
type SortField = "revenue" | "date" | null;

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const getPaymentBadge = (method: string) => {
  const styles: Record<string, string> = {
    COD: "bg-amber-500 text-white shadow-sm shadow-amber-200/30",
    COP: "bg-emerald-500 text-white shadow-sm shadow-emerald-200/30",
    Wire: "bg-teal-500 text-white shadow-sm shadow-teal-200/30",
    Check: "bg-amber-600 text-white shadow-sm shadow-amber-200/30",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
      styles[method] || "bg-stone-100 text-stone-600"
    )}>
      {method}
    </span>
  );
};

export const RevenueTable = ({ records, onEdit, onDelete, onView }: RevenueTableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    revenue: { min: "", max: "" },
    bookingId: "",
    date: "",
    paymentMethod: [],
    hasDocs: "all",
  });
  
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get unique payment methods from records
  const uniquePaymentMethods = useMemo(() => {
    return [...new Set(records.map(r => r.paymentMethod))];
  }, [records]);

  // Apply column filters and sorting
  const filteredAndSortedRecords = useMemo(() => {
    let result = records.filter(record => {
      // Revenue filter
      if (columnFilters.revenue.min && record.revenue < parseFloat(columnFilters.revenue.min)) return false;
      if (columnFilters.revenue.max && record.revenue > parseFloat(columnFilters.revenue.max)) return false;
      
      // Booking ID filter
      if (columnFilters.bookingId && !record.bookingId.toLowerCase().includes(columnFilters.bookingId.toLowerCase())) return false;
      
      // Date filter
      if (columnFilters.date && !record.date.includes(columnFilters.date)) return false;
      
      // Payment method filter
      if (columnFilters.paymentMethod.length > 0 && !columnFilters.paymentMethod.includes(record.paymentMethod)) return false;
      
      // Docs filter
      if (columnFilters.hasDocs === "yes" && !record.hasDocs) return false;
      if (columnFilters.hasDocs === "no" && record.hasDocs) return false;
      
      return true;
    });
    
    // Apply sorting
    if (sortState.field && sortState.direction) {
      result = [...result].sort((a, b) => {
        if (sortState.field === "revenue") {
          return sortState.direction === "asc" 
            ? a.revenue - b.revenue 
            : b.revenue - a.revenue;
        }
        if (sortState.field === "date") {
          const dateA = parse(a.date, "MM-dd-yyyy", new Date());
          const dateB = parse(b.date, "MM-dd-yyyy", new Date());
          return sortState.direction === "asc" 
            ? dateA.getTime() - dateB.getTime() 
            : dateB.getTime() - dateA.getTime();
        }
        return 0;
      });
    }
    
    return result;
  }, [records, columnFilters, sortState]);
  
  const handleSort = (field: SortField, direction: SortDirection) => {
    if (sortState.field === field && sortState.direction === direction) {
      // Clear sort if clicking the same option
      setSortState({ field: null, direction: null });
    } else {
      setSortState({ field, direction });
    }
  };

  const hasActiveFilters = columnFilters.revenue.min || columnFilters.revenue.max || 
    columnFilters.bookingId || columnFilters.date || 
    columnFilters.paymentMethod.length > 0 || columnFilters.hasDocs !== "all" ||
    sortState.field !== null;

  const clearAllFilters = () => {
    setColumnFilters({
      revenue: { min: "", max: "" },
      bookingId: "",
      date: "",
      paymentMethod: [],
      hasDocs: "all",
    });
    setSortState({ field: null, direction: null });
  };

  const togglePaymentMethod = (method: string) => {
    setColumnFilters(prev => ({
      ...prev,
      paymentMethod: prev.paymentMethod.includes(method)
        ? prev.paymentMethod.filter(m => m !== method)
        : [...prev.paymentMethod, method]
    }));
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <DollarSign className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-stone-700">No revenue records found</p>
            <p className="text-sm text-stone-400 mt-1">Try adjusting your filters</p>
          </div>
        </div>
      </div>
    );
  }

  // Alternating amber and emerald accent colors
  const accents = [
    { bg: 'from-amber-400 to-orange-400', light: 'bg-amber-50', text: 'text-amber-600', shadow: 'shadow-amber-200/20', border: 'hover:border-amber-200' },
    { bg: 'from-emerald-400 to-teal-400', light: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-200/20', border: 'hover:border-emerald-200' },
  ];

  return (
    <div className="space-y-4">
      {/* Innovative Column Filters Header */}
      <div className="relative rounded-[1.5rem_2.5rem_1.5rem_2.5rem] overflow-hidden">
        {/* Glassmorphic background with gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/30 via-stone-100/50 to-emerald-200/30 rounded-[1.5rem_2.5rem_1.5rem_2.5rem]" />
        <div className="absolute inset-[1px] bg-white/80 backdrop-blur-xl rounded-[1.4rem_2.4rem_1.4rem_2.4rem]" />
        
        {/* Decorative floating orbs */}
        <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-amber-300/20 to-orange-300/10 blur-2xl" />
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-300/20 to-teal-300/10 blur-2xl" />
        
        <div className="relative p-5">
          {/* Filter Label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-400 flex items-center justify-center shadow-sm">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-stone-600 tracking-wide">Column Filters</span>
            {hasActiveFilters && (
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Revenue Filter & Sort - Emerald theme */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] transition-all duration-300 overflow-hidden",
                    (columnFilters.revenue.min || columnFilters.revenue.max || sortState.field === "revenue") 
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md shadow-emerald-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {/* Animated border on active */}
                  {(columnFilters.revenue.min || columnFilters.revenue.max || sortState.field === "revenue") && (
                    <div className="absolute inset-0 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      (columnFilters.revenue.min || columnFilters.revenue.max || sortState.field === "revenue") 
                        ? "bg-emerald-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                    )}>
                      <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      (columnFilters.revenue.min || columnFilters.revenue.max || sortState.field === "revenue") ? "text-emerald-700" : "text-stone-600"
                    )}>Revenue</span>
                    {sortState.field === "revenue" && (
                      sortState.direction === "asc" 
                        ? <ArrowUpNarrowWide className="h-3.5 w-3.5 text-emerald-500" />
                        : <ArrowDownWideNarrow className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      (columnFilters.revenue.min || columnFilters.revenue.max || sortState.field === "revenue") ? "text-emerald-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenue Range
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Sort Options */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Sort</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSort("revenue", "desc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "revenue" && sortState.direction === "desc"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600"
                        )}
                      >
                        <ArrowDownWideNarrow className="h-4 w-4" />
                        High → Low
                      </button>
                      <button
                        onClick={() => handleSort("revenue", "asc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "revenue" && sortState.direction === "asc"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600"
                        )}
                      >
                        <ArrowUpNarrowWide className="h-4 w-4" />
                        Low → High
                      </button>
                    </div>
                  </div>
                  
                  {/* Range Filter */}
                  <div className="pt-2 border-t border-stone-100">
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Filter by Range</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                          <Input
                            type="number"
                            placeholder="Min"
                            value={columnFilters.revenue.min}
                            onChange={(e) => setColumnFilters(prev => ({
                              ...prev,
                              revenue: { ...prev.revenue, min: e.target.value }
                            }))}
                            className="h-10 pl-8 rounded-xl text-sm border-stone-200 focus:border-emerald-300 focus:ring-emerald-100"
                          />
                        </div>
                      </div>
                      <div className="h-0.5 w-4 bg-stone-200 rounded-full" />
                      <div className="flex-1">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={columnFilters.revenue.max}
                            onChange={(e) => setColumnFilters(prev => ({
                              ...prev,
                              revenue: { ...prev.revenue, max: e.target.value }
                            }))}
                            className="h-10 pl-8 rounded-xl text-sm border-stone-200 focus:border-emerald-300 focus:ring-emerald-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Booking ID Filter - Amber theme */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] transition-all duration-300 overflow-hidden",
                    columnFilters.bookingId 
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 shadow-md shadow-amber-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {columnFilters.bookingId && (
                    <div className="absolute inset-0 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      columnFilters.bookingId 
                        ? "bg-amber-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                    )}>
                      <Filter className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      columnFilters.bookingId ? "text-amber-700" : "text-stone-600"
                    )}>Booking ID</span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      columnFilters.bookingId ? "text-amber-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Search Booking ID
                  </p>
                </div>
                <div className="p-4">
                  <Input
                    placeholder="Enter booking ID..."
                    value={columnFilters.bookingId}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, bookingId: e.target.value }))}
                    className="h-10 rounded-xl text-sm border-stone-200 focus:border-amber-300 focus:ring-amber-100"
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Filter & Sort - Amber/Teal theme */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] transition-all duration-300 overflow-hidden",
                    (columnFilters.date || sortState.field === "date") 
                      ? "bg-gradient-to-r from-amber-50 to-teal-50 shadow-md shadow-amber-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {(columnFilters.date || sortState.field === "date") && (
                    <div className="absolute inset-0 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] bg-gradient-to-r from-amber-400 via-teal-400 to-amber-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      (columnFilters.date || sortState.field === "date") 
                        ? "bg-gradient-to-br from-amber-500 to-teal-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                    )}>
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      (columnFilters.date || sortState.field === "date") ? "text-amber-700" : "text-stone-600"
                    )}>Date</span>
                    {sortState.field === "date" && (
                      sortState.direction === "desc" 
                        ? <ArrowDownWideNarrow className="h-3.5 w-3.5 text-amber-500" />
                        : <ArrowUpNarrowWide className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      (columnFilters.date || sortState.field === "date") ? "text-amber-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-amber-500 to-teal-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Filter & Sort
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Sort Options */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Sort</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSort("date", "desc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "date" && sortState.direction === "desc"
                            ? "bg-gradient-to-r from-amber-500 to-teal-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-600"
                        )}
                      >
                        <ArrowDownWideNarrow className="h-4 w-4" />
                        Newest
                      </button>
                      <button
                        onClick={() => handleSort("date", "asc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "date" && sortState.direction === "asc"
                            ? "bg-gradient-to-r from-amber-500 to-teal-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-600"
                        )}
                      >
                        <ArrowUpNarrowWide className="h-4 w-4" />
                        Oldest
                      </button>
                    </div>
                  </div>
                  
                  {/* Text Filter */}
                  <div className="pt-2 border-t border-stone-100">
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Filter by Text</label>
                    <Input
                      placeholder="e.g. 01-2026 or 01-15-2026"
                      value={columnFilters.date}
                      onChange={(e) => setColumnFilters(prev => ({ ...prev, date: e.target.value }))}
                      className="h-10 rounded-xl text-sm border-stone-200 focus:border-amber-300 focus:ring-amber-100"
                    />
                    <p className="text-[10px] text-stone-400 mt-2">Search by month or full date</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Payment Method Filter - Teal theme */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] transition-all duration-300 overflow-hidden",
                    columnFilters.paymentMethod.length > 0 
                      ? "bg-gradient-to-r from-teal-50 to-cyan-50 shadow-md shadow-teal-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {columnFilters.paymentMethod.length > 0 && (
                    <div className="absolute inset-0 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      columnFilters.paymentMethod.length > 0 
                        ? "bg-teal-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-teal-100 group-hover:text-teal-600"
                    )}>
                      <CreditCard className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      columnFilters.paymentMethod.length > 0 ? "text-teal-700" : "text-stone-600"
                    )}>Payment</span>
                    {columnFilters.paymentMethod.length > 0 && (
                      <span className="h-5 min-w-[20px] px-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {columnFilters.paymentMethod.length}
                      </span>
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      columnFilters.paymentMethod.length > 0 ? "text-teal-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Methods
                  </p>
                </div>
                <div className="p-3 space-y-1">
                  {uniquePaymentMethods.map(method => (
                    <label
                      key={method}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
                        columnFilters.paymentMethod.includes(method)
                          ? "bg-teal-50"
                          : "hover:bg-stone-50"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all",
                        columnFilters.paymentMethod.includes(method)
                          ? "bg-teal-500 border-teal-500"
                          : "border-stone-300"
                      )}>
                        {columnFilters.paymentMethod.includes(method) && (
                          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={columnFilters.paymentMethod.includes(method)}
                        onChange={() => togglePaymentMethod(method)}
                        className="sr-only"
                      />
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        columnFilters.paymentMethod.includes(method) ? "text-teal-700" : "text-stone-600"
                      )}>{method}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Documents Filter - Orange theme */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] transition-all duration-300 overflow-hidden",
                    columnFilters.hasDocs !== "all" 
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 shadow-md shadow-orange-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {columnFilters.hasDocs !== "all" && (
                    <div className="absolute inset-0 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      columnFilters.hasDocs !== "all" 
                        ? "bg-orange-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-orange-100 group-hover:text-orange-600"
                    )}>
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      columnFilters.hasDocs !== "all" ? "text-orange-700" : "text-stone-600"
                    )}>Documents</span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      columnFilters.hasDocs !== "all" ? "text-orange-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Status
                  </p>
                </div>
                <div className="p-2">
                  {(["all", "yes", "no"] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setColumnFilters(prev => ({ ...prev, hasDocs: option }))}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        columnFilters.hasDocs === option
                          ? "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700"
                          : "text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {option === "all" ? "All Records" : option === "yes" ? "With Documents" : "No Documents"}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters - Animated */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="group relative h-11 px-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition-all duration-300 overflow-hidden"
              >
                <div className="relative flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-500 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-sm font-medium text-rose-600">Clear All</span>
                </div>
              </button>
            )}

            {/* Results count - Glassmorphic */}
            <div className="ml-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-sm border border-stone-100/50">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse" />
                <span className="text-lg font-bold text-stone-700">{filteredAndSortedRecords.length}</span>
              </div>
              <span className="text-sm text-stone-400">of {records.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state for filtered results */}
      {filteredAndSortedRecords.length === 0 && records.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center">
              <Filter className="h-5 w-5 text-stone-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-stone-700">No matching records</p>
              <p className="text-sm text-stone-400 mt-1">Try adjusting your column filters</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-2 rounded-xl"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Records List */}
      {filteredAndSortedRecords.map((record, index) => {
        const accent = accents[index % accents.length];

        return (
          <div
            key={record.id}
            className={cn(
              "group bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden",
              accent.border, accent.shadow
            )}
          >
            {/* Decorative accent bar */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", accent.bg)} />
            
            {/* Decorative corner accent */}
            <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br opacity-5", accent.bg)} />

            <div className="flex items-center gap-6 pl-4">
              {/* Revenue & Booking ID */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300", accent.light)}>
                  <DollarSign className={cn("h-6 w-6", accent.text)} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold text-sm", accent.text)}>{record.bookingId}</span>
                    <div className={cn("h-2 w-2 rounded-full bg-gradient-to-r animate-pulse", accent.bg)} />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 mt-0.5">
                    {formatCurrency(record.revenue)}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 min-w-[160px] p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-stone-700">{record.date}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Payment</p>
                  <div className="mt-1">{getPaymentBadge(record.paymentMethod)}</div>
                </div>
              </div>

              {/* Documents */}
              <div className="flex-1 flex items-center gap-3">
                {record.hasDocs ? (
                  <button className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r transition-all duration-300 hover:shadow-lg",
                    accent.light
                  )}>
                    <FileText className={cn("h-4 w-4", accent.text)} strokeWidth={2} />
                    <span className={cn("text-sm font-semibold", accent.text)}>View Docs</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50">
                    <FileText className="h-4 w-4 text-stone-300" strokeWidth={2} />
                    <span className="text-sm text-stone-400">No docs</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(record)}
                  className="h-10 w-10 rounded-xl hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition-all"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-2xl shadow-2xl border-stone-200/60 p-1.5">
                    <DropdownMenuItem 
                      onClick={() => onEdit(record)} 
                      className="cursor-pointer rounded-xl py-2.5 text-stone-600 hover:bg-stone-100"
                    >
                      <Edit className="mr-2 h-4 w-4 text-stone-400" />
                      Update
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(record.id)}
                      className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-xl py-2.5"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
