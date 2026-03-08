import { getTable } from "./baseRepo";

export interface LoadDocumentRow {
    id: string;
    lead_id: string;
    name: string;
    type: string | null;
    file_url: string | null;
    created_at: string;
}

export type CreateLoadDocumentPayload = Omit<LoadDocumentRow, "id" | "created_at">;

export async function findByLeadId(leadId: string): Promise<LoadDocumentRow[]> {
    const { data, error } = await getTable("lead_documents")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as LoadDocumentRow[];
}

export async function findByLeadIds(leadIds: string[]): Promise<Map<string, LoadDocumentRow[]>> {
    if (!leadIds || leadIds.length === 0) return new Map();

    const { data, error } = await getTable("lead_documents")
        .select("*")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const result = new Map<string, LoadDocumentRow[]>();
    for (const row of (data || [])) {
        const id = row.lead_id;
        if (!result.has(id)) result.set(id, []);
        result.get(id)!.push(row as LoadDocumentRow);
    }
    return result;
}

export async function addDocument(payload: CreateLoadDocumentPayload): Promise<LoadDocumentRow> {
    const { data, error } = await getTable("lead_documents")
        .insert(payload)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as LoadDocumentRow;
}

export async function deleteDocument(docId: string, leadId: string): Promise<void> {
    const { error } = await getTable("lead_documents")
        .delete()
        .eq("id", docId)
        .eq("lead_id", leadId);

    if (error) throw new Error(error.message);
}
