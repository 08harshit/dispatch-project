import { useQuery } from "@tanstack/react-query";
import { fetchTransactions, fetchAccountingStats } from "../../services/accountingService";

// --- Query Keys ---
export const accountingKeys = {
    all: ["accounting"] as const,
    transactions: () => [...accountingKeys.all, "transactions"] as const,
    stats: () => [...accountingKeys.all, "stats"] as const,
};

// --- Queries ---
export function useTransactionsQuery() {
    return useQuery({
        queryKey: accountingKeys.transactions(),
        queryFn: fetchTransactions,
        staleTime: 10 * 60 * 1000,
    });
}

export function useAccountingStatsQuery() {
    return useQuery({
        queryKey: accountingKeys.stats(),
        queryFn: fetchAccountingStats,
        staleTime: 10 * 60 * 1000,
    });
}
