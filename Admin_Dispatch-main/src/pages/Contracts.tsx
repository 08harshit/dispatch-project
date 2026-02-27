import { useState, useEffect } from "react";
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
import { FileText, Package, ExternalLink, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchContracts, createContract, type ContractListItem } from "@/services/contractService";
import { fetchLoads } from "@/services/loadService";
import { fetchCouriers } from "@/services/courierService";
import { fetchShippers } from "@/services/shipperService";
import { fetchVehicles } from "@/services/vehicleService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LeadOption {
  id: string;
  pickup_address?: string;
  delivery_address?: string;
  stockNumber?: string;
}

export default function Contracts() {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [couriers, setCouriers] = useState<{ id: string; name: string }[]>([]);
  const [shippers, setShippers] = useState<{ id: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; reg_no: string; courier_id: string }[]>([]);
  const [form, setForm] = useState({
    lead_id: "",
    courier_id: "",
    shipper_id: "",
    amount: "",
    pickup_time: "",
    expected_reach_time: "",
    start_location: "",
    end_location: "",
    vehicle_id: "",
  });

  useEffect(() => {
    setLoading(true);
    fetchContracts({ status: statusFilter === "all" ? undefined : statusFilter })
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    if (createOpen) {
      Promise.all([
        fetchLoads({ status: "pending" }),
        fetchCouriers(),
        fetchShippers(),
        fetchVehicles(),
      ]).then(([loadsRes, couriersRes, shippersRes, vehiclesRes]) => {
        setLeads(loadsRes as LeadOption[]);
        setCouriers((couriersRes || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        setShippers((shippersRes || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
        setVehicles((vehiclesRes || []).map((v: { id: string; reg_no: string; courier_id: string }) => ({ id: v.id, reg_no: v.reg_no, courier_id: v.courier_id })));
      }).catch(() => toast.error("Failed to load form data"));
    }
  }, [createOpen]);

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    setForm((p) => ({
      ...p,
      lead_id: leadId,
      start_location: lead?.pickup_address ?? p.start_location,
      end_location: lead?.delivery_address ?? p.end_location,
    }));
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lead_id || !form.courier_id || !form.shipper_id || !form.amount || !form.pickup_time || !form.expected_reach_time || !form.start_location || !form.end_location) {
      toast.error("Please fill all required fields");
      return;
    }
    setCreateSubmitting(true);
    try {
      await createContract({
        lead_id: form.lead_id,
        courier_id: form.courier_id,
        shipper_id: form.shipper_id,
        amount: Number(form.amount),
        pickup_time: form.pickup_time,
        expected_reach_time: form.expected_reach_time,
        start_location: form.start_location,
        end_location: form.end_location,
        vehicle_id: form.vehicle_id || undefined,
      });
      toast.success("Contract and trip created");
      setCreateOpen(false);
      setForm({ lead_id: "", courier_id: "", shipper_id: "", amount: "", pickup_time: "", expected_reach_time: "", start_location: "", end_location: "", vehicle_id: "" });
      setLoading(true);
      fetchContracts({ status: statusFilter === "all" ? undefined : statusFilter }).then(setContracts).catch(() => {}).finally(() => setLoading(false));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contract");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 relative">
        <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow">
                <FileText className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-background flex items-center justify-center">
                <span className="text-[9px] font-bold text-success-foreground">{contracts.length}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Contracts</h1>
              <p className="mt-0.5 text-muted-foreground">Contracts and trip agreements</p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
            <Plus className="h-4 w-4" />
            Create Contract
          </Button>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Contract</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateContract} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Load *</label>
                <Select value={form.lead_id} onValueChange={handleLeadSelect}>
                  <SelectTrigger><SelectValue placeholder="Select load" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {(l as any).stockNumber || l.id.slice(0, 8)} - {(l as any).pickup_address || ""} to {(l as any).delivery_address || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <label className="text-sm font-medium">Shipper *</label>
                <Select value={form.shipper_id} onValueChange={(v) => setForm((p) => ({ ...p, shipper_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select shipper" /></SelectTrigger>
                  <SelectContent>
                    {shippers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount *</label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pickup time *</label>
                  <Input type="datetime-local" value={form.pickup_time} onChange={(e) => setForm((p) => ({ ...p, pickup_time: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected reach time *</label>
                  <Input type="datetime-local" value={form.expected_reach_time} onChange={(e) => setForm((p) => ({ ...p, expected_reach_time: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start location *</label>
                <Input placeholder="Pickup address" value={form.start_location} onChange={(e) => setForm((p) => ({ ...p, start_location: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End location *</label>
                <Input placeholder="Delivery address" value={form.end_location} onChange={(e) => setForm((p) => ({ ...p, end_location: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle (optional)</label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm((p) => ({ ...p, vehicle_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {vehicles.filter((v) => !form.courier_id || v.courier_id === form.courier_id).map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.reg_no}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createSubmitting}>Cancel</Button>
                <Button type="submit" disabled={createSubmitting}>{createSubmitting ? "Creating..." : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="overflow-hidden border-0 shadow-elevated bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/30 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl">All Contracts</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-[160px]", statusFilter !== "all" && "border-primary text-primary")}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Contract</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Shipper</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Trip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Loading contracts...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && contracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No contracts found</p>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  contracts.map((c) => {
                    const route = [c.start_location, c.end_location].filter(Boolean).join(" to ") || "-";
                    const loadDesc = c.lead
                      ? [c.lead.vehicle_year, c.lead.vehicle_make, c.lead.vehicle_model].filter(Boolean).join(" ") || c.lead.listing_id || c.lead_id.slice(0, 8)
                      : c.lead_id.slice(0, 8);
                    return (
                      <TableRow key={c.id} className="group hover:bg-primary/5">
                        <TableCell className="font-mono text-sm">{c.id.slice(0, 8)}</TableCell>
                        <TableCell>{loadDesc}</TableCell>
                        <TableCell>{c.shipperName ?? "-"}</TableCell>
                        <TableCell>{c.courierName ?? "-"}</TableCell>
                        <TableCell>${Number(c.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={route}>{route}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/trips?contract_id=${c.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
