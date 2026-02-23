import { createClient } from "@supabase/supabase-js";
import { config } from "./index";

// Public client — respects RLS, used for user-scoped operations
export const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Admin client — bypasses RLS, used for server-side operations
export const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);
