import { useState, useCallback, useEffect } from "react";
import {
  fetchSavedLoads,
  saveLoad,
  unsaveLoadByLead,
  type SavedLoadItem,
} from "@/services/savedLoadsService";

export function useSavedLoads(courierId: string | undefined) {
  const [saved, setSaved] = useState<SavedLoadItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!courierId) {
      setSaved([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchSavedLoads(courierId);
      setSaved(list);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, [courierId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isSaved = useCallback(
    (leadId: string) => saved.some((s) => s.lead_id === leadId),
    [saved]
  );

  const save = useCallback(
    async (leadId: string) => {
      if (!courierId) return;
      try {
        const item = await saveLoad(courierId, leadId);
        setSaved((prev) => {
          if (prev.some((s) => s.lead_id === leadId)) return prev;
          return [item, ...prev];
        });
      } catch (e) {
        throw e;
      }
    },
    [courierId]
  );

  const unsave = useCallback(
    async (leadId: string) => {
      if (!courierId) return;
      try {
        await unsaveLoadByLead(courierId, leadId);
        setSaved((prev) => prev.filter((s) => s.lead_id !== leadId));
      } catch (e) {
        throw e;
      }
    },
    [courierId]
  );

  const toggleSave = useCallback(
    async (leadId: string) => {
      if (isSaved(leadId)) await unsave(leadId);
      else await save(leadId);
    },
    [isSaved, save, unsave]
  );

  return {
    savedLoads: saved,
    loading,
    isSaved,
    save,
    unsave,
    toggleSave,
    refetch,
  };
}
