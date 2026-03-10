import { apiGet, apiPatch, apiDelete } from "./api";

export interface DashboardOverview {
    stats: DashboardStats;
    recentActivity: RecentActivityItem[];
    alerts: DashboardAlert[];
}

export interface DashboardStats {
    totalCouriers: number;
    totalShippers: number;
    totalTransactions: number;
    activeAlerts: number;
    couriersCompliant: number;
    couriersNonCompliant: number;
    shippersCompliant: number;
    shippersNonCompliant: number;
    couriersTrend?: { value: number; isPositive: boolean } | null;
    shippersTrend?: { value: number; isPositive: boolean } | null;
    transactionsTrend?: { value: number; isPositive: boolean } | null;
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

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
    const res = await apiGet<DashboardOverview>("/dashboard/overview");
    if (!res.success || !res.data) {
        return {
            stats: {
                totalCouriers: 0,
                totalShippers: 0,
                totalTransactions: 0,
                activeAlerts: 0,
                couriersCompliant: 0,
                couriersNonCompliant: 0,
                shippersCompliant: 0,
                shippersNonCompliant: 0,
                couriersTrend: null,
                shippersTrend: null,
                transactionsTrend: null,
            },
            recentActivity: [],
            alerts: [],
        };
    }
    return res.data;
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
            couriersTrend: null,
            shippersTrend: null,
            transactionsTrend: null,
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

export async function markAlertRead(id: string): Promise<void> {
    await apiPatch(`/dashboard/alerts/${id}/read`);
}

export async function dismissAlert(id: string): Promise<void> {
    await apiDelete(`/dashboard/alerts/${id}`);
}
