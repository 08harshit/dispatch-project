import { useState, useMemo, useEffect } from "react";
import { DollarSign, Plus } from "lucide-react";
import { RevenueTable, RevenueRecord } from "@/components/accounting/RevenueTable";
import { CostsTable, CostRecord } from "@/components/accounting/CostsTable";
import { AccountingTabs } from "@/components/accounting/AccountingTabs";
import { AddCostDialog } from "@/components/accounting/AddCostDialog";
import { AddRevenueDialog } from "@/components/accounting/AddRevenueDialog";
import { EditRevenueDialog } from "@/components/accounting/EditRevenueDialog";
import { EditCostDialog } from "@/components/accounting/EditCostDialog";
import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import { useAccountingStatsQuery, useAccountingTransactionsQuery } from "@/hooks/queries/useAccounting";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parse, isWithinInterval, isAfter, isBefore } from "date-fns";

function transactionToRevenueRecord(t: { id: string; date: string; description: string; amount: number }): RevenueRecord {
  const [y, m, d] = (t.date || "").split("-");
  const dateStr = m && d && y ? `${m}-${d}-${y}` : "";
  return {
    id: t.id,
    revenue: t.amount,
    bookingId: t.description?.slice(0, 20) || t.id.slice(0, 8),
    date: dateStr,
    paymentMethod: "Invoice",
    hasDocs: false,
  };
}

