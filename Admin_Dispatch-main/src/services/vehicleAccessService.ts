import { apiGet } from "./api";

export interface VehicleAccessRecord {
    id: string;
    vehicle_id: string;
    shipper_id: string;
    trip_id: string;
    wef_dt: string;
    exp_dt: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    vehicles?: { reg_no: string | null } | null;
    shippers?: { name: string | null } | null;
}

export interface VehicleAccessFilters {
    shipper_id?: string;
    vehicle_id?: string;
    active_only?: boolean;
}

export async function fetchVehicleAccess(filters: VehicleAccessFilters = {}): Promise<VehicleAccessRecord[]> {
    const params = new URLSearchParams();
    if (filters.shipper_id) params.set("shipper_id", filters.shipper_id);
    if (filters.vehicle_id) params.set("vehicle_id", filters.vehicle_id);
    if (filters.active_only === true) params.set("active_only", "true");
    const q = params.toString();
    const path = q ? `/vehicle-access?${q}` : "/vehicle-access";
    const res = await apiGet<VehicleAccessRecord[]>(path);
    return Array.isArray(res.data) ? res.data : [];
}
