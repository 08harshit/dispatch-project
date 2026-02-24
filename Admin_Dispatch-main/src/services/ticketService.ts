// ============================================================
// Ticket Service — mock data shell
// Pattern: types → mock data → async functions (swap for API later)
// ============================================================

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

// --- Async service functions (mock → API ready) ---

export async function fetchTickets(
    _filters: TicketFilters = {}
): Promise<Ticket[]> {
    // TODO: replace with apiGet<Ticket[]>(`/tickets?${params}`)
    return Promise.resolve(mockTickets);
}

export async function fetchTicketStats(): Promise<{
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
}> {
    // TODO: replace with apiGet("/tickets/stats")
    const open = mockTickets.filter((t) => t.status === "open").length;
    const inProgress = mockTickets.filter(
        (t) => t.status === "in-progress"
    ).length;
    const resolved = mockTickets.filter((t) => t.status === "resolved").length;
    const closed = mockTickets.filter((t) => t.status === "closed").length;
    const urgent = mockTickets.filter(
        (t) => t.priority === "urgent" || t.priority === "high"
    ).length;
    return Promise.resolve({ open, inProgress, resolved, closed, urgent });
}
