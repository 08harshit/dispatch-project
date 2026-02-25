// ============================================================
// Load Service — API-backed (leads)
// ============================================================

import { apiGet } from "./api";

export interface Load {
    id: string;
    vehicleYear: string;
    vehicleMake: string;
    vehicleModel: string;
    vin: string;
    stockNumber: string;
    shipperInfo: string;
    pickupDate: string;
    dropOffDate: string;
    status: "pending" | "in-transit" | "delivered" | "cancelled";
    courierInfo: string;
    docs: { name: string; type: string }[];
    history: { date: string; action: string }[];
}

export type LoadStatus = Load["status"];

export interface LoadFilters {
    search?: string;
    status?: string;
    shipper_id?: string;
    dateFrom?: string;
    dateTo?: string;
}

export async function fetchLoads(filters: LoadFilters = {}): Promise<Load[]> {
    const params = new URLSearchParams();
    const statusMap: Record<string, string> = { pending: "open", delivered: "completed", cancelled: "cancelled" };
    const apiStatus = filters.status && filters.status !== "all" ? (statusMap[filters.status] ?? filters.status) : undefined;
    if (apiStatus) params.set("status", apiStatus);
    if (filters.shipper_id) params.set("shipper_id", filters.shipper_id);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    const q = params.toString();
    const path = q ? `/loads?${q}` : "/loads";
    const res = await apiGet<Load[]>(path);
    return res.data ?? [];
}

export async function fetchLoadStats(): Promise<{
    total: number;
    inTransit: number;
    delivered: number;
    pending: number;
    cancelled: number;
    alerts: number;
}> {
    const res = await apiGet<{
        total: number;
        inTransit: number;
        delivered: number;
        pending: number;
        cancelled: number;
        alerts: number;
    }>("/loads/stats");
    return res.data ?? { total: 0, inTransit: 0, delivered: 0, pending: 0, cancelled: 0, alerts: 0 };
}
