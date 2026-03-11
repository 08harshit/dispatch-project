import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Truck, Plus, Pencil, MoreHorizontal } from "lucide-react";
import { fetchVehicles, createVehicle, updateVehicle, type Vehicle } from "@/services/vehicleService";
import { fetchCouriers } from "@/services/courierService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Vehicles() {
  const { vehicleId: paramVehicleId } = useParams();
  const [searchParams] = useSearchParams();
  const highlightVehicleId = paramVehicleId ?? searchParams.get("vehicle_id") ?? undefined;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [courierFilter, setCourierFilter] = useState<string>("all");
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  const [highlightFaded, setHighlightFaded] = useState(false);
  const [couriers, setCouriers] = useState<{ id: string; name: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    courier_id: "",
    reg_no: "",
    vehicle_type: "",
    vin: "",
    is_available: true,
  });

  const loadVehicles = () => {
    setLoading(true);
    const filters = courierFilter !== "all" ? { courier_id: courierFilter } : {};
    fetchVehicles(filters)
      .then(setVehicles)
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (highlightVehicleId) {
      setCourierFilter("all");
      setHighlightFaded(false);
    }
  }, [highlightVehicleId]);

  useEffect(() => {
    loadVehicles();
  }, [courierFilter]);

  useEffect(() => {
    if (!loading && vehicles.length && highlightVehicleId && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => setHighlightFaded(true), 4000);
      return () => clearTimeout(t);
    }
  }, [loading, vehicles, highlightVehicleId]);

  useEffect(() => {
    fetchCouriers()
      .then((res) => setCouriers((res?.data || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))))
      .catch(() => setCouriers([]));
  }, []);

  useEffect(() => {
    if (createOpen) setForm({ courier_id: "", reg_no: "", vehicle_type: "", vin: "", is_available: true });
  }, [createOpen]);

  useEffect(() => {
    if (editOpen && editingVehicle) {
      setForm({
        courier_id: editingVehicle.courier_id,
        reg_no: editingVehicle.reg_no,
        vehicle_type: editingVehicle.vehicle_type ?? "",
        vin: editingVehicle.vin ?? "",
        is_available: editingVehicle.is_available,
      });
    }
  }, [editOpen, editingVehicle]);

  const courierName = (id: string) => couriers.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courier_id || !form.reg_no.trim()) {
      toast.error("Courier and registration number are required");
      return;
    }
    setSubmitting(true);
    try {
      await createVehicle({
        courier_id: form.courier_id,
        reg_no: form.reg_no.trim(),
        vehicle_type: form.vehicle_type || undefined,
        vin: form.vin || undefined,
        is_available: form.is_available,
      });
      toast.success("Vehicle created");
      setCreateOpen(false);
      loadVehicles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setSubmitting(true);
    try {
      await updateVehicle(editingVehicle.id, {
        reg_no: form.reg_no.trim(),
        vehicle_type: form.vehicle_type || undefined,
        vin: form.vin || undefined,
        is_available: form.is_available,
      });
      toast.success("Vehicle updated");
      setEditOpen(false);
      setEditingVehicle(null);
      loadVehicles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 relative">
        <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow">
                <Truck className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-background flex items-center justify-center">
                <span className="text-[9px] font-bold text-success-foreground">{vehicles.length}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Vehicles</h1>
              <p className="mt-0.5 text-muted-foreground">Courier vehicles</p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        <Card className="overflow-hidden border-0 shadow-elevated bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/30 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl">All Vehicles</CardTitle>
              <Select value={courierFilter} onValueChange={setCourierFilter}>
                <SelectTrigger className={cn("w-[200px]", courierFilter !== "all" && "border-primary text-primary")}>
                  <SelectValue placeholder="Filter by courier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Couriers</SelectItem>
                  {couriers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Reg No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading vehicles...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && vehicles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Truck className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No vehicles found</p>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  vehicles.map((v) => (
                    <TableRow
                      key={v.id}
                      ref={v.id === highlightVehicleId ? highlightRowRef : undefined}
                      className={cn(
                        "group hover:bg-primary/5",
                        v.id === highlightVehicleId && !highlightFaded && "bg-primary/15 ring-2 ring-primary ring-inset"
                      )}
                    >
                      <TableCell className="font-mono font-semibold">{v.reg_no}</TableCell>
                      <TableCell>{v.vehicle_type ?? "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{v.vin ?? "-"}</TableCell>
                      <TableCell>{courierName(v.courier_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(v.is_available ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground")}>
                          {v.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingVehicle(v);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Courier *</label>
                <Select value={form.courier_id} onValueChange={(v) => setForm((p) => ({ ...p, courier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select courier" /></SelectTrigger>
                  <SelectContent>
                    {couriers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Registration number *</label>
                <Input placeholder="e.g. ABC-1234" value={form.reg_no} onChange={(e) => setForm((p) => ({ ...p, reg_no: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle type</label>
                <Input placeholder="e.g. Sedan, Truck" value={form.vehicle_type} onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">VIN</label>
                <Input placeholder="17-digit VIN" value={form.vin} onChange={(e) => setForm((p) => ({ ...p, vin: e.target.value }))} className="font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setEditingVehicle(null); setEditOpen(open); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Registration number *</label>
                <Input placeholder="e.g. ABC-1234" value={form.reg_no} onChange={(e) => setForm((p) => ({ ...p, reg_no: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle type</label>
                <Input placeholder="e.g. Sedan, Truck" value={form.vehicle_type} onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">VIN</label>
                <Input placeholder="17-digit VIN" value={form.vin} onChange={(e) => setForm((p) => ({ ...p, vin: e.target.value }))} className="font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="avail" checked={form.is_available} onChange={(e) => setForm((p) => ({ ...p, is_available: e.target.checked }))} />
                <label htmlFor="avail" className="text-sm font-medium">Available</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
