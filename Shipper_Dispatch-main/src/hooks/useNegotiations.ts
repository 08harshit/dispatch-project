import { useState, useEffect, useCallback } from "react";
import { apiGet } from "@/services/api";
import { createContract } from "@/services/contractService";
import * as matchingService from "@/services/matchingService";

export type Negotiation = matchingService.Negotiation;
export type Offer = NonNullable<Negotiation["offers"]>[number];

interface NegotiationWithDetails extends Negotiation {
  courier?: { id: string; name: string; [key: string]: unknown } | { id: string; name: string; [key: string]: unknown }[];
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
      const data = await matchingService.listNegotiations(leadId);
      setNegotiations((data || []) as NegotiationWithDetails[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch negotiations");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;
    fetchNegotiations();
  }, [leadId, fetchNegotiations]);

  const startNegotiation = async (courierId: string, initialOffer: number) => {
    if (!leadId) return null;

    try {
      const negotiation = await matchingService.startNegotiation(leadId, courierId, initialOffer);
      await fetchNegotiations();
      return negotiation;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start negotiation");
      return null;
    }
  };

  const respondToOffer = async (
    negotiationId: string,
    response: "accepted" | "declined" | "countered",
    counterAmount?: number
  ) => {
    try {
      const negotiation = negotiations.find((n) => n.id === negotiationId);
      if (!negotiation) throw new Error("Negotiation not found");

      const action = response === "accepted" ? "accept" : response === "declined" ? "decline" : "counter";
      await matchingService.negotiate(negotiationId, action, counterAmount);

      if (response === "accepted") {
        try {
          const meRes = await apiGet<{ data: { shipper_id?: string } }>("/me");
          const shipperId = meRes.data?.shipper_id;
          if (shipperId) {
            const leadRes = await apiGet<{
              data: { pickup_address?: string; delivery_address?: string };
            }>(`/loads/${negotiation.lead_id}`);
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
              start_location: lead?.pickup_address ?? "Pickup",
              end_location: lead?.delivery_address ?? "Delivery",
            });
          }
        } catch (contractErr) {
          console.warn("Contract sync to dispatch-server failed:", contractErr);
        }
      }

      await fetchNegotiations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond to offer");
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
