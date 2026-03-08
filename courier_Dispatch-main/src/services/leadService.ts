import { apiGet } from "./api";

/**
 * Lead/load detail from dispatch-server (Admin/Courier DB).
 * Use this to enrich notification display with vehicle/year/make/model, notes when lead_id
 * refers to the same DB (e.g. when notifications are synced or use shared leads).
 */
export interface LeadDetail {
  id: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  shipperInfo: string;
  pickup_address?: string;
  delivery_address?: string;
  notes?: string;
}

export async function fetchLeadById(leadId: string): Promise<LeadDetail | null> {
  try {
    const res = await apiGet<LeadDetail>(`/loads/${leadId}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}
