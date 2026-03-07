import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Plus, Search, Eye, FileText, MoreHorizontal, Truck, CheckCircle, XCircle, UserPlus, AlertTriangle, History, Edit, Trash2, ExternalLink, Phone, Mail, MapPin, Filter, X, KeyRound, Power, ShieldCheck, Shield, Copy, MessageSquare, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AccountPasswordDialog } from "@/components/AccountPasswordDialog";
import { cn } from "@/lib/utils";
import { AddCourierForm, CourierFormData } from "@/components/forms/AddCourierForm";
import { toast } from "sonner";
import { fetchCouriers, fetchCourierStats, createCourier, toggleCourierStatus, deleteCourier, updateCourierCompliance, CourierListItem, CourierStats, CourierFilters } from "@/services/courierService";
import type { FilterTab } from "@/types/common";
import { StatsGrid, StatItem } from "@/components/common/StatsGrid";
import { HistoryDialog } from "@/components/common/HistoryDialog";
import { DocumentsDialog } from "@/components/common/DocumentsDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { useDialogManager } from "@/hooks/useDialogManager";
import { useTableSort } from "@/hooks/useTableSort";

// Courier type is now imported from courierService as CourierListItem
type Courier = CourierListItem;

type SortKey = "id" | "name" | "contact" | "compliance" | "status" | "history" | "documents";

// Equipment type enum values (matches DB enum)
const EQUIPMENT_TYPES = [
  "Open Transport",
  "Enclosed Transport",
  "Flatbed",
  "Hotshot",
  "Multi-Car Carrier",
];

