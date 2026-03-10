import * as loadRepo from "../repos/loadRepo";
import * as historyRepo from "../repos/loadHistoryRepo";
import * as documentRepo from "../repos/loadDocumentRepo";
import { supabaseAdmin } from "../config/supabase";

export interface LoadListItem {
    id: string;
    vehicleYear: string;
    vehicleMake: string;
    vehicleModel: string;
    vin: string;
    stockNumber: string;
    shipperInfo: string;
    pickupDate: string;
    dropOffDate: string;
    status: "pending" | "in-transit" | "delivered" | "cancelled" | "open";
    courierInfo: string;
    docs: documentRepo.LoadDocumentRow[];
    history: historyRepo.LoadHistoryRow[];
    pickup_address: string;
    delivery_address: string;
    notes?: string;
    vehicle_type?: string;
    vehicle_color?: string;
    initial_price?: number;
    payment_type?: string;
}

export interface PaginatedListResult {
    data: LoadListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface LoadStats {
    total: number;
    inTransit: number;
    delivered: number;
    pending: number;
    cancelled: number;
    alerts: number;
}

async function fetchShipperNames(ids: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (ids.length === 0) return map;
    const { data } = await supabaseAdmin.from("shippers").select("id, name").in("id", ids);
    for (const s of data || []) map.set(s.id, (s as any).name || "");
    return map;
}

async function fetchCourierNames(ids: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (ids.length === 0) return map;
    const { data } = await supabaseAdmin.from("couriers").select("id, name").in("id", ids);
    for (const c of data || []) map.set(c.id, (c as any).name || "");
    return map;
}

function mapLeadToLoad(
    lead: loadRepo.LeadRow,
    shippersMap: Map<string, string>,
    couriersMap: Map<string, string>,
    history: historyRepo.LoadHistoryRow[] = [],
    docs: documentRepo.LoadDocumentRow[] = []
): LoadListItem {
    const created = lead.created_at ? lead.created_at.split("T")[0] : "";
    let status: LoadListItem["status"] = "pending";
    if (lead.status === "cancelled") status = "cancelled";
    else if (lead.status === "completed") status = "delivered";
    else if (lead.is_locked) status = "in-transit";

    const shipperName = lead.shipper_id ? shippersMap.get(lead.shipper_id) || lead.pickup_address : lead.pickup_address;
    const courierName = lead.locked_by_courier_id ? couriersMap.get(lead.locked_by_courier_id) || "" : "";

    return {
        id: lead.id,
        vehicleYear: lead.vehicle_year || "",
        vehicleMake: lead.vehicle_make || "",
        vehicleModel: lead.vehicle_model || "",
        vin: lead.vehicle_vin || "",
        stockNumber: lead.listing_id || "",
        shipperInfo: shipperName || "",
        pickupDate: created,
        dropOffDate: lead.updated_at ? lead.updated_at.split("T")[0] : created,
        status,
        courierInfo: courierName,
        docs,
        history: history.length > 0 ? history : [{ id: "fallback", lead_id: lead.id, action: "Load created", created_at: lead.created_at }],
        pickup_address: lead.pickup_address,
        delivery_address: lead.delivery_address,
        notes: lead.notes,
        vehicle_type: lead.vehicle_type,
        vehicle_color: lead.vehicle_color,
        initial_price: lead.initial_price,
        payment_type: lead.payment_type,
    };
}

export async function listLoads(
    filters: loadRepo.LoadFilters = {},
    page?: number,
    limit?: number
): Promise<PaginatedListResult> {
    const { rows: leads, pagination } = await loadRepo.findAll(filters, page, limit);
    if (leads.length === 0) return { data: [], pagination };

    const leadIds = leads.map((l: loadRepo.LeadRow) => l.id);
    const shipperIds = [...new Set(leads.map((l: loadRepo.LeadRow) => l.shipper_id).filter(Boolean))] as string[];
    const courierIds = [...new Set(leads.map((l: loadRepo.LeadRow) => l.locked_by_courier_id).filter(Boolean))] as string[];

    const [historyMap, docsMap, shippersMap, couriersMap] = await Promise.all([
        historyRepo.findByLeadIds(leadIds),
        documentRepo.findByLeadIds(leadIds),
        fetchShipperNames(shipperIds),
        fetchCourierNames(courierIds)
    ]);

    const result = leads.map((l: loadRepo.LeadRow) => mapLeadToLoad(l, shippersMap, couriersMap, historyMap.get(l.id), docsMap.get(l.id)));
    return { data: result, pagination };
}

export async function getLoadStats(filters?: loadRepo.LoadFilters): Promise<LoadStats> {
    return loadRepo.getStats(filters ?? {});
}

export async function getLoadById(id: string): Promise<LoadListItem | null> {
    const lead = await loadRepo.findById(id);
    if (!lead) return null;

    const [history, docs, shippersMap, couriersMap] = await Promise.all([
        historyRepo.findByLeadId(id),
        documentRepo.findByLeadId(id),
        fetchShipperNames(lead.shipper_id ? [lead.shipper_id] : []),
        fetchCourierNames(lead.locked_by_courier_id ? [lead.locked_by_courier_id] : [])
    ]);

    return mapLeadToLoad(lead, shippersMap, couriersMap, history, docs);
}

export async function createLoad(payload: loadRepo.CreateLeadPayload): Promise<LoadListItem> {
    const lead = await loadRepo.create(payload);
    await historyRepo.logAction(lead.id, "Load created");
    return getLoadById(lead.id) as Promise<LoadListItem>;
}

export async function updateLoad(id: string, payload: loadRepo.UpdateLeadPayload): Promise<LoadListItem> {
    const lead = await loadRepo.update(id, payload);
    await historyRepo.logAction(lead.id, "Load details updated");
    return getLoadById(lead.id) as Promise<LoadListItem>;
}

export async function updateLoadStatus(id: string, status: string): Promise<LoadListItem> {
    const lead = await loadRepo.update(id, { status });
    await historyRepo.logAction(lead.id, `Status changed to ${status}`);
    return getLoadById(lead.id) as Promise<LoadListItem>;
}

export async function deleteLoad(id: string): Promise<LoadListItem> {
    await loadRepo.update(id, { status: "cancelled" });
    await historyRepo.logAction(id, "Load cancelled");
    const load = await getLoadById(id);
    if (!load) throw new Error("Failed to fetch load after cancel");
    return load;
}

export async function getLoadHistory(id: string) {
    return historyRepo.findByLeadId(id);
}

export async function getLoadDocuments(id: string) {
    return documentRepo.findByLeadId(id);
}

export async function addLoadDocumentMeta(id: string, name: string, type: string) {
    const doc = await documentRepo.addDocument({
        lead_id: id,
        name,
        type,
        file_url: null
    });
    await historyRepo.logAction(id, `Added document: ${name}`);
    return doc;
}

export async function removeLoadDocument(id: string, docId: string) {
    await documentRepo.deleteDocument(docId, id);
    await historyRepo.logAction(id, `Deleted document`);
}
