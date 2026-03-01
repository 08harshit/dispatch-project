import { useState, useMemo, useEffect } from "react";
import { getLoadStatusConfig } from "@/utils/styleHelpers";
import { Load, fetchLoads, fetchLoadStats, createLoad, updateLoad, deleteLoad, type CreateLoadPayload } from "@/services/loadService";
import { fetchShippers } from "@/services/shipperService";
import { useDialogManager } from "@/hooks/useDialogManager";
import { useTableSort } from "@/hooks/useTableSort";
import { StatsGrid } from "@/components/common/StatsGrid";
import { HistoryDialog } from "@/components/common/HistoryDialog";
import { DocumentsDialog } from "@/components/common/DocumentsDialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Calendar,
  MoreHorizontal,
  Eye,
  FileText,
  History,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck as TruckIcon,
  ArrowUpDown,
  X,
  Plus,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";



const getStatusConfig = (status: string) => {
  const config = getLoadStatusConfig(status);
  const iconMap: Record<string, typeof CheckCircle> = {
    delivered: CheckCircle,
    "in-transit": TruckIcon,
    pending: Clock,
    cancelled: X,
  };
  return { ...config, icon: iconMap[status] || Clock };
};

type SortField = "id" | "vehicleInfo" | "shipperInfo" | "pickupDate" | "dropOffDate" | "status" | "courierInfo";
type SortDir = "asc" | "desc";

