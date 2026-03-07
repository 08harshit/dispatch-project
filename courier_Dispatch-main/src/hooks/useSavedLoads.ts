import { useState, useCallback, useEffect } from "react";
import {
  fetchSavedLoads,
  saveLoad,
  unsaveLoadByLead,
  type SavedLoadItem,
} from "@/services/savedLoadsService";

export function useSavedLoads(isAuthenticated: boolean) {
  const [saved, setSaved] = useState<SavedLoadItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setSaved([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchSavedLoads();
      setSaved(list);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isSaved = useCallback(
    (leadId: string) => saved.some((s) => s.lead_id === leadId),
    [saved]
  );

  const save = useCallback(
    async (leadId: string) => {
      if (!isAuthenticated) return;
      try {
        const item = await saveLoad(leadId);
        setSaved((prev) => {
          if (prev.some((s) => s.lead_id === leadId)) return prev;
          return [item, ...prev];
        });
      } catch (e) {
        throw e;
      }
    },
    [isAuthenticated]
  );

  const unsave = useCallback(
    async (leadId: string) => {
      if (!isAuthenticated) return;
      try {
        await unsaveLoadByLead(leadId);
        setSaved((prev) => prev.filter((s) => s.lead_id !== leadId));
      } catch (e) {
        throw e;
      }
    },
    [isAuthenticated]
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
