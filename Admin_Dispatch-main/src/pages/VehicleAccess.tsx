import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { fetchVehicleAccess, type VehicleAccessRecord } from "@/services/vehicleAccessService";
import { cn } from "@/lib/utils";

export default function VehicleAccess() {
  const [records, setRecords] = useState<VehicleAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);

  const loadRecords = () => {
    setLoading(true);
    fetchVehicleAccess({ active_only: activeOnly })
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecords();
  }, [activeOnly]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary/50" />
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Vehicle Access</h1>
              <p className="mt-1 text-muted-foreground">
                Time-bound vehicle access for shippers during trips
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={activeOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveOnly(true)}
            >
              Active only
            </Button>
            <Button
              variant={!activeOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveOnly(false)}
            >
              All
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-elevated bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-xl font-bold">Access Records</span>
                <p className="text-xs text-muted-foreground font-normal">Time-bound vehicle access for shippers during trips</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : records.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No vehicle access records found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipper</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Valid from</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link
                          to={`/shippers/${r.shipper_id}`}
                          className="text-primary hover:underline font-semibold"
                        >
                          {r.shippers?.name ?? r.shipper_id.slice(0, 8) + "..."}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/vehicles/${r.vehicle_id}`}
                          className="text-primary hover:underline font-semibold"
                        >
                          {r.vehicles?.reg_no ?? r.vehicle_id.slice(0, 8) + "..."}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/trips/${r.trip_id}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {r.trip_id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(r.wef_dt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(r.exp_dt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.is_active ? "default" : "secondary"}
                          className={cn(
                            r.is_active && "bg-green-600 hover:bg-green-700"
                          )}
                        >
                          {r.is_active ? "Active" : "Expired"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