export default function Loads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { sortField, sortDir, toggleSort } = useTableSort<SortField>("id");
  const dialogs = useDialogManager<Load>();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loads, setLoads] = useState<Load[]>([]);
  const [stats, setStats] = useState({ total: 0, inTransit: 0, delivered: 0, pending: 0, cancelled: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [createLoadSubmitting, setCreateLoadSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState<string | null>(null);
  const [shippers, setShippers] = useState<{ id: string; name: string }[]>([]);
  const [newLoad, setNewLoad] = useState({
    listing_id: "",
    shipper_id: "",
    pickup_address: "",
    delivery_address: "",
    vehicle_year: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_vin: "",
    vehicle_type: "",
    vehicle_color: "",
    initial_price: "",
    payment_type: "",
    notes: "",
  });

  useEffect(() => {
    setLoading(true);
    const statusParam = statusFilter !== "all" ? statusFilter : undefined;
    fetchLoads({ status: statusParam, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((res) => setLoads(res.data))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLoadStats().then(setStats).catch(() => { });
  }, []);

  useEffect(() => {
    if (addDialogOpen) {
      fetchShippers().then((list) => setShippers(list.map((s) => ({ id: s.id, name: s.name })))).catch(() => setShippers([]));
    }
  }, [addDialogOpen]);

  const filteredLoads = useMemo(() => {
    let result = loads.filter((load) => {
      if (statusFilter !== "all" && load.status !== statusFilter) return false;
      if (dateFrom && load.pickupDate < dateFrom) return false;
      if (dateTo && load.dropOffDate > dateTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !load.id.toLowerCase().includes(q) &&
          !`${load.vehicleYear} ${load.vehicleMake} ${load.vehicleModel}`.toLowerCase().includes(q) &&
          !load.vin.toLowerCase().includes(q) &&
          !load.stockNumber.toLowerCase().includes(q) &&
          !load.shipperInfo.toLowerCase().includes(q) &&
          !load.courierInfo.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [loads, searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDir]);

  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo || searchQuery;

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  const totalLoads = stats.total;
  const alertsCount = stats.alerts;


  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3.5 w-3.5 transition-colors", sortField === field ? "text-primary" : "text-muted-foreground/40")} />
      </div>
    </TableHead>
  );

  return (
    <MainLayout>
      <div className="space-y-8 relative">
        {/* Decorative backgrounds */}
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
                <span className="text-[9px] font-bold text-success-foreground">{totalLoads}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Loads</h1>
              <p className="mt-0.5 text-muted-foreground flex items-center gap-2">
                Manage and track all loads
                <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  {stats.delivered} delivered
                </span>
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <Plus className="h-4 w-4" />
            Create Load
          </Button>
        </div>

        {/* Stats */}
        <StatsGrid
          stats={[
            { label: "Total Listings", value: totalLoads, icon: Package, color: "primary", delay: 1 },
            { label: "In Transit", value: stats.inTransit, icon: TruckIcon, color: "primary", delay: 2 },
            { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "success", delay: 3 },
            { label: "Alerts", value: alertsCount, icon: AlertTriangle, color: "warning", delay: 4 },
          ]}
          columns={4}
        />

        {/* Table Section */}
        <Card className="overflow-hidden border-0 shadow-elevated bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/30 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">All Loads</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  {filteredLoads.length} records
                </Badge>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md bg-primary/15">
                  <Search className="h-3.5 w-3.5 text-primary" />
                </div>
                <Input
                  placeholder="Search loads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-background/80 rounded-lg border-border/50"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`gap-2 ${dateFrom || dateTo ? "border-primary text-primary" : ""}`}>
                    <Calendar className="h-4 w-4" />
                    {dateFrom || dateTo ? "Date Set" : "Date Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 space-y-3" align="start">
                  <p className="text-sm font-medium text-foreground">Date Range</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">From</label>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">To</label>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`h-9 w-[140px] text-sm ${statusFilter !== "all" ? "border-primary text-primary" : ""}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <SortableHead field="id">Load ID</SortableHead>
                  <SortableHead field="vehicleInfo">Vehicle Info</SortableHead>
                  <SortableHead field="shipperInfo">Shipper</SortableHead>
                  <SortableHead field="pickupDate">Pickup Date</SortableHead>
                  <SortableHead field="dropOffDate">Drop Off Date</SortableHead>
                  <SortableHead field="status">Status</SortableHead>
                  <SortableHead field="courierInfo">Courier</SortableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>History</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      Loading loads...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredLoads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No loads match your filters</p>
                      <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                        Clear all filters
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredLoads.map((load, index) => {
                  const statusConfig = getStatusConfig(load.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <TableRow
                      key={load.id}
                      className="group hover:bg-primary/5 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <TableCell className="font-semibold text-primary">{load.stockNumber || load.id.slice(0, 8)}</TableCell>
                      <TableCell className="min-w-[180px]">
                        <div>
                          <p className="font-semibold text-foreground">{load.vehicleYear} {load.vehicleMake} {load.vehicleModel}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            VIN: <span className="font-mono text-primary/80">{load.vin}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            STK#: <span className="font-mono font-semibold text-foreground/70">{load.stockNumber}</span>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{load.shipperInfo}</TableCell>
                      <TableCell>{load.pickupDate}</TableCell>
                      <TableCell>{load.dropOffDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1", statusConfig.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{load.courierInfo}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => dialogs.open("docs", load)}>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => dialogs.open("history", load)}>
                          <History className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => dialogs.open("view", load)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => dialogs.open("edit", load)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={deleteSubmitting === load.id}
                              onClick={async () => {
                                if (!confirm("Cancel this load?")) return;
                                setDeleteSubmitting(load.id);
                                try {
                                  await deleteLoad(load.id);
                                  toast.success("Load cancelled");
                                  setLoads((prev) => prev.filter((l) => l.id !== load.id));
                                  fetchLoadStats().then(setStats).catch(() => { });
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Failed to cancel load");
                                } finally {
                                  setDeleteSubmitting(null);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={dialogs.isOpen("view")} onOpenChange={dialogs.setOpen.bind(null, "view")}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Load Details — {dialogs.selected?.id}</DialogTitle>
            </DialogHeader>
            {dialogs.selected && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Vehicle</p>
                    <p className="font-medium">{dialogs.selected.vehicleYear} {dialogs.selected.vehicleMake} {dialogs.selected.vehicleModel}</p>
                    <p className="text-xs text-muted-foreground mt-1">VIN: <span className="font-mono">{dialogs.selected.vin}</span></p>
                    <p className="text-xs text-muted-foreground">STK#: <span className="font-mono">{dialogs.selected.stockNumber}</span></p>
                  </div>
                  <div><p className="text-muted-foreground text-xs">Shipper</p><p className="font-medium">{dialogs.selected.shipperInfo}</p></div>
                  <div><p className="text-muted-foreground text-xs">Pickup</p><p className="font-medium">{dialogs.selected.pickupDate}</p></div>
                  <div><p className="text-muted-foreground text-xs">Drop Off</p><p className="font-medium">{dialogs.selected.dropOffDate}</p></div>
                  <div><p className="text-muted-foreground text-xs">Courier</p><p className="font-medium">{dialogs.selected.courierInfo}</p></div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge variant="outline" className={cn("gap-1 mt-1", getStatusConfig(dialogs.selected.status).className)}>
                      {getStatusConfig(dialogs.selected.status).label}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={dialogs.isOpen("edit")} onOpenChange={(open) => dialogs.setOpen("edit", open)}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Load</DialogTitle>
            </DialogHeader>
            {dialogs.selected && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const sel = dialogs.selected!;
                  const form = e.currentTarget;
                  const get = (name: string) => (form.querySelector(`[name="${name}"]`) as HTMLInputElement)?.value ?? "";
                  setEditSubmitting(true);
                  try {
                    await updateLoad(sel.id, {
                      pickup_address: get("pickup_address") || undefined,
                      delivery_address: get("delivery_address") || undefined,
                      vehicle_year: get("vehicle_year") || undefined,
                      vehicle_make: get("vehicle_make") || undefined,
                      vehicle_model: get("vehicle_model") || undefined,
                      vehicle_vin: get("vehicle_vin") || undefined,
                      vehicle_type: get("vehicle_type") || undefined,
                      vehicle_color: get("vehicle_color") || undefined,
                      initial_price: get("initial_price") ? Number(get("initial_price")) : undefined,
                      payment_type: get("payment_type") || undefined,
                      notes: get("notes") || undefined,
                    });
                    toast.success("Load updated");
                    dialogs.setOpen("edit", false);
                    setLoading(true);
                    const [nextLoadsResponse, nextStats] = await Promise.all([
                      fetchLoads({ status: statusFilter !== "all" ? statusFilter : undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
                      fetchLoadStats(),
                    ]);
                    setLoads(nextLoadsResponse.data);
                    setStats(nextStats);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to update load");
                  } finally {
                    setEditSubmitting(false);
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pickup address</label>
                  <Input name="pickup_address" defaultValue={(dialogs.selected as any).pickup_address} placeholder="Pickup address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Delivery address</label>
                  <Input name="delivery_address" defaultValue={(dialogs.selected as any).delivery_address} placeholder="Delivery address" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <Input name="vehicle_year" defaultValue={dialogs.selected.vehicleYear} placeholder="2024" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Make</label>
                    <Input name="vehicle_make" defaultValue={dialogs.selected.vehicleMake} placeholder="Make" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <Input name="vehicle_model" defaultValue={dialogs.selected.vehicleModel} placeholder="Model" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">VIN</label>
                    <Input name="vehicle_vin" defaultValue={dialogs.selected.vin} placeholder="VIN" className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vehicle type</label>
                    <Input name="vehicle_type" defaultValue={(dialogs.selected as any).vehicle_type} placeholder="e.g. Sedan" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Initial price</label>
                    <Input name="initial_price" type="number" step="0.01" defaultValue={(dialogs.selected as any).initial_price} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment type</label>
                    <Input name="payment_type" defaultValue={(dialogs.selected as any).payment_type} placeholder="e.g. COD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input name="notes" defaultValue={(dialogs.selected as any).notes} placeholder="Optional notes" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => dialogs.setOpen("edit", false)} disabled={editSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={editSubmitting}>{editSubmitting ? "Saving..." : "Save"}</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <HistoryDialog
          open={dialogs.isOpen("history")}
          onOpenChange={dialogs.setOpen.bind(null, "history")}
          entityName={dialogs.selected?.id || ""}
          history={dialogs.selected?.history || []}
        />

        {/* Docs Dialog */}
        <DocumentsDialog
          open={dialogs.isOpen("docs")}
          onOpenChange={dialogs.setOpen.bind(null, "docs")}
          entityName={dialogs.selected?.id || ""}
          documents={dialogs.selected?.docs || []}
          showUpload={false}
        />


        {/* Create Load Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Load</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newLoad.listing_id.trim() || !newLoad.shipper_id || !newLoad.pickup_address.trim() || !newLoad.delivery_address.trim()) {
                  toast.error("Please fill in listing ID, shipper, pickup address, and delivery address");
                  return;
                }
                setCreateLoadSubmitting(true);
                try {
                  const payload: CreateLoadPayload = {
                    listing_id: newLoad.listing_id.trim(),
                    shipper_id: newLoad.shipper_id,
                    pickup_address: newLoad.pickup_address.trim(),
                    delivery_address: newLoad.delivery_address.trim(),
                  };
                  if (newLoad.vehicle_year) payload.vehicle_year = newLoad.vehicle_year;
                  if (newLoad.vehicle_make) payload.vehicle_make = newLoad.vehicle_make;
                  if (newLoad.vehicle_model) payload.vehicle_model = newLoad.vehicle_model;
                  if (newLoad.vehicle_vin) payload.vehicle_vin = newLoad.vehicle_vin;
                  if (newLoad.vehicle_type) payload.vehicle_type = newLoad.vehicle_type;
                  if (newLoad.vehicle_color) payload.vehicle_color = newLoad.vehicle_color;
                  if (newLoad.initial_price) payload.initial_price = Number(newLoad.initial_price);
                  if (newLoad.payment_type) payload.payment_type = newLoad.payment_type;
                  if (newLoad.notes) payload.notes = newLoad.notes;
                  await createLoad(payload);
                  setNewLoad({ listing_id: "", shipper_id: "", pickup_address: "", delivery_address: "", vehicle_year: "", vehicle_make: "", vehicle_model: "", vehicle_vin: "", vehicle_type: "", vehicle_color: "", initial_price: "", payment_type: "", notes: "" });
                  setAddDialogOpen(false);
                  toast.success("Load created successfully");
                  setLoading(true);
                  const [nextLoadsResponse, nextStats] = await Promise.all([fetchLoads({ status: statusFilter !== "all" ? statusFilter : undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }), fetchLoadStats()]);
                  setLoads(nextLoadsResponse.data);
                  setStats(nextStats);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to create load");
                } finally {
                  setCreateLoadSubmitting(false);
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Listing ID *</label>
                <Input placeholder="e.g. LD-001" value={newLoad.listing_id} onChange={(e) => setNewLoad((p) => ({ ...p, listing_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Shipper *</label>
                <Select value={newLoad.shipper_id} onValueChange={(v) => setNewLoad((p) => ({ ...p, shipper_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipper" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pickup address *</label>
                <Input placeholder="Full pickup address" value={newLoad.pickup_address} onChange={(e) => setNewLoad((p) => ({ ...p, pickup_address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Delivery address *</label>
                <Input placeholder="Full delivery address" value={newLoad.delivery_address} onChange={(e) => setNewLoad((p) => ({ ...p, delivery_address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Year</label>
                  <Input placeholder="2024" value={newLoad.vehicle_year} onChange={(e) => setNewLoad((p) => ({ ...p, vehicle_year: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Make</label>
                  <Input placeholder="Make" value={newLoad.vehicle_make} onChange={(e) => setNewLoad((p) => ({ ...p, vehicle_make: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Model</label>
                  <Input placeholder="Model" value={newLoad.vehicle_model} onChange={(e) => setNewLoad((p) => ({ ...p, vehicle_model: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">VIN</label>
                  <Input placeholder="VIN" value={newLoad.vehicle_vin} onChange={(e) => setNewLoad((p) => ({ ...p, vehicle_vin: e.target.value }))} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Vehicle type</label>
                  <Input placeholder="e.g. Sedan" value={newLoad.vehicle_type} onChange={(e) => setNewLoad((p) => ({ ...p, vehicle_type: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Initial price</label>
                  <Input type="number" step="0.01" placeholder="0.00" value={newLoad.initial_price} onChange={(e) => setNewLoad((p) => ({ ...p, initial_price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Payment type</label>
                  <Input placeholder="e.g. COD" value={newLoad.payment_type} onChange={(e) => setNewLoad((p) => ({ ...p, payment_type: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Input placeholder="Optional notes" value={newLoad.notes} onChange={(e) => setNewLoad((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} disabled={createLoadSubmitting}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80" disabled={createLoadSubmitting}>
                  {createLoadSubmitting ? "Creating..." : "Create Load"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
