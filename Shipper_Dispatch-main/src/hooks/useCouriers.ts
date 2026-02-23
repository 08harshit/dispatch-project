import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Courier = Tables<'couriers'> & {
  dot_number?: string | null;
  mc_number?: string | null;
  verification_status?: string | null;
  verified_at?: string | null;
  legal_name?: string | null;
  operating_status?: string | null;
};

export function useCouriers(includeAll = false) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCouriers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('couriers')
        .select('*')
        .order('name');

      // Only filter by availability if not including all
      if (!includeAll) {
        query = query
          .eq('is_available', true)
          .gt('available_capacity', 0);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCouriers((data || []) as Courier[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch couriers');
    } finally {
      setLoading(false);
    }
  }, [includeAll]);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  return { couriers, loading, error, refetch: fetchCouriers };
}
