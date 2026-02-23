import { useState, useMemo, useEffect } from "react";
import { 
  DollarSign, AlertTriangle, Plus, CheckCircle, Clock, XCircle, 
  CreditCard, Receipt, Wallet, FileText
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import FilterCards, { FilterCardData } from "@/components/dashboard/FilterCards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AddCostModal from "@/components/accounting/AddCostModal";
import AccountingTable from "@/components/accounting/AccountingTable";
import ViewCostModal from "@/components/accounting/ViewCostModal";
import EditCostModal from "@/components/accounting/EditCostModal";
import DeleteCostModal from "@/components/accounting/DeleteCostModal";
import ViewDocsModal from "@/components/accounting/ViewDocsModal";
import AccountingHistoryModal from "@/components/accounting/AccountingHistoryModal";
import AccountingFiltersBar, { AccountingFilters, SortField, SortDirection } from "@/components/accounting/AccountingFiltersBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HistoryEvent {
  id: string;
  type: "created" | "status_change" | "payout_change" | "cost_change" | "doc_added" | "doc_removed" | "edited" | "deleted";
  timestamp: string;
  performedBy: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

interface AccountingRecord {
  id: string;
  listingId: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  cost: number;
  date: string;
  paymentMethod: "cod" | "ach" | "wire" | "check";
  payoutStatus: "paid" | "pending" | "processing";
  hasDocs: boolean;
  history?: HistoryEvent[];
}

interface PayoutTab {
  id: string;
  label: string;
  count: number;
  icon: React.ReactNode;
}

const Accounting = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [activeFilterCard, setActiveFilterCard] = useState<string | null>(null);
  const [isAddCostOpen, setIsAddCostOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<AccountingRecord | null>(null);
  const [editRecord, setEditRecord] = useState<AccountingRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<AccountingRecord | null>(null);
  const [viewDocsRecord, setViewDocsRecord] = useState<AccountingRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<AccountingRecord | null>(null);
  
  // Column filters and sorting
  const [columnFilters, setColumnFilters] = useState<AccountingFilters>({
    paymentMethod: "",
    payoutStatus: "",
    hasDocs: "",
  });
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Fetch records from database
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const db = supabase as any;
        
        // Fetch records with history
        const { data: recordsData, error: recordsError } = await db
          .from('accounting_records')
          .select('*')
          .order('date', { ascending: false });

        if (recordsError) throw recordsError;

        const { data: historyData, error: historyError } = await db
          .from('accounting_history')
          .select('*')
          .order('created_at', { ascending: true });

        if (historyError) throw historyError;

        // Map database records to local format
        const mappedRecords: AccountingRecord[] = (recordsData || []).map((r: any) => {
          const recordHistory = (historyData || [])
            .filter((h: any) => h.record_id === r.id)
            .map((h: any) => ({
              id: h.id,
              type: h.action_type as HistoryEvent["type"],
              timestamp: h.created_at,
              performedBy: h.performed_by,
              details: h.details || '',
              previousValue: h.previous_value,
              newValue: h.new_value,
            }));

          return {
            id: r.id,
            listingId: r.listing_id,
            vehicleYear: r.vehicle_year || '2024',
            vehicleMake: r.vehicle_make || 'Unknown',
            vehicleModel: r.vehicle_model || 'Vehicle',
            vin: r.vin || 'N/A',
            stockNumber: r.stock_number || 'N/A',
            cost: Number(r.cost),
            date: r.date,
            paymentMethod: r.payment_method as AccountingRecord["paymentMethod"] || 'cod',
            payoutStatus: r.payout_status as AccountingRecord["payoutStatus"],
            hasDocs: r.has_docs,
            history: recordHistory,
          };
        });

        setRecords(mappedRecords);
      } catch (error) {
        console.error('Error fetching records:', error);
        toast({
          title: "Error",
          description: "Failed to load accounting records",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('accounting-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounting_records' },
        () => fetchRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleAddCost = async (newRecord: Omit<AccountingRecord, "id">) => {
    try {
      const db = supabase as any;
      
      const { data, error } = await db
        .from('accounting_records')
        .insert({
          listing_id: newRecord.listingId,
          vehicle_year: newRecord.vehicleYear,
          vehicle_make: newRecord.vehicleMake,
          vehicle_model: newRecord.vehicleModel,
          vin: newRecord.vin,
          stock_number: newRecord.stockNumber,
          cost: newRecord.cost,
          date: newRecord.date,
          payment_method: newRecord.paymentMethod,
          payout_status: newRecord.payoutStatus,
          has_docs: newRecord.hasDocs,
        })
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await db.from('accounting_history').insert({
        record_id: data.id,
        action_type: 'created',
        performed_by: 'Admin',
        details: 'Record created',
      });

      toast({
        title: "Success",
        description: "Record added successfully",
      });
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive",
      });
    }
  };

  const handleEditCost = async (updatedRecord: AccountingRecord) => {
    try {
      const db = supabase as any;
      const originalRecord = records.find(r => r.id === updatedRecord.id);
      if (!originalRecord) return;

      const { error } = await db
        .from('accounting_records')
        .update({
          listing_id: updatedRecord.listingId,
          vehicle_year: updatedRecord.vehicleYear,
          vehicle_make: updatedRecord.vehicleMake,
          vehicle_model: updatedRecord.vehicleModel,
          vin: updatedRecord.vin,
          stock_number: updatedRecord.stockNumber,
          cost: updatedRecord.cost,
          date: updatedRecord.date,
          payment_method: updatedRecord.paymentMethod,
          payout_status: updatedRecord.payoutStatus,
          has_docs: updatedRecord.hasDocs,
        })
        .eq('id', updatedRecord.id);

      if (error) throw error;

      // Log changes to history
      const historyEntries: any[] = [];

      if (originalRecord.cost !== updatedRecord.cost) {
        historyEntries.push({
          record_id: updatedRecord.id,
          action_type: 'cost_change',
          previous_value: `$${originalRecord.cost}`,
          new_value: `$${updatedRecord.cost}`,
          performed_by: 'Admin',
          details: 'Cost updated',
        });
      }

      if (originalRecord.paymentMethod !== updatedRecord.paymentMethod) {
        historyEntries.push({
          record_id: updatedRecord.id,
          action_type: 'status_change',
          previous_value: originalRecord.paymentMethod,
          new_value: updatedRecord.paymentMethod,
          performed_by: 'Admin',
          details: 'Payment method changed',
        });
      }

      if (originalRecord.payoutStatus !== updatedRecord.payoutStatus) {
        historyEntries.push({
          record_id: updatedRecord.id,
          action_type: 'payout_change',
          previous_value: originalRecord.payoutStatus,
          new_value: updatedRecord.payoutStatus,
          performed_by: 'Admin',
          details: 'Payout status changed',
        });
      }

      if (historyEntries.length === 0) {
        historyEntries.push({
          record_id: updatedRecord.id,
          action_type: 'edited',
          performed_by: 'Admin',
          details: 'Record edited',
        });
      }

      await db.from('accounting_history').insert(historyEntries);

      toast({
        title: "Success",
        description: "Record updated successfully",
      });
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCost = async (id: string) => {
    try {
      const db = supabase as any;
      
      const { error } = await db
        .from('accounting_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const handleInlineUpdate = async (record: AccountingRecord, field: string, value: string) => {
    try {
      const db = supabase as any;
      const dbField = field === "paymentMethod" ? "payment_method" : field === "payoutStatus" ? "payout_status" : field;
      
      const { error } = await db
        .from('accounting_records')
        .update({ [dbField]: value, updated_at: new Date().toISOString() })
        .eq('id', record.id);

      if (error) throw error;

      // Log history
      const previousValue = String((record as any)[field]);
      await db.from('accounting_history').insert({
        record_id: record.id,
        action_type: field === "payoutStatus" ? "payout_change" : field === "paymentMethod" ? "status_change" : "edited",
        previous_value: previousValue,
        new_value: value,
        performed_by: 'Admin',
        details: `${field === "date" ? "Date" : field === "paymentMethod" ? "Payment method" : "Payout status"} changed`,
      });

      toast({ title: "Updated", description: "Record updated successfully" });
    } catch (error) {
      console.error('Error updating record inline:', error);
      toast({ title: "Error", description: "Failed to update record", variant: "destructive" });
    }
  };

  // Calculate counts
  const tabCounts = useMemo(() => ({
    all: records.length,
    paid: records.filter(r => r.payoutStatus === "paid").length,
    processing: records.filter(r => r.payoutStatus === "processing").length,
    pending: records.filter(r => r.payoutStatus === "pending").length,
  }), [records]);

  const payoutTabs: PayoutTab[] = [
    { id: "all", label: "All", count: tabCounts.all, icon: <Wallet size={14} /> },
    { id: "paid", label: "Paid", count: tabCounts.paid, icon: <CheckCircle size={14} /> },
    { id: "processing", label: "Processing", count: tabCounts.processing, icon: <Clock size={14} /> },
    { id: "pending", label: "Pending", count: tabCounts.pending, icon: <XCircle size={14} /> },
  ];

  // Filter card data
  const filterCardCounts = useMemo(() => ({
    totalSpends: records.filter(r => r.payoutStatus === "paid").reduce((sum, r) => sum + r.cost, 0),
    pendingPayouts: records.filter(r => r.payoutStatus !== "paid").reduce((sum, r) => sum + r.cost, 0),
    withDocs: records.filter(r => r.hasDocs).length,
    missingDocs: records.filter(r => !r.hasDocs).length,
  }), [records]);

  const filterCards: FilterCardData[] = [
    {
      id: "spends",
      label: "Total Spends",
      value: `$${filterCardCounts.totalSpends.toLocaleString()}`,
      icon: <DollarSign size={18} />,
    },
    {
      id: "pending-amount",
      label: "Pending Payouts",
      value: `$${filterCardCounts.pendingPayouts.toLocaleString()}`,
      icon: <CreditCard size={18} />,
    },
    {
      id: "with-docs",
      label: "With Documents",
      value: `${filterCardCounts.withDocs} records`,
      icon: <FileText size={18} />,
    },
    {
      id: "missing-docs",
      label: "Missing Docs",
      value: `${filterCardCounts.missingDocs} records`,
      icon: <Receipt size={18} />,
    },
  ];

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = [...records];
    
    // Apply tab filter
    if (activeTab !== "all") {
      result = result.filter(r => r.payoutStatus === activeTab);
    }
    
    // Apply filter card filter
    if (activeFilterCard) {
      switch (activeFilterCard) {
        case "spends":
          result = result.filter(r => r.payoutStatus === "paid");
          break;
        case "pending-amount":
          result = result.filter(r => r.payoutStatus !== "paid");
          break;
        case "with-docs":
          result = result.filter(r => r.hasDocs);
          break;
        case "missing-docs":
          result = result.filter(r => !r.hasDocs);
          break;
      }
    }
    
    // Apply column filters
    if (columnFilters.paymentMethod) {
      result = result.filter(r => r.paymentMethod === columnFilters.paymentMethod);
    }
    if (columnFilters.payoutStatus) {
      result = result.filter(r => r.payoutStatus === columnFilters.payoutStatus);
    }
    if (columnFilters.hasDocs) {
      result = result.filter(r => 
        columnFilters.hasDocs === "true" ? r.hasDocs : !r.hasDocs
      );
    }
    
    // Apply sorting
    if (sortField === "cost") {
      result.sort((a, b) => {
        const diff = a.cost - b.cost;
        return sortDirection === "asc" ? diff : -diff;
      });
    } else if (sortField === "date") {
      result.sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDirection === "asc" ? diff : -diff;
      });
    }
    
    return result;
  }, [records, activeTab, activeFilterCard, columnFilters, sortField, sortDirection]);

  const totalCost = useMemo(() => records.reduce((sum, r) => sum + r.cost, 0), [records]);
  const alertCount = useMemo(() => records.filter(r => r.payoutStatus === "pending").length, [records]);

  const getTabColors = (tabId: string, isActive: boolean) => {
    if (!isActive) {
      return {
        bg: "bg-transparent",
        text: "text-muted-foreground",
        indicator: "bg-transparent",
      };
    }
    switch (tabId) {
      case "paid":
        return { bg: "bg-emerald-500/10", text: "text-emerald-600", indicator: "bg-emerald-500" };
      case "processing":
        return { bg: "bg-blue-500/10", text: "text-blue-600", indicator: "bg-blue-500" };
      case "pending":
        return { bg: "bg-amber-500/10", text: "text-amber-600", indicator: "bg-amber-500" };
      default:
        return { bg: "bg-primary/10", text: "text-primary", indicator: "bg-primary" };
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounting</h1>
          <p className="text-muted-foreground mt-1">Financial overview and payment tracking</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddCostOpen(true)}>
          <Plus size={18} />
          Add Cost
        </Button>
      </div>

      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatsCard
            title="Total Cost"
            value={`$${totalCost.toLocaleString()}`}
            icon={<DollarSign size={24} />}
            trend={{ value: 8, positive: true }}
          />
          <StatsCard
            title="Alerts"
            value={alertCount}
            icon={<AlertTriangle size={24} />}
            trend={{ value: alertCount > 0 ? 2 : 0, positive: false }}
          />
        </div>

        {/* Filter Cards */}
        <FilterCards
          cards={filterCards}
          activeFilter={activeFilterCard}
          onFilterChange={setActiveFilterCard}
        />

        {/* Innovative Tabs */}
        <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-1.5 shadow-sm mb-6">
          {payoutTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const colors = getTabColors(tab.id, isActive);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out",
                  colors.bg,
                  colors.text,
                  !isActive && "hover:bg-muted/50",
                  isActive && "shadow-sm"
                )}
              >
                {/* Animated indicator dot */}
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    isActive ? colors.indicator : "bg-muted-foreground/30",
                    isActive && "animate-pulse"
                  )}
                />
                
                {/* Icon */}
                <span className={cn(
                  "transition-transform duration-300",
                  isActive && "scale-110"
                )}>
                  {tab.icon}
                </span>
                
                {/* Label */}
                <span className="hidden sm:inline">{tab.label}</span>
                
                {/* Count badge */}
                <span
                  className={cn(
                    "min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                    isActive
                      ? `${colors.indicator} text-white`
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Column Filters & Sort */}
        <AccountingFiltersBar
          filters={columnFilters}
          onFiltersChange={setColumnFilters}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />

        {/* Accounting Table */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading records...</p>
          </div>
        ) : (
          <AccountingTable 
            records={filteredRecords} 
            onView={setViewRecord}
            onEdit={setEditRecord}
            onDelete={setDeleteRecord}
            onViewDocs={setViewDocsRecord}
            onViewHistory={setHistoryRecord}
            onInlineUpdate={handleInlineUpdate}
          />
        )}

      <AddCostModal
        open={isAddCostOpen}
        onOpenChange={setIsAddCostOpen}
        onAdd={handleAddCost}
      />

      <ViewCostModal
        open={!!viewRecord}
        onOpenChange={(open) => !open && setViewRecord(null)}
        record={viewRecord}
      />

      <EditCostModal
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
        record={editRecord}
        onSave={handleEditCost}
      />

      <DeleteCostModal
        open={!!deleteRecord}
        onOpenChange={(open) => !open && setDeleteRecord(null)}
        record={deleteRecord}
        onConfirm={handleDeleteCost}
      />

      <ViewDocsModal
        open={!!viewDocsRecord}
        onOpenChange={(open) => !open && setViewDocsRecord(null)}
        record={viewDocsRecord}
      />

      <AccountingHistoryModal
        open={!!historyRecord}
        onOpenChange={(open) => !open && setHistoryRecord(null)}
        recordId={historyRecord?.id || null}
        listingId={historyRecord?.listingId}
        history={historyRecord?.history || []}
      />
    </MainLayout>
  );
};

export default Accounting;
