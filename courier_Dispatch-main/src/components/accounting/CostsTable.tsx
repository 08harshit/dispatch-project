import { useState, useMemo } from "react";
import { MoreHorizontal, Edit, Trash2, Eye, Fuel, Car, Shield, CreditCard, ParkingCircle, Wrench, Filter, ChevronDown, X, DollarSign, Calendar, FileText, FileX, ArrowUpNarrowWide, ArrowDownWideNarrow } from "lucide-react";
import { parse } from "date-fns";
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

export interface CostRecord {
  id: string;
  amount: number;
  category: "Fuel" | "Parking" | "Insurance" | "Washing" | "Maintenance" | "Credits";
  description: string;
  date: string;
  paymentMethod: string;
  hasDocs: boolean;
  invoiceUrl?: string;
  invoiceName?: string;
}

interface CostsTableProps {
  records: CostRecord[];
  onEdit: (record: CostRecord) => void;
  onDelete: (recordId: string) => void;
  onView: (record: CostRecord) => void;
}

interface ColumnFilters {
  amount: { min: string; max: string };
  category: string[];
  date: string;
  paymentMethod: string[];
  hasDocs: "all" | "yes" | "no";
}

interface SortState {
  field: "amount" | "date" | null;
  direction: "asc" | "desc";
}

const getCategoryConfig = (category: string) => {
  const configs: Record<string, { icon: typeof Fuel; gradient: string; light: string; text: string; shadow: string }> = {
    Fuel: { icon: Fuel, gradient: "from-amber-400 to-orange-400", light: "bg-amber-50", text: "text-amber-600", shadow: "shadow-amber-200/20" },
    Parking: { icon: ParkingCircle, gradient: "from-teal-400 to-emerald-400", light: "bg-teal-50", text: "text-teal-600", shadow: "shadow-teal-200/20" },
    Insurance: { icon: Shield, gradient: "from-emerald-400 to-teal-400", light: "bg-emerald-50", text: "text-emerald-600", shadow: "shadow-emerald-200/20" },
    Washing: { icon: Car, gradient: "from-teal-400 to-cyan-400", light: "bg-teal-50", text: "text-teal-600", shadow: "shadow-teal-200/20" },
    Maintenance: { icon: Wrench, gradient: "from-stone-400 to-stone-500", light: "bg-stone-50", text: "text-stone-600", shadow: "shadow-stone-200/20" },
    Credits: { icon: CreditCard, gradient: "from-amber-500 to-orange-500", light: "bg-amber-50", text: "text-amber-600", shadow: "shadow-amber-200/20" },
  };
  return configs[category] || configs.Fuel;
};

const getCategoryBadge = (category: string) => {
  const config = getCategoryConfig(category);
  const Icon = config.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
      `bg-gradient-to-r ${config.gradient} text-white shadow-sm`
    )}>
      <Icon className="h-3 w-3" />
      {category}
    </span>
  );
};

