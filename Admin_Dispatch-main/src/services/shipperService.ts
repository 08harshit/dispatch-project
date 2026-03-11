// ============================================================
// Shipper Service — API-backed
// ============================================================

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./api";

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
    documents: { id?: string; name: string; type: string; date: string }[];
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

export interface CreateShipperPayload {
    name: string;
    contact_email?: string;
    phone?: string;
    address?: string;
    business_type?: string;
    city?: string;
    state?: string;
    tax_exempt?: boolean;
    ein?: string;
    hours_pickup?: string;
    hours_dropoff?: string;
    principal_name?: string;
}

export async function createShipper(payload: CreateShipperPayload): Promise<Shipper> {
    const res = await apiPost<Shipper>("/shippers", payload);
    if (!res.success || !res.data) throw new Error(res.error || "Failed to create shipper");
    return res.data;
}

export async function updateShipper(id: string, payload: Partial<CreateShipperPayload>): Promise<Shipper> {
    const res = await apiPut<Shipper>(`/shippers/${id}`, payload);
    if (!res.success || !res.data) throw new Error(res.error || "Failed to update shipper");
    return res.data;
}

export async function updateShipperStatus(id: string, status: "active" | "inactive"): Promise<Shipper> {
    const res = await apiPatch<Shipper>(`/shippers/${id}/status`, { status });
    if (!res.success || !res.data) throw new Error(res.error || "Failed to update shipper status");
    return res.data;
}

export async function updateShipperCompliance(
    id: string,
    compliance: "compliant" | "non-compliant",
): Promise<Shipper> {
    const res = await apiPatch<Shipper>(`/shippers/${id}/compliance`, { compliance });
    if (!res.success || !res.data) throw new Error(res.error || "Failed to update shipper compliance");
    return res.data;
}

export async function deleteShipper(id: string): Promise<void> {
    const res = await apiDelete<unknown>(`/shippers/${id}`);
    if (!res.success) throw new Error(res.error || "Failed to delete shipper");
}

export async function setShipperPassword(id: string, password: string): Promise<void> {
    await apiPost<void>(`/shippers/${id}/password`, { password });
}

export async function addShipperDocument(
    shipperId: string,
    meta: { name: string; type: string; date?: string },
): Promise<void> {
    const res = await apiPost<unknown>(`/shippers/${shipperId}/documents`, meta);
    if (!res.success) throw new Error(res.error || "Failed to add document");
}

export async function deleteShipperDocument(shipperId: string, docId: string): Promise<void> {
    const res = await apiDelete<unknown>(`/shippers/${shipperId}/documents/${docId}`);
    if (!res.success) throw new Error(res.error || "Failed to delete document");
}
