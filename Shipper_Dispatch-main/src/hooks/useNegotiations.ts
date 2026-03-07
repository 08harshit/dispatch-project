import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { apiGet } from '@/services/api';
import { createContract } from '@/services/contractService';

export type Negotiation = Tables<'negotiations'>;
export type Offer = Tables<'offers'>;
export type NegotiationStatus = Enums<'negotiation_status'>;

interface NegotiationWithDetails extends Negotiation {
  courier?: Tables<'couriers'>;
  offers?: Offer[];
}

export function useNegotiations(leadId: string | null) {
  const [negotiations, setNegotiations] = useState<NegotiationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNegotiations = useCallback(async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('negotiations')
        .select(`
          *,
          courier:couriers(*),
          offers(*)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNegotiations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch negotiations');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  // Real-time subscription
  useEffect(() => {
    if (!leadId) return;

    fetchNegotiations();

    const channel = supabase
      .channel(`negotiations-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'negotiations',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          console.log('Negotiation change:', payload);
          fetchNegotiations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
        },
        (payload) => {
          console.log('Offer change:', payload);
          fetchNegotiations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, fetchNegotiations]);

  const startNegotiation = async (courierId: string, initialOffer: number) => {
    if (!leadId) return null;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 min
    const courierDeadline = new Date(now.getTime() + 10 * 60 * 1000); // 10 min

    try {
      // Create negotiation
      const { data: negotiation, error: negError } = await supabase
        .from('negotiations')
        .insert({
          lead_id: leadId,
          courier_id: courierId,
          status: 'negotiating' as NegotiationStatus,
          current_offer: initialOffer,
          counter_count: 0,
          negotiation_started_at: now.toISOString(),
          negotiation_expires_at: expiresAt.toISOString(),
          courier_response_deadline: courierDeadline.toISOString(),
        })
        .select()
        .single();

      if (negError) throw negError;

      // Create initial offer
      const { error: offerError } = await supabase.from('offers').insert({
        negotiation_id: negotiation.id,
        offered_by: 'shipper',
        amount: initialOffer,
        response: 'pending',
      });

      if (offerError) throw offerError;

      // Lock the lead
      await supabase
        .from('leads')
        .update({ is_locked: true, locked_by_courier_id: courierId })
        .eq('id', leadId);

      return negotiation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start negotiation');
      return null;
    }
  };

  const respondToOffer = async (
    negotiationId: string,
    response: 'accepted' | 'declined' | 'countered',
    counterAmount?: number
  ) => {
    try {
      const negotiation = negotiations.find((n) => n.id === negotiationId);
      if (!negotiation) throw new Error('Negotiation not found');

      // Use the negotiate edge function for consistent behavior
      const action = response === 'accepted' ? 'accept' : response === 'declined' ? 'decline' : 'counter';
      
      const { data, error: invokeError } = await supabase.functions.invoke('negotiate', {
        body: {
          action,
          negotiation_id: negotiationId,
          actor: 'shipper',
          counter_amount: counterAmount,
        },
      });

      if (invokeError) {
        console.error('Negotiate invoke error:', invokeError);
        throw new Error(invokeError.message || 'Failed to process response');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (response === 'accepted') {
        try {
          const meRes = await apiGet<{ data: { shipper_id?: string } }>('/me');
          const shipperId = meRes.data?.shipper_id;
          if (shipperId) {
            const leadRes = await apiGet<{ data: { pickup_address?: string; delivery_address?: string } }>(`/loads/${negotiation.lead_id}`);
            const lead = leadRes.data;
            const now = new Date();
            const pickupTime = now.toISOString();
            const expectedReach = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            await createContract({
              lead_id: negotiation.lead_id,
              courier_id: negotiation.courier_id,
              shipper_id: shipperId,
              amount: negotiation.current_offer ?? 0,
              pickup_time: pickupTime,
              expected_reach_time: expectedReach,
              start_location: lead?.pickup_address ?? 'Pickup',
              end_location: lead?.delivery_address ?? 'Delivery',
            });
          }
        } catch (contractErr) {
          console.warn('Contract sync to dispatch-server failed:', contractErr);
        }
      }

      console.log('Negotiate response:', data);
      await fetchNegotiations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to offer');
      throw err;
    }
  };

  return {
    negotiations,
    loading,
    error,
    startNegotiation,
    respondToOffer,
    refetch: fetchNegotiations,
  };
}
