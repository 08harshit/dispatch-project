// ============================================================
// Centralized style helper functions
// Extracted from: Accounting.tsx, Analytics.tsx, Settings.tsx,
//                 Loads.tsx, Tickets.tsx
// ============================================================

/**
 * Returns Tailwind class sets for color-coded UI elements (stat cards, nav items, etc.)
 *
 * Used in: Accounting, Analytics, Settings (previously duplicated in all three)
 */
export const getColorClasses = (color: string) => {
    switch (color) {
        case "success":
            return {
                bg: "bg-success/10",
                text: "text-success",
                gradient: "from-success/20 via-success/5 to-transparent",
                border: "bg-success",
            };
        case "primary":
            return {
                bg: "bg-primary/10",
                text: "text-primary",
                gradient: "from-primary/20 via-primary/5 to-transparent",
                border: "bg-primary",
            };
        case "warning":
            return {
                bg: "bg-warning/10",
                text: "text-warning",
                gradient: "from-warning/20 via-warning/5 to-transparent",
                border: "bg-warning",
            };
        case "accent":
            return {
                bg: "bg-accent/10",
                text: "text-accent",
                gradient: "from-accent/20 via-accent/5 to-transparent",
                border: "bg-accent",
            };
        case "info":
            return {
                bg: "bg-primary/10",
                text: "text-primary",
                gradient: "from-primary/20 via-primary/5 to-transparent",
                border: "bg-primary",
            };
        case "destructive":
            return {
                bg: "bg-destructive/10",
                text: "text-destructive",
                gradient: "from-destructive/20 via-destructive/5 to-transparent",
                border: "bg-destructive",
            };
        default:
            return {
                bg: "bg-primary/10",
                text: "text-primary",
                gradient: "from-primary/20 via-primary/5 to-transparent",
                border: "bg-primary",
            };
    }
};

/** Return type for getColorClasses */
export type ColorClasses = ReturnType<typeof getColorClasses>;

// ============================================================
// Status config helpers
// Each page has its own domain-specific statuses, so we provide
// a per-domain helper. Pages import only the one they need.
// ============================================================

/**
 * Accounting transaction status config
 * Used in: Accounting.tsx
 */
export const getAccountingStatusConfig = (status: string) => {
    switch (status) {
        case "completed":
            return {
                label: "Completed",
                className: "bg-success/15 text-success border-success/20",
            };
        case "pending":
            return {
                label: "Pending",
                className: "bg-warning/15 text-warning border-warning/20",
            };
        case "overdue":
            return {
                label: "Overdue",
                className: "bg-destructive/15 text-destructive border-destructive/20",
            };
        default:
            return {
                label: status,
                className: "bg-muted text-muted-foreground",
            };
    }
};

/**
 * Load status config
 * Used in: Loads.tsx
 */
export const getLoadStatusConfig = (status: string) => {
    switch (status) {
        case "delivered":
            return {
                label: "Delivered",
                className: "bg-success/15 text-success border-success/20",
            };
        case "in-transit":
            return {
                label: "In Transit",
                className: "bg-primary/15 text-primary border-primary/20",
            };
        case "pending":
            return {
                label: "Pending",
                className: "bg-warning/15 text-warning border-warning/20",
            };
        case "cancelled":
            return {
                label: "Cancelled",
                className: "bg-destructive/15 text-destructive border-destructive/20",
            };
        default:
            return {
                label: status,
                className: "bg-muted text-muted-foreground",
            };
    }
};

/**
 * Ticket status config
 * Used in: Tickets.tsx
 */
export const getTicketStatusConfig = (status: string) => {
    switch (status) {
        case "open":
            return {
                label: "Open",
                className: "bg-primary/15 text-primary border-primary/20",
            };
        case "in-progress":
            return {
                label: "In Progress",
                className: "bg-warning/15 text-warning border-warning/20",
            };
        case "resolved":
            return {
                label: "Resolved",
                className: "bg-success/15 text-success border-success/20",
            };
        case "closed":
            return {
                label: "Closed",
                className: "bg-muted text-muted-foreground border-border",
            };
        default:
            return {
                label: status,
                className: "bg-muted text-muted-foreground",
            };
    }
};

/**
 * Analytics courier performance status config
 * Used in: Analytics.tsx
 */
export const getPerformanceStatusConfig = (status: string) => {
    switch (status) {
        case "top":
            return {
                label: "Top Performer",
                className: "bg-success/15 text-success border-success/20",
            };
        case "good":
            return {
                label: "Good",
                className: "bg-primary/15 text-primary border-primary/20",
            };
        case "average":
            return {
                label: "Average",
                className: "bg-warning/15 text-warning border-warning/20",
            };
        default:
            return {
                label: status,
                className: "bg-muted text-muted-foreground",
            };
    }
};

/**
 * Ticket priority config
 * Used in: Tickets.tsx
 */
export const getPriorityConfig = (priority: string) => {
    switch (priority) {
        case "urgent":
            return {
                label: "Urgent",
                className: "bg-destructive/15 text-destructive border-destructive/20",
            };
        case "high":
            return {
                label: "High",
                className: "bg-warning/15 text-warning border-warning/20",
            };
        case "medium":
            return {
                label: "Medium",
                className: "bg-primary/15 text-primary border-primary/20",
            };
        case "low":
            return {
                label: "Low",
                className: "bg-muted text-muted-foreground border-border",
            };
        default:
            return {
                label: priority,
                className: "bg-muted text-muted-foreground border-border",
            };
    }
};
