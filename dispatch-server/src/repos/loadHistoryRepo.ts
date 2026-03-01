import { getTable } from "./baseRepo";

export interface LoadHistoryRow {
    id: string;
    lead_id: string;
    action: string;
    created_at: string;
}

export async function findByLeadId(leadId: string): Promise<LoadHistoryRow[]> {
    const { data, error } = await getTable("lead_history")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as LoadHistoryRow[];
}

export async function findByLeadIds(leadIds: string[]): Promise<Map<string, LoadHistoryRow[]>> {
    if (!leadIds || leadIds.length === 0) return new Map();

    const { data, error } = await getTable("lead_history")
        .select("*")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const result = new Map<string, LoadHistoryRow[]>();
    for (const row of (data || [])) {
        const id = row.lead_id;
        if (!result.has(id)) result.set(id, []);
        result.get(id)!.push(row as LoadHistoryRow);
    }
    return result;
}

export async function logAction(leadId: string, action: string): Promise<LoadHistoryRow> {
    const { data, error } = await getTable("lead_history")
        .insert({ lead_id: leadId, action })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as LoadHistoryRow;
}
