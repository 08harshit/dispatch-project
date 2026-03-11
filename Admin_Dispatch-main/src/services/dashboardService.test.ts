import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchDashboardOverview,
  fetchDashboardStats,
  markAlertRead,
  dismissAlert,
} from "./dashboardService";

vi.mock("./api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

const { apiGet, apiPatch, apiDelete } = await import("./api");

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDashboardOverview", () => {
    it("returns overview when API succeeds", async () => {
      const mockData = {
        stats: {
          totalCouriers: 5,
          totalShippers: 3,
          totalTransactions: 100,
          activeAlerts: 2,
          couriersCompliant: 4,
          couriersNonCompliant: 1,
          shippersCompliant: 2,
          shippersNonCompliant: 1,
        },
        recentActivity: [],
        alerts: [],
      };
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: mockData });

      const result = await fetchDashboardOverview();

      expect(result).toEqual(mockData);
      expect(apiGet).toHaveBeenCalledWith("/dashboard/overview");
    });

    it("returns fallback when API fails", async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: false, data: null });

      const result = await fetchDashboardOverview();

      expect(result.stats.totalCouriers).toBe(0);
      expect(result.stats.totalShippers).toBe(0);
      expect(result.recentActivity).toEqual([]);
      expect(result.alerts).toEqual([]);
    });
  });

  describe("fetchDashboardStats", () => {
    it("returns stats when API succeeds", async () => {
      const mockStats = {
        totalCouriers: 10,
        totalShippers: 5,
        totalTransactions: 200,
        activeAlerts: 3,
        couriersCompliant: 8,
        couriersNonCompliant: 2,
        shippersCompliant: 4,
        shippersNonCompliant: 1,
      };
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: mockStats });

      const result = await fetchDashboardStats();

      expect(result).toEqual(mockStats);
      expect(apiGet).toHaveBeenCalledWith("/dashboard/stats");
    });
  });

  describe("markAlertRead", () => {
    it("calls PATCH with alert id", async () => {
      vi.mocked(apiPatch).mockResolvedValue({ success: true, data: {} });

      await markAlertRead("alert-123");

      expect(apiPatch).toHaveBeenCalledWith("/dashboard/alerts/alert-123/read");
    });
  });

  describe("dismissAlert", () => {
    it("calls DELETE with alert id", async () => {
      vi.mocked(apiDelete).mockResolvedValue({ success: true, data: {} });

      await dismissAlert("alert-456");

      expect(apiDelete).toHaveBeenCalledWith("/dashboard/alerts/alert-456");
    });
  });
});
