import { supabaseAdmin } from "../config/supabase";

/**
 * Sets is_active = false for all vehicle_access rows where exp_dt < now().
 * Call periodically (e.g. every 5-10 min) or from cron endpoint.
 */
export async function expireVehicleAccess(): Promise<{ expired: number; error?: string }> {
    try {
        const now = new Date().toISOString();
        const { data: rows, error } = await supabaseAdmin
            .from("vehicle_access")
            .select("id")
            .eq("is_active", true)
            .lt("exp_dt", now);

        if (error) {
            return { expired: 0, error: error.message };
        }

        const ids = (rows || []).map((r: { id: string }) => r.id);
        if (ids.length === 0) {
            return { expired: 0 };
        }

        const { error: updateError } = await supabaseAdmin
            .from("vehicle_access")
            .update({ is_active: false })
            .in("id", ids);

        if (updateError) {
            return { expired: 0, error: updateError.message };
        }
        return { expired: ids.length };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return { expired: 0, error: message };
    }
}
