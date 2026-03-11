// ============================================================
// Analytics Service — API-backed
// ============================================================

import { LucideIcon } from "lucide-react";
import { Activity, Target, Clock, Zap } from "lucide-react";
import { apiGet } from "./api";

export type DateRange = "7days" | "14days" | "30days" | "90days";
export type PerformanceFilter = "all" | "top" | "good" | "average";

export const dateRangeLabels: Record<DateRange, string> = {
    "7days": "Last 7 Days",
    "14days": "Last 14 Days",
    "30days": "Last 30 Days",
    "90days": "Last 90 Days",
};

export interface AnalyticsStatItem {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon?: LucideIcon;
    color?: string;
    description: string;
}

export interface DeliveryTrendItem {
    day: string;
    deliveries: number;
    percentage: number;
}

export interface CourierPerformanceItem {
    name: string;
    deliveries: number;
    rating: number;
    onTime: number;
    status: string;
}

// --- Mock Data (will be replaced by API responses) ---

const statsData: Record<DateRange, AnalyticsStatItem[]> = {
    "7days": [
        { title: "Deliveries Today", value: "127", change: "+12%", isPositive: true, icon: Activity, color: "primary", description: "vs yesterday" },
        { title: "On-Time Rate", value: "94.2%", change: "+2.3%", isPositive: true, icon: Target, color: "success", description: "This week" },
        { title: "Avg. Transit Time", value: "2.3 days", change: "-8%", isPositive: true, icon: Clock, color: "warning", description: "Improved" },
        { title: "Utilization", value: "78%", change: "+5%", isPositive: true, icon: Zap, color: "accent", description: "Fleet capacity" },
    ],
    "14days": [
        { title: "Deliveries Today", value: "142", change: "+18%", isPositive: true, icon: Activity, color: "primary", description: "vs yesterday" },
        { title: "On-Time Rate", value: "92.8%", change: "+1.5%", isPositive: true, icon: Target, color: "success", description: "This period" },
        { title: "Avg. Transit Time", value: "2.5 days", change: "-5%", isPositive: true, icon: Clock, color: "warning", description: "Improved" },
        { title: "Utilization", value: "81%", change: "+8%", isPositive: true, icon: Zap, color: "accent", description: "Fleet capacity" },
    ],
    "30days": [
        { title: "Deliveries Today", value: "156", change: "+22%", isPositive: true, icon: Activity, color: "primary", description: "vs yesterday" },
        { title: "On-Time Rate", value: "91.5%", change: "-0.8%", isPositive: false, icon: Target, color: "success", description: "This month" },
        { title: "Avg. Transit Time", value: "2.7 days", change: "+3%", isPositive: false, icon: Clock, color: "warning", description: "Slower" },
        { title: "Utilization", value: "85%", change: "+12%", isPositive: true, icon: Zap, color: "accent", description: "Fleet capacity" },
    ],
    "90days": [
        { title: "Deliveries Today", value: "189", change: "+35%", isPositive: true, icon: Activity, color: "primary", description: "vs yesterday" },
        { title: "On-Time Rate", value: "93.1%", change: "+4.2%", isPositive: true, icon: Target, color: "success", description: "This quarter" },
        { title: "Avg. Transit Time", value: "2.4 days", change: "-12%", isPositive: true, icon: Clock, color: "warning", description: "Improved" },
        { title: "Utilization", value: "82%", change: "+15%", isPositive: true, icon: Zap, color: "accent", description: "Fleet capacity" },
    ],
};

const deliveryTrendsData: Record<DateRange, DeliveryTrendItem[]> = {
    "7days": [
        { day: "Mon", deliveries: 45, percentage: 75 },
        { day: "Tue", deliveries: 52, percentage: 87 },
        { day: "Wed", deliveries: 38, percentage: 63 },
        { day: "Thu", deliveries: 61, percentage: 100 },
        { day: "Fri", deliveries: 55, percentage: 90 },
        { day: "Sat", deliveries: 28, percentage: 47 },
        { day: "Sun", deliveries: 12, percentage: 20 },
    ],
    "14days": [
        { day: "Week 1", deliveries: 291, percentage: 85 },
        { day: "Week 2", deliveries: 324, percentage: 100 },
    ],
    "30days": [
        { day: "Week 1", deliveries: 285, percentage: 72 },
        { day: "Week 2", deliveries: 312, percentage: 79 },
        { day: "Week 3", deliveries: 395, percentage: 100 },
        { day: "Week 4", deliveries: 348, percentage: 88 },
    ],
    "90days": [
        { day: "Jan", deliveries: 1245, percentage: 78 },
        { day: "Feb", deliveries: 1589, percentage: 100 },
        { day: "Mar", deliveries: 1423, percentage: 90 },
    ],
};

const mockCourierPerformance: CourierPerformanceItem[] = [
    { name: "John Smith", deliveries: 156, rating: 4.9, onTime: 98, status: "top" },
    { name: "Maria Garcia", deliveries: 142, rating: 4.8, onTime: 96, status: "top" },
    { name: "David Chen", deliveries: 128, rating: 4.7, onTime: 94, status: "good" },
    { name: "Sarah Wilson", deliveries: 115, rating: 4.6, onTime: 92, status: "good" },
    { name: "Mike Johnson", deliveries: 98, rating: 4.5, onTime: 89, status: "average" },
    { name: "Emily Brown", deliveries: 87, rating: 4.3, onTime: 85, status: "average" },
    { name: "James Lee", deliveries: 76, rating: 4.2, onTime: 82, status: "average" },
];

const titleToIcon: Record<string, LucideIcon> = {
    "Deliveries Today": Activity,
    "On-Time Rate": Target,
    "Avg. Transit Time": Clock,
    "Utilization": Zap,
};

export async function fetchAnalyticsStats(dateRange: DateRange): Promise<AnalyticsStatItem[]> {
    const res = await apiGet<AnalyticsStatItem[]>(`/analytics/stats?range=${dateRange}`);
    if (!res.success || !Array.isArray(res.data)) return statsData[dateRange];
    return res.data.map((item) => ({
        ...item,
        icon: titleToIcon[item.title] ?? Activity,
        color: item.color ?? "primary",
    }));
}

export async function fetchDeliveryTrends(dateRange: DateRange): Promise<DeliveryTrendItem[]> {
    const res = await apiGet<DeliveryTrendItem[]>(`/analytics/delivery-trends?range=${dateRange}`);
    if (!res.success || !Array.isArray(res.data)) return deliveryTrendsData[dateRange];
    return res.data;
}

export async function fetchCourierPerformance(): Promise<CourierPerformanceItem[]> {
    const res = await apiGet<CourierPerformanceItem[]>("/analytics/courier-performance");
    if (!res.success || !Array.isArray(res.data)) return mockCourierPerformance;
    return res.data;
}
