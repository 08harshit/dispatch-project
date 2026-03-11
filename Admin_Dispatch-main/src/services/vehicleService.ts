import { apiGet, apiPost, apiPut, apiPatch } from "./api";

export interface Vehicle {
    id: string;
    courier_id: string;
    reg_no: string;
    vehicle_type: string | null;
    vin: string | null;
    is_available: boolean;
    created_at: string;
    updated_at: string;
}

export interface VehicleFilters {
    courier_id?: string;
    is_available?: boolean;
}

export async function fetchVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (filters.courier_id) params.set("courier_id", filters.courier_id);
    if (filters.is_available !== undefined) params.set("is_available", String(filters.is_available));
    const q = params.toString();
    const path = q ? `/vehicles?${q}` : "/vehicles";
    const res = await apiGet<Vehicle[]>(path);
    return Array.isArray(res.data) ? res.data : [];
}

export async function fetchVehicle(id: string): Promise<Vehicle | null> {
    const res = await apiGet<Vehicle>(`/vehicles/${id}`);
    return res.data ?? null;
}

export async function createVehicle(payload: {
    courier_id: string;
    reg_no: string;
    vehicle_type?: string;
    vin?: string;
    is_available?: boolean;
}): Promise<Vehicle> {
    const res = await apiPost<Vehicle>("/vehicles", payload);
    if (!res.success || !res.data) throw new Error((res as any).error || "Failed to create vehicle");
    return res.data;
}

export async function updateVehicle(id: string, payload: Partial<Pick<Vehicle, "reg_no" | "vehicle_type" | "vin" | "is_available">>): Promise<Vehicle> {
    const res = await apiPut<Vehicle>(`/vehicles/${id}`, payload);
    if (!res.success || !res.data) throw new Error((res as any).error || "Failed to update vehicle");
    return res.data;
}

export async function patchVehicle(id: string, payload: Partial<Pick<Vehicle, "is_available">>): Promise<Vehicle> {
    const res = await apiPatch<Vehicle>(`/vehicles/${id}`, payload);
    if (!res.success || !res.data) throw new Error((res as any).error || "Failed to update vehicle");
    return res.data;
}
