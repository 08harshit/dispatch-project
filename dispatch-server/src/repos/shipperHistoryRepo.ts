/**
 * Shipper History Repository
 *
 * All DB operations for the `shipper_history` table.
 * No business logic - just queries.
 */

import { getTable } from "./baseRepo";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HistoryRow {
    id: string;
    shipper_id: string;
    action: string;
    created_at: string;
}

export interface HistoryEntry {
    date: string;
    action: string;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/** Get all history entries for a single shipper (newest first). */
export async function findByShipperId(shipperId: string): Promise<HistoryEntry[]> {
    const { data, error } = await getTable("shipper_history")
        .select("*")
        .eq("shipper_id", shipperId)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as HistoryRow[]).map((h) => ({
        date: h.created_at?.split("T")[0] || "",
        action: h.action,
    }));
}

/**
 * Batch-fetch history for multiple shippers.
 * Returns a Map keyed by shipper_id.
 */
export async function findByShipperIds(
    shipperIds: string[],
): Promise<Map<string, HistoryEntry[]>> {
    const map = new Map<string, HistoryEntry[]>();
    if (shipperIds.length === 0) return map;

    const { data, error } = await getTable("shipper_history")
        .select("*")
        .in("shipper_id", shipperIds)
        .order("created_at", { ascending: false });

    if (error || !data) return map;

    for (const h of data as HistoryRow[]) {
        if (!map.has(h.shipper_id)) map.set(h.shipper_id, []);
        map.get(h.shipper_id)!.push({
            date: h.created_at?.split("T")[0] || "",
            action: h.action,
        });
    }

    return map;
}

/** Insert a single history entry. */
export async function addEntry(
    shipperId: string,
    action: string,
): Promise<{ data: { id: string } | null; error: string | null }> {
    const { data, error } = await getTable("shipper_history")
        .insert({ shipper_id: shipperId, action })
        .select("id")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as { id: string }, error: null };
}
