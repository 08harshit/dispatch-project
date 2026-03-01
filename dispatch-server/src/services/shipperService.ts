import { supabaseAdmin } from "../config/supabase";

export interface ShipperRow {
    id: string;
    name: string;
    contact_email?: string;
    phone?: string;
    compliance?: string;
    address?: string;
    business_type?: string;
    city?: string;
    state?: string;
    tax_exempt?: boolean;
    ein?: string;
    hours_pickup?: string;
    hours_dropoff?: string;
    principal_name?: string;
    status?: string;
    is_new?: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export async function updateShipperStatus(
    id: string,
    status: "active" | "inactive"
): Promise<{ success: true; data: ShipperRow } | { success: false; error: string }> {
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from("shippers")
        .select("id, status")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

    if (fetchError || !existing) {
        return { success: false, error: "Shipper not found" };
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from("shippers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true, data: updated as ShipperRow };
}

export async function softDeleteShipper(
    id: string
): Promise<{ success: true } | { success: false; error: string }> {
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from("shippers")
        .select("id")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

    if (fetchError || !existing) {
        return { success: false, error: "Shipper not found" };
    }

    const { error: updateError } = await supabaseAdmin
        .from("shippers")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true };
}

export async function updateShipperCompliance(
    id: string,
    compliance: "compliant" | "non-compliant",
): Promise<{ success: true; data: ShipperRow } | { success: false; error: string }> {
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from("shippers")
        .select("id, compliance")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

    if (fetchError || !existing) {
        return { success: false, error: "Shipper not found" };
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from("shippers")
        .update({ compliance, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true, data: updated as ShipperRow };
}
