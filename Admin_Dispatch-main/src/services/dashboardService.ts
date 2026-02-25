import { apiGet } from "./api";

export interface DashboardStats {
    totalCouriers: number;
    totalShippers: number;
    totalTransactions: number;
    activeAlerts: number;
    couriersCompliant: number;
    couriersNonCompliant: number;
    shippersCompliant: number;
    shippersNonCompliant: number;
}

export interface RecentActivityItem {
    id: string;
    entity: string;
    entityType: "courier" | "shipper";
    action: string;
    status: "completed" | "pending" | "failed";
    date: string;
}

export interface DashboardAlert {
    id: string;
    title: string;
    description: string;
    type: "warning" | "urgent" | "info";
    time: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const res = await apiGet<DashboardStats>("/dashboard/stats");
    if (!res.success || !res.data) {
        return {
            totalCouriers: 0,
            totalShippers: 0,
            totalTransactions: 0,
            activeAlerts: 0,
            couriersCompliant: 0,
            couriersNonCompliant: 0,
            shippersCompliant: 0,
            shippersNonCompliant: 0,
        };
    }
    return res.data;
}

export async function fetchRecentActivity(): Promise<RecentActivityItem[]> {
    const res = await apiGet<RecentActivityItem[]>("/dashboard/recent-activity");
    if (!res.success || !Array.isArray(res.data)) return [];
    return res.data;
}

export async function fetchDashboardAlerts(): Promise<DashboardAlert[]> {
    const res = await apiGet<DashboardAlert[]>("/dashboard/alerts");
    if (!res.success || !Array.isArray(res.data)) return [];
    return res.data;
}
