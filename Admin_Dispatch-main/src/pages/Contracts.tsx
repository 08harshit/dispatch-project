import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FileText, Package, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchContracts, type ContractListItem } from "@/services/contractService";
import { cn } from "@/lib/utils";

export default function Contracts() {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    fetchContracts({ status: statusFilter === "all" ? undefined : statusFilter })
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

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
        </div>

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