export const AccountingPage = () => {
  const [activeTab, setActiveTab] = useState<"revenue" | "costs">("revenue");
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);

  const { data: stats } = useAccountingStatsQuery();
  const { data: transactions } = useAccountingTransactionsQuery({ type: "income" });

  useEffect(() => {
    if (transactions) setRevenueRecords(transactions.map(transactionToRevenueRecord));
  }, [transactions]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [addRevenueOpen, setAddRevenueOpen] = useState(false);
  const [editRevenueRecord, setEditRevenueRecord] = useState<RevenueRecord | null>(null);
  const [editCostRecord, setEditCostRecord] = useState<CostRecord | null>(null);

  // Filter revenue records
  const filteredRevenueRecords = useMemo(() => {
    return revenueRecords
      .filter((record) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          record.bookingId.toLowerCase().includes(query) ||
          record.paymentMethod.toLowerCase().includes(query)
        );
      })
      .filter((record) => {
        if (!fromDate && !toDate) return true;
        const recordDate = parse(record.date, "MM-dd-yyyy", new Date());
        if (fromDate && toDate) {
          return isWithinInterval(recordDate, { start: fromDate, end: toDate });
        }
        if (fromDate) {
          return isAfter(recordDate, fromDate) || recordDate.getTime() === fromDate.getTime();
        }
        if (toDate) {
          return isBefore(recordDate, toDate) || recordDate.getTime() === toDate.getTime();
        }
        return true;
      });
  }, [revenueRecords, searchQuery, fromDate, toDate]);

  // Filter cost records
  const filteredCostRecords = useMemo(() => {
    return costRecords
      .filter((record) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          record.category.toLowerCase().includes(query) ||
          record.description.toLowerCase().includes(query) ||
          record.paymentMethod.toLowerCase().includes(query)
        );
      })
      .filter((record) => {
        if (!fromDate && !toDate) return true;
        const recordDate = parse(record.date, "MM-dd-yyyy", new Date());
        if (fromDate && toDate) {
          return isWithinInterval(recordDate, { start: fromDate, end: toDate });
        }
        if (fromDate) {
          return isAfter(recordDate, fromDate) || recordDate.getTime() === fromDate.getTime();
        }
        if (toDate) {
          return isBefore(recordDate, toDate) || recordDate.getTime() === toDate.getTime();
        }
        return true;
      });
  }, [costRecords, searchQuery, fromDate, toDate]);

  const totalRevenue = revenueRecords.reduce((sum, r) => sum + r.revenue, 0);
  const totalCosts = costRecords.reduce((sum, r) => sum + r.amount, 0);

  // Revenue handlers
  const handleEditRevenue = (record: RevenueRecord) => {
    setEditRevenueRecord(record);
  };

  const handleSaveRevenue = (updated: RevenueRecord) => {
    setRevenueRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    toast.success("Revenue updated successfully");
  };

  const handleDeleteRevenue = (recordId: string) => {
    setRevenueRecords((prev) => prev.filter((r) => r.id !== recordId));
    toast.success("Revenue record deleted");
  };

  const handleViewRevenue = (record: RevenueRecord) => {
    toast.info(`Viewing revenue ${record.bookingId}`);
  };

  // Cost handlers
  const handleEditCost = (record: CostRecord) => {
    setEditCostRecord(record);
  };

  const handleSaveCost = (updated: CostRecord) => {
    setCostRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    toast.success("Cost updated successfully");
  };

  const handleDeleteCost = (recordId: string) => {
    setCostRecords((prev) => prev.filter((r) => r.id !== recordId));
    toast.success("Cost record deleted");
  };

  const handleViewCost = (record: CostRecord) => {
    toast.info(`Viewing cost: ${record.category}`);
  };

  const handleAddRecord = () => {
    if (activeTab === "revenue") {
      setAddRevenueOpen(true);
    } else {
      setAddCostOpen(true);
    }
  };

  const handleAddRevenue = (newRevenue: Omit<RevenueRecord, "id">) => {
    const record: RevenueRecord = {
      ...newRevenue,
      id: crypto.randomUUID(),
    };
    setRevenueRecords((prev) => [record, ...prev]);
    toast.success("Revenue added (local only; backend has no create endpoint)");
  };

  const handleAddCost = (newCost: Omit<CostRecord, "id">) => {
    const record: CostRecord = {
      ...newCost,
      id: crypto.randomUUID(),
    };
    setCostRecords((prev) => [record, ...prev]);
    toast.success("Cost added (local only; costs table not in backend yet)");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFromDate(undefined);
    setToDate(undefined);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            activeTab === "revenue" ? "bg-emerald-100" : "bg-amber-100"
          }`}>
            <DollarSign className={`h-5 w-5 ${
              activeTab === "revenue" ? "text-emerald-700" : "text-amber-700"
            }`} strokeWidth={1.5} />
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-[0.25em] font-medium ${
              activeTab === "revenue" ? "text-emerald-600" : "text-amber-600"
            }`}>Finance</p>
            <h1 className="text-2xl font-semibold text-stone-700 tracking-tight">Accounting</h1>
          </div>
        </div>
        <Button 
          onClick={handleAddRecord}
          className={`rounded-xl px-5 shadow-sm ${
            activeTab === "revenue" 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === "revenue" ? "Revenue" : "Cost"}
        </Button>
      </div>

      {/* Tab Cards - Revenue & Costs */}
      <AccountingTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalRevenue={totalRevenue}
        totalCosts={totalCosts}
      />

      {/* Search and Date Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={activeTab === "revenue" 
          ? "Search by Booking ID, payment method..." 
          : "Search by category, description..."
        }
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onClearFilters={handleClearFilters}
      />

      {/* Content based on active tab */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {activeTab === "revenue" ? "Revenue Records" : "Cost Records"}
        </h2>
        
        {activeTab === "revenue" ? (
          <RevenueTable
            records={filteredRevenueRecords}
            onEdit={handleEditRevenue}
            onDelete={handleDeleteRevenue}
            onView={handleViewRevenue}
          />
        ) : (
          <CostsTable
            records={filteredCostRecords}
            onEdit={handleEditCost}
            onDelete={handleDeleteCost}
            onView={handleViewCost}
          />
        )}
      </div>

      {/* Add Cost Dialog */}
      <AddCostDialog
        open={addCostOpen}
        onOpenChange={setAddCostOpen}
        onAdd={handleAddCost}
      />

      {/* Add Revenue Dialog */}
      <AddRevenueDialog
        open={addRevenueOpen}
        onOpenChange={setAddRevenueOpen}
        onAdd={handleAddRevenue}
      />

      {/* Edit Revenue Dialog */}
      <EditRevenueDialog
        open={!!editRevenueRecord}
        onOpenChange={(o) => { if (!o) setEditRevenueRecord(null); }}
        record={editRevenueRecord}
        onSave={handleSaveRevenue}
      />

      {/* Edit Cost Dialog */}
      <EditCostDialog
        open={!!editCostRecord}
        onOpenChange={(o) => { if (!o) setEditCostRecord(null); }}
        record={editCostRecord}
        onSave={handleSaveCost}
      />
    </div>
  );
};
