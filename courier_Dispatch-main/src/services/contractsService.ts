import { apiGet } from "./api";

export interface ContractLead {
  id: string;
  listing_id?: string;
  pickup_address?: string;
  delivery_address?: string;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_vin?: string;
  status?: string;
}

export interface Contract {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  start_location: string;
  end_location: string;
  lead_id: string;
  lead?: ContractLead | null;
  courierName?: string | null;
  shipperName?: string | null;
}

export async function fetchContracts(params?: {
  courier_id?: string;
  status?: string;
}): Promise<Contract[]> {
  const search = new URLSearchParams();
  if (params?.courier_id) search.set("courier_id", params.courier_id);
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  const res = await apiGet<Contract[]>(`/contracts${qs ? `?${qs}` : ""}`);
  return Array.isArray(res.data) ? res.data : [];
}
