import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Eye, FileText, MoreHorizontal, Truck, CheckCircle, XCircle, UserPlus, AlertTriangle, History, Edit, Trash2, ExternalLink, Phone, Mail, MapPin, Filter, X, KeyRound, Power, ShieldCheck } from "lucide-react";
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

// Courier type is now imported from courierService as CourierListItem
type Courier = CourierListItem;

// Equipment type enum values (matches DB enum)
const EQUIPMENT_TYPES = [
  "Open Transport",
  "Enclosed Transport",
  "Flatbed",
  "Hotshot",
  "Multi-Car Carrier",
];

export default function Couriers() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [stats, setStats] = useState<CourierStats>({ total: 0, active: 0, compliant: 0, nonCompliant: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const dialogs = useDialogManager<Courier>();

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
                    <span className="text-sm font-bold text-foreground">{filteredCouriers.length}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">result{filteredCouriers.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-xl font-bold text-foreground">Loading Couriers...</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">Fetching data from the server</p>
                </div>
              ) : filteredCouriers.map((courier, index) => (
                <div
                  key={courier.id}
                  className={cn(
                    "group relative rounded-2xl border border-border/50 bg-gradient-to-r from-background via-background to-muted/10 overflow-hidden transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 hover:border-primary/40 animate-fade-in",
                    courier.status === "inactive" && "opacity-60"
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Top colored bar based on compliance */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
                    courier.compliance === "compliant"
                      ? "bg-gradient-to-r from-success via-success/80 to-success/40"
                      : "bg-gradient-to-r from-destructive via-destructive/80 to-destructive/40"
                  )} />

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative p-5 flex flex-col lg:flex-row lg:items-center gap-5">
                    {/* Left: Avatar & ID */}
                    <div className="flex items-center gap-4 lg:w-56">
                      <div className="relative">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                          courier.compliance === "compliant"
                            ? "bg-gradient-to-br from-success/25 to-success/5 shadow-[0_0_20px_-5px] shadow-success/30"
                            : "bg-gradient-to-br from-destructive/25 to-destructive/5 shadow-[0_0_20px_-5px] shadow-destructive/30"
                        )}>
                          <Truck className={cn(
                            "h-7 w-7 transition-transform duration-300 group-hover:scale-110",
                            courier.compliance === "compliant" ? "text-success" : "text-destructive"
                          )} />
                        </div>
                        {courier.isNew && (
                          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow animate-bounce-subtle">
                            <span className="text-[9px] font-bold text-primary-foreground">NEW</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded inline-block">{courier.id}</p>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground text-lg leading-tight">{courier.name}</p>
                        </div>
                        {/* Inline Activation Toggle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(courier); }}
                          className={cn(
                            "group/toggle relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-500 cursor-pointer border",
                            courier.status === "active"
                              ? "bg-success/10 text-success border-success/20 hover:bg-success/20 hover:shadow-[0_0_12px_-3px] hover:shadow-success/40"
                              : "bg-muted/50 text-muted-foreground border-muted-foreground/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                          )}
                        >
                          <span className={cn(
                            "relative flex h-2 w-2",
                          )}>
                            {courier.status === "active" && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                            )}
                            <span className={cn(
                              "relative inline-flex rounded-full h-2 w-2 transition-colors duration-300",
                              courier.status === "active" ? "bg-success" : "bg-muted-foreground/40"
                            )} />
                          </span>
                          {courier.status === "active" ? "Actif" : "Inactif"}
                          <Power className={cn(
                            "h-2.5 w-2.5 transition-all duration-300 opacity-0 group-hover/toggle:opacity-100 group-hover/toggle:rotate-180",
                          )} />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Details Grid */}
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Contact
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">{courier.contact}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Status</p>
                        <Badge className={cn(
                          "font-bold shadow-sm transition-all duration-300 group-hover:scale-105",
                          courier.compliance === "compliant"
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-destructive/15 text-destructive border border-destructive/30"
                        )}>
                          <span className={cn(
                            "mr-2 h-2 w-2 rounded-full inline-block",
                            courier.compliance === "compliant" ? "bg-success" : "bg-destructive animate-pulse"
                          )} />
                          {courier.compliance === "compliant" ? "Compliant" : "Non-Compliant"}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Equipment
                        </p>
                        <p className="text-sm font-medium text-foreground">{courier.equipmentType}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">{courier.address.split(',')[1]?.trim() || courier.address}</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border/30 lg:pl-5">
                      {[
                        { icon: History, action: () => dialogs.open("history", courier), label: "History" },
                        { icon: FileText, action: () => dialogs.open("docs", courier), label: "Documents" },
                        { icon: Eye, action: () => dialogs.open("view", courier), label: "View" },
                      ].map((btn, i) => (
                        <Button
                          key={i}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all duration-200"
                          onClick={btn.action}
                        >
                          <btn.icon className="h-4 w-4" />
                        </Button>
                      ))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-xl p-2">
                          <DropdownMenuItem onClick={() => dialogs.open("view", courier)} className="gap-3 rounded-lg">
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => dialogs.open("edit", courier)} className="gap-3 rounded-lg">
                            <Edit className="h-4 w-4" />
                            Edit Courier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerifyFMCSA(courier.usdot)} className="gap-3 rounded-lg">
                            <ExternalLink className="h-4 w-4" />
                            Verify FMCSA
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => dialogs.open("password", courier)} className="gap-3 rounded-lg">
                            <KeyRound className="h-4 w-4" />
                            Set Password
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
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && filteredCouriers.length === 0 && (
                <EmptyState
                  icon={Truck}
                  title="No couriers found"
                  description="Try adjusting your search criteria or filters to find what you're looking for"
                  actionLabel="Clear Filters"
                  onAction={clearFilters}
                />
              )}
            </div>
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
            <AddCourierForm
              onSuccess={() => {
                dialogs.setOpen("edit", false);
                loadData();
              }}
              isEditing={true}
              initialData={{
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
