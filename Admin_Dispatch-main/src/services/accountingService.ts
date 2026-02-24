// ============================================================
// Accounting Service — mock data shell
// Pattern: types → mock data → async functions (swap for API later)
// ============================================================

import { LucideIcon } from "lucide-react";
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

// --- Mock Data (will be replaced by API responses) ---

const mockTransactions: Transaction[] = [
    {
        id: "TXN-001",
        date: "2024-01-15",
        description: "Freight Payment - ABC Logistics",
        type: "income",
        amount: 4500.0,
        status: "completed",
        party: "ABC Logistics",
        partyType: "shipper",
    },
    {
        id: "TXN-002",
        date: "2024-01-14",
        description: "Carrier Payment - FastFreight Inc",
        type: "expense",
        amount: 3200.0,
        status: "completed",
        party: "FastFreight Inc",
        partyType: "courier",
    },
    {
        id: "TXN-003",
        date: "2024-01-14",
        description: "Freight Payment - Global Shipping Co",
        type: "income",
        amount: 6800.0,
        status: "pending",
        party: "Global Shipping Co",
        partyType: "shipper",
    },
    {
        id: "TXN-004",
        date: "2024-01-13",
        description: "Carrier Payment - Express Haulers",
        type: "expense",
        amount: 2100.0,
        status: "completed",
        party: "Express Haulers",
        partyType: "courier",
    },
    {
        id: "TXN-005",
        date: "2024-01-12",
        description: "Freight Payment - Metro Distributors",
        type: "income",
        amount: 5200.0,
        status: "overdue",
        party: "Metro Distributors",
        partyType: "shipper",
    },
];

const mockStats: AccountingStats[] = [
    {
        title: "Total Revenue",
        value: "$124,580",
        change: "+12.5%",
        isPositive: true,
        icon: DollarSign,
        color: "success",
        description: "This month",
    },
    {
        title: "Receivables",
        value: "$45,230",
        change: "+8.2%",
        isPositive: true,
        icon: TrendingUp,
        color: "primary",
        description: "Outstanding",
    },
    {
        title: "Payables",
        value: "$28,450",
        change: "-5.1%",
        isPositive: false,
        icon: TrendingDown,
        color: "warning",
        description: "Due this week",
    },
    {
        title: "Pending",
        value: "$12,800",
        change: "+3.4%",
        isPositive: true,
        icon: CreditCard,
        color: "accent",
        description: "Processing",
    },
];

// --- Async service functions (mock → API ready) ---

export async function fetchTransactions(): Promise<Transaction[]> {
    // TODO: replace with apiGet<Transaction[]>("/accounting/transactions")
    return Promise.resolve(mockTransactions);
}

export async function fetchAccountingStats(): Promise<AccountingStats[]> {
    // TODO: replace with apiGet<AccountingStats[]>("/accounting/stats")
    return Promise.resolve(mockStats);
}
