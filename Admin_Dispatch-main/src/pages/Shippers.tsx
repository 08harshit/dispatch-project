import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { StatsGrid } from "@/components/common/StatsGrid";
import { HistoryDialog } from "@/components/common/HistoryDialog";
import { DocumentsDialog } from "@/components/common/DocumentsDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { useDialogManager } from "@/hooks/useDialogManager";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, FileText, MoreHorizontal, Package, CheckCircle, XCircle, UserPlus, AlertTriangle, History, Edit, Trash2, Phone, Mail, MapPin, Clock, Building2, Filter, X, KeyRound, Power, ShieldCheck, Shield, Copy, MessageSquare, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AccountPasswordDialog } from "@/components/AccountPasswordDialog";
import { cn } from "@/lib/utils";
import { AddShipperForm, ShipperFormData } from "@/components/forms/AddShipperForm";
import { toast } from "sonner";
import { Shipper, ShipperStats, ShipperFilters, fetchShippers, fetchShipperStats, updateShipperStatus, updateShipperCompliance, deleteShipper, addShipperDocument, deleteShipperDocument } from "@/services/shipperService";
import type { FilterTab } from "@/types/common";
import { useTableSort } from "@/hooks/useTableSort";

type SortKey = "id" | "name" | "contact" | "compliance" | "history" | "documents";

