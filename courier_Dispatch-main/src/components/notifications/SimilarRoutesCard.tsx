import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, DollarSign, ChevronRight } from "lucide-react";
import { LoadNotification } from "@/hooks/useLoadNotifications";

interface SimilarRoute {
  id: string;
  shippersCount: number;
  pickup: { city: string; state: string; coordinates: [number, number] };
  delivery: { city: string; state: string; coordinates: [number, number] };
  priceRange: { min: number; max: number };
  distance: number;
  loads: LoadNotification[];
}

interface SimilarRoutesCardProps {
  routes: SimilarRoute[];
  onSelectRoute: (route: SimilarRoute) => void;
}

export const SimilarRoutesCard = ({ routes, onSelectRoute }: SimilarRoutesCardProps) => {
  if (routes.length === 0) return null;

  return (
    <Card className="border-amber-100 rounded-2xl bg-white">
      <CardHeader className="p-4 pb-2">
        <h3 className="font-semibold text-stone-700 flex items-center gap-2">
          <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <MapPin className="h-4 w-4 text-amber-600" />
          </div>
          Similar Routes Available
        </h3>
        <p className="text-sm text-stone-400">
          Group loads on the same route for better earnings
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {routes.map((route) => (
          <div
            key={route.id}
            className="bg-amber-50/50 rounded-xl p-4 hover:bg-amber-50 transition-colors cursor-pointer border border-amber-100"
            onClick={() => onSelectRoute(route)}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
                    <Users className="h-3 w-3 mr-1" />
                    {route.shippersCount} shipper{route.shippersCount > 1 ? "s" : ""}
                  </Badge>
                  <span className="text-sm text-stone-400">
                    {route.distance} miles
                  </span>
                </div>
                <p className="font-medium text-stone-700">
                  <span className="text-amber-600">{route.pickup.city}, {route.pickup.state}</span>
                  <span className="text-stone-300 mx-2">→</span>
                  <span className="text-emerald-600">{route.delivery.city}, {route.delivery.state}</span>
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span className="text-stone-400">Price range:</span>
                  <span className="font-semibold text-emerald-600">
                    ${route.priceRange.min} - ${route.priceRange.max}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-100">
                <ChevronRight className="h-5 w-5 text-amber-500" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
