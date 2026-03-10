import { apiGet, apiPost, apiPatch } from "./api";

export interface LoadListItem {
  id: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  shipperInfo: string;
  pickupDate: string;
  dropOffDate: string;
  status: "pending" | "in-transit" | "delivered" | "cancelled" | "open";
  courierInfo: string;
  pickup_address: string;
  delivery_address: string;
  notes?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  initial_price?: number;
  payment_type?: string;
}

export interface LoadsListResponse {
  data: LoadListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateLoadPayload {
  listing_id: string;
  shipper_id?: string | null;
  pickup_address: string;
  pickup_location_type?: string;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  pickup_contact_email?: string;
  delivery_address: string;
  delivery_location_type?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_contact_email?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_vin?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  vehicle_runs?: boolean;
  vehicle_rolls?: boolean;
  initial_price?: number;
  payment_type?: string;
  notes?: string;
}

export interface Load {
  id: string;
  listing_id: string;
  shipper_id: string | null;
  pickup_address: string;
  delivery_address: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_vin?: string;
  initial_price?: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export async function createLoad(payload: CreateLoadPayload): Promise<Load> {
  const res = await apiPost<Load>("/loads", payload);
  return res.data as Load;
}

export async function updateLoadStatus(loadId: string, status: string): Promise<Load> {
  const res = await apiPatch<Load>(`/loads/${loadId}/status`, { status });
  return res.data as Load;
}

export async function listLoads(shipperId: string | null, filters?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<LoadsListResponse> {
  const params = new URLSearchParams();
  if (shipperId) params.set("shipper_id", shipperId);
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  params.set("limit", "100");
  const res = await apiGet<LoadListItem[]>(`/loads?${params}`);
  const data = Array.isArray(res.data) ? res.data : [];
  const pagination = (res as unknown as { pagination?: LoadsListResponse["pagination"] }).pagination ?? { page: 1, limit: 100, total: data.length, totalPages: 1 };
  return { data, pagination };
}
