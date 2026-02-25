import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, MapPin, Calendar, Package } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { fetchTrip, type TripDetail as TripDetailType } from "@/services/tripService";
import { cn } from "@/lib/utils";

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTrip(id)
      .then(setTrip)
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

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
                <Badge variant="outline" className="capitalize">
                  {trip.status.replace(/_/g, " ")}
                </Badge>
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
        </div>
      </div>
    </MainLayout>
  );
}
