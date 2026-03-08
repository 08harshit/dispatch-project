import { apiGet, apiPost } from "./api";

export interface ContractListItem {
    id: string;
    lead_id: string;
    courier_id: string;
    shipper_id: string;
    amount: number;
    pickup_time: string;
    expected_reach_time: string;
    start_location: string;
    end_location: string;
    status: string;
    signed_at: string | null;
    created_at: string;
    lead?: { id: string; listing_id?: string; pickup_address?: string; delivery_address?: string; vehicle_year?: string; vehicle_make?: string; vehicle_model?: string } | null;
    courierName?: string;
    shipperName?: string;
}

export interface ContractFilters {
    courier_id?: string;
    shipper_id?: string;
    status?: string;
}

export async function fetchContracts(filters: ContractFilters = {}): Promise<ContractListItem[]> {
    const params = new URLSearchParams();
    if (filters.courier_id) params.set("courier_id", filters.courier_id);
    if (filters.shipper_id) params.set("shipper_id", filters.shipper_id);
    if (filters.status) params.set("status", filters.status);
    const q = params.toString();
    const path = q ? `/contracts?${q}` : "/contracts";
    const res = await apiGet<ContractListItem[]>(path);
    return res.data ?? [];
}

export async function fetchContract(id: string): Promise<ContractListItem | null> {
    const res = await apiGet<ContractListItem>(`/contracts/${id}`);
    return res.data ?? null;
}

export async function createContract(body: {
    lead_id: string;
    courier_id: string;
    shipper_id: string;
    amount: number;
    pickup_time: string;
    expected_reach_time: string;
    start_location: string;
    end_location: string;
    status?: string;
    vehicle_id?: string;
}): Promise<{ contract: unknown; trip: unknown }> {
    const res = await apiPost<{ contract: unknown; trip: unknown }>("/contracts", body);
    return res.data as { contract: unknown; trip: unknown };
}
