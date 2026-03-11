import { useEffect, useState } from "react";
import { fetchContracts } from "@/services/contractsService";
import { contractToLoad } from "@/lib/contractToLoad";
import type { Load } from "@/components/loads/LoadsTable";

export function useCourierContracts(status?: string) {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchContracts(status ? { status } : undefined)
      .then((contracts) => {
        if (!cancelled) {
          setLoads(contracts.map(contractToLoad));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load contracts");
          setLoads([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [status]);

  return { loads, loading, error };
}
