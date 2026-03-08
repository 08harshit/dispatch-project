import { Bookmark, Car, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSavedLoads } from "@/hooks/useSavedLoads";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const SavedLoadsPage = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { savedLoads, loading, unsave } = useSavedLoads(isAuthenticated);

  const handleRemove = async (leadId: string) => {
    try {
      await unsave(leadId);
      toast.success("Removed from saved loads");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
        <Bookmark className="h-12 w-12 mx-auto text-stone-300 mb-4" />
        <h2 className="text-lg font-semibold text-stone-700">Saved Loads</h2>
        <p className="text-sm text-stone-500 mt-1">Sign in to see and manage your saved loads.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
        <p className="text-stone-500">Loading saved loads...</p>
      </div>
    );
  }

  if (savedLoads.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
        <Bookmark className="h-12 w-12 mx-auto text-stone-300 mb-4" />
        <h2 className="text-lg font-semibold text-stone-700">No saved loads</h2>
        <p className="text-sm text-stone-500 mt-1">Save loads from the Loads page to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-800">Saved Loads</h2>
        <span className="text-sm text-stone-500">{savedLoads.length} saved</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {savedLoads.map((item) => {
          const lead = item.lead;
          const route = lead
            ? [lead.pickup_address, lead.delivery_address].filter(Boolean).join(" to ") || "-"
            : "-";
          const vehicle = lead
            ? [lead.vehicle_year, lead.vehicle_make, lead.vehicle_model].filter(Boolean).join(" ") || "Load"
            : "Load";
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Car className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-800 truncate">{vehicle}</p>
                      <p className="text-xs text-stone-500 font-mono">{item.lead_id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-stone-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="truncate">{route}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item.lead_id)}
                  className="text-stone-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => toast.info("Navigate to Loads to bid")}
                >
                  Bid
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
