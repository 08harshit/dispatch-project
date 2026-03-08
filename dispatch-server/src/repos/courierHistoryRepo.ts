/**
 * Courier History Repository
 *
 * All DB operations for the `courier_history` table.
 * No business logic — just queries.
 */

import { getTable, type DbResult } from "./baseRepo";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HistoryRow {
    id: string;
    courier_id: string;
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

/** Get all history entries for a single courier (newest first). */
export async function findByCourierId(courierId: string): Promise<HistoryEntry[]> {
    const { data, error } = await getTable("courier_history")
        .select("*")
        .eq("courier_id", courierId)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as HistoryRow[]).map(h => ({
        date: h.created_at?.split("T")[0] || "",
        action: h.action,
    }));
}

/**
 * Batch-fetch history for multiple couriers.
 * Returns a Map keyed by courier_id.
 */
export async function findByCourierIds(
    courierIds: string[],
): Promise<Map<string, HistoryEntry[]>> {
    const map = new Map<string, HistoryEntry[]>();
    if (courierIds.length === 0) return map;

    const { data, error } = await getTable("courier_history")
        .select("*")
        .in("courier_id", courierIds)
        .order("created_at", { ascending: false });

    if (error || !data) return map;

    for (const h of data as HistoryRow[]) {
        if (!map.has(h.courier_id)) map.set(h.courier_id, []);
        map.get(h.courier_id)!.push({
            date: h.created_at?.split("T")[0] || "",
            action: h.action,
        });
    }

    return map;
}

/** Insert a single history entry. */
export async function addEntry(
    courierId: string,
    action: string,
): Promise<DbResult<{ id: string }>> {
    const { data, error } = await getTable("courier_history")
        .insert({ courier_id: courierId, action })
        .select("id")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as { id: string }, error: null };
}
