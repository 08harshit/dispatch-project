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
