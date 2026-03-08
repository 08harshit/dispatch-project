import { apiGet, apiPatch, apiPost } from "./api";

export interface TripListItem {
    id: string;
    contract_id: string;
    status: string;
    vehicle_state: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    contract?: { id: string; lead_id: string; courier_id: string; shipper_id: string; amount: number; pickup_time: string; start_location: string; end_location: string; status: string } | null;
    lead?: Record<string, unknown> | null;
}

export interface TripDetail extends TripListItem {
    events?: { id: string; event_type: string; scanned_value: string; occurred_at: string }[];
}

export interface TripFilters {
    contract_id?: string;
    courier_id?: string;
    status?: string;
}

export async function fetchTrips(filters: TripFilters = {}): Promise<TripListItem[]> {
    const params = new URLSearchParams();
    if (filters.contract_id) params.set("contract_id", filters.contract_id);
    if (filters.courier_id) params.set("courier_id", filters.courier_id);
    if (filters.status) params.set("status", filters.status);
    const q = params.toString();
    const path = q ? `/trips?${q}` : "/trips";
    const res = await apiGet<TripListItem[]>(path);
    return res.data ?? [];
}

export async function fetchTrip(id: string): Promise<TripDetail | null> {
    const res = await apiGet<TripDetail>(`/trips/${id}`);
    return res.data ?? null;
}

export async function recordTripEvent(
    tripId: string,
    body: { event_type: "pickup_scan" | "delivery_scan"; scanned_value: string; occurred_at?: string }
): Promise<unknown> {
    const res = await apiPost<unknown>(`/trips/${tripId}/events`, body);
    return res.data;
}

export async function updateTripStatus(tripId: string, status: "cancelled"): Promise<TripListItem | null> {
    const res = await apiPatch<TripListItem>(`/trips/${tripId}`, { status });
    return res.data ?? null;
}
