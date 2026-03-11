import { apiGet } from "./api";

export interface CourierListItem {
  id: string;
  name: string;
  contact: string;
  phone: string;
  compliance: string;
  address: string;
  usdot: string;
  mc: string;
  status: string;
  [key: string]: unknown;
}

export interface Courier {
  id: string;
  name: string;
  email: string;
  dot_number?: string | null;
  mc_number?: string | null;
  verification_status?: string | null;
  verified_at?: string | null;
  legal_name?: string | null;
  operating_status?: string | null;
  [key: string]: unknown;
}

function toCourier(item: CourierListItem): Courier {
  return {
    id: item.id,
    name: item.name || "",
    email: item.contact || "",
    dot_number: item.usdot || null,
    mc_number: item.mc || null,
    verification_status: null,
    verified_at: null,
    legal_name: null,
    operating_status: null,
    ...item,
  };
}

export async function listCouriers(
  options?: { status?: string; includeAll?: boolean }
): Promise<Courier[]> {
  const params = new URLSearchParams();
  params.set("limit", "500");
  if (options?.status) params.set("status", options.status);
  else if (!options?.includeAll) params.set("status", "active");
  const qs = params.toString();
  const res = await apiGet<CourierListItem[]>(`/couriers?${qs}`);
  return (res.data ?? []).map(toCourier);
}
