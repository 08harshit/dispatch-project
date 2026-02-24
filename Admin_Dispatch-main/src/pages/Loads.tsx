import { useState, useMemo, useEffect } from "react";
import { getLoadStatusConfig } from "@/utils/styleHelpers";
import { Load, fetchLoads } from "@/services/loadService";
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
  const [newLoad, setNewLoad] = useState({ vehicleYear: "", vehicleMake: "", vehicleModel: "", vin: "", stockNumber: "", shipperInfo: "", pickupDate: "", dropOffDate: "", courierInfo: "" });

  useEffect(() => {
    fetchLoads().then(setLoads);
  }, []);

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

  const totalLoads = loads.length;
  const alertsCount = loads.filter((l) => l.status === "pending" || l.status === "cancelled").length;


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
                  {loads.filter((l) => l.status === "delivered").length} delivered
                </span>
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Stats */}
        <StatsGrid
          stats={[
            { label: "Total Listings", value: totalLoads, icon: Package, color: "primary", delay: 1 },
            { label: "In Transit", value: loads.filter((l) => l.status === "in-transit").length, icon: TruckIcon, color: "primary", delay: 2 },
            { label: "Delivered", value: loads.filter((l) => l.status === "delivered").length, icon: CheckCircle, color: "success", delay: 3 },
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
                {filteredLoads.length === 0 && (
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
                {filteredLoads.map((load, index) => {
                  const statusConfig = getStatusConfig(load.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <TableRow
                      key={load.id}
                      className="group hover:bg-primary/5 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <TableCell className="font-semibold text-primary">{load.id}</TableCell>
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
                            <DropdownMenuItem onClick={() => toast.info("Edit coming soon")}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => toast.error(`${load.id} deleted`)}>
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


        {/* Add Vehicle Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-lg animate-scale-in">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newLoad.vehicleYear || !newLoad.vehicleMake || !newLoad.vehicleModel || !newLoad.vin || !newLoad.shipperInfo || !newLoad.pickupDate || !newLoad.dropOffDate || !newLoad.courierInfo) {
                  toast.error("Please fill in all fields");
                  return;
                }
                const id = `LD-${String(loads.length + 1).padStart(3, "0")}`;
                const created: Load = {
                  id,
                  vehicleYear: newLoad.vehicleYear,
                  vehicleMake: newLoad.vehicleMake,
                  vehicleModel: newLoad.vehicleModel,
                  vin: newLoad.vin,
                  stockNumber: newLoad.stockNumber || `${newLoad.vehicleMake.charAt(0)}${newLoad.vehicleModel.charAt(0)}-${id.slice(-3)}`,
                  shipperInfo: newLoad.shipperInfo,
                  pickupDate: newLoad.pickupDate,
                  dropOffDate: newLoad.dropOffDate,
                  status: "pending",
                  courierInfo: newLoad.courierInfo,
                  docs: [],
                  history: [{ date: new Date().toISOString().split("T")[0], action: "Load created" }],
                };
                setLoads((prev) => [created, ...prev]);
                setNewLoad({ vehicleYear: "", vehicleMake: "", vehicleModel: "", vin: "", stockNumber: "", shipperInfo: "", pickupDate: "", dropOffDate: "", courierInfo: "" });
                setAddDialogOpen(false);
                toast.success(`Load ${id} created successfully`);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Year</label>
                  <Input placeholder="2024" value={newLoad.vehicleYear} onChange={(e) => setNewLoad((p) => ({ ...p, vehicleYear: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Make</label>
                  <Input placeholder="Toyota" value={newLoad.vehicleMake} onChange={(e) => setNewLoad((p) => ({ ...p, vehicleMake: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Model</label>
                  <Input placeholder="Camry" value={newLoad.vehicleModel} onChange={(e) => setNewLoad((p) => ({ ...p, vehicleModel: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">VIN</label>
                  <Input placeholder="1HGBH41JXMN109186" value={newLoad.vin} onChange={(e) => setNewLoad((p) => ({ ...p, vin: e.target.value }))} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Stock # <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input placeholder="TC2024-01" value={newLoad.stockNumber} onChange={(e) => setNewLoad((p) => ({ ...p, stockNumber: e.target.value }))} className="font-mono text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Shipper</label>
                <Input
                  placeholder="e.g. AutoMax Dealers"
                  value={newLoad.shipperInfo}
                  onChange={(e) => setNewLoad((p) => ({ ...p, shipperInfo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Courier</label>
                <Input
                  placeholder="e.g. Express Logistics LLC"
                  value={newLoad.courierInfo}
                  onChange={(e) => setNewLoad((p) => ({ ...p, courierInfo: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pickup Date</label>
                  <Input type="date" value={newLoad.pickupDate} onChange={(e) => setNewLoad((p) => ({ ...p, pickupDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Drop Off Date</label>
                  <Input type="date" value={newLoad.dropOffDate} onChange={(e) => setNewLoad((p) => ({ ...p, dropOffDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80">Add Vehicle</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
