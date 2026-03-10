import { useQuery } from "@tanstack/react-query";
import { fetchContracts } from "@/services/contractsService";
import { contractToLoad } from "@/lib/contractToLoad";
import type { Load } from "@/components/loads/LoadsTable";

export const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (status?: string) => [...contractKeys.lists(), { status }] as const,
};

export function useCourierContractsQuery(status?: string) {
  const query = useQuery({
    queryKey: contractKeys.list(status),
    queryFn: () => fetchContracts(status ? { status } : undefined),
    staleTime: 5 * 60 * 1000,
  });

  const loads: Load[] = (query.data ?? []).map(contractToLoad);

  return {
    ...query,
    loads,
  };
}