export default function Shippers() {
  const { shipperId: paramShipperId } = useParams();
  const [searchParams] = useSearchParams();
  const highlightShipperId = paramShipperId ?? searchParams.get("shipper_id") ?? undefined;
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [stats, setStats] = useState<ShipperStats>({ total: 0, compliant: 0, nonCompliant: 0, new: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Shipper | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const dialogs = useDialogManager<Shipper>();
  const { sortField, sortDir, toggleSort } = useTableSort<SortKey>("id", "asc");

  useEffect(() => {
    const compliance = searchParams.get("compliance");
    if (compliance === "compliant" || compliance === "non-compliant") {
      setActiveTab(compliance);
    }
  }, [searchParams]);

  useEffect(() => {
    if (highlightShipperId) {
      setActiveTab("all");
      setBusinessTypeFilter("all");
      setStateFilter("all");
    }
  }, [highlightShipperId]);

  const buildFilters = useCallback((): ShipperFilters => {
    const filters: ShipperFilters = {};
    if (activeTab === "compliant") filters.compliance = "compliant";
    if (activeTab === "non-compliant") filters.compliance = "non-compliant";
    if (activeTab === "new") filters.isNew = true;
    if (businessTypeFilter !== "all") filters.businessType = businessTypeFilter;
    if (stateFilter !== "all") filters.state = stateFilter;
    return filters;
  }, [activeTab, businessTypeFilter, stateFilter]);

  const loadShippers = useCallback(async (): Promise<Shipper[]> => {
    setLoading(true);
    setError(null);
    try {
      const [shippersData, statsData] = await Promise.all([
        fetchShippers(buildFilters()),
        fetchShipperStats(),
      ]);
      setShippers(shippersData);
      setStats(statsData);
      return shippersData;
    } catch (e) {
      setError(e?.message || "Failed to load shippers");
      return [];
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    loadShippers();
  }, [loadShippers]);

  const filteredShippers = shippers.filter((shipper) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      shipper.name.toLowerCase().includes(term) ||
      shipper.id.toLowerCase().includes(term) ||
      (shipper.contact && shipper.contact.toLowerCase().includes(term))
    );
  });

  // Get unique values for filters from current result set
  const uniqueBusinessTypes = [...new Set(shippers.map(s => s.businessType).filter(Boolean))].sort();
  const uniqueStates = [...new Set(shippers.map(s => s.state).filter(Boolean))].sort();

  const totalShippers = stats.total;
  const compliantCount = stats.compliant;
  const nonCompliantCount = stats.nonCompliant;
  const newShippersCount = stats.new;
  const alertsCount = stats.alerts;

  const hasActiveFilters = businessTypeFilter !== "all" || stateFilter !== "all" || !!searchTerm;

  const clearFilters = () => {
    setBusinessTypeFilter("all");
    setStateFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // --- Client-side sort ---
  const sortedShippers = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredShippers].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "id": cmp = a.id.localeCompare(b.id); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "contact": cmp = (a.contact || "").localeCompare(b.contact || ""); break;
        case "compliance": cmp = a.compliance.localeCompare(b.compliance); break;
        case "history": cmp = (a.history?.length ?? 0) - (b.history?.length ?? 0); break;
        case "documents": cmp = (a.documents?.length ?? 0) - (b.documents?.length ?? 0); break;
        default: break;
      }
      return cmp * dir;
    });
  }, [filteredShippers, sortField, sortDir]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(sortedShippers.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedShippers = sortedShippers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );
  const startIndex = sortedShippers.length > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(safeCurrentPage * pageSize, sortedShippers.length);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortField !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, businessTypeFilter, stateFilter]);

  const handleToggleStatus = async (shipper: Shipper) => {
    const newStatus = shipper.status === "active" ? "inactive" : "active";
    try {
      await updateShipperStatus(shipper.id, newStatus);
      toast.success(`${shipper.name} ${newStatus === "active" ? "activated" : "deactivated"}`);
      loadShippers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const handleToggleCompliance = async (shipper: Shipper) => {
    const newCompliance = shipper.compliance === "compliant" ? "non-compliant" : "compliant";
    try {
      await updateShipperCompliance(shipper.id, newCompliance);
      toast.success(`${shipper.name} compliance updated to ${newCompliance}`);
      loadShippers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update compliance");
    }
  };

  const handleEditComplianceChange = async (newCompliance: "compliant" | "non-compliant") => {
    if (!dialogs.selected || dialogs.selected.compliance === newCompliance) return;
    try {
      await updateShipperCompliance(dialogs.selected.id, newCompliance);
      toast.success(`${dialogs.selected.name} compliance updated`);
      loadShippers();
      dialogs.setSelected({ ...dialogs.selected, compliance: newCompliance });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update compliance");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteShipper(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      loadShippers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete shipper");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-gradient-radial from-success/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow">
                <Package className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-background flex items-center justify-center">
                <span className="text-[9px] font-bold text-success-foreground">{totalShippers}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Shippers</h1>
              <p className="mt-0.5 text-muted-foreground flex items-center gap-2">
                Manage your shipper accounts
                <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  {compliantCount} compliant
                </span>
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                <Plus className="h-4 w-4" />
                Add Shipper
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl animate-scale-in">
              <DialogHeader>
                <DialogTitle>Add New Shipper</DialogTitle>
              </DialogHeader>
              <AddShipperForm onSuccess={() => { setIsAddDialogOpen(false); loadShippers(); }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats - Bento Grid Style */}
        <StatsGrid
          stats={[
            { label: "Total Shippers", value: totalShippers, icon: Package, color: "primary", delay: 1 },
            { label: "In Compliance", value: compliantCount, icon: CheckCircle, color: "success", delay: 2 },
            { label: "Out of Compliance", value: nonCompliantCount, icon: XCircle, color: "destructive", delay: 3 },
            { label: "New Shippers", value: newShippersCount, icon: UserPlus, color: "primary", delay: 4 },
            { label: "Alerts", value: alertsCount, icon: AlertTriangle, color: "warning", delay: 5 },
          ]}
          columns={5}
        />

        {/* Filter Tabs and Cards */}
        <Card className="overflow-hidden border-0 shadow-elevated bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-transparent">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xl font-bold">All Shippers</span>
                    <p className="text-xs text-muted-foreground font-normal">Manage and track shipper accounts</p>
                  </div>
                </CardTitle>
                <div className="relative w-full sm:w-80">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    placeholder="Search by name, ID, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-14 h-12 bg-background/80 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                  />
                </div>
              </div>

              {/* Modern Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
                <TabsList className="bg-muted/30 p-1.5 rounded-xl h-auto flex-wrap">
                  {[
                    { value: "all", label: "All", count: totalShippers, color: "foreground" },
                    { value: "compliant", label: "Compliant", count: compliantCount, color: "success" },
                    { value: "non-compliant", label: "Non-Compliant", count: nonCompliantCount, color: "destructive" },
                    { value: "new", label: "New", count: newShippersCount, color: "primary" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                      {tab.label}
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                        activeTab === tab.value
                          ? tab.color === "success" ? "bg-success/20 text-success"
                            : tab.color === "destructive" ? "bg-destructive/20 text-destructive"
                              : tab.color === "primary" ? "bg-primary/20 text-primary"
                                : "bg-foreground/10 text-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {tab.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Floating Filter Bar */}
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/20 border border-border/30">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Filters</span>
                </div>
                <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                  <SelectTrigger className="w-[150px] h-10 bg-background border-border/30 hover:border-primary/50 rounded-xl transition-colors">
                    <SelectValue placeholder="Business Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueBusinessTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-background border-border/30 hover:border-primary/50 rounded-xl transition-colors">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {uniqueStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
                <div className="ml-auto flex items-center gap-3 px-4 py-2 rounded-full bg-background/80 border border-border/30">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-bold text-foreground">{sortedShippers.length}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">result{sortedShippers.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-xl font-bold text-foreground">Loading Shippers...</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">Fetching data from the server</p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive m-4">
                  {error}
                </div>
              ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => toggleSort("id")}>
                        <div className="flex items-center gap-1.5">Client # <SortIcon column="id" /></div>
                      </TableHead>
                      <TableHead className="font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => toggleSort("name")}>
                        <div className="flex items-center gap-1.5">Shipper Name <SortIcon column="name" /></div>
                      </TableHead>
                      <TableHead className="font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => toggleSort("contact")}>
                        <div className="flex items-center gap-1.5">Contact <SortIcon column="contact" /></div>
                      </TableHead>
                      <TableHead className="font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => toggleSort("compliance")}>
                        <div className="flex items-center gap-1.5">Status <SortIcon column="compliance" /></div>
                      </TableHead>
                      <TableHead className="font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => toggleSort("history")}>
                        <div className="flex items-center gap-1.5">History <SortIcon column="history" /></div>
                      </TableHead>
                      <TableHead className="font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => toggleSort("documents")}>
                        <div className="flex items-center gap-1.5">Documents <SortIcon column="documents" /></div>
                      </TableHead>
                      <TableHead className="font-semibold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedShippers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <EmptyState
                            icon={Package}
                            title="No shippers found"
                            description={stats.total === 0 ? "Add a shipper to get started." : "No shippers match your filters or search."}
                            actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
                            onAction={hasActiveFilters ? clearFilters : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    ) : paginatedShippers.map((shipper) => (
                      <TableRow
                        key={shipper.id}
                        className={cn(
                          "group transition-colors",
                          shipper.status === "inactive" && "opacity-60",
                          shipper.id === highlightShipperId && "ring-2 ring-primary ring-inset bg-primary/5"
                        )}
                      >
                        <TableCell>
                          <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{shipper.id}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                              shipper.compliance === "compliant" ? "bg-success/15" : "bg-destructive/15"
                            )}>
                              <Package className={cn(
                                "h-4 w-4",
                                shipper.compliance === "compliant" ? "text-success" : "text-destructive"
                              )} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{shipper.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">{shipper.businessType}</span>
                                {shipper.isNew && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">NEW</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="group/email flex items-center gap-1.5 text-foreground">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              <a href={`mailto:${shipper.contact}`} className="truncate max-w-[160px] text-primary hover:underline">{shipper.contact}</a>
                              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(shipper.contact || ""); toast.success("Email copied!"); }} title="Copy email" className="hidden group-hover/email:flex h-5 w-5 rounded-full bg-muted/50 hover:bg-muted items-center justify-center transition-colors shrink-0">
                                <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                              </button>
                            </div>
                            <div className="group/phone flex items-center gap-1.5 text-muted-foreground relative">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{shipper.phone}</span>
                              <div className="hidden group-hover/phone:flex items-center gap-1 ml-1">
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(shipper.phone || ""); toast.success("Phone copied!"); }} title="Copy phone" className="h-6 w-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                </button>
                                <a href={`tel:${shipper.phone}`} title="Call" className="h-6 w-6 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors">
                                  <Phone className="h-3 w-3 text-accent" />
                                </a>
                                <a href={`sms:${shipper.phone}`} title="Send text" className="h-6 w-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                                  <MessageSquare className="h-3 w-3 text-primary" />
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{shipper.city}, {shipper.state}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-medium text-xs cursor-pointer transition-all hover:opacity-80",
                              shipper.compliance === "compliant"
                                ? "bg-success/15 text-success border border-success/30 hover:bg-success/25"
                                : "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                            )}
                            onClick={() => dialogs.open("edit", shipper)}
                          >
                            <span className={cn(
                              "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
                              shipper.compliance === "compliant" ? "bg-success" : "bg-destructive animate-pulse"
                            )} />
                            {shipper.compliance === "compliant" ? "Compliant" : "Non-Compliant"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-primary"
                            onClick={() => dialogs.open("history", shipper)}
                          >
                            <History className="h-4 w-4" />
                            <span className="text-xs">{shipper.history?.length ?? 0}</span>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-primary"
                            onClick={() => dialogs.open("docs", shipper)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">{shipper.documents?.length ?? 0}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => dialogs.open("view", shipper)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 rounded-xl p-2">
                                <DropdownMenuItem onClick={() => dialogs.open("view", shipper)} className="gap-3 rounded-lg">
                                  <Eye className="h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => dialogs.open("edit", shipper)} className="gap-3 rounded-lg">
                                  <Edit className="h-4 w-4" /> Edit Shipper
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => dialogs.open("password", shipper)} className="gap-3 rounded-lg">
                                  <KeyRound className="h-4 w-4" /> Set Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleCompliance(shipper)} className="gap-3 rounded-lg">
                                  <ShieldCheck className="h-4 w-4" />
                                  {shipper.compliance === "compliant" ? "Mark Non-Compliant" : "Mark Compliant"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2" />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(shipper)}
                                  className="gap-3 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredShippers.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/10">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{startIndex}</span> to <span className="font-semibold text-foreground">{endIndex}</span> of <span className="font-semibold text-foreground">{sortedShippers.length}</span> results
                      </p>
                      <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[80px] h-8 text-xs bg-background border-border/30 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 20, 50].map((size) => (
                            <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">Page {safeCurrentPage} of {totalPages}</span>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage >= totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage >= totalPages}>
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={dialogs.isOpen("view")} onOpenChange={dialogs.setOpen.bind(null, "view")}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Shipper Details</DialogTitle>
            <DialogDescription>
              {dialogs.selected?.id} - {dialogs.selected?.name}
            </DialogDescription>
          </DialogHeader>
          {dialogs.selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Business Type</p>
                  <Badge className="bg-primary/10 text-primary border-0">
                    {dialogs.selected.businessType}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Compliance</p>
                  <Badge className={cn("border-0", dialogs.selected.compliance === "compliant" ? "compliance-compliant" : "compliance-non-compliant")}>
                    {dialogs.selected.compliance === "compliant" ? "Compliant" : "Non-Compliant"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Principal: {dialogs.selected.principalName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{dialogs.selected.contact}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{dialogs.selected.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{dialogs.selected.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">EIN (Tax ID)</p>
                  <p className="font-mono text-sm">{dialogs.selected.ein}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tax Exempt</p>
                  <Badge className={dialogs.selected.taxExempt ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                    {dialogs.selected.taxExempt ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Pickup: {dialogs.selected.hoursPickup}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Dropoff: {dialogs.selected.hoursDropoff}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => dialogs.open("edit", dialogs.selected)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <HistoryDialog
        open={dialogs.isOpen("history")}
        onOpenChange={dialogs.setOpen.bind(null, "history")}
        entityName={dialogs.selected?.name || ""}
        history={dialogs.selected?.history || []}
      />

      {/* Documents Dialog */}
      <DocumentsDialog
        open={dialogs.isOpen("docs")}
        onOpenChange={dialogs.setOpen.bind(null, "docs")}
        entityName={dialogs.selected?.name || ""}
        documents={dialogs.selected?.documents || []}
        onUpload={dialogs.selected ? async (meta) => {
          await addShipperDocument(dialogs.selected!.id, meta);
          const updated = await loadShippers();
          const found = updated.find((s) => s.id === dialogs.selected?.id);
          if (found) dialogs.setSelected(found);
        } : undefined}
        onDelete={dialogs.selected ? async (docId) => {
          await deleteShipperDocument(dialogs.selected!.id, docId);
          const updated = await loadShippers();
          const found = updated.find((s) => s.id === dialogs.selected?.id);
          if (found) dialogs.setSelected(found);
        } : undefined}
      />

      {/* Edit Dialog */}
      <Dialog open={dialogs.isOpen("edit")} onOpenChange={dialogs.setOpen.bind(null, "edit")}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shipper</DialogTitle>
            <DialogDescription>
              {dialogs.selected?.id} - {dialogs.selected?.name}
            </DialogDescription>
          </DialogHeader>
          {dialogs.selected && (
            <>
              <div className="space-y-2 pb-4 border-b">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Compliance Status
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["compliant", "non-compliant"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleEditComplianceChange(status)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium",
                        dialogs.selected!.compliance === status
                          ? status === "compliant"
                            ? "border-success bg-success/10 text-success"
                            : "border-destructive bg-destructive/10 text-destructive"
                          : "border-border bg-muted/10 text-muted-foreground hover:border-muted-foreground/40"
                      )}
                    >
                      {status === "compliant" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {status === "compliant" ? "Compliant" : "Non-Compliant"}
                    </button>
                  ))}
                </div>
              </div>
              <AddShipperForm
              onSuccess={() => {
                dialogs.setOpen("edit", false);
                loadShippers();
              }}
              isEditing={true}
              initialData={{
                id: dialogs.selected.id,
                businessName: dialogs.selected.name,
                businessType: dialogs.selected.businessType?.toLowerCase() ?? "",
                dealerContactEmail: dialogs.selected.contact,
                dealerPhone: dialogs.selected.phone,
                address: dialogs.selected.address,
                city: dialogs.selected.city,
                state: dialogs.selected.state,
                ein: dialogs.selected.ein,
                taxExempt: dialogs.selected.taxExempt,
                hoursPickup: dialogs.selected.hoursPickup,
                hoursDropoff: dialogs.selected.hoursDropoff,
                principalName: dialogs.selected.principalName,
              }}
            />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Management Dialog */}
      {dialogs.selected && (
        <AccountPasswordDialog
          open={dialogs.isOpen("password")}
          onOpenChange={dialogs.setOpen.bind(null, "password")}
          accountName={dialogs.selected.name}
          accountId={dialogs.selected.id}
          accountEmail={dialogs.selected.contact}
          accountType="shipper"
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipper</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
