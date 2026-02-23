import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverNotification {
  id: string;
  matching_request_id: string;
  courier_id: string;
  lead_id: string;
  status: string;
  distance_meters: number | null;
  offer_amount: number;
  expires_at: string;
  created_at: string;
  lead?: {
    id: string;
    pickup_address: string;
    delivery_address: string;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_year: string | null;
  };
}

export function useDriverNotifications(courierId: string | null) {
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!courierId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_notifications')
        .select(`
          *,
          lead:leads(id, pickup_address, delivery_address, vehicle_make, vehicle_model, vehicle_year)
        `)
        .eq('courier_id', courierId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [courierId]);

  // Real-time subscription
  useEffect(() => {
    if (!courierId) return;

    fetchNotifications();

    const channel = supabase
      .channel(`driver-notifications-${courierId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_notifications',
          filter: `courier_id=eq.${courierId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courierId, fetchNotifications]);

  const respondToNotification = useCallback(async (
    notificationId: string,
    response: 'accepted' | 'declined'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('find-closest-driver', {
        body: {
          action: 'driver_response',
          matching_request_id: notificationId,
          response,
        },
      });

      if (error) throw error;
      
      await fetchNotifications();
      return data;
    } catch (err) {
      console.error('Response error:', err);
      throw err;
    }
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    respondToNotification,
    refetch: fetchNotifications,
  };
}
