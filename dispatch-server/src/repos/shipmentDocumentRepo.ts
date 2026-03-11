import { supabaseAdmin } from "../config/supabase";

export interface ShipmentDocumentRow {
    id: string;
    lead_id: string;
    courier_id: string | null;
    document_type: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
    mime_type: string | null;
    notes: string | null;
    uploaded_by: string;
    created_at: string;
    updated_at: string;
}

export async function findByLeadId(leadId: string): Promise<(ShipmentDocumentRow & { courier_name?: string })[]> {
    const { data, error } = await supabaseAdmin
        .from("shipment_documents")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    const rows = data || [];
    const courierIds = [...new Set(rows.map((r: any) => r.courier_id).filter(Boolean))];
    let courierNames: Record<string, string> = {};
    if (courierIds.length > 0) {
        const { data: couriers } = await supabaseAdmin.from("couriers").select("id, name").in("id", courierIds);
        courierNames = Object.fromEntries((couriers || []).map((c: any) => [c.id, c.name || ""]));
    }
    return rows.map((r: any) => ({
        ...r,
        courier_name: r.courier_id ? courierNames[r.courier_id] : undefined,
    }));
}

export async function create(payload: {
    lead_id: string;
    courier_id?: string | null;
    document_type: string;
    file_name: string;
    file_url: string;
    file_size?: number | null;
    mime_type?: string | null;
    notes?: string | null;
    uploaded_by?: string;
}): Promise<ShipmentDocumentRow> {
    const { data, error } = await supabaseAdmin
        .from("shipment_documents")
        .insert({
            lead_id: payload.lead_id,
            courier_id: payload.courier_id ?? null,
            document_type: payload.document_type,
            file_name: payload.file_name,
            file_url: payload.file_url,
            file_size: payload.file_size ?? null,
            mime_type: payload.mime_type ?? null,
            notes: payload.notes ?? null,
            uploaded_by: payload.uploaded_by ?? "shipper",
        })
        .select()
        .single();

    if (error) throw error;
    return data as ShipmentDocumentRow;
}

export async function deleteById(docId: string): Promise<void> {
    const { error } = await supabaseAdmin.from("shipment_documents").delete().eq("id", docId);
    if (error) throw error;
}

export async function findById(docId: string): Promise<ShipmentDocumentRow | null> {
    const { data, error } = await supabaseAdmin
        .from("shipment_documents")
        .select("*")
        .eq("id", docId)
        .single();

    if (error || !data) return null;
    return data as ShipmentDocumentRow;
}
