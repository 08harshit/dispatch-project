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
import { Truck, Package, ExternalLink, MapPin } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchTrips, type TripListItem } from "@/services/tripService";
import { cn } from "@/lib/utils";

export default function Trips() {
  const [searchParams] = useSearchParams();
  const contractIdFromQuery = searchParams.get("contract_id") ?? "";
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    const filters: { contract_id?: string; status?: string } = {};
    if (contractIdFromQuery) filters.contract_id = contractIdFromQuery;
    if (statusFilter !== "all") filters.status = statusFilter;
    fetchTrips(filters)
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [contractIdFromQuery, statusFilter]);

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
                <span className="text-[9px] font-bold text-success-foreground">{trips.length}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Trips</h1>
              <p className="mt-0.5 text-muted-foreground">Trip status and events</p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-elevated bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/30 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl">All Trips</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-[160px]", statusFilter !== "all" && "border-primary text-primary")}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
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
                  <TableHead>Trip</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Loading trips...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && trips.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No trips found</p>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  trips.map((t) => {
                    const route = t.contract
                      ? [t.contract.start_location, t.contract.end_location].filter(Boolean).join(" to ") || "-"
                      : "-";
                    return (
                      <TableRow key={t.id} className="group hover:bg-primary/5">
                        <TableCell className="font-mono text-sm">{t.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Link to={`/contracts`} className="text-primary hover:underline font-mono text-sm">
                            {t.contract_id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate flex items-center gap-1" title={route}>
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {route}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground capitalize">{(t.vehicle_state ?? "-").replace(/_/g, " ")}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {t.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.started_at ? new Date(t.started_at).toLocaleString() : "-"}</TableCell>
                        <TableCell>{t.completed_at ? new Date(t.completed_at).toLocaleString() : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/trips/${t.id}`}>
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
