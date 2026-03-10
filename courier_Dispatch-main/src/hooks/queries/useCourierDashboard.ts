import { useQuery } from "@tanstack/react-query";
import { fetchCourierOverview } from "@/services/courierDashboardService";

export const courierDashboardKeys = {
  all: ["courier-dashboard"] as const,
  overview: () => [...courierDashboardKeys.all, "overview"] as const,
};

export function useCourierOverviewQuery() {
  return useQuery({
    queryKey: courierDashboardKeys.overview(),
    queryFn: fetchCourierOverview,
    staleTime: 5 * 60 * 1000,
  });
}
