/**
 * Shipper Document Repository
 *
 * All DB operations for the `shipper_documents` table.
 * Handles metadata only - no file storage logic here.
 */

import { getTable, type DbResult } from "./baseRepo";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DocumentRow {
    id: string;
    shipper_id: string;
    name: string;
    type: string;
    date?: string;
    created_at?: string;
}

export interface DocumentEntry {
    id: string;
    name: string;
    type: string;
    date: string;
}

export interface CreateDocumentMeta {
    name: string;
    type: string;
    date?: string;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/** Get all documents for a single shipper (newest first). */
export async function findByShipperId(shipperId: string): Promise<DocumentEntry[]> {
    const { data, error } = await getTable("shipper_documents")
        .select("*")
        .eq("shipper_id", shipperId)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as DocumentRow[]).map(mapToEntry);
}

/**
 * Batch-fetch documents for multiple shippers.
 * Returns a Map keyed by shipper_id.
 */
export async function findByShipperIds(
    shipperIds: string[],
): Promise<Map<string, DocumentEntry[]>> {
    const map = new Map<string, DocumentEntry[]>();
    if (shipperIds.length === 0) return map;

    const { data, error } = await getTable("shipper_documents")
        .select("*")
        .in("shipper_id", shipperIds)
        .order("created_at", { ascending: false });

    if (error || !data) return map;

    for (const d of data as DocumentRow[]) {
        if (!map.has(d.shipper_id)) map.set(d.shipper_id, []);
        map.get(d.shipper_id)!.push(mapToEntry(d));
    }

    return map;
}

/** Get a single document by its ID. */
export async function findById(docId: string): Promise<DocumentRow | null> {
    const { data, error } = await getTable("shipper_documents")
        .select("*")
        .eq("id", docId)
        .single();

    if (error || !data) return null;
    return data as DocumentRow;
}

/** Insert a document metadata record. */
export async function create(
    shipperId: string,
    meta: CreateDocumentMeta,
): Promise<DbResult<{ id: string }>> {
    const { data, error } = await getTable("shipper_documents")
        .insert({
            shipper_id: shipperId,
            name: meta.name,
            type: meta.type,
            date: meta.date || null,
        })
        .select("id")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as { id: string }, error: null };
}

/** Delete a document metadata record by ID. */
export async function deleteById(docId: string): Promise<DbResult<null>> {
    const { error } = await getTable("shipper_documents")
        .delete()
        .eq("id", docId);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
}

/* ------------------------------------------------------------------ */
/*  Internal mapper                                                    */
/* ------------------------------------------------------------------ */

function mapToEntry(d: DocumentRow): DocumentEntry {
    return {
        id: d.id,
        name: d.name,
        type: d.type || "PDF",
        date: d.date || d.created_at?.split("T")[0] || "",
    };
}
