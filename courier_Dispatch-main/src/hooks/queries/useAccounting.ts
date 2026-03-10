import { useQuery } from "@tanstack/react-query";
import {
  fetchAccountingStats,
  fetchAccountingTransactions,
} from "@/services/accountingService";

export interface AccountingTransactionsParams {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const accountingKeys = {
  all: ["accounting"] as const,
  stats: () => [...accountingKeys.all, "stats"] as const,
  transactions: (params?: AccountingTransactionsParams) =>
    [...accountingKeys.all, "transactions", params] as const,
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
