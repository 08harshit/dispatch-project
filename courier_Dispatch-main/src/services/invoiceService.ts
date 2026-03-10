import { apiGet } from "./api";

/**
 * Invoice (created by trigger on trip completion).
 * Courier module uses contract_id and date range; no trip_id.
 */
export interface Invoice {
  id: string;
  trip_id?: string;
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

export async function fetchInvoices(params?: {
  dateFrom?: string;
  dateTo?: string;
  contract_id?: string;
}): Promise<Invoice[]> {
  const search = new URLSearchParams();
  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  if (params?.contract_id) search.set("contract_id", params.contract_id);
  const qs = search.toString();
  const res = await apiGet<Invoice[]>(`/invoices${qs ? `?${qs}` : ""}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const res = await apiGet<Invoice>(`/invoices/${id}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}
