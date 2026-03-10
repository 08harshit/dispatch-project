import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsStats, fetchDeliveryTrends } from "@/services/analyticsService";

export const analyticsKeys = {
  all: ["analytics"] as const,
  stats: (range?: string) => [...analyticsKeys.all, "stats", range] as const,
  deliveryTrends: (range?: string) => [...analyticsKeys.all, "delivery-trends", range] as const,
};

export function useAnalyticsStatsQuery(range?: string) {
  return useQuery({
    queryKey: analyticsKeys.stats(range),
    queryFn: () => fetchAnalyticsStats(range),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeliveryTrendsQuery(range?: string) {
  return useQuery({
    queryKey: analyticsKeys.deliveryTrends(range),
    queryFn: () => fetchDeliveryTrends(range),
    staleTime: 5 * 60 * 1000,
  });
}
