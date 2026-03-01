/**
 * Courier Service (Backend)
 *
 * Orchestrates courier repository operations with business logic.
 * No `req/res` objects — receives plain data, returns typed results.
 */

import * as courierRepo from "../repos/courierRepo";
import * as historyRepo from "../repos/courierHistoryRepo";
import * as documentRepo from "../repos/courierDocumentRepo";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Shape returned to the frontend for list views. */
export interface CourierListItem {
    id: string;
    name: string;
    contact: string;
    phone: string;
    compliance: string;
    address: string;
    usdot: string;
    mc: string;
    status: string;
    trucks: number;
    insuranceCompany: string;
    equipmentType: string;
    isNew: boolean;
    history: { date: string; action: string }[];
    documents: { id: string; name: string; type: string; date: string; url: string | null }[];
}

export interface CourierStats {
    total: number;
    active: number;
    compliant: number;
    nonCompliant: number;
    new: number;
}

/** Incoming body from the frontend create/update form. */
export interface CourierFormBody {
    courierName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    businessType?: string;
    businessPhone?: string;
    fax?: string;
    businessEmail?: string;
    website?: string;
    hours?: string;
    timezone?: string;
    contactName?: string;
    contactPosition?: string;
    contactPhone?: string;
    deskPhone?: string;
    contactEmail?: string;
    contactHours?: string;
    usdot?: string;
    usdotLink?: string;
    mcNumber?: string;
    mcLink?: string;
    operatingStatus?: string;
    mcs150Status?: string;
    outOfServiceDate?: string;
    authorityStatus?: string;
    insuranceCompany?: string;
    insuranceAgent?: string;
    insurancePhone?: string;
    insuranceEmail?: string;
    physicalDamageLimit?: string;
    numTrucks?: string;
    equipmentType?: string;
    routes?: string;
}

/* ------------------------------------------------------------------ */
/*  List couriers (shaped for frontend)                                */
/* ------------------------------------------------------------------ */

export interface PaginatedListResult {
    data: CourierListItem[];
    pagination: courierRepo.PaginationResult;
}

export async function listCouriers(
    filters: courierRepo.CourierFilters = {},
    page?: number,
    limit?: number,
): Promise<PaginatedListResult> {
    // 1. Fetch core rows (paginated and fully pre-filtered)
    const { rows: couriers, pagination } = await courierRepo.findAll(filters, page, limit);
    if (couriers.length === 0) return { data: [], pagination };

    const courierIds = couriers.map(c => c.id);

    // 2. Batch fetch related data in parallel
    const [trucksMap, insuranceMap, historyMap, docsMap] = await Promise.all([
        courierRepo.findTrucksByCourierIds(courierIds),
        courierRepo.findInsuranceByCourierIds(courierIds),
        historyRepo.findByCourierIds(courierIds),
        documentRepo.findByCourierIds(courierIds),
    ]);

    // 3. Shape response
    const result = couriers.map((c): CourierListItem => {
        const trucks = trucksMap.get(c.id) || [];
        const totalTrucks = trucks.reduce((sum, t) => sum + (t.count || 0), 0);
        const equipmentTypes = trucks.map(t => t.equipment_type).filter(Boolean);

        return {
            id: c.id,
            name: c.name || "",
            contact: c.contact_email || "",
            phone: c.phone || "",
            compliance: c.compliance || "non-compliant",
            address: c.address || "",
            usdot: c.usdot || "",
            mc: c.mc || "",
            status: c.status || "active",
            trucks: totalTrucks,
            insuranceCompany: insuranceMap.get(c.id) || "",
            equipmentType: equipmentTypes.join(", ") || "",
            isNew: c.is_new || false,
            history: historyMap.get(c.id) || [],
            documents: docsMap.get(c.id) || [],
        };
    });

    return { data: result, pagination };
}

/* ------------------------------------------------------------------ */
/*  Get single courier                                                 */
/* ------------------------------------------------------------------ */

export async function getCourier(id: string) {
    const result = await courierRepo.findById(id);
    if (result.error) throw new Error(result.error);
    return result.data;
}

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

export async function getStats(): Promise<CourierStats> {
    const all = await courierRepo.findAllForStats();
    return {
        total: all.length,
        active: all.filter(c => c.status === "active").length,
        compliant: all.filter(c => c.compliance === "compliant").length,
        nonCompliant: all.filter(c => c.compliance === "non-compliant").length,
        new: all.filter(c => c.is_new === true).length,
    };
}

/* ------------------------------------------------------------------ */
/*  Create courier                                                     */
/* ------------------------------------------------------------------ */

