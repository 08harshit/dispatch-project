import { apiGet } from "./api";

export interface ShipperStat {
  label: string;
  value: string;
  change: number;
  positive: boolean;
  period: string;
}

export interface ShipperTrend {
  name: string;
  shipments: number;
  cost: number;
}

export interface RouteDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TopRoute {
  from: string;
  to: string;
  count: number;
  cost: string;
}

export async function getShipperStats(range?: string): Promise<ShipperStat[]> {
  const path = `/analytics/shipper/stats${range ? `?range=${range}` : ""}`;
  const res = await apiGet<ShipperStat[]>(path);
  return res.data ?? [];
}

export async function getShipperTrends(range?: string): Promise<ShipperTrend[]> {
  const path = `/analytics/shipper/trends${range ? `?range=${range}` : ""}`;
  const res = await apiGet<ShipperTrend[]>(path);
  return res.data ?? [];
}

export async function getRouteDistribution(): Promise<RouteDistribution[]> {
  const res = await apiGet<RouteDistribution[]>("/analytics/shipper/route-distribution");
  return res.data ?? [];
}

export async function getTopRoutes(): Promise<TopRoute[]> {
  const res = await apiGet<TopRoute[]>("/analytics/shipper/top-routes");
  return res.data ?? [];
}
