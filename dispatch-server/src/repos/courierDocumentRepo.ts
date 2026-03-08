/**
 * Courier Document Repository
 *
 * All DB operations for the `courier_documents` table.
 * Handles metadata only — no file storage logic here.
 */

import { getTable, type DbResult } from "./baseRepo";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DocumentRow {
    id: string;
    courier_id: string;
    name: string;
    type: string;
    s3_key?: string | null;
    url?: string | null;
    mime_type?: string | null;
    file_size_bytes?: number | null;
    date?: string;
    created_at?: string;
}

export interface DocumentEntry {
    id: string;
    name: string;
    type: string;
    date: string;
    url: string | null;
}

export interface CreateDocumentMeta {
    name: string;
    type: string;
    mime_type?: string | null;
    file_size_bytes?: number | null;
    s3_key?: string | null;
    url?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/** Get all documents for a single courier (newest first). */
export async function findByCourierId(courierId: string): Promise<DocumentEntry[]> {
    const { data, error } = await getTable("courier_documents")
        .select("*")
        .eq("courier_id", courierId)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as DocumentRow[]).map(mapToEntry);
}

/**
 * Batch-fetch documents for multiple couriers.
 * Returns a Map keyed by courier_id.
 */
export async function findByCourierIds(
    courierIds: string[],
): Promise<Map<string, DocumentEntry[]>> {
    const map = new Map<string, DocumentEntry[]>();
    if (courierIds.length === 0) return map;

    const { data, error } = await getTable("courier_documents")
        .select("*")
        .in("courier_id", courierIds)
        .order("created_at", { ascending: false });

    if (error || !data) return map;

    for (const d of data as DocumentRow[]) {
        if (!map.has(d.courier_id)) map.set(d.courier_id, []);
        map.get(d.courier_id)!.push(mapToEntry(d));
    }

    return map;
}

/** Get a single document by its ID. */
export async function findById(docId: string): Promise<DocumentRow | null> {
    const { data, error } = await getTable("courier_documents")
        .select("*")
        .eq("id", docId)
        .single();

    if (error || !data) return null;
    return data as DocumentRow;
}

/** Insert a document metadata record. */
export async function create(
    courierId: string,
    meta: CreateDocumentMeta,
): Promise<DbResult<{ id: string }>> {
    const { data, error } = await getTable("courier_documents")
        .insert({
            courier_id: courierId,
            name: meta.name,
            type: meta.type,
            mime_type: meta.mime_type || null,
            file_size_bytes: meta.file_size_bytes || null,
            s3_key: meta.s3_key || null,
            url: meta.url || null,
        })
        .select("id")
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as { id: string }, error: null };
}

/** Delete a document metadata record by ID. */
export async function deleteById(docId: string): Promise<DbResult<null>> {
    const { error } = await getTable("courier_documents")
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
        url: d.url || null,
    };
}
