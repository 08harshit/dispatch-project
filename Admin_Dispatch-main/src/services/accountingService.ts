// ============================================================
// Accounting Service — API-backed (invoices)
// ============================================================

import { apiGet } from "./api";
import type { LucideIcon } from "lucide-react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";

export interface Transaction {
    id: string;
    date: string;
    description: string;
    type: "income" | "expense";
    amount: number;
    status: "completed" | "pending" | "overdue";
    party: string;
    partyType: "shipper" | "courier";
}

export interface AccountingStats {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: LucideIcon;
    color: string;
    description: string;
}

interface ApiStats {
    totalRevenue: { value: string; change: string; isPositive: boolean };
    receivables: { value: string; change: string; isPositive: boolean };
    payables: { value: string; change: string; isPositive: boolean };
    pending: { value: string; change: string; isPositive: boolean };
}

export async function fetchTransactions(): Promise<Transaction[]> {
    const res = await apiGet<Transaction[]>("/accounting/transactions");
    return res.data ?? [];
}

export async function fetchAccountingStats(): Promise<AccountingStats[]> {
    const res = await apiGet<ApiStats>("/accounting/stats");
    const data = res.data;
    if (!data || typeof data !== "object") {
        return [
            { title: "Total Revenue", value: "$0", change: "+0%", isPositive: true, icon: DollarSign, color: "success", description: "This month" },
            { title: "Receivables", value: "$0", change: "+0%", isPositive: true, icon: TrendingUp, color: "primary", description: "Outstanding" },
            { title: "Payables", value: "$0", change: "+0%", isPositive: false, icon: TrendingDown, color: "warning", description: "Due this week" },
            { title: "Pending", value: "$0", change: "+0%", isPositive: true, icon: CreditCard, color: "accent", description: "Processing" },
        ];
    }
    return [
        { title: "Total Revenue", value: data.totalRevenue?.value ?? "$0", change: data.totalRevenue?.change ?? "+0%", isPositive: data.totalRevenue?.isPositive ?? true, icon: DollarSign, color: "success", description: "This month" },
        { title: "Receivables", value: data.receivables?.value ?? "$0", change: data.receivables?.change ?? "+0%", isPositive: data.receivables?.isPositive ?? true, icon: TrendingUp, color: "primary", description: "Outstanding" },
        { title: "Payables", value: data.payables?.value ?? "$0", change: data.payables?.change ?? "+0%", isPositive: data.payables?.isPositive ?? false, icon: TrendingDown, color: "warning", description: "Due this week" },
        { title: "Pending", value: data.pending?.value ?? "$0", change: data.pending?.change ?? "+0%", isPositive: data.pending?.isPositive ?? true, icon: CreditCard, color: "accent", description: "Processing" },
    ];
}
