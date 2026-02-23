import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

function parseTimestampToMs(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Common variants we might see from realtime/PostgREST:
  // - 2026-01-22T21:06:54.995Z
  // - 2026-01-22T21:06:54.995+00
  // - 2026-01-22 21:06:54.995+00
  // - 2026-01-22T21:06:54+0000
  let normalized = trimmed.replace(' ', 'T');
  normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'); // +0000 -> +00:00
  normalized = normalized.replace(/([+-]\d{2})$/, '$1:00'); // +00 -> +00:00

  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms)) {
    const ms2 = Date.parse(trimmed);
    return Number.isFinite(ms2) ? ms2 : null;
  }
  return ms;
}

interface MatchingStatus {
  status: 'idle' | 'searching' | 'pending_response' | 'negotiating' | 'completed' | 'failed' | 'cancelled';
  matchingRequestId: string | null;
  notificationId: string | null;
  currentCourier: {
    id: string;
    name: string;
    distance: number;
  } | null;
  expiresAt: string | null;
  driversRemaining: number;
  error: string | null;
}

export function useAutoMatching(leadId: string | null) {
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus>({
    status: 'idle',
    matchingRequestId: null,
    notificationId: null,
    currentCourier: null,
    expiresAt: null,
    driversRemaining: 0,
    error: null,
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timeoutTriggeredRef = useRef(false);

  const checkTimeout = useCallback(async () => {
    if (!matchingStatus.matchingRequestId) return;

    try {
      const { data, error } = await supabase.functions.invoke('find-closest-driver', {
        body: {
          action: 'check_timeout',
          matching_request_id: matchingStatus.matchingRequestId,
        },
      });

      if (error) throw error;

      console.log('Check timeout response:', data);

      if (data.success && data.courier) {
        // New driver found - reset the timeout ref so timer can work again
        timeoutTriggeredRef.current = false;

        setMatchingStatus((prev) => ({
          ...prev,
          status: 'pending_response',
          notificationId: data.notification_id,
          currentCourier: data.courier,
          expiresAt: data.expires_at,
          driversRemaining: data.drivers_remaining,
        }));
      } else if (data.status === 'failed') {
        setMatchingStatus((prev) => ({
          ...prev,
          status: 'failed',
          error: data.message || 'No more drivers available',
        }));
      } else if (data.status === 'negotiating') {
        setMatchingStatus((prev) => ({
          ...prev,
          status: 'negotiating',
        }));
      }
      // If just pending_response with no new courier, don't change anything
    } catch (err) {
      console.error('Check timeout error:', err);
    }
  }, [matchingStatus.matchingRequestId]);

  // Real-time subscription for matching request and notification updates
  useEffect(() => {
    if (!matchingStatus.matchingRequestId) return;

    console.log('Setting up realtime for matching request:', matchingStatus.matchingRequestId);

    const channel = supabase
      .channel(`matching-${matchingStatus.matchingRequestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matching_requests',
          filter: `id=eq.${matchingStatus.matchingRequestId}`,
        },
        (payload) => {
          console.log('Matching request update:', payload);
          const newData = payload.new as any;
          if (newData) {
            setMatchingStatus(prev => ({
              ...prev,
              status: newData.status,
              // Don't clobber a valid expiry with null/undefined.
              expiresAt: newData.response_deadline ?? prev.expiresAt,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_notifications',
          filter: `matching_request_id=eq.${matchingStatus.matchingRequestId}`,
        },
        async (payload) => {
          console.log('New notification:', payload);
          const notification = payload.new as any;
          
          // Fetch courier details
          const { data: courier } = await supabase
            .from('couriers')
            .select('id, name')
            .eq('id', notification.courier_id)
            .single();

          if (courier) {
            setMatchingStatus(prev => ({
              ...prev,
              notificationId: notification.id,
              currentCourier: {
                id: courier.id,
                name: courier.name,
                distance: Math.round(notification.distance_meters || 0),
              },
              expiresAt: notification.expires_at,
              status: 'pending_response',
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_notifications',
          filter: `matching_request_id=eq.${matchingStatus.matchingRequestId}`,
        },
        (payload) => {
          console.log('Notification updated:', payload);
          const newData = payload.new as any;
          if (newData.status === 'accepted') {
            // Important: don't treat a notification UPDATE as truth for workflow state.
            // Only the backend (matching_requests.status) should drive the shipper's state.
            // This prevents "phantom accepts" caused by direct table updates.
            console.log('Notification marked accepted; verifying matching request state...');
            void checkTimeout();
          } else if (newData.status === 'declined' || newData.status === 'expired') {
            // Will trigger finding next driver
            console.log('Driver declined/expired, waiting for next...');
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchingStatus.matchingRequestId, checkTimeout]);

  // Timer countdown
  useEffect(() => {
    if (!matchingStatus.expiresAt || matchingStatus.status !== 'pending_response') {
      setTimeLeft(null);
      return;
    }

    timeoutTriggeredRef.current = false;

    const computeSecondsLeft = () => {
      const expiresMs = parseTimestampToMs(matchingStatus.expiresAt!);
      if (expiresMs === null) return null;
      const remainingMs = Math.max(0, expiresMs - Date.now());
      return Math.floor(remainingMs / 1000);
    };

    const tick = async () => {
      const seconds = computeSecondsLeft();
      if (seconds === null) {
        // If we can't parse the timestamp, fall back to server check.
        if (!timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          await checkTimeout();
        }
        setTimeLeft(null);
        return;
      }

      setTimeLeft(seconds);

      if (seconds <= 0 && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        await checkTimeout();
      }
    };

    // Run immediately so UI doesn't sit at 0 for a full second.
    void tick();

    const interval = setInterval(() => {
      void tick();
    }, 1000);

    // Guard against background-tab timer throttling by also polling server.
    const serverInterval = setInterval(() => {
      void checkTimeout();
    }, 10_000);

    return () => {
      clearInterval(interval);
      clearInterval(serverInterval);
    };
  }, [matchingStatus.expiresAt, matchingStatus.status, checkTimeout]);

  const startMatching = useCallback(async (
    initialOffer: number,
    pickupLatitude: number,
    pickupLongitude: number
  ) => {
    if (!leadId) return;

    setMatchingStatus(prev => ({
      ...prev,
      status: 'searching',
      error: null,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('find-closest-driver', {
        body: {
          action: 'start',
          lead_id: leadId,
          initial_offer: initialOffer,
          pickup_latitude: pickupLatitude,
          pickup_longitude: pickupLongitude,
        },
      });

      if (error) throw error;

      console.log('Start matching result:', data);

      if (data.success) {
        // Get the matching request ID from the notification
        const { data: notification } = await (supabase as any)
          .from('driver_notifications')
          .select('matching_request_id')
          .eq('id', data.notification_id)
          .single();

        setMatchingStatus({
          status: 'pending_response',
          matchingRequestId: notification?.matching_request_id || null,
          notificationId: data.notification_id,
          currentCourier: data.courier,
          expiresAt: data.expires_at,
          driversRemaining: data.drivers_remaining,
          error: null,
        });
      } else {
        setMatchingStatus(prev => ({
          ...prev,
          status: 'failed',
          error: data.message || 'No drivers available',
        }));
      }
    } catch (err) {
      console.error('Start matching error:', err);
      setMatchingStatus(prev => ({
        ...prev,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Failed to start matching',
      }));
    }
  }, [leadId]);

  const cancelMatching = useCallback(async () => {
    if (!matchingStatus.matchingRequestId) return;

    try {
      await supabase.functions.invoke('find-closest-driver', {
        body: {
          action: 'cancel',
          matching_request_id: matchingStatus.matchingRequestId,
        },
      });

      setMatchingStatus({
        status: 'cancelled',
        matchingRequestId: null,
        notificationId: null,
        currentCourier: null,
        expiresAt: null,
        driversRemaining: 0,
        error: null,
      });
    } catch (err) {
      console.error('Cancel matching error:', err);
    }
  }, [matchingStatus.matchingRequestId]);

  return {
    matchingStatus,
    timeLeft,
    startMatching,
    cancelMatching,
    checkTimeout,
  };
}
