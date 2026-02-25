// ============================================================
// Shipper Service — API-backed
// ============================================================

import { apiGet } from "./api";

export interface Shipper {
    id: string;
    name: string;
    contact: string;
    phone: string;
    compliance: "compliant" | "non-compliant";
    address: string;
    businessType: string;
    city: string;
    state: string;
    taxExempt: boolean;
    ein: string;
    hoursPickup: string;
    hoursDropoff: string;
    principalName: string;
    status: "active" | "inactive";
    isNew?: boolean;
    history: { date: string; action: string }[];
    documents: { name: string; type: string; date: string }[];
}

export interface ShipperStats {
    total: number;
    compliant: number;
    nonCompliant: number;
    new: number;
    alerts: number;
}

export interface ShipperFilters {
    search?: string;
    compliance?: string;
    status?: string;
    businessType?: string;
    state?: string;
    isNew?: boolean;
}

export async function fetchShippers(filters: ShipperFilters = {}): Promise<Shipper[]> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.compliance) params.set("compliance", filters.compliance);
    if (filters.status) params.set("status", filters.status);
    if (filters.businessType) params.set("businessType", filters.businessType);
    if (filters.state) params.set("state", filters.state);
    if (filters.isNew === true) params.set("isNew", "true");
    const q = params.toString();
    const path = q ? `/shippers?${q}` : "/shippers";
    const res = await apiGet<Shipper[]>(path);
    if (!res.success || !Array.isArray(res.data)) return [];
    return res.data;
}

export async function fetchShipperStats(): Promise<ShipperStats> {
    const res = await apiGet<ShipperStats>("/shippers/stats");
    if (!res.success || !res.data) {
        return {
            total: 0,
            compliant: 0,
            nonCompliant: 0,
            new: 0,
            alerts: 0,
        };
    }
    return res.data;
}
