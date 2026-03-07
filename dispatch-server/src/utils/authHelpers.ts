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