export default function Couriers() {
  const [searchParams] = useSearchParams();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [stats, setStats] = useState<CourierStats>({ total: 0, active: 0, compliant: 0, nonCompliant: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const dialogs = useDialogManager<Courier>();
  const { sortField, sortDir, toggleSort } = useTableSort<SortKey>("id", "asc");

  useEffect(() => {
    const compliance = searchParams.get("compliance");
    if (compliance === "compliant" || compliance === "non-compliant") {
      setActiveTab(compliance);
    }
  }, [searchParams]);

  // --- Build server-side filters ---
  const buildFilters = useCallback((): CourierFilters => {
    const filters: CourierFilters = {};
    if (activeTab === "compliant") filters.compliance = "compliant";
    if (activeTab === "non-compliant") filters.compliance = "non-compliant";
    if (activeTab === "new") filters.isNew = true;
    if (equipmentTypeFilter !== "all") filters.equipmentType = equipmentTypeFilter;
    if (statusFilter !== "all") filters.status = statusFilter;
    return filters;
  }, [activeTab, equipmentTypeFilter, statusFilter]);

  // --- Fetch data from server ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [couriersResult, statsData] = await Promise.all([
        fetchCouriers(buildFilters()),
        fetchCourierStats(),
      ]);
      setCouriers(couriersResult.data);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load couriers:", err);
      toast.error("Failed to load couriers from server");
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, equipmentTypeFilter, statusFilter]);

  // --- Equipment types from enum (no longer derived from data) ---
  const uniqueEquipmentTypes = EQUIPMENT_TYPES;
  const uniqueStatuses = ["active", "inactive"];

  // --- Client-side search filter (instant UX) ---
  const filteredCouriers = couriers.filter((courier) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      courier.name.toLowerCase().includes(term) ||
      courier.contact.toLowerCase().includes(term) ||
      courier.phone.includes(term) ||
      courier.usdot.includes(term) ||
      courier.mc.toLowerCase().includes(term)
    );
  });

  // --- Client-side sort ---
  const sortedCouriers = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredCouriers].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "id": cmp = a.id.localeCompare(b.id); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "contact": cmp = a.contact.localeCompare(b.contact); break;
        case "compliance": cmp = a.compliance.localeCompare(b.compliance); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "history": cmp = (a.history?.length ?? 0) - (b.history?.length ?? 0); break;
        case "documents": cmp = (a.documents?.length ?? 0) - (b.documents?.length ?? 0); break;
        default: break;
      }
      return cmp * dir;
    });
  }, [filteredCouriers, sortField, sortDir]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(sortedCouriers.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedCouriers = sortedCouriers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );
  const startIndex = sortedCouriers.length > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(safeCurrentPage * pageSize, sortedCouriers.length);

  // --- Stats from server ---
  const totalCouriers = stats.total;
  const compliantCount = stats.compliant;
  const nonCompliantCount = stats.nonCompliant;
  const newCouriersCount = stats.new;
  const alertsCount = nonCompliantCount;

  const hasActiveFilters = equipmentTypeFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setEquipmentTypeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortField !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };



  const handleToggleStatus = async (courier: Courier) => {
    try {
      await toggleCourierStatus(courier.id);
      const newStatus = courier.status === "active" ? "inactive" : "active";
      toast.success(`${courier.name} status updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      console.error("Failed to toggle status:", err);
      toast.error(err.message || "Failed to toggle status");
    }
  };

  const handleDeleteCourier = async (courier: Courier) => {
    if (!confirm(`Are you sure you want to delete ${courier.name}?`)) return;
    try {
      await deleteCourier(courier.id);
      toast.success(`${courier.name} deleted successfully`);
      loadData();
    } catch (err: any) {
      console.error("Failed to delete courier:", err);
      toast.error(err.message || "Failed to delete courier");
    }
  };

  const handleVerifyFMCSA = (usdot: string) => {
    window.open(`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${usdot}`, '_blank');
  };

  const handleToggleCompliance = async (courier: Courier) => {
    const newCompliance = courier.compliance === "compliant" ? "non-compliant" : "compliant";
    try {
      await updateCourierCompliance(courier.id, newCompliance);
      toast.success(`${courier.name} compliance updated to ${newCompliance}`);
      loadData();
    } catch (err: any) {
      console.error("Failed to update compliance:", err);
      toast.error(err.message || "Failed to update compliance");
    }
  };

  const handleEditComplianceChange = async (newCompliance: "compliant" | "non-compliant") => {
    if (!dialogs.selected || dialogs.selected.compliance === newCompliance) return;
    try {
      await updateCourierCompliance(dialogs.selected.id, newCompliance);
      toast.success(`${dialogs.selected.name} compliance updated`);
      loadData();
      dialogs.setSelected({ ...dialogs.selected, compliance: newCompliance });
    } catch (err: unknown) {
      console.error("Failed to update compliance:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update compliance");
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
                <Truck className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-background flex items-center justify-center">
                <span className="text-[9px] font-bold text-success-foreground">{totalCouriers}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Couriers</h1>
              <p className="mt-0.5 text-muted-foreground flex items-center gap-2">
                Manage your courier partners
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
                Add Courier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl animate-scale-in">
              <DialogHeader>
                <DialogTitle>Add New Courier</DialogTitle>
              </DialogHeader>
              <AddCourierForm onSuccess={() => { setIsAddDialogOpen(false); loadData(); }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats - Bento Grid Style */}
        <StatsGrid
          stats={[
            { label: "Total Couriers", value: totalCouriers, icon: Truck, color: "primary", delay: 1 },
            { label: "In Compliance", value: compliantCount, icon: CheckCircle, color: "success", delay: 2 },
            { label: "Out of Compliance", value: nonCompliantCount, icon: XCircle, color: "destructive", delay: 3 },
            { label: "New Couriers", value: newCouriersCount, icon: UserPlus, color: "primary", delay: 4 },
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
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xl font-bold">All Couriers</span>
                    <p className="text-xs text-muted-foreground font-normal">Manage and track courier partners</p>
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
                    { value: "all", label: "All", count: totalCouriers, color: "foreground" },
                    { value: "compliant", label: "Compliant", count: compliantCount, color: "success" },
                    { value: "non-compliant", label: "Non-Compliant", count: nonCompliantCount, color: "destructive" },
                    { value: "new", label: "New", count: newCouriersCount, color: "primary" },
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
                <Select value={equipmentTypeFilter} onValueChange={setEquipmentTypeFilter}>
                  <SelectTrigger className="w-[160px] h-10 bg-background border-border/30 hover:border-primary/50 rounded-xl transition-colors">
                    <SelectValue placeholder="Equipment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    {uniqueEquipmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-background border-border/30 hover:border-primary/50 rounded-xl transition-colors">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
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
                    <span className="text-sm font-bold text-foreground">{sortedCouriers.length}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">result{sortedCouriers.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-xl font-bold text-foreground">Loading Couriers...</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">Fetching data from the server</p>
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
                        <div className="flex items-center gap-1.5">Courier Name <SortIcon column="name" /></div>
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
                    {paginatedCouriers.map((courier) => (
                      <TableRow
                        key={courier.id}
                        className={cn(
                          "group transition-colors",
                          courier.status === "inactive" && "opacity-60"
                        )}
                      >
                        <TableCell>
                          <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{courier.id}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                              courier.compliance === "compliant" ? "bg-success/15" : "bg-destructive/15"
                            )}>
                              <Truck className={cn(
                                "h-4 w-4",
                                courier.compliance === "compliant" ? "text-success" : "text-destructive"
                              )} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{courier.name}</p>
                              {courier.isNew && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5 bg-primary/10 text-primary border-0">NEW</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="group/email flex items-center gap-1.5 text-foreground">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              <a href={`mailto:${courier.contact}`} className="truncate max-w-[160px] text-primary hover:underline">{courier.contact}</a>
                              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(courier.contact); toast.success("Email copied!"); }} title="Copy email" className="hidden group-hover/email:flex h-5 w-5 rounded-full bg-muted/50 hover:bg-muted items-center justify-center transition-colors shrink-0">
                                <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                              </button>
                            </div>
                            <div className="group/phone flex items-center gap-1.5 text-muted-foreground relative">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{courier.phone}</span>
                              <div className="hidden group-hover/phone:flex items-center gap-1 ml-1">
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(courier.phone); toast.success("Phone copied!"); }} title="Copy phone" className="h-6 w-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                </button>
                                <a href={`tel:${courier.phone}`} title="Call" className="h-6 w-6 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors">
                                  <Phone className="h-3 w-3 text-accent" />
                                </a>
                                <a href={`sms:${courier.phone}`} title="Send text" className="h-6 w-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                                  <MessageSquare className="h-3 w-3 text-primary" />
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{courier.address.split(',').pop()?.trim()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <Badge
                              className={cn(
                                "font-medium text-xs cursor-pointer transition-all hover:opacity-80",
                                courier.compliance === "compliant"
                                  ? "bg-success/15 text-success border border-success/30 hover:bg-success/25"
                                  : "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                              )}
                              onClick={() => dialogs.open("edit", courier)}
                            >
                              <span className={cn(
                                "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
                                courier.compliance === "compliant" ? "bg-success" : "bg-destructive animate-pulse"
                              )} />
                              {courier.compliance === "compliant" ? "Compliant" : "Non-Compliant"}
                            </Badge>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(courier); }}
                              className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                                courier.status === "active"
                                  ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                                  : "bg-muted/50 text-muted-foreground border-muted-foreground/20 hover:bg-destructive/10 hover:text-destructive"
                              )}
                            >
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                courier.status === "active" ? "bg-success" : "bg-muted-foreground/40"
                              )} />
                              {courier.status === "active" ? "Active" : "Inactive"}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-primary"
                            onClick={() => dialogs.open("history", courier)}
                          >
                            <History className="h-4 w-4" />
                            <span className="text-xs">{courier.history?.length ?? 0}</span>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-primary"
                            onClick={() => dialogs.open("docs", courier)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">{courier.documents?.length ?? 0}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => dialogs.open("view", courier)}
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
                                <DropdownMenuItem onClick={() => dialogs.open("view", courier)} className="gap-3 rounded-lg">
                                  <Eye className="h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => dialogs.open("edit", courier)} className="gap-3 rounded-lg">
                                  <Edit className="h-4 w-4" /> Edit Courier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleVerifyFMCSA(courier.usdot)} className="gap-3 rounded-lg">
                                  <ExternalLink className="h-4 w-4" /> Verify FMCSA
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => dialogs.open("password", courier)} className="gap-3 rounded-lg">
                                  <KeyRound className="h-4 w-4" /> Set Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleCompliance(courier)} className="gap-3 rounded-lg">
                                  <ShieldCheck className="h-4 w-4" />
                                  {courier.compliance === "compliant" ? "Mark Non-Compliant" : "Mark Compliant"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2" />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCourier(courier)}
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
                    {paginatedCouriers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <EmptyState
                            icon={Truck}
                            title="No couriers found"
                            description="Try adjusting your search criteria or filters to find what you're looking for"
                            actionLabel="Clear Filters"
                            onAction={clearFilters}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {filteredCouriers.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/10">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{startIndex}</span> to <span className="font-semibold text-foreground">{endIndex}</span> of <span className="font-semibold text-foreground">{sortedCouriers.length}</span> results
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setCurrentPage(1)}
                        disabled={safeCurrentPage <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeCurrentPage <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Page {safeCurrentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={safeCurrentPage >= totalPages}
                      >
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
            <DialogTitle>Courier Details</DialogTitle>
            <DialogDescription>
              {dialogs.selected?.id} - {dialogs.selected?.name}
            </DialogDescription>
          </DialogHeader>
          {dialogs.selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={dialogs.selected.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                    {dialogs.selected.status === "active" ? "Active" : "Inactive"}
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
                  <p className="text-xs text-muted-foreground">USDOT #</p>
                  <p className="font-mono text-sm">{dialogs.selected.usdot}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MC #</p>
                  <p className="font-mono text-sm">{dialogs.selected.mc}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground"># of Trucks</p>
                  <p className="text-sm font-medium">{dialogs.selected.trucks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equipment Type</p>
                  <p className="text-sm">{dialogs.selected.equipmentType}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Insurance Company</p>
                  <p className="text-sm">{dialogs.selected.insuranceCompany}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleVerifyFMCSA(dialogs.selected.usdot)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Verify on FMCSA
                </Button>
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
      />

      {/* Edit Dialog */}
      <Dialog open={dialogs.isOpen("edit")} onOpenChange={dialogs.setOpen.bind(null, "edit")}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Courier</DialogTitle>
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
              <AddCourierForm
              onSuccess={() => {
                dialogs.setOpen("edit", false);
                loadData();
              }}
              isEditing={true}
              editingId={dialogs.selected.id}
              initialData={{
                id: dialogs.selected.id,
                courierName: dialogs.selected.name,
                businessEmail: dialogs.selected.contact,
                businessPhone: dialogs.selected.phone,
                address: dialogs.selected.address,
                usdot: dialogs.selected.usdot,
                mcNumber: dialogs.selected.mc,
                numTrucks: String(dialogs.selected.trucks),
                equipmentType: dialogs.selected.equipmentType,
                insuranceCompany: dialogs.selected.insuranceCompany,
              } as Partial<CourierFormData>}
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
        />
      )}
    </MainLayout>
  );
}
