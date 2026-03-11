import { useState, useEffect, useCallback } from "react";
import * as courierService from "@/services/courierService";

export type Courier = courierService.Courier;

export function useCouriers(includeAll = false) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCouriers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courierService.listCouriers({ includeAll });
      setCouriers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch couriers");
    } finally {
      setLoading(false);
    }
  }, [includeAll]);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  return { couriers, loading, error, refetch: fetchCouriers };
}
