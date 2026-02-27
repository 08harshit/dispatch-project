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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vehicle Access</h1>
            <p className="text-muted-foreground">
              Time-bound vehicle access for shippers during trips
            </p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Access Records
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
                          to="/shippers"
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {r.shipper_id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          to="/vehicles"
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {r.vehicle_id.slice(0, 8)}...
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
