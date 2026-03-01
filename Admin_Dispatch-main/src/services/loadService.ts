// ============================================================
// Load Service — API-backed (leads)
// ============================================================

import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import { PaginationResult } from "./courierService";

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
    status: "pending" | "in-transit" | "delivered" | "cancelled" | "open";
    courierInfo: string;
    docs: { id: string; name: string; type: string; file_url?: string; date?: string }[];
    history: { id: string; date: string; action: string; created_at?: string }[];
    pickup_address?: string;
    delivery_address?: string;
    notes?: string;
}

export type LoadStatus = Load["status"];

export interface LoadFilters {
    search?: string;
    status?: string;
    shipper_id?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface PaginatedLoadsResponse {
    data: Load[];
    pagination: PaginationResult;
}

export async function fetchLoads(
    filters: LoadFilters = {},
    page?: number,
    limit?: number
): Promise<PaginatedLoadsResponse> {
    const params = new URLSearchParams();
    const statusMap: Record<string, string> = { pending: "open", delivered: "completed", cancelled: "cancelled" };
    const apiStatus = filters.status && filters.status !== "all" ? (statusMap[filters.status] ?? filters.status) : undefined;
    
    if (apiStatus) params.set("status", apiStatus);
    if (filters.shipper_id) params.set("shipper_id", filters.shipper_id);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (page) params.set("page", page.toString());
    if (limit) params.set("limit", limit.toString());
    
    const q = params.toString();
    const path = q ? `/loads?${q}` : "/loads";
    const res = await apiGet<PaginatedLoadsResponse>(path);
    
    // The wrapper `apiGet` only returns the raw response when `skipDataUnwrap` might be needed
    // Actually, `apiGet` handles unwrapping data. Let's cast directly based on the response format
    const fullRes = res as unknown as { success: boolean; data: Load[]; pagination: PaginationResult };
    return { data: fullRes.data || [], pagination: fullRes.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } };
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

export interface CreateLoadPayload {
    listing_id: string;
    shipper_id: string;
    pickup_address: string;
    delivery_address: string;
    pickup_contact_name?: string;
    pickup_contact_phone?: string;
    pickup_contact_email?: string;
    delivery_contact_name?: string;
    delivery_contact_phone?: string;
    delivery_contact_email?: string;
    vehicle_year?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_vin?: string;
    vehicle_type?: string;
    vehicle_color?: string;
    initial_price?: number;
    payment_type?: string;
    notes?: string;
}

export async function createLoad(payload: CreateLoadPayload): Promise<void> {
    const res = await apiPost<{ id: string }>("/loads", payload);
    if (!res.success) throw new Error(res.error || "Failed to create load");
}

export interface UpdateLoadPayload {
    pickup_address?: string;
    delivery_address?: string;
    vehicle_year?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_vin?: string;
    vehicle_type?: string;
    vehicle_color?: string;
    initial_price?: number;
    payment_type?: string;
    notes?: string;
    status?: string;
}

export async function updateLoad(id: string, payload: UpdateLoadPayload): Promise<Load> {
    const res = await apiPut<Load>(`/loads/${id}`, payload);
    if (!res.success || !res.data) throw new Error(res.error || "Failed to update load");
    return res.data;
}

export async function updateLoadStatus(id: string, status: string): Promise<Load> {
    const res = await apiPut<Load>(`/loads/${id}/status`, { status });
    if (!res.success || !res.data) throw new Error(res.error || "Failed to update status");
    return res.data;
}


export async function deleteLoad(id: string): Promise<void> {
    const res = await apiDelete<{ message: string }>(`/loads/${id}`);
    if (!res.success) throw new Error(res.error || "Failed to delete load");
}

export async function fetchLoadHistory(id: string): Promise<Load["history"]> {
    const res = await apiGet<Load["history"]>(`/loads/${id}/history`);
    return res.data || [];
}

export async function fetchLoadDocuments(id: string): Promise<Load["docs"]> {
    const res = await apiGet<Load["docs"]>(`/loads/${id}/documents`);
    return res.data || [];
}

export async function addLoadDocumentMeta(id: string, name: string, type: string): Promise<Load["docs"][0]> {
    const res = await apiPost<Load["docs"][0]>(`/loads/${id}/documents`, { name, type });
    if (!res.success || !res.data) throw new Error(res.error || "Failed to add document metadata");
    return res.data;
}

export async function deleteLoadDocument(id: string, docId: string): Promise<void> {
    const res = await apiDelete<{ message: string }>(`/loads/${id}/documents/${docId}`);
    if (!res.success) throw new Error(res.error || "Failed to delete document");
}
