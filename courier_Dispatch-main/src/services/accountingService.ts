import { apiGet } from "./api";

export interface AccountingStats {
  totalRevenue: { value: string; change: string; isPositive: boolean };
  receivables: { value: string; change: string; isPositive: boolean };
  payables: { value: string; change: string; isPositive: boolean };
  pending: { value: string; change: string; isPositive: boolean };
}

export interface AccountingTransaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  party: string;
  partyType: string;
}

export async function fetchAccountingStats(): Promise<AccountingStats> {
  const res = await apiGet<AccountingStats>("/accounting/stats");
  if (!res.success || !res.data) {
    return {
      totalRevenue: { value: "$0", change: "+0%", isPositive: true },
      receivables: { value: "$0", change: "+0%", isPositive: true },
      payables: { value: "$0", change: "+0%", isPositive: false },
      pending: { value: "$0", change: "+0%", isPositive: true },
    };
  }
  return res.data;
}

export async function fetchAccountingTransactions(params?: {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AccountingTransaction[]> {
  const search = new URLSearchParams();
  if (params?.type) search.set("type", params.type);
  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  const qs = search.toString();
  const res = await apiGet<AccountingTransaction[]>(`/accounting/transactions${qs ? `?${qs}` : ""}`);
  return Array.isArray(res.data) ? res.data : [];
}
