import { useState, useEffect, useCallback } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Truck, MapPin, Calendar, Package, Scan, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { fetchTrip, recordTripEvent, updateTripStatus, type TripDetail as TripDetailType } from "@/services/tripService";
import { toast } from "sonner";

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventDialog, setEventDialog] = useState<{ type: "pickup_scan" | "delivery_scan"; open: boolean } | null>(null);
  const [scannedValue, setScannedValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadTrip = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchTrip(id)
      .then(setTrip)
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  if (loading || !trip) {
    return (
      <MainLayout>
        <div className="p-8">
          {loading ? <p className="text-muted-foreground">Loading trip...</p> : <p className="text-muted-foreground">Trip not found.</p>}
          <Button variant="link" asChild className="mt-4">
            <Link to="/trips">Back to Trips</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const route = trip.contract
    ? [trip.contract.start_location, trip.contract.end_location].filter(Boolean).join(" to ")
    : "-";

  const hasPickupScan = trip.events?.some((e) => e.event_type === "pickup_scan") ?? false;
  const hasDeliveryScan = trip.events?.some((e) => e.event_type === "delivery_scan") ?? false;
  const canRecordPickup =
    (trip.status === "scheduled" || trip.status === "in_progress") && !hasPickupScan;
  const canRecordDelivery = hasPickupScan && !hasDeliveryScan;
  const canCancel = trip.status === "scheduled" || trip.status === "in_progress";

  const handleCancelTrip = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await updateTripStatus(id, "cancelled");
      setCancelDialogOpen(false);
      loadTrip();
      toast.success("Trip cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel trip");
    } finally {
      setCancelling(false);
    }
  };

  const handleRecordEvent = async () => {
    if (!id || !eventDialog?.type || !scannedValue.trim()) return;
    setSubmitting(true);
    try {
      await recordTripEvent(id, {
        event_type: eventDialog.type,
        scanned_value: scannedValue.trim(),
      });
      setEventDialog(null);
      setScannedValue("");
      loadTrip();
      toast.success(`${eventDialog.type.replace("_", " ")} recorded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/trips" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Trips
            </Link>
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Trip {trip.id.slice(0, 8)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {trip.status.replace(/_/g, " ")}
                  </Badge>
                  {canCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCancelDialogOpen(true)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Trip
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{route}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Vehicle state</span>
                  <p className="font-medium capitalize">{(trip.vehicle_state ?? "-").replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Started</span>
                  <p className="font-medium">{trip.started_at ? new Date(trip.started_at).toLocaleString() : "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed</span>
                  <p className="font-medium">{trip.completed_at ? new Date(trip.completed_at).toLocaleString() : "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contract</span>
                  <p className="font-medium font-mono">
                    <Link to="/contracts" className="text-primary hover:underline">
                      {trip.contract_id.slice(0, 8)}
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {trip.events && trip.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Trip Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {trip.events.map((ev) => (
                    <li key={ev.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Badge variant="outline" className="capitalize shrink-0">
                        {ev.event_type.replace(/_/g, " ")}
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">{ev.scanned_value}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {new Date(ev.occurred_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(!trip.events || trip.events.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events recorded for this trip.</p>
              </CardContent>
            </Card>
          )}

          {(canRecordPickup || canRecordDelivery) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Record Trip Event
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {canRecordPickup && (
                  <Button
                    variant="outline"
                    onClick={() => setEventDialog({ type: "pickup_scan", open: true })}
                    className="gap-2"
                  >
                    <Scan className="h-4 w-4" />
                    Record pickup scan
                  </Button>
                )}
                {canRecordDelivery && (
                  <Button
                    variant="outline"
                    onClick={() => setEventDialog({ type: "delivery_scan", open: true })}
                    className="gap-2"
                  >
                    <Scan className="h-4 w-4" />
                    Record delivery scan
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Trip</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-2">
            Are you sure you want to cancel this trip? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              Keep Trip
            </Button>
            <Button variant="destructive" onClick={handleCancelTrip} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!eventDialog?.open}
        onOpenChange={(open) => {
          if (!open) {
            setEventDialog(null);
            setScannedValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record {eventDialog?.type?.replace("_", " ")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Scanned value</label>
              <Input
                value={scannedValue}
                onChange={(e) => setScannedValue(e.target.value)}
                placeholder="e.g. barcode or tracking number"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialog(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleRecordEvent} disabled={!scannedValue.trim() || submitting}>
              {submitting ? "Recording..." : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
