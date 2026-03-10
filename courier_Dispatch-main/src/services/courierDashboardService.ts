import { apiGet } from "./api";

export interface CourierContract {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  start_location: string;
  end_location: string;
  lead_id: string;
  leads?: {
    id: string;
    listing_id?: string;
    pickup_address?: string;
    delivery_address?: string;
    vehicle_year?: number;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_vin?: string;
    status?: string;
  } | null;
}

export interface CourierOverview {
  contracts: CourierContract[];
  stats: {
    assignedCount: number;
    revenue: string;
  };
  recentActivity: Array<{
    id: string;
    entity: string;
    entityType: string;
    action: string;
    status: string;
    date: string;
  }>;
}

export async function fetchCourierOverview(): Promise<CourierOverview> {
  const res = await apiGet<CourierOverview>("/dashboard/courier-overview");
  if (!res.success || !res.data) {
    return {
      contracts: [],
      stats: { assignedCount: 0, revenue: "$0" },
      recentActivity: [],
    };
  }
  return res.data;
}
