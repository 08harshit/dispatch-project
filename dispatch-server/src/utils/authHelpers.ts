import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get auth user by email. Tries direct auth.users query first (O(1)), falls back to listUsers (O(n))
 * when auth schema is not exposed in the API.
 */
export async function getUserByEmail(
    supabase: SupabaseClient,
    email: string,
): Promise<{ id: string } | null> {
    const { data, error } = await supabase.schema("auth").from("users").select("id").eq("email", email).maybeSingle();
    if (!error) {
        return data ? (data as { id: string }) : null;
    }
    const { data: userList } = await supabase.auth.admin.listUsers();
    const user = userList?.users?.find((u) => u.email === email);
    return user ? { id: user.id } : null;
}

/**
 * Resolve auth user ID to courier_id (couriers.id).
 * Looks up couriers WHERE auth_user_id = authUserId.
 */
export async function resolveCourierId(
    supabase: SupabaseClient,
    authUserId: string,
): Promise<string | null> {
    const { data, error } = await supabase
        .from("couriers")
        .select("id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();
    if (error || !data) return null;
    return (data as { id: string }).id;
}

/**
 * Resolve auth user ID to shipper_id (shippers.id).
 * Tries auth_user_id column first; falls back to contact_email match if column missing.
 */
export async function resolveShipperId(
    supabase: SupabaseClient,
    authUserId: string,
): Promise<string | null> {
    const { data: byAuth, error: authErr } = await supabase
        .from("shippers")
        .select("id")
        .eq("auth_user_id", authUserId)
        .is("deleted_at", null)
        .maybeSingle();
    if (!authErr && byAuth) return (byAuth as { id: string }).id;
    const { data: user } = await supabase.auth.admin.getUserById(authUserId);
    const email = user?.user?.email;
    if (!email) return null;
    const { data: byEmail } = await supabase
        .from("shippers")
        .select("id")
        .eq("contact_email", email)
        .is("deleted_at", null)
        .maybeSingle();
    return byEmail ? (byEmail as { id: string }).id : null;
}
