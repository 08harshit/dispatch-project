import { apiPost } from "./api";

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
