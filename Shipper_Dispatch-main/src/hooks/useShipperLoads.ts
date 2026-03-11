import { useQuery } from "@tanstack/react-query";
import { listLoads } from "@/services/loadService";
import { loadToVehicle } from "@/lib/loadToVehicle";
import type { Vehicle } from "@/components/dashboard/VehicleTable";

export function useShipperLoads(shipperId: string | null, filters?: { status?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["shipper-loads", shipperId, filters?.status, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      const res = await listLoads(shipperId, filters);
      return res.data.map(loadToVehicle) as Vehicle[];
    },
    enabled: !!shipperId,
  });
}