export async function createCourier(body: CourierFormBody): Promise<{ id: string }> {
    // 1. Insert core courier row
    const result = await courierRepo.create({
        name: body.courierName || "",
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zipCode,
        business_type: body.businessType || null,
        business_phone: body.businessPhone,
        fax: body.fax,
        business_email: body.businessEmail,
        contact_email: body.contactEmail || body.businessEmail,
        phone: body.contactPhone || body.businessPhone,
        website: body.website,
        business_hours: body.hours,
        timezone: body.timezone || null,
        usdot: body.usdot,
        usdot_link: body.usdotLink,
        mc: body.mcNumber,
        mc_link: body.mcLink,
        operating_status: body.operatingStatus || null,
        mcs150_status: body.mcs150Status || null,
        out_of_service_date: body.outOfServiceDate || null,
        authority_status: body.authorityStatus || null,
        compliance: "non-compliant",
        status: "active",
        is_new: true,
    });

    if (result.error) throw new Error(result.error);
    const courierId = result.data!.id;

    // 2. Insert related records (all fire-and-forget, errors logged but don't block)
    const relatedOps: Promise<void>[] = [];

    if (body.contactName) {
        relatedOps.push(
            courierRepo.insertContact(courierId, {
                name: body.contactName,
                position: body.contactPosition,
                phone: body.contactPhone,
                desk_phone: body.deskPhone,
                email: body.contactEmail,
                hours: body.contactHours,
                is_primary: true,
            }),
        );
    }

    if (body.insuranceCompany) {
        relatedOps.push(
            courierRepo.insertInsurance(courierId, {
                company_name: body.insuranceCompany,
                agent_name: body.insuranceAgent,
                agent_phone: body.insurancePhone,
                agent_email: body.insuranceEmail,
                physical_damage_limit: body.physicalDamageLimit,
            }),
        );
    }

    if (body.equipmentType) {
        relatedOps.push(
            courierRepo.insertTrucks(courierId, {
                equipment_type: body.equipmentType,
                count: parseInt(body.numTrucks || "0", 10) || 0,
            }),
        );
    }

    if (body.routes) {
        relatedOps.push(courierRepo.insertRoutes(courierId, body.routes));
    }

    // 3. Add history entry
    relatedOps.push(
        historyRepo.addEntry(courierId, "Account created").then(() => { }),
    );

    await Promise.all(relatedOps);

    return { id: courierId };
}

/* ------------------------------------------------------------------ */
/*  Update courier                                                     */
/* ------------------------------------------------------------------ */

export async function updateCourier(id: string, body: CourierFormBody): Promise<void> {
    // 1. Build partial update for core fields
    const courierData: Partial<courierRepo.CreateCourierData> = {};
    if (body.courierName !== undefined) courierData.name = body.courierName;
    if (body.address !== undefined) courierData.address = body.address;
    if (body.city !== undefined) courierData.city = body.city;
    if (body.state !== undefined) courierData.state = body.state;
    if (body.zipCode !== undefined) courierData.zip_code = body.zipCode;
    if (body.businessType !== undefined) courierData.business_type = body.businessType || null;
    if (body.businessPhone !== undefined) courierData.business_phone = body.businessPhone;
    if (body.fax !== undefined) courierData.fax = body.fax;
    if (body.businessEmail !== undefined) courierData.business_email = body.businessEmail;
    if (body.contactEmail !== undefined) courierData.contact_email = body.contactEmail || body.businessEmail;
    if (body.contactPhone !== undefined) courierData.phone = body.contactPhone || body.businessPhone;
    if (body.website !== undefined) courierData.website = body.website;
    if (body.hours !== undefined) courierData.business_hours = body.hours;
    if (body.timezone !== undefined) courierData.timezone = body.timezone || null;
    if (body.usdot !== undefined) courierData.usdot = body.usdot;
    if (body.usdotLink !== undefined) courierData.usdot_link = body.usdotLink;
    if (body.mcNumber !== undefined) courierData.mc = body.mcNumber;
    if (body.mcLink !== undefined) courierData.mc_link = body.mcLink;
    if (body.operatingStatus !== undefined) courierData.operating_status = body.operatingStatus || null;
    if (body.mcs150Status !== undefined) courierData.mcs150_status = body.mcs150Status || null;
    if (body.outOfServiceDate !== undefined) courierData.out_of_service_date = body.outOfServiceDate || null;
    if (body.authorityStatus !== undefined) courierData.authority_status = body.authorityStatus || null;

    // 2. Update core fields
    const updateResult = await courierRepo.update(id, courierData);
    if (updateResult.error) throw new Error(updateResult.error);

    // 3. Upsert related records
    const relatedOps: Promise<void>[] = [];

    if (body.contactName !== undefined) {
        relatedOps.push(
            courierRepo.upsertContact(id, {
                name: body.contactName,
                position: body.contactPosition,
                phone: body.contactPhone,
                desk_phone: body.deskPhone,
                email: body.contactEmail,
                hours: body.contactHours,
                is_primary: true,
            }),
        );
    }

    if (body.insuranceCompany !== undefined) {
        relatedOps.push(
            courierRepo.upsertInsurance(id, {
                company_name: body.insuranceCompany,
                agent_name: body.insuranceAgent,
                agent_phone: body.insurancePhone,
                agent_email: body.insuranceEmail,
                physical_damage_limit: body.physicalDamageLimit,
            }),
        );
    }

    if (body.equipmentType !== undefined) {
        relatedOps.push(
            courierRepo.upsertTrucks(id, {
                equipment_type: body.equipmentType,
                count: parseInt(body.numTrucks || "0", 10) || 0,
            }),
        );
    }

    if (body.routes !== undefined) {
        relatedOps.push(courierRepo.upsertRoutes(id, body.routes));
    }

    // 4. Add history entry
    relatedOps.push(
        historyRepo.addEntry(id, "Account details updated").then(() => { }),
    );

    await Promise.all(relatedOps);
}

