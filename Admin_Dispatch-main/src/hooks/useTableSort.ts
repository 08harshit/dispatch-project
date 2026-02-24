import { useState, useCallback } from "react";

/**
 * useTableSort — manages sort field + direction with toggle logic.
 *
 * Replaces the repetitive pattern of:
 *   const [sortField, setSortField] = useState<SortField>("id");
 *   const [sortDir, setSortDir] = useState<SortDir>("asc");
 *   const toggleSort = (field: SortField) => {
 *     if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
 *     else { setSortField(field); setSortDir("asc"); }
 *   };
 *
 * With:
 *   const { sortField, sortDir, toggleSort } = useTableSort<SortField>("id");
 */
export function useTableSort<T extends string>(
    defaultField: T,
    defaultDir: "asc" | "desc" = "asc"
) {
    const [sortField, setSortField] = useState<T>(defaultField);
    const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultDir);

    const toggleSort = useCallback(
        (field: T) => {
            if (sortField === field) {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            } else {
                setSortField(field);
                setSortDir("asc");
            }
        },
        [sortField]
    );

    return { sortField, sortDir, toggleSort };
}
