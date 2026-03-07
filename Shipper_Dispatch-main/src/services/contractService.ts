import { apiPost } from "./api";

export interface CreateContractPayload {
  lead_id: string;
  courier_id: string;
  shipper_id: string;
  amount: number;
  pickup_time: string;
  expected_reach_time: string;
  start_location: string;
  end_location: string;
  vehicle_id?: string;
}

export async function createContract(payload: CreateContractPayload): Promise<unknown> {
  const res = await apiPost<unknown>("/contracts", payload);
  return res.data;
}