/* ------------------------------------------------------------------ */
/*  Toggle status                                                      */
/* ------------------------------------------------------------------ */

export async function toggleStatus(id: string): Promise<{ status: string }> {
    const result = await courierRepo.toggleStatus(id);
    if (result.error) throw new Error(result.error);

    const newStatus = result.data!.status;
    await historyRepo.addEntry(id, `Status changed to ${newStatus}`);

    return { status: newStatus };
}

/* ------------------------------------------------------------------ */
/*  Delete courier                                                     */
/* ------------------------------------------------------------------ */

export async function deleteCourier(id: string): Promise<void> {
    // Phase 3: Soft delete instead of hard delete
    const result = await courierRepo.softDelete(id);
    if (result.error) throw new Error(result.error);
    await historyRepo.addEntry(id, "Account soft-deleted by Admin");
}

/* ------------------------------------------------------------------ */
/*  Password management — Supabase Auth (Phase 2)                      */
/* ------------------------------------------------------------------ */

export async function setCourierPassword(id: string, password: string): Promise<void> {
    const courierResult = await courierRepo.findById(id);
    if (courierResult.error) throw new Error(courierResult.error);

    const courier = courierResult.data!;
    const email = courier.contact_email;
    if (!email) throw new Error("Courier has no email — cannot set auth password");

    // Import supabaseAdmin only for auth operations
    const { supabaseAdmin } = await import("../config/supabase");

    // Check if auth user already exists for this email
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find(u => u.email === email);

    if (existingUser) {
        // Update existing auth user's password
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password },
        );
        if (updateErr) throw updateErr;
    } else {
        // Create new auth user for this courier
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            app_metadata: { role: "courier", courier_id: id },
        });
        if (createErr) throw createErr;

        // Store auth_user_id on courier record (if column exists)
        if (newUser?.user) {
            await courierRepo.update(id, { auth_user_id: newUser.user.id } as any);
        }
    }

    await historyRepo.addEntry(id, "Password updated by Admin");
}

/* ------------------------------------------------------------------ */
/*  Compliance management (Phase 3)                                    */
/* ------------------------------------------------------------------ */

export async function setCompliance(
    id: string,
    compliance: "compliant" | "non-compliant",
): Promise<void> {
    const result = await courierRepo.updateCompliance(id, compliance);
    if (result.error) throw new Error(result.error);
    await historyRepo.addEntry(id, `Compliance changed to ${compliance}`);
}

/* ------------------------------------------------------------------ */
/*  History (dedicated endpoint — Phase 1)                             */
/* ------------------------------------------------------------------ */

export async function getCourierHistory(id: string) {
    return historyRepo.findByCourierId(id);
}

/* ------------------------------------------------------------------ */
/*  Document metadata (Phase 1 — no file storage yet)                  */
/* ------------------------------------------------------------------ */

export interface DocumentMeta {
    name: string;
    type: string;
    mime_type?: string;
    file_size_bytes?: number;
}

export async function addDocumentMeta(
    courierId: string,
    meta: DocumentMeta,
): Promise<{ id: string }> {
    // Generate a future S3 key (will be used in Phase 6)
    const s3Key = `couriers/${courierId}/docs/${Date.now()}_${meta.name}`;

    const result = await documentRepo.create(courierId, {
        name: meta.name,
        type: meta.type,
        mime_type: meta.mime_type || null,
        file_size_bytes: meta.file_size_bytes || null,
        s3_key: s3Key,
        url: null, // will be a presigned URL when S3 is set up
    });

    if (result.error) throw new Error(result.error);
    await historyRepo.addEntry(courierId, `Document metadata added: ${meta.name}`);
    return result.data!;
}

export async function getDocuments(courierId: string) {
    return documentRepo.findByCourierId(courierId);
}

export async function deleteDocumentMeta(
    courierId: string,
    docId: string,
): Promise<void> {
    const doc = await documentRepo.findById(docId);
    if (!doc) throw new Error("Document not found");

    // TODO Phase 6: also delete from S3 using doc.s3_key

    const result = await documentRepo.deleteById(docId);
    if (result.error) throw new Error(result.error);
    await historyRepo.addEntry(courierId, `Document removed: ${doc.name}`);
}
