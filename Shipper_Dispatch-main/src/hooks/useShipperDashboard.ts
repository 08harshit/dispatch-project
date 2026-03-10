import { useQuery } from "@tanstack/react-query";
import { fetchShipperOverview } from "@/services/shipperDashboardService";

export function useShipperDashboard(enabled = true) {
  return useQuery({
    queryKey: ["shipper-dashboard"],
    queryFn: fetchShipperOverview,
    enabled,
  });
}
