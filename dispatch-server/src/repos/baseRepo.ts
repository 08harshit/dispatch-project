/**
 * Base Repository Helpers
 *
 * Provides typed wrappers around the Supabase client so that every
 * repository returns a consistent `DbResult<T>` shape and individual
 * repos never import `supabaseAdmin` directly.
 */

import { supabaseAdmin } from "../config/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DbResult<T> =
    | { data: T; error: null }
    | { data: null; error: string };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Shorthand – returns the query builder for a table. */
export function getTable(table: string) {
    return supabaseAdmin.from(table);
}

/**
 * Wrap a Supabase query result into a `DbResult`.
 * If both `data` and `error` are `null` the result is treated as "not found".
 */
export function toResult<T>(
    data: T | null,
    error: { message: string } | null,
): DbResult<T> {
    if (error) return { data: null, error: error.message };
    if (data === null) return { data: null, error: "Not found" };
    return { data, error: null };
}
