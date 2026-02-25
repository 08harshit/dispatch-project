// ============================================================
// Ticket Service — API-backed
// ============================================================

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./api";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";

export interface TicketComment {
    id: string;
    author: string;
    text: string;
    date: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
    comments: TicketComment[];
}

export interface TicketFilters {
    search?: string;
    status?: string;
    priority?: string;
}

// --- Mock Data (will be replaced by API responses) ---

const mockTickets: Ticket[] = [
    {
        id: "TK-001",
        title: "Update courier payment schedule",
        description:
            "Need to revise the payment terms for Q2 courier contracts to align with new budget.",
        priority: "high",
        status: "open",
        createdAt: "2024-01-20",
        updatedAt: "2024-01-22",
        comments: [
            {
                id: "c1",
                author: "Admin",
                text: "Flagged as high priority for finance review.",
                date: "2024-01-21",
            },
        ],
    },
    {
        id: "TK-002",
        title: "Onboard new shipper: Metro Auto Sales",
        description:
            "Complete onboarding paperwork and system setup for Metro Auto Sales.",
        priority: "medium",
        status: "in-progress",
        createdAt: "2024-01-18",
        updatedAt: "2024-01-23",
        comments: [
            {
                id: "c2",
                author: "Admin",
                text: "Documents received, pending verification.",
                date: "2024-01-19",
            },
            {
                id: "c3",
                author: "Admin",
                text: "Verification complete, setting up account.",
                date: "2024-01-23",
            },
        ],
    },
    {
        id: "TK-003",
        title: "Investigate late delivery LD-002",
        description:
            "Load LD-002 was delayed by 2 days. Investigate cause and update shipper.",
        priority: "urgent",
        status: "open",
        createdAt: "2024-01-25",
        updatedAt: "2024-01-25",
        comments: [],
    },
    {
        id: "TK-004",
        title: "Prepare monthly analytics report",
        description:
            "Compile delivery stats, revenue, and courier performance for January.",
        priority: "low",
        status: "resolved",
        createdAt: "2024-01-10",
        updatedAt: "2024-01-28",
        comments: [
            {
                id: "c4",
                author: "Admin",
                text: "Report drafted and sent for review.",
                date: "2024-01-28",
            },
        ],
    },
    {
        id: "TK-005",
        title: "Fix billing discrepancy for Express Logistics",
        description:
            "Invoice #1042 shows incorrect amount. Needs correction before end of month.",
        priority: "high",
        status: "closed",
        createdAt: "2024-01-05",
        updatedAt: "2024-01-15",
        comments: [
            {
                id: "c5",
                author: "Admin",
                text: "Corrected invoice sent. Confirmed by client.",
                date: "2024-01-15",
            },
        ],
    },
];

export async function fetchTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    const q = params.toString();
    const path = q ? `/tickets?${q}` : "/tickets";
    const res = await apiGet<Ticket[]>(path);
    if (!res.success || !Array.isArray(res.data)) return [];
    return res.data;
}

export async function fetchTicketStats(): Promise<{
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
}> {
    const res = await apiGet<{ open: number; inProgress: number; resolved: number; closed: number; highPriority: number; urgent?: number }>("/tickets/stats");
    if (!res.success || !res.data) {
        return { open: 0, inProgress: 0, resolved: 0, closed: 0, urgent: 0 };
    }
    return {
        open: res.data.open,
        inProgress: res.data.inProgress,
        resolved: res.data.resolved,
        closed: res.data.closed,
        urgent: res.data.urgent ?? res.data.highPriority ?? 0,
    };
}

export async function createTicket(payload: { title: string; description: string; priority: Priority }): Promise<Ticket | null> {
    const res = await apiPost<Ticket>("/tickets", payload);
    return res.success && res.data ? res.data : null;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<Ticket | null> {
    const res = await apiPatch<Ticket>(`/tickets/${ticketId}/status`, { status });
    return res.success && res.data ? res.data : null;
}

export async function addTicketComment(ticketId: string, text: string, author?: string): Promise<TicketComment | null> {
    const res = await apiPost<{ id: string; author: string; text: string; date: string }>(`/tickets/${ticketId}/comments`, { text, author });
    return res.success && res.data ? { id: res.data.id, author: res.data.author, text: res.data.text, date: res.data.date } : null;
}

export async function deleteTicket(ticketId: string): Promise<boolean> {
    const res = await apiDelete<unknown>(`/tickets/${ticketId}`);
    return res.success;
}
