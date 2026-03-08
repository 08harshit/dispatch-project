/**
 * Returns true if the error indicates a missing table/schema (migrations not applied).
 * When true, routes can return 200 with empty data so the UI does not break.
 */
export function isMissingTableError(error: { message?: string } | null): boolean {
    if (!error?.message) return false;
    const msg = error.message.toLowerCase();
    return (
        msg.includes("schema cache") ||
        msg.includes("could not find the table") ||
        (msg.includes("relation ") && msg.includes("does not exist"))
    );
}

/**
 * Returns true if the error is a unique constraint violation (Postgres 23505).
 */
export function isUniqueViolationError(error: { code?: string; message?: string } | null): boolean {
    return error?.code === "23505";
}
