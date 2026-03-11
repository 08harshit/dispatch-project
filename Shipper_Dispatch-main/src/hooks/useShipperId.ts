import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/services/api";

interface MeResponse {
  id: string;
  email?: string;
  role?: string;
  courier_id?: string;
  shipper_id?: string;
}

export function useShipperId(enabled = true): string | null {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiGet<MeResponse>("/me");
      return res.data;
    },
    enabled,
  });
  return data?.shipper_id ?? null;
}
