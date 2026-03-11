import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

export interface CostRecordApi {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  hasDocs: boolean;
  invoiceUrl?: string;
  invoiceName?: string;
}

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

function toCostRecordDate(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("T")[0].split("-");
  return m && d && y ? `${m}-${d}-${y}` : isoDate;
}

function toIsoDate(mmDdYyyy: string): string {
  if (!mmDdYyyy) return "";
  const parts = mmDdYyyy.split("-");
  if (parts.length !== 3) return mmDdYyyy;
  const [m, d, y] = parts;
  return `${y}-${m}-${d}`;
}

export async function fetchCourierCosts(params?: {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
}): Promise<CostRecordApi[]> {
  const search = new URLSearchParams();
  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  if (params?.category) search.set("category", params.category);
  const qs = search.toString();
  const res = await apiGet<CostRecordApi[]>(`/accounting/courier/costs${qs ? `?${qs}` : ""}`);
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map((r) => ({ ...r, date: toCostRecordDate(r.date) }));
}

export async function createCourierCost(body: {
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod?: string;
  hasDocs?: boolean;
  invoiceUrl?: string;
  invoiceName?: string;
}): Promise<CostRecordApi> {
  const isoDate = /^\d{4}-\d{2}-\d{2}/.test(body.date) ? body.date.split("T")[0] : toIsoDate(body.date);
  const res = await apiPost<CostRecordApi>("/accounting/courier/costs", {
    ...body,
    date: isoDate,
  });
  if (!res.success || !res.data) throw new Error(res.error || "Failed to create cost");
  return { ...res.data, date: toCostRecordDate(res.data.date) };
}

export async function updateCourierCost(
  id: string,
  body: Partial<{
    amount: number;
    category: string;
    description: string;
    date: string;
    paymentMethod: string;
    hasDocs: boolean;
    invoiceUrl: string;
    invoiceName: string;
  }>
): Promise<CostRecordApi> {
  const payload = { ...body };
  if (payload.date && payload.date.length === 10 && payload.date.includes("-")) {
    payload.date = /^\d{4}-\d{2}-\d{2}/.test(payload.date) ? payload.date.split("T")[0] : toIsoDate(payload.date);
  }
  const res = await apiPatch<CostRecordApi>(`/accounting/courier/costs/${id}`, payload);
  if (!res.success || !res.data) throw new Error(res.error || "Failed to update cost");
  return { ...res.data, date: toCostRecordDate(res.data.date) };
}

export async function deleteCourierCost(id: string): Promise<void> {
  const res = await apiDelete<{ message?: string }>(`/accounting/courier/costs/${id}`);
  if (!res.success) throw new Error(res.error || "Failed to delete cost");
}
