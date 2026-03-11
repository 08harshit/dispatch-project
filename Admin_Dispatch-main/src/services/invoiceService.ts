import { apiGet } from "./api";

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

export async function fetchInvoice(id: string): Promise<Invoice | null> {
    const res = await apiGet<Invoice>(`/invoices/${id}`);
    return res.data ?? null;
}
