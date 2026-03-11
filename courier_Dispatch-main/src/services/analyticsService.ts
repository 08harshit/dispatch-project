import { apiGet } from "./api";

export interface AnalyticsStat {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  description: string;
}

export interface DeliveryTrendItem {
  day: string;
  deliveries: number;
  percentage: number;
}

export async function fetchAnalyticsStats(range?: string): Promise<AnalyticsStat[]> {
  const qs = range ? `?range=${encodeURIComponent(range)}` : "";
  const res = await apiGet<AnalyticsStat[]>(`/analytics/stats${qs}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchDeliveryTrends(range?: string): Promise<DeliveryTrendItem[]> {
  const qs = range ? `?range=${encodeURIComponent(range)}` : "";
  const res = await apiGet<DeliveryTrendItem[]>(`/analytics/delivery-trends${qs}`);
  return Array.isArray(res.data) ? res.data : [];
}

export interface TopRouteItem {
  route: string;
  loads: number;
  revenue: string;
  growth: string;
}

export interface LoadTypeItem {
  type: string;
  percentage: number;
  color: string;
}

export async function fetchAnalyticsTopRoutes(range?: string): Promise<TopRouteItem[]> {
  const qs = range ? `?range=${encodeURIComponent(range)}` : "";
  const res = await apiGet<TopRouteItem[]>(`/analytics/courier/top-routes${qs}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchAnalyticsLoadTypes(range?: string): Promise<LoadTypeItem[]> {
  const qs = range ? `?range=${encodeURIComponent(range)}` : "";
  const res = await apiGet<LoadTypeItem[]>(`/analytics/courier/load-types${qs}`);
  return Array.isArray(res.data) ? res.data : [];
}
