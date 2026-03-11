import { apiGet } from "./api";

export interface ShipperOverview {
  activeShipments: number;
  totalShipment: number;
  spends: string;
  onTimeRate: string;
  recentActivity: Array<{ type: string; message: string; time: string; icon: string }>;
}

export async function fetchShipperOverview(): Promise<ShipperOverview> {
  const res = await apiGet<ShipperOverview>("/dashboard/shipper-overview");
  const data = res.data;
  if (!data) {
    return {
      activeShipments: 0,
      totalShipment: 0,
      spends: "$0",
      onTimeRate: "0%",
      recentActivity: [],
    };
  }
  return data;
}
