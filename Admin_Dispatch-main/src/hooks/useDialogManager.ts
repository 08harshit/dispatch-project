import { useState, useCallback } from "react";

/**
 * useDialogManager — manages multiple named dialogs + a single selected entity.
 *
 * Replaces the repetitive pattern of:
 *   const [viewDialogOpen, setViewDialogOpen] = useState(false);
 *   const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
 *   const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
 *   const handleView = (e: T) => { setSelectedEntity(e); setViewDialogOpen(true); };
 *
 * With:
 *   const { selected, isOpen, open, close, setOpen } = useDialogManager<T>();
 *   <button onClick={() => open("view", entity)} />
 *   <Dialog open={isOpen("view")} onOpenChange={(v) => setOpen("view", v)} />
 */
export function useDialogManager<T>() {
    const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
    const [selected, setSelected] = useState<T | null>(null);

    /** Check if a named dialog is open */
    const isOpen = useCallback(
        (name: string) => !!openDialogs[name],
        [openDialogs]
    );

    /** Open a named dialog, optionally setting the selected entity */
    const open = useCallback((name: string, entity?: T) => {
        if (entity !== undefined) setSelected(entity);
        setOpenDialogs((prev) => ({ ...prev, [name]: true }));
    }, []);

    /** Close a named dialog */
    const close = useCallback((name: string) => {
        setOpenDialogs((prev) => ({ ...prev, [name]: false }));
    }, []);

    /** Toggle-compatible setter for Dialog onOpenChange */
    const setOpen = useCallback((name: string, value: boolean) => {
        setOpenDialogs((prev) => ({ ...prev, [name]: value }));
    }, []);

    return { selected, setSelected, isOpen, open, close, setOpen };
}