export const CostsTable = ({ records, onEdit, onDelete, onView }: CostsTableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    amount: { min: "", max: "" },
    category: [],
    date: "",
    paymentMethod: [],
    hasDocs: "all",
  });
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: "desc" });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const uniqueCategories = useMemo(() => {
    return [...new Set(records.map(r => r.category))];
  }, [records]);

  const uniquePaymentMethods = useMemo(() => {
    return [...new Set(records.map(r => r.paymentMethod))];
  }, [records]);

  const filteredAndSortedRecords = useMemo(() => {
    let result = records.filter(record => {
      if (columnFilters.amount.min && record.amount < parseFloat(columnFilters.amount.min)) return false;
      if (columnFilters.amount.max && record.amount > parseFloat(columnFilters.amount.max)) return false;
      if (columnFilters.category.length > 0 && !columnFilters.category.includes(record.category)) return false;
      if (columnFilters.date && !record.date.includes(columnFilters.date)) return false;
      if (columnFilters.paymentMethod.length > 0 && !columnFilters.paymentMethod.includes(record.paymentMethod)) return false;
      if (columnFilters.hasDocs === "yes" && !record.hasDocs) return false;
      if (columnFilters.hasDocs === "no" && record.hasDocs) return false;
      return true;
    });

    // Apply sorting
    if (sortState.field) {
      result = [...result].sort((a, b) => {
        if (sortState.field === "amount") {
          return sortState.direction === "asc" ? a.amount - b.amount : b.amount - a.amount;
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

  const hasActiveFilters = columnFilters.amount.min || columnFilters.amount.max || 
    columnFilters.category.length > 0 || columnFilters.date || 
    columnFilters.paymentMethod.length > 0 || columnFilters.hasDocs !== "all" || sortState.field !== null;

  const clearAllFilters = () => {
    setColumnFilters({
      amount: { min: "", max: "" },
      category: [],
      date: "",
      paymentMethod: [],
      hasDocs: "all",
    });
    setSortState({ field: null, direction: "desc" });
  };

  const toggleSort = (field: "amount" | "date", direction: "asc" | "desc") => {
    if (sortState.field === field && sortState.direction === direction) {
      setSortState({ field: null, direction: "desc" });
    } else {
      setSortState({ field, direction });
    }
  };

  const toggleCategory = (category: string) => {
    setColumnFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
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
      <div className="bg-white rounded-2xl border border-amber-100 p-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <DollarSign className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-stone-700">No cost records found</p>
            <p className="text-sm text-stone-400 mt-1">Add your first expense</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Innovative Column Filters Header - Amber/Orange theme for costs */}
      <div className="relative rounded-[1.5rem_2.5rem_1.5rem_2.5rem] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/30 via-stone-100/50 to-orange-200/30 rounded-[1.5rem_2.5rem_1.5rem_2.5rem]" />
        <div className="absolute inset-[1px] bg-white/80 backdrop-blur-xl rounded-[1.4rem_2.4rem_1.4rem_2.4rem]" />
        
        <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-amber-300/20 to-orange-300/10 blur-2xl" />
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-orange-300/20 to-amber-300/10 blur-2xl" />
        
        <div className="relative p-5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Amount Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] transition-all duration-300 overflow-hidden",
                    (columnFilters.amount.min || columnFilters.amount.max || sortState.field === "amount") 
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 shadow-md shadow-amber-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {(columnFilters.amount.min || columnFilters.amount.max || sortState.field === "amount") && (
                    <div className="absolute inset-0 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      (columnFilters.amount.min || columnFilters.amount.max || sortState.field === "amount") 
                        ? "bg-amber-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                    )}>
                      <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      (columnFilters.amount.min || columnFilters.amount.max || sortState.field === "amount") ? "text-amber-700" : "text-stone-600"
                    )}>Amount</span>
                    {sortState.field === "amount" && (
                      sortState.direction === "desc" 
                        ? <ArrowDownWideNarrow className="h-3.5 w-3.5 text-amber-500" />
                        : <ArrowUpNarrowWide className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      (columnFilters.amount.min || columnFilters.amount.max || sortState.field === "amount") ? "text-amber-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Range & Sort
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Sort Options */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Sort By</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSort("amount", "desc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "amount" && sortState.direction === "desc"
                            ? "bg-amber-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-700"
                        )}
                      >
                        <ArrowDownWideNarrow className="h-4 w-4" />
                        High → Low
                      </button>
                      <button
                        onClick={() => toggleSort("amount", "asc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "amount" && sortState.direction === "asc"
                            ? "bg-amber-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-700"
                        )}
                      >
                        <ArrowUpNarrowWide className="h-4 w-4" />
                        Low → High
                      </button>
                    </div>
                  </div>
                  
                  {/* Filter Options */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1 block">Min</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={columnFilters.amount.min}
                          onChange={(e) => setColumnFilters(prev => ({
                            ...prev,
                            amount: { ...prev.amount, min: e.target.value }
                          }))}
                          className="h-10 pl-8 rounded-xl text-sm border-stone-200 focus:border-amber-300 focus:ring-amber-100"
                        />
                      </div>
                    </div>
                    <div className="h-0.5 w-4 bg-stone-200 rounded-full mt-5" />
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1 block">Max</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                        <Input
                          type="number"
                          placeholder="∞"
                          value={columnFilters.amount.max}
                          onChange={(e) => setColumnFilters(prev => ({
                            ...prev,
                            amount: { ...prev.amount, max: e.target.value }
                          }))}
                          className="h-10 pl-8 rounded-xl text-sm border-stone-200 focus:border-amber-300 focus:ring-amber-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] transition-all duration-300 overflow-hidden",
                    columnFilters.category.length > 0 
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 shadow-md shadow-amber-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {columnFilters.category.length > 0 && (
                    <div className="absolute inset-0 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      columnFilters.category.length > 0 
                        ? "bg-amber-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                    )}>
                      <Car className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      columnFilters.category.length > 0 ? "text-amber-700" : "text-stone-600"
                    )}>Category</span>
                    {columnFilters.category.length > 0 && (
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                        {columnFilters.category.length}
                      </span>
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      columnFilters.category.length > 0 ? "text-amber-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Expense Category
                  </p>
                </div>
                <div className="p-3 space-y-1">
                  {uniqueCategories.map((category) => {
                    const config = getCategoryConfig(category);
                    const Icon = config.icon;
                    return (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                          columnFilters.category.includes(category) 
                            ? `${config.light} ${config.text}` 
                            : "hover:bg-stone-50 text-stone-600"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                          columnFilters.category.includes(category)
                            ? `bg-gradient-to-br ${config.gradient} border-transparent`
                            : "border-stone-300"
                        )}>
                          {columnFilters.category.includes(category) && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{category}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] transition-all duration-300 overflow-hidden",
                    (columnFilters.date || sortState.field === "date")
                      ? "bg-gradient-to-r from-teal-50 to-cyan-50 shadow-md shadow-teal-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {(columnFilters.date || sortState.field === "date") && (
                    <div className="absolute inset-0 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      (columnFilters.date || sortState.field === "date")
                        ? "bg-teal-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-teal-100 group-hover:text-teal-600"
                    )}>
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      (columnFilters.date || sortState.field === "date") ? "text-teal-700" : "text-stone-600"
                    )}>Date</span>
                    {sortState.field === "date" && (
                      sortState.direction === "desc" 
                        ? <ArrowDownWideNarrow className="h-3.5 w-3.5 text-teal-500" />
                        : <ArrowUpNarrowWide className="h-3.5 w-3.5 text-teal-500" />
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      (columnFilters.date || sortState.field === "date") ? "text-teal-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Filter & Sort
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Sort Options */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2 block">Sort By</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSort("date", "desc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "date" && sortState.direction === "desc"
                            ? "bg-teal-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-teal-100 hover:text-teal-700"
                        )}
                      >
                        <ArrowDownWideNarrow className="h-4 w-4" />
                        Newest
                      </button>
                      <button
                        onClick={() => toggleSort("date", "asc")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          sortState.field === "date" && sortState.direction === "asc"
                            ? "bg-teal-500 text-white shadow-md"
                            : "bg-stone-100 text-stone-600 hover:bg-teal-100 hover:text-teal-700"
                        )}
                      >
                        <ArrowUpNarrowWide className="h-4 w-4" />
                        Oldest
                      </button>
                    </div>
                  </div>
                  
                  {/* Filter Option */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1 block">Search Date</label>
                    <Input
                      placeholder="e.g. 01-2026 or 01-15-2026"
                      value={columnFilters.date}
                      onChange={(e) => setColumnFilters(prev => ({ ...prev, date: e.target.value }))}
                      className="h-10 rounded-xl text-sm border-stone-200 focus:border-teal-300 focus:ring-teal-100"
                    />
                    <p className="text-[10px] text-stone-400 mt-2">Search by month or full date</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Payment Method Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] transition-all duration-300 overflow-hidden",
                    columnFilters.paymentMethod.length > 0 
                      ? "bg-gradient-to-r from-stone-100 to-stone-50 shadow-md shadow-stone-200/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {columnFilters.paymentMethod.length > 0 && (
                    <div className="absolute inset-0 rounded-[1.25rem_0.75rem_1.25rem_0.75rem] bg-gradient-to-r from-stone-400 via-stone-300 to-stone-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      columnFilters.paymentMethod.length > 0 
                        ? "bg-stone-600 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-stone-200 group-hover:text-stone-700"
                    )}>
                      <CreditCard className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      columnFilters.paymentMethod.length > 0 ? "text-stone-700" : "text-stone-600"
                    )}>Payment</span>
                    {columnFilters.paymentMethod.length > 0 && (
                      <span className="text-[10px] font-bold bg-stone-600 text-white px-1.5 py-0.5 rounded-full">
                        {columnFilters.paymentMethod.length}
                      </span>
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      columnFilters.paymentMethod.length > 0 ? "text-stone-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-stone-500 to-stone-600 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Method
                  </p>
                </div>
                <div className="p-3 space-y-1">
                  {uniquePaymentMethods.map((method) => (
                    <button
                      key={method}
                      onClick={() => togglePaymentMethod(method)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                        columnFilters.paymentMethod.includes(method) 
                          ? "bg-stone-100 text-stone-700" 
                          : "hover:bg-stone-50 text-stone-600"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                        columnFilters.paymentMethod.includes(method)
                          ? "bg-stone-600 border-transparent"
                          : "border-stone-300"
                      )}>
                        {columnFilters.paymentMethod.includes(method) && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{method}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Documents Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "group relative h-11 px-4 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] transition-all duration-300 overflow-hidden",
                    columnFilters.hasDocs !== "all" 
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md shadow-emerald-100/50" 
                      : "bg-stone-50/80 hover:bg-stone-100/80"
                  )}
                >
                  {columnFilters.hasDocs !== "all" && (
                    <div className="absolute inset-0 rounded-[0.75rem_1.25rem_0.75rem_1.25rem] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 opacity-20 animate-pulse" />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
                      columnFilters.hasDocs !== "all" 
                        ? "bg-emerald-500 text-white" 
                        : "bg-stone-200/80 text-stone-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                    )}>
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      columnFilters.hasDocs !== "all" ? "text-emerald-700" : "text-stone-600"
                    )}>Docs</span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-all group-hover:translate-y-0.5",
                      columnFilters.hasDocs !== "all" ? "text-emerald-500" : "text-stone-400"
                    )} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0 rounded-2xl border-0 shadow-2xl shadow-stone-200/50 overflow-hidden bg-white z-50" align="start">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </p>
                </div>
                <div className="p-3 space-y-1">
                  {["all", "yes", "no"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setColumnFilters(prev => ({ ...prev, hasDocs: option as "all" | "yes" | "no" }))}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                        columnFilters.hasDocs === option 
                          ? "bg-emerald-50 text-emerald-700" 
                          : "hover:bg-stone-50 text-stone-600"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                        columnFilters.hasDocs === option
                          ? "bg-emerald-500 border-transparent"
                          : "border-stone-300"
                      )}>
                        {columnFilters.hasDocs === option && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {option === "all" ? "All Records" : option === "yes" ? "With Docs" : "No Docs"}
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 h-11 px-4 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all duration-300"
              >
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Clear</span>
              </button>
            )}
          </div>

          {/* Results counter */}
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-pulse" />
            <span className="text-xs text-stone-500">
              Showing <span className="font-semibold text-stone-700">{filteredAndSortedRecords.length}</span> of {records.length} records
            </span>
          </div>
        </div>
      </div>

      {/* Cost Records */}
      {filteredAndSortedRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Filter className="h-6 w-6 text-amber-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-stone-700">No matching records</p>
              <p className="text-sm text-stone-400 mt-1">Try adjusting your filters</p>
            </div>
            <button
              onClick={clearAllFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        filteredAndSortedRecords.map((record) => {
          const config = getCategoryConfig(record.category);
          const Icon = config.icon;

          return (
            <div
              key={record.id}
              className={cn(
                "group bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden",
                "hover:border-amber-200", config.shadow
              )}
            >
              {/* Decorative accent bar */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", config.gradient)} />
              
              {/* Decorative corner accent */}
              <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br opacity-5", config.gradient)} />

              <div className="flex items-center gap-6 pl-4">
                {/* Category Icon */}
                <div className="flex items-center gap-4 min-w-[180px]">
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300", config.light)}>
                    <Icon className={cn("h-6 w-6", config.text)} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(record.category)}
                    </div>
                    <p className="text-xs text-stone-400 mt-1 max-w-[140px] truncate">{record.description}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-3 min-w-[140px] p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-amber-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Cost</p>
                    <p className="text-lg font-bold text-stone-700">{formatCurrency(record.amount)}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="min-w-[120px]">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-stone-400" />
                    <span className="text-sm font-medium text-stone-600">{record.date}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="min-w-[100px]">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Payment</p>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600">
                    {record.paymentMethod}
                  </span>
                </div>

                {/* Documents */}
                <div className="min-w-[100px]">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Docs</p>
                  {record.hasDocs && record.invoiceUrl ? (
                    <a
                      href={record.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 group/doc hover:opacity-80 transition-opacity"
                    >
                      <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center group-hover/doc:bg-emerald-200 transition-colors">
                        <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 underline underline-offset-2">View</span>
                    </a>
                  ) : record.hasDocs ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="h-7 w-7 rounded-lg bg-stone-100 flex items-center justify-center">
                        <FileX className="h-3.5 w-3.5 text-stone-400" />
                      </div>
                      <span className="text-[10px] font-semibold text-stone-400">No</span>
                    </div>
                  )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
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
                      onClick={() => onView(record)}
                      className="cursor-pointer rounded-xl py-2.5 text-stone-600 hover:bg-stone-100"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onEdit(record)}
                      className="cursor-pointer rounded-xl py-2.5 text-stone-600 hover:bg-stone-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(record.id)}
                      className="cursor-pointer rounded-xl py-2.5 text-amber-600 hover:bg-amber-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
