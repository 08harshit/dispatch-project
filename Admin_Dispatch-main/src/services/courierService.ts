import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./api";

// --- Types matching server response shape ---

export interface CourierListItem {
    id: string;
    name: string;
    contact: string;
    phone: string;
    compliance: "compliant" | "non-compliant";
    address: string;
    usdot: string;
    mc: string;
    status: "active" | "inactive";
    trucks: number;
    insuranceCompany: string;
    equipmentType: string;
    isNew?: boolean;
    history: { date: string; action: string }[];
    documents: { name: string; type: string; date: string }[];
}

export interface CourierStats {
    total: number;
    active: number;
    compliant: number;
    nonCompliant: number;
    new: number;
}

export interface CourierFilters {
    search?: string;
    compliance?: string;
    status?: string;
    equipmentType?: string;
    isNew?: boolean;
}

// --- API Functions ---

export async function fetchCouriers(filters: CourierFilters = {}): Promise<CourierListItem[]> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.compliance) params.set("compliance", filters.compliance);
    if (filters.status) params.set("status", filters.status);
    if (filters.equipmentType) params.set("equipmentType", filters.equipmentType);
    if (filters.isNew !== undefined) params.set("isNew", String(filters.isNew));

    const query = params.toString() ? `?${params}` : "";
    const res = await apiGet<CourierListItem[]>(`/couriers${query}`);
    return res.data;
}

export async function fetchCourierStats(): Promise<CourierStats> {
    const res = await apiGet<CourierStats>("/couriers/stats");
    return res.data;
}

export async function createCourier(formData: Record<string, string>): Promise<{ id: string }> {
    const res = await apiPost<{ id: string }>("/couriers", formData);
    return res.data;
}

export async function updateCourier(id: string, formData: Record<string, string>): Promise<void> {
    await apiPut<void>(`/couriers/${id}`, formData);
}

export async function toggleCourierStatus(id: string): Promise<{ status: string }> {
    const res = await apiPatch<{ status: string }>(`/couriers/${id}/status`);
    return res.data;
}

export async function deleteCourier(id: string): Promise<void> {
    await apiDelete<void>(`/couriers/${id}`);
}

export async function setCourierPassword(id: string, password: string): Promise<void> {
    await apiPost<void>(`/couriers/${id}/password`, { password });
}
