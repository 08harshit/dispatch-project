import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccountingStats,
  fetchAccountingTransactions,
  fetchCourierCosts,
  createCourierCost,
  updateCourierCost,
  deleteCourierCost,
} from "@/services/accountingService";

export interface AccountingTransactionsParams {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CourierCostsParams {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
}

export const accountingKeys = {
  all: ["accounting"] as const,
  stats: () => [...accountingKeys.all, "stats"] as const,
  transactions: (params?: AccountingTransactionsParams) =>
    [...accountingKeys.all, "transactions", params] as const,
  courierCosts: (params?: CourierCostsParams) =>
    [...accountingKeys.all, "courierCosts", params] as const,
};

export function useAccountingStatsQuery() {
  return useQuery({
    queryKey: accountingKeys.stats(),
    queryFn: fetchAccountingStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccountingTransactionsQuery(params?: AccountingTransactionsParams) {
  return useQuery({
    queryKey: accountingKeys.transactions(params),
    queryFn: () => fetchAccountingTransactions(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCourierCostsQuery(params?: CourierCostsParams) {
  return useQuery({
    queryKey: accountingKeys.courierCosts(params),
    queryFn: () => fetchCourierCosts(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCourierCostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createCourierCost>[0]) => createCourierCost(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
    },
  });
}

export function useUpdateCourierCostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateCourierCost>[1] }) =>
      updateCourierCost(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
    },
  });
}

export function useDeleteCourierCostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCourierCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.all });
    },
  });
}
