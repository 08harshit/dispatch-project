import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

export interface AccountingRecordHistory {
  id: string;
  type: string;
  timestamp: string;
  performedBy: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface AccountingRecord {
  id: string;
  listingId: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  cost: number;
  date: string;
  paymentMethod: "cod" | "ach" | "wire" | "check";
  payoutStatus: "paid" | "pending" | "processing";
  hasDocs: boolean;
  history?: AccountingRecordHistory[];
}

export interface ListRecordsParams {
  payoutStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listRecords(params?: ListRecordsParams): Promise<AccountingRecord[]> {
  const search = new URLSearchParams();
  if (params?.payoutStatus) search.set("payoutStatus", params.payoutStatus);
  if (params?.paymentMethod) search.set("paymentMethod", params.paymentMethod);
  if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo) search.set("dateTo", params.dateTo);
  const qs = search.toString();
  const path = `/accounting/shipper/records${qs ? `?${qs}` : ""}`;
  const res = await apiGet<AccountingRecord[]>(path);
  return res.data ?? [];
}

export async function createRecord(
  record: Omit<AccountingRecord, "id">,
  performedBy: string
): Promise<AccountingRecord> {
  const res = await apiPost<AccountingRecord>("/accounting/shipper/records", {
    ...record,
    performedBy,
  });
  if (!res.data) throw new Error(res.error ?? "Failed to create record");
  return res.data;
}

export async function updateRecord(
  id: string,
  updates: Partial<AccountingRecord>,
  performedBy: string
): Promise<void> {
  const payload: Record<string, unknown> = { performedBy };
  if (updates.listingId !== undefined) payload.listingId = updates.listingId;
  if (updates.vehicleYear !== undefined) payload.vehicleYear = updates.vehicleYear;
  if (updates.vehicleMake !== undefined) payload.vehicleMake = updates.vehicleMake;
  if (updates.vehicleModel !== undefined) payload.vehicleModel = updates.vehicleModel;
  if (updates.vin !== undefined) payload.vin = updates.vin;
  if (updates.stockNumber !== undefined) payload.stockNumber = updates.stockNumber;
  if (updates.cost !== undefined) payload.cost = updates.cost;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.paymentMethod !== undefined) payload.paymentMethod = updates.paymentMethod;
  if (updates.payoutStatus !== undefined) payload.payoutStatus = updates.payoutStatus;
  if (updates.hasDocs !== undefined) payload.hasDocs = updates.hasDocs;

  await apiPatch(`/accounting/shipper/records/${id}`, payload);
}

export async function deleteRecord(id: string): Promise<void> {
  await apiDelete(`/accounting/shipper/records/${id}`);
}

export async function getRecordHistory(id: string): Promise<AccountingRecordHistory[]> {
  const res = await apiGet<AccountingRecordHistory[]>(`/accounting/shipper/records/${id}/history`);
  return res.data ?? [];
}
