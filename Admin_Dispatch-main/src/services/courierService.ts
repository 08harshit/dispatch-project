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
    documents: { id: string; name: string; type: string; date: string; url: string | null }[];
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

export interface DocumentMeta {
    name: string;
    type: string;
    mime_type?: string;
    file_size_bytes?: number;
}

export interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedCouriersResponse {
    data: CourierListItem[];
    pagination: PaginationResult;
}

// --- API Functions ---

export async function fetchCouriers(
    filters: CourierFilters = {},
    page?: number,
    limit?: number,
): Promise<PaginatedCouriersResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.compliance) params.set("compliance", filters.compliance);
    if (filters.status) params.set("status", filters.status);
    if (filters.equipmentType) params.set("equipmentType", filters.equipmentType);
    if (filters.isNew !== undefined) params.set("isNew", String(filters.isNew));
    if (page !== undefined) params.set("page", String(page));
    if (limit !== undefined) params.set("limit", String(limit));

    const query = params.toString() ? `?${params}` : "";
    const res = await apiGet<CourierListItem[]>(`/couriers${query}`);
    return {
        data: res.data,
        pagination: (res as any).pagination ?? { page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 },
    };
}

export async function fetchCourierStats(): Promise<CourierStats> {
    const res = await apiGet<CourierStats>("/couriers/stats");
    return res.data;
}

export async function createCourier(formData: Record<string, string>): Promise<CourierListItem> {
    const res = await apiPost<CourierListItem>("/couriers", formData);
    return res.data;
}

export async function updateCourier(id: string, formData: Record<string, string>): Promise<CourierListItem> {
    const res = await apiPut<CourierListItem>(`/couriers/${id}`, formData);
    return res.data;
}

export async function toggleCourierStatus(id: string): Promise<CourierListItem> {
    const res = await apiPatch<CourierListItem>(`/couriers/${id}/status`);
    return res.data;
}

export async function deleteCourier(id: string): Promise<void> {
    await apiDelete<void>(`/couriers/${id}`);
}

export async function setCourierPassword(id: string, password: string): Promise<void> {
    await apiPost<void>(`/couriers/${id}/password`, { password });
}

// --- Phase 3: Compliance ---

export async function updateCourierCompliance(
    id: string,
    compliance: "compliant" | "non-compliant",
): Promise<CourierListItem> {
    const res = await apiPatch<CourierListItem>(`/couriers/${id}/compliance`, { compliance });
    return res.data;
}

// --- Phase 1: Document Metadata ---

export async function fetchCourierDocuments(id: string) {
    const res = await apiGet<{ id: string; name: string; type: string; date: string; url: string | null }[]>(
        `/couriers/${id}/documents`,
    );
    return res.data;
}

export async function addCourierDocumentMeta(
    id: string,
    meta: DocumentMeta,
): Promise<{ id: string }> {
    const res = await apiPost<{ id: string }>(`/couriers/${id}/documents`, meta);
    return res.data;
}

export async function deleteCourierDocument(id: string, docId: string): Promise<void> {
    await apiDelete<void>(`/couriers/${id}/documents/${docId}`);
}

// --- FMCSA Verification (server-side proxy to avoid 403) ---

export interface FMCSAVerifyResult {
    verified: boolean;
    status: "verified" | "flagged" | "not_found";
    message?: string;
    carrier?: {
        dotNumber: string;
        mcNumber?: string;
        legalName: string;
        operatingStatus: string;
        phone?: string;
        isValid: boolean;
    };
}

export async function verifyFmcsa(usdot: string): Promise<FMCSAVerifyResult> {
    const res = await apiGet<FMCSAVerifyResult>(`/couriers/verify-fmcsa?usdot=${encodeURIComponent(usdot)}`);
    return res.data;
}

