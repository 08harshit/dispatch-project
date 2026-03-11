import { useQuery } from "@tanstack/react-query";
import {
  fetchAnalyticsStats,
  fetchDeliveryTrends,
  fetchAnalyticsTopRoutes,
  fetchAnalyticsLoadTypes,
} from "@/services/analyticsService";

export const analyticsKeys = {
  all: ["analytics"] as const,
  stats: (range?: string) => [...analyticsKeys.all, "stats", range] as const,
  deliveryTrends: (range?: string) => [...analyticsKeys.all, "delivery-trends", range] as const,
  topRoutes: (range?: string) => [...analyticsKeys.all, "top-routes", range] as const,
  loadTypes: (range?: string) => [...analyticsKeys.all, "load-types", range] as const,
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

export function useAnalyticsTopRoutesQuery(range?: string) {
  return useQuery({
    queryKey: analyticsKeys.topRoutes(range),
    queryFn: () => fetchAnalyticsTopRoutes(range),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsLoadTypesQuery(range?: string) {
  return useQuery({
    queryKey: analyticsKeys.loadTypes(range),
    queryFn: () => fetchAnalyticsLoadTypes(range),
    staleTime: 5 * 60 * 1000,
  });
}
