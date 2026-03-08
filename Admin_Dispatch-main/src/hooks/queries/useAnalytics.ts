import { useQuery } from "@tanstack/react-query";
import {
    fetchAnalyticsStats,
    fetchDeliveryTrends,
    fetchCourierPerformance,
    DateRange
} from "../../services/analyticsService";

// --- Query Keys ---
export const analyticsKeys = {
    all: ["analytics"] as const,
    stats: (range: DateRange) => [...analyticsKeys.all, "stats", range] as const,
    trends: (range: DateRange) => [...analyticsKeys.all, "trends", range] as const,
    couriers: () => [...analyticsKeys.all, "couriers"] as const,
};

// --- Queries ---
export function useAnalyticsStatsQuery(range: DateRange) {
    return useQuery({
        queryKey: analyticsKeys.stats(range),
        queryFn: () => fetchAnalyticsStats(range),
        staleTime: 15 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useDeliveryTrendsQuery(range: DateRange) {
    return useQuery({
        queryKey: analyticsKeys.trends(range),
        queryFn: () => fetchDeliveryTrends(range),
        staleTime: 15 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCourierPerformanceQuery() {
    return useQuery({
        queryKey: analyticsKeys.couriers(),
        queryFn: fetchCourierPerformance,
        staleTime: 15 * 60 * 1000,
    });
}
