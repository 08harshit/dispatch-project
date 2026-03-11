import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";
import { resolveShipperId } from "../utils/authHelpers";
import { validateUuidParam } from "../utils/validate";

const router = Router();

async function resolveShipperIdForRequest(req: Request): Promise<string | null> {
    const shipperId = req.query.shipper_id as string | undefined;
    if (shipperId) return shipperId;
    return req.user?.id ? await resolveShipperId(supabaseAdmin, req.user.id) : null;
}

async function verifyLeadAccess(leadId: string, shipperId: string): Promise<boolean> {
    const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("shipper_id")
        .eq("id", leadId)
        .single();
    if (!lead) return false;
    return (lead as { shipper_id: string | null }).shipper_id === shipperId;
}

async function getShipperLeadIds(shipperId: string): Promise<string[]> {
    const { data } = await supabaseAdmin.from("leads").select("id").eq("shipper_id", shipperId);
    return (data || []).map((r: { id: string }) => r.id);
}

function toApiFormat(row: any) {
    return {
        id: row.id,
        vehicleId: row.vehicle_id,
        leadId: row.lead_id,
        runsAndDrives: row.runs_and_drives,
        starts: row.starts,
        notDrivable: row.not_drivable,
        noStructuralDamage: row.no_structural_damage,
        priorPaint: row.prior_paint,
        tiresCondition: row.tires_condition,
        clean: row.clean,
        otherOdor: row.other_odor,
        smokeOdor: row.smoke_odor,
        keysAvailable: row.keys_available,
        keyFobs: row.key_fobs,
        invoiceAvailable: row.invoice_available,
        mileage: row.mileage || "",
        announcements: row.announcements || [],
        highValueOptions: row.high_value_options || [],
        exteriorDamageItems: row.exterior_damage_items || [],
        interiorDamageItems: row.interior_damage_items || [],
        mechanicalIssues: row.mechanical_issues || [],
        structuralIssues: row.structural_issues || [],
        vehicleHistory: row.vehicle_history || {},
        vehicleDetails: row.vehicle_details || {},
        tiresWheels: row.tires_wheels || {},
        exteriorChecklist: row.exterior_checklist || {},
        underVehicle: row.under_vehicle || {},
        underHood: row.under_hood || {},
        brakesTires: row.brakes_tires || {},
        damageAreas: row.damage_areas || {},
        conditionNotes: row.condition_notes || "",
        mechanicComments: row.mechanic_comments || "",
        estimatedRepairCost: row.estimated_repair_cost || "",
        photos: row.photos || [],
        pdfReportUrl: row.pdf_report_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function toDbFormat(body: any) {
    const o: Record<string, unknown> = {};
    const map: [string, string][] = [
        ["vehicle_id", "vehicleId"],
        ["lead_id", "leadId"],
        ["runs_and_drives", "runsAndDrives"],
        ["starts", "starts"],
        ["not_drivable", "notDrivable"],
        ["no_structural_damage", "noStructuralDamage"],
        ["prior_paint", "priorPaint"],
        ["tires_condition", "tiresCondition"],
        ["clean", "clean"],
        ["other_odor", "otherOdor"],
        ["smoke_odor", "smokeOdor"],
        ["keys_available", "keysAvailable"],
        ["key_fobs", "keyFobs"],
        ["invoice_available", "invoiceAvailable"],
        ["mileage", "mileage"],
        ["announcements", "announcements"],
        ["high_value_options", "highValueOptions"],
        ["exterior_damage_items", "exteriorDamageItems"],
        ["interior_damage_items", "interiorDamageItems"],
        ["mechanical_issues", "mechanicalIssues"],
        ["structural_issues", "structuralIssues"],
        ["vehicle_history", "vehicleHistory"],
        ["vehicle_details", "vehicleDetails"],
        ["tires_wheels", "tiresWheels"],
        ["exterior_checklist", "exteriorChecklist"],
        ["under_vehicle", "underVehicle"],
        ["under_hood", "underHood"],
        ["brakes_tires", "brakesTires"],
        ["damage_areas", "damageAreas"],
        ["condition_notes", "conditionNotes"],
        ["mechanic_comments", "mechanicComments"],
        ["estimated_repair_cost", "estimatedRepairCost"],
        ["photos", "photos"],
        ["pdf_report_url", "pdfReportUrl"],
    ];
    for (const [db, api] of map) {
        const v = body[api] ?? body[db];
        if (v !== undefined) o[db] = v;
    }
    return o;
}

router.get("/", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const leadId = req.query.lead_id as string | undefined;
        const vehicleId = req.query.vehicle_id as string | undefined;

        const leadIds = await getShipperLeadIds(shipperId);

        let query = supabaseAdmin.from("condition_reports").select("*").order("created_at", { ascending: false });

        if (leadId) {
            const ok = await verifyLeadAccess(leadId, shipperId);
            if (!ok) return res.status(403).json({ success: false, error: "Not authorized to access this lead" });
            query = query.eq("lead_id", leadId);
        } else if (vehicleId) {
            query = query.eq("vehicle_id", vehicleId);
        }

        const { data, error } = await query;

        if (error) {
            if (isMissingTableError(error)) return res.json({ success: true, data: [] });
            logger.error({ err: error }, "Error fetching condition reports");
            return res.status(500).json({ success: false, error: error.message });
        }

        const rows = data || [];
        const filtered = leadId ? rows : rows.filter((r: any) => !r.lead_id || leadIds.includes(r.lead_id));

        res.json({ success: true, data: filtered.map(toApiFormat) });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /condition-reports");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/:id", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: row, error } = await supabaseAdmin
            .from("condition_reports")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (error || !row) {
            if (isMissingTableError(error)) return res.status(404).json({ success: false, error: "Not found" });
            return res.status(404).json({ success: false, error: "Report not found" });
        }

        if (row.lead_id) {
            const ok = await verifyLeadAccess(row.lead_id, shipperId);
            if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });
        }

        res.json({ success: true, data: toApiFormat(row) });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /condition-reports/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const body = req.body || {};
        const leadId = body.leadId ?? body.lead_id;
        if (leadId) {
            const ok = await verifyLeadAccess(leadId, shipperId);
            if (!ok) return res.status(403).json({ success: false, error: "Not authorized to create report for this lead" });
        }

        const dbData = toDbFormat(body);
        if (!dbData.vehicle_id) return res.status(400).json({ success: false, error: "vehicleId is required" });

        const { data: row, error } = await supabaseAdmin
            .from("condition_reports")
            .insert(dbData)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: toApiFormat(row) });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /condition-reports");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch("/:id", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: existing, error: fetchErr } = await supabaseAdmin
            .from("condition_reports")
            .select("lead_id")
            .eq("id", req.params.id)
            .single();

        if (fetchErr || !existing) return res.status(404).json({ success: false, error: "Report not found" });
        if (existing.lead_id) {
            const ok = await verifyLeadAccess(existing.lead_id, shipperId);
            if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });
        }

        const dbData = toDbFormat(req.body || {});
        if (Object.keys(dbData).length === 0) {
            const { data: row } = await supabaseAdmin.from("condition_reports").select("*").eq("id", req.params.id).single();
            return res.json({ success: true, data: row ? toApiFormat(row) : null });
        }

        const { data: row, error } = await supabaseAdmin
            .from("condition_reports")
            .update(dbData)
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) return res.status(500).json({ success: false, error: error.message });
        res.json({ success: true, data: toApiFormat(row) });
    } catch (err: any) {
        logger.error({ err }, "Error in PATCH /condition-reports/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete("/:id", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: existing } = await supabaseAdmin
            .from("condition_reports")
            .select("lead_id")
            .eq("id", req.params.id)
            .single();

        if (!existing) return res.status(404).json({ success: false, error: "Report not found" });
        if (existing.lead_id) {
            const ok = await verifyLeadAccess(existing.lead_id, shipperId);
            if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });
        }

        const { error } = await supabaseAdmin.from("condition_reports").delete().eq("id", req.params.id);
        if (error) return res.status(500).json({ success: false, error: error.message });
        res.json({ success: true, message: "Deleted" });
    } catch (err: any) {
        logger.error({ err }, "Error in DELETE /condition-reports/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/:id/upload-pdf", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: existing } = await supabaseAdmin
            .from("condition_reports")
            .select("lead_id")
            .eq("id", req.params.id)
            .single();

        if (!existing) return res.status(404).json({ success: false, error: "Report not found" });
        if (existing.lead_id) {
            const ok = await verifyLeadAccess(existing.lead_id, shipperId);
            if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });
        }

        const body = req.body || {};
        const fileUrl = body.fileUrl as string | undefined;
        const base64Data = body.data as string | undefined;

        if (!fileUrl && !base64Data) {
            return res.status(400).json({ success: false, error: "fileUrl or data (base64) required" });
        }

        let pdfUrl: string;
        if (fileUrl) {
            pdfUrl = fileUrl;
        } else {
            const buf = Buffer.from(base64Data!, "base64");
            const fileName = `condition-reports/${req.params.id}/${Date.now()}.pdf`;
            const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
                .from("shipment-documents")
                .upload(fileName, buf, { contentType: "application/pdf", upsert: true });
            if (uploadErr) {
                logger.error({ err: uploadErr }, "Error uploading PDF");
                return res.status(500).json({ success: false, error: uploadErr.message });
            }
            const { data: urlData } = supabaseAdmin.storage.from("shipment-documents").getPublicUrl(uploadData.path);
            pdfUrl = urlData.publicUrl;
        }

        const { data: row, error } = await supabaseAdmin
            .from("condition_reports")
            .update({ pdf_report_url: pdfUrl })
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) return res.status(500).json({ success: false, error: error.message });
        res.json({ success: true, data: toApiFormat(row) });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /condition-reports/:id/upload-pdf");
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
