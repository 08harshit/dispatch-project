import { apiGet, apiPost } from "./api";

export interface ContractListItem {
  id: string;
  lead_id: string;
  courier_id: string;
  shipper_id: string;
  amount: number;
  status: string;
  lead?: { id: string; listing_id?: string; pickup_address?: string; delivery_address?: string; vehicle_year?: string; vehicle_make?: string; vehicle_model?: string; vehicle_vin?: string; status?: string };
  courierName?: string | null;
  shipperName?: string | null;
}

export interface CreateContractPayload {
  lead_id: string;
  courier_id: string;
  shipper_id: string;
  amount: number;
  pickup_time: string;
  expected_reach_time: string;
  start_location: string;
  end_location: string;
  vehicle_id?: string;
}

export async function createContract(payload: CreateContractPayload): Promise<unknown> {
  const res = await apiPost<unknown>("/contracts", payload);
  return res.data;
}

export async function listContracts(shipperId: string | null, status?: string): Promise<ContractListItem[]> {
  if (!shipperId) return [];
  const params = new URLSearchParams({ shipper_id: shipperId });
  if (status && status !== "all") params.set("status", status);
  const res = await apiGet<ContractListItem[]>(`/contracts?${params}`);
  return Array.isArray(res.data) ? res.data : [];
}
