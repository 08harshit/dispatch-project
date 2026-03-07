import { apiGet, apiPost, apiDelete } from "./api";

export interface SavedLoadItem {
  id: string;
  lead_id: string;
  saved_at: string;
  lead: {
    id: string;
    listing_id?: string;
    pickup_address?: string;
    delivery_address?: string;
    vehicle_year?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_vin?: string;
    notes?: string;
    status?: string;
    created_at?: string;
  } | null;
}

export async function fetchSavedLoads(): Promise<SavedLoadItem[]> {
  const res = await apiGet<SavedLoadItem[]>("/saved-loads");
  return res.data ?? [];
}

export async function saveLoad(leadId: string): Promise<SavedLoadItem> {
  const res = await apiPost<SavedLoadItem>("/saved-loads", { lead_id: leadId });
  return res.data as SavedLoadItem;
}

export async function unsaveLoadById(id: string): Promise<void> {
  await apiDelete(`/saved-loads/${id}`);
}

export async function unsaveLoadByLead(leadId: string): Promise<void> {
  await apiDelete(`/saved-loads/by-lead?lead_id=${encodeURIComponent(leadId)}`);
}
