import { apiGet } from "./api";

/**
 * Trip-level invoice (created by trigger on trip completion).
 * Use for "View Invoice" when a courier has completed a trip.
 */
export interface Invoice {
  id: string;
  trip_id: string;
  contract_id: string;
  amount: number;
  generated_at: string;
  start_location: string;
  end_location: string;
  pickup_time: string | null;
  delivered_at: string | null;
  courier_name: string | null;
  shipper_name: string | null;
  load_description: string | null;
}

export async function fetchInvoicesByTripId(tripId: string): Promise<Invoice[]> {
  const res = await apiGet<Invoice[]>(`/invoices?trip_id=${encodeURIComponent(tripId)}`);
  return res.data ?? [];
}

export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const res = await apiGet<Invoice>(`/invoices/${id}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}
