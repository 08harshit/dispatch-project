// ============================================================
// Shared types used across multiple page components
// ============================================================

/** Reusable history entry — used by Couriers, Shippers, Loads */
export interface HistoryItem {
    date: string;
    action: string;
}

/** Reusable document entry — used by Couriers, Shippers, Loads */
export interface DocumentItem {
    name: string;
    type: string;
    date?: string;
}

/** Compliance status — used by Couriers and Shippers */
export type ComplianceStatus = "compliant" | "non-compliant";

/** Generic entity status — used across most entity pages */
export type EntityStatus = "active" | "inactive";

/** Filter tab values used by Couriers and Shippers */
export type FilterTab = "all" | "compliant" | "non-compliant" | "new";
