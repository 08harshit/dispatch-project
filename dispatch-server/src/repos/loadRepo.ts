import { getTable } from "./baseRepo";

export interface LoadFilters {
    status?: string;
    shipper_id?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface LeadRow {
    id: string;
    listing_id: string;
    shipper_id: string | null;
    pickup_address: string;
    pickup_location_type?: string;
    pickup_contact_name?: string;
    pickup_contact_phone?: string;
    pickup_contact_email?: string;
    delivery_address: string;
    delivery_location_type?: string;
    delivery_contact_name?: string;
    delivery_contact_phone?: string;
    delivery_contact_email?: string;
    vehicle_year?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_vin?: string;
    vehicle_type?: string;
    vehicle_color?: string;
    vehicle_runs?: boolean;
    vehicle_rolls?: boolean;
    initial_price?: number;
    payment_type?: string;
    notes?: string;
    status: string;
    is_locked?: boolean;
    locked_by_courier_id?: string | null;
    created_at: string;
    updated_at: string;
}

export type CreateLeadPayload = Omit<LeadRow, "id" | "created_at" | "updated_at">;
export type UpdateLeadPayload = Partial<CreateLeadPayload>;

export interface PaginatedLeads {
    rows: LeadRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function applyFilters(query: any, filters: LoadFilters) {
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.shipper_id) query = query.eq("shipper_id", filters.shipper_id);
    if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
    return query;
}

export async function findAll(
    filters: LoadFilters = {},
    page?: number,
    limit?: number
): Promise<PaginatedLeads> {
    let countQuery = getTable("leads").select("id", { count: "exact", head: true });
    countQuery = applyFilters(countQuery, filters);
    const { count, error: countErr } = await countQuery;
    if (countErr) throw new Error(countErr.message);

    const total = count ?? 0;
    const effectivePage = page ?? 1;
    const effectiveLimit = limit ?? (total || 1);
    const offset = (effectivePage - 1) * effectiveLimit;

    let query = getTable("leads")
        .select("*")
        .order("created_at", { ascending: false });

    query = applyFilters(query, filters);
    if (page && limit) {
        query = query.range(offset, offset + effectiveLimit - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return {
        rows: (data || []) as LeadRow[],
        pagination: {
            page: effectivePage,
            limit: effectiveLimit,
            total,
            totalPages: Math.ceil(total / effectiveLimit) || 1,
        },
    };
}

export async function findById(id: string): Promise<LeadRow | null> {
    const { data, error } = await getTable("leads").select("*").eq("id", id).single();
    if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(error.message);
    }
    return data as LeadRow;
}

export async function create(payload: CreateLeadPayload): Promise<LeadRow> {
    const { data, error } = await getTable("leads").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as LeadRow;
}

export async function update(id: string, payload: UpdateLeadPayload): Promise<LeadRow> {
    const { data, error } = await getTable("leads").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data as LeadRow;
}

export async function getStats() {
    const [leadsRes, tripsRes] = await Promise.all([
        getTable("leads").select("status"),
        getTable("trips").select("status")
    ]);

    const leads = leadsRes.data || [];
    const trips = tripsRes.data || [];

    const byLeadStatus = leads.reduce((acc: Record<string, number>, r: any) => {
        acc[r.status || "open"] = (acc[r.status || "open"] || 0) + 1;
        return acc;
    }, {});

    const inTransit = trips.filter((t: any) => t.status === "in_progress").length;
    const delivered = trips.filter((t: any) => t.status === "completed").length;

    return {
        total: leads.length,
        inTransit,
        delivered,
        pending: byLeadStatus["open"] || 0,
        cancelled: byLeadStatus["cancelled"] || 0,
        alerts: byLeadStatus["open"] || 0,
    };
}
