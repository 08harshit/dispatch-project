import { apiGet, apiPost } from "./api";

export interface Negotiation {
  id: string;
  lead_id: string;
  courier_id: string;
  status: string;
  current_offer: number | null;
  counter_count: number;
  negotiation_started_at: string;
  negotiation_expires_at: string;
  courier_response_deadline: string;
  couriers?: { id: string; name: string; [key: string]: unknown } | { id: string; name: string; [key: string]: unknown }[];
  offers?: Array<{
    id: string;
    negotiation_id: string;
    offered_by: string;
    amount: number;
    response: string;
    created_at: string;
  }>;
  [key: string]: unknown;
}

export interface FindDriverResult {
  success: boolean;
  notification_id?: string;
  courier?: { id: string; name: string; distance: number };
  expires_at?: string;
  drivers_remaining?: number;
  message?: string;
  status?: string;
}

export interface MatchingHistoryData {
  activity: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  matchingRequests: Array<Record<string, unknown>>;
}

export interface NearbyDriver {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  is_available: boolean;
}

export async function listNegotiations(leadId: string): Promise<Negotiation[]> {
  const res = await apiGet<Negotiation[]>(`/matching/negotiations?lead_id=${leadId}`);
  return res.data ?? [];
}

export async function negotiate(
  negotiationId: string,
  action: "accept" | "decline" | "counter",
  counterAmount?: number
): Promise<unknown> {
  const res = await apiPost<unknown>("/matching/negotiate", {
    action,
    negotiation_id: negotiationId,
    actor: "shipper",
    counter_amount: counterAmount,
  });
  return res.data;
}

export async function startNegotiation(
  leadId: string,
  courierId: string,
  initialOffer: number
): Promise<Negotiation> {
  const res = await apiPost<Negotiation>("/matching/start-negotiation", {
    lead_id: leadId,
    courier_id: courierId,
    initial_offer: initialOffer,
  });
  if (!res.data) throw new Error("Failed to start negotiation");
  return res.data;
}

export async function findDriver(body: {
  action: string;
  lead_id?: string;
  initial_offer?: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
  matching_request_id?: string;
}): Promise<FindDriverResult> {
  const res = await apiPost<FindDriverResult>("/matching/find-driver", body);
  return res.data as FindDriverResult;
}

export async function cancelMatching(matchingRequestId: string): Promise<unknown> {
  const res = await apiPost<unknown>("/matching/cancel", { matching_request_id: matchingRequestId });
  return res.data;
}

export async function getMatchingHistory(leadId: string): Promise<MatchingHistoryData> {
  const res = await apiGet<MatchingHistoryData>(`/matching/history?lead_id=${leadId}`);
  return res.data ?? { activity: [], notifications: [], matchingRequests: [] };
}

export async function getNearbyDrivers(
  lat: number,
  lng: number,
  radiusMeters = 50000
): Promise<NearbyDriver[]> {
  const res = await apiGet<NearbyDriver[]>(
    `/matching/nearby-drivers?lat=${lat}&lng=${lng}&radius=${radiusMeters}`
  );
  return res.data ?? [];
}

export async function verifyCarrier(body: {
  dotNumber?: string;
  dot_number?: string;
  mcNumber?: string;
  mc_number?: string;
  courierId?: string;
}): Promise<unknown> {
  const payload = {
    dotNumber: body.dotNumber ?? body.dot_number,
    mcNumber: body.mcNumber ?? body.mc_number,
    courierId: body.courierId,
  };
  const res = await apiPost<unknown>("/matching/verify-carrier", payload);
  return res.data;
}
