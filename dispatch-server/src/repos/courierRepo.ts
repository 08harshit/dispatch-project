/**
 * Courier Repository
 *
 * All DB operations for `couriers` and its related tables
 * (`courier_contacts`, `courier_insurance`, `courier_trucks`, `courier_routes`).
 *
 * No business logic — just queries and row mapping.
 */

import { getTable, toResult, type DbResult } from "./baseRepo";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CourierFilters {
    search?: string;
    compliance?: string;
    status?: string;
    equipmentType?: string;
    isNew?: string;
}

export interface CourierRow {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    business_type?: string;
    business_phone?: string;
    fax?: string;
    business_email?: string;
    contact_email?: string;
    phone?: string;
    website?: string;
    business_hours?: string;
    timezone?: string;
    usdot?: string;
    usdot_link?: string;
    mc?: string;
    mc_link?: string;
    operating_status?: string;
    mcs150_status?: string;
    out_of_service_date?: string;
    authority_status?: string;
    compliance?: string;
    status?: string;
    is_new?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateCourierData {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    business_type?: string | null;
    business_phone?: string;
    fax?: string;
    business_email?: string;
    contact_email?: string;
    phone?: string;
    website?: string;
    business_hours?: string;
    timezone?: string | null;
    usdot?: string;
    usdot_link?: string;
    mc?: string;
    mc_link?: string;
    operating_status?: string | null;
    mcs150_status?: string | null;
    out_of_service_date?: string | null;
    authority_status?: string | null;
    compliance?: string;
    status?: string;
    is_new?: boolean;
}

export interface ContactData {
    name: string;
    position?: string;
    phone?: string;
    desk_phone?: string;
    email?: string;
    hours?: string;
    is_primary?: boolean;
}

export interface InsuranceData {
    company_name: string;
    agent_name?: string;
    agent_phone?: string;
    agent_email?: string;
    physical_damage_limit?: string;
}

export interface TruckData {
    equipment_type: string;
    count: number;
}

/* ------------------------------------------------------------------ */
/*  Core courier queries                                               */
/* ------------------------------------------------------------------ */

export interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedCouriers {
    rows: CourierRow[];
    pagination: PaginationResult;
}

/**
 * Build a filter chain that can be applied to both data and count queries.
 * Returns a function that applies filters to a Supabase query builder.
 */
function applyFilters(query: any, filters: CourierFilters) {
    // Exclude soft-deleted couriers
    query = query.is("deleted_at", null);

    if (filters.compliance) {
        query = query.eq("compliance", filters.compliance);
    }
    if (filters.status) {
        query = query.eq("status", filters.status);
    }
    if (filters.isNew === "true") {
        query = query.eq("is_new", true);
    }
    if (filters.search) {
        const term = `%${filters.search}%`;
        query = query.or(
            `name.ilike.${term},contact_email.ilike.${term},phone.ilike.${term},usdot.ilike.${term},mc.ilike.${term}`,
        );
    }
    return query;
}

/**
 * Fetch couriers with pagination.
 * When `page` / `limit` are provided, returns paginated results.
 * When omitted, returns all rows (backward-compatible).
 */
export async function findAll(
    filters: CourierFilters = {},
    page?: number,
    limit?: number,
): Promise<PaginatedCouriers> {
    // 1. If filtering by equipment, pre-fetch matching IDs
    let equipmentFilteredIds: string[] | null = null;
    if (filters.equipmentType) {
        equipmentFilteredIds = await findCourierIdsByEquipmentType(filters.equipmentType);
        if (equipmentFilteredIds.length === 0) {
            // Fast exit: no couriers match this equipment type
            const defaultLimit = limit ?? 10;
            return {
                rows: [],
                pagination: { page: page ?? 1, limit: defaultLimit, total: 0, totalPages: 1 },
            };
        }
    }

    // 2. Count query (for total — uses same filters)
    let countQuery = getTable("couriers").select("id", { count: "exact", head: true });
    countQuery = applyFilters(countQuery, filters);
    if (equipmentFilteredIds) {
        countQuery = countQuery.in("id", equipmentFilteredIds);
    }
    const { count, error: countErr } = await countQuery;
    if (countErr) throw new Error(countErr.message);

    const total = count ?? 0;
    const effectivePage = page ?? 1;
    const effectiveLimit = limit ?? (total || 1); // no limit = all rows
    const offset = (effectivePage - 1) * effectiveLimit;

    // 3. Data query
    let query = getTable("couriers")
        .select("*")
        .order("created_at", { ascending: false });
    query = applyFilters(query, filters);
    if (equipmentFilteredIds) {
        query = query.in("id", equipmentFilteredIds);
    }

    if (page && limit) {
        query = query.range(offset, offset + effectiveLimit - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return {
        rows: (data || []) as CourierRow[],
        pagination: {
            page: effectivePage,
            limit: effectiveLimit,
            total,
            totalPages: Math.ceil(total / effectiveLimit) || 1,
        },
    };
}

/** Fetch a single courier by ID. */
export async function findById(id: string): Promise<DbResult<CourierRow>> {
    const { data, error } = await getTable("couriers")
        .select("*")
        .eq("id", id)
        .single();

    return toResult<CourierRow>(data as CourierRow | null, error);
}

/** Fetch basic status/compliance/is_new for stats aggregation. */
export async function findAllForStats(): Promise<
    { status: string; compliance: string; is_new: boolean }[]
> {
    const { data, error } = await getTable("couriers")
        .select("status, compliance, is_new")
        .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return (data || []) as { status: string; compliance: string; is_new: boolean }[];
}

/** Insert a new courier row and return the created record. */
export async function create(data: CreateCourierData): Promise<DbResult<CourierRow>> {
    const { data: row, error } = await getTable("couriers")
        .insert(data)
        .select()
        .single();

    return toResult<CourierRow>(row as CourierRow | null, error);
}

/**
 * Partial update of a courier's core fields.
 * Only non-undefined values in `data` will be written.
 */
export async function update(
    id: string,
    data: Partial<CreateCourierData>,
): Promise<DbResult<null>> {
    if (Object.keys(data).length === 0) return { data: null, error: null };

    const { error } = await getTable("couriers")
        .update(data)
        .eq("id", id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
}

/** Toggle a courier's status. Returns the new status string. */
export async function toggleStatus(id: string): Promise<DbResult<{ status: string }>> {
    // 1. Fetch current status
    const { data: courier, error: fetchErr } = await getTable("couriers")
        .select("status")
        .eq("id", id)
        .single();

    if (fetchErr || !courier) {
        return { data: null, error: fetchErr?.message || "Courier not found" };
    }

    const newStatus = (courier as CourierRow).status === "active" ? "inactive" : "active";

    // 2. Write new status
    const { error: updateErr } = await getTable("couriers")
        .update({ status: newStatus })
        .eq("id", id);

    if (updateErr) return { data: null, error: updateErr.message };
    return { data: { status: newStatus }, error: null };
}

/** Hard-delete a courier. */
export async function hardDelete(id: string): Promise<DbResult<null>> {
    const { error } = await getTable("couriers")
        .delete()
        .eq("id", id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
}

/** Soft-delete a courier (set deleted_at instead of removing the row). */
export async function softDelete(id: string): Promise<DbResult<null>> {
    const { error } = await getTable("couriers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
}

/** Update a courier's compliance status. */
export async function updateCompliance(
    id: string,
    compliance: "compliant" | "non-compliant",
): Promise<DbResult<null>> {
    const { error } = await getTable("couriers")
        .update({ compliance })
        .eq("id", id);

    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
}

/* ------------------------------------------------------------------ */
/*  Related table queries                                              */
/* ------------------------------------------------------------------ */

// ---- Trucks ----

export async function findTrucksByCourierIds(
    courierIds: string[],
): Promise<Map<string, { equipment_type: string; count: number }[]>> {
    const map = new Map<string, { equipment_type: string; count: number }[]>();
    if (courierIds.length === 0) return map;

    const { data } = await getTable("courier_trucks")
        .select("*")
        .in("courier_id", courierIds);

    for (const t of (data || []) as any[]) {
        if (!map.has(t.courier_id)) map.set(t.courier_id, []);
        map.get(t.courier_id)!.push({ equipment_type: t.equipment_type, count: t.count || 0 });
    }

    return map;
}

/**
 * Get courier IDs that have trucks matching a given equipment type.
 * Used for post-query filtering.
 */
export async function findCourierIdsByEquipmentType(equipmentType: string): Promise<string[]> {
    const { data } = await getTable("courier_trucks")
        .select("courier_id")
        .eq("equipment_type", equipmentType);

    return (data || []).map((r: any) => r.courier_id);
}

// ---- Insurance ----

export async function findInsuranceByCourierIds(
    courierIds: string[],
): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (courierIds.length === 0) return map;

    const { data } = await getTable("courier_insurance")
        .select("*")
        .in("courier_id", courierIds)
        .order("created_at", { ascending: false });

    for (const ins of (data || []) as any[]) {
        // Only keep the most recent insurance per courier
        if (!map.has(ins.courier_id)) {
            map.set(ins.courier_id, ins.company_name || "");
        }
    }

    return map;
}

// ---- Contact upsert ----

export async function upsertContact(courierId: string, contact: ContactData): Promise<void> {
    await getTable("courier_contacts").delete().eq("courier_id", courierId);
    await getTable("courier_contacts").insert({
        courier_id: courierId,
        name: contact.name,
        position: contact.position,
        phone: contact.phone,
        desk_phone: contact.desk_phone,
        email: contact.email,
        hours: contact.hours,
        is_primary: contact.is_primary ?? true,
    });
}

// ---- Insurance upsert ----

export async function upsertInsurance(courierId: string, ins: InsuranceData): Promise<void> {
    await getTable("courier_insurance").delete().eq("courier_id", courierId);
    await getTable("courier_insurance").insert({
        courier_id: courierId,
        company_name: ins.company_name,
        agent_name: ins.agent_name,
        agent_phone: ins.agent_phone,
        agent_email: ins.agent_email,
        physical_damage_limit: ins.physical_damage_limit,
    });
}

// ---- Trucks upsert ----

export async function upsertTrucks(courierId: string, truck: TruckData): Promise<void> {
    await getTable("courier_trucks").delete().eq("courier_id", courierId);
    await getTable("courier_trucks").insert({
        courier_id: courierId,
        equipment_type: truck.equipment_type,
        count: truck.count,
    });
}

// ---- Routes upsert ----

export async function upsertRoutes(courierId: string, routesCsv: string): Promise<void> {
    await getTable("courier_routes").delete().eq("courier_id", courierId);

    const routeNames = routesCsv
        .split(",")
        .map(r => r.trim())
        .filter(r => r.length > 0);

    if (routeNames.length > 0) {
        await getTable("courier_routes").insert(
            routeNames.map(name => ({ courier_id: courierId, route_name: name })),
        );
    }
}

// ---- Insert contact (for create — no delete first) ----

export async function insertContact(courierId: string, contact: ContactData): Promise<void> {
    await getTable("courier_contacts").insert({
        courier_id: courierId,
        name: contact.name,
        position: contact.position,
        phone: contact.phone,
        desk_phone: contact.desk_phone,
        email: contact.email,
        hours: contact.hours,
        is_primary: contact.is_primary ?? true,
    });
}

// ---- Insert insurance (for create — no delete first) ----

export async function insertInsurance(courierId: string, ins: InsuranceData): Promise<void> {
    await getTable("courier_insurance").insert({
        courier_id: courierId,
        company_name: ins.company_name,
        agent_name: ins.agent_name,
        agent_phone: ins.agent_phone,
        agent_email: ins.agent_email,
        physical_damage_limit: ins.physical_damage_limit,
    });
}

// ---- Insert trucks (for create — no delete first) ----

export async function insertTrucks(courierId: string, truck: TruckData): Promise<void> {
    await getTable("courier_trucks").insert({
        courier_id: courierId,
        equipment_type: truck.equipment_type,
        count: truck.count,
    });
}

// ---- Insert routes (for create — no delete first) ----

export async function insertRoutes(courierId: string, routesCsv: string): Promise<void> {
    const routeNames = routesCsv
        .split(",")
        .map(r => r.trim())
        .filter(r => r.length > 0);

    if (routeNames.length > 0) {
        await getTable("courier_routes").insert(
            routeNames.map(name => ({ courier_id: courierId, route_name: name })),
        );
    }
}
