import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../config/supabase";
import * as shipperHistoryRepo from "../repos/shipperHistoryRepo";
import * as shipperDocumentRepo from "../repos/shipperDocumentRepo";
import { updateShipperStatus, softDeleteShipper, updateShipperCompliance } from "../services/shipperService";
import { isMissingTableError } from "../utils/dbError";
import { logger } from "../utils/logger";
import { validateBody, validateUuidParam } from "../utils/validate";

const router = Router();

function mapRowToShipper(
    row: Record<string, unknown>,
    history: { date: string; action: string }[] = [],
    documents: { id: string; name: string; type: string; date: string }[] = [],
): Record<string, unknown> {
    return {
        id: row.id,
        name: row.name,
        contact: row.contact_email ?? "",
        phone: row.phone ?? "",
        compliance: row.compliance ?? "non-compliant",
        address: row.address ?? "",
        businessType: row.business_type ?? "",
        city: row.city ?? "",
        state: row.state ?? "",
        taxExempt: Boolean(row.tax_exempt),
        ein: row.ein ?? "",
        hoursPickup: row.hours_pickup ?? "",
        hoursDropoff: row.hours_dropoff ?? "",
        principalName: row.principal_name ?? "",
        status: row.status ?? "active",
        isNew: Boolean(row.is_new),
        history,
        documents: documents.map((d) => ({ id: d.id, name: d.name, type: d.type, date: d.date })),
    };
}

/**
 * @swagger
 * tags:
 *   name: Shippers
 *   description: Shipper management
 */

/**
 * @swagger
 * /shippers:
 *   get:
 *     summary: List all shippers
 *     tags: [Shippers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: compliance
 *         schema: { type: string, enum: [compliant, non-compliant] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: businessType
 *         schema: { type: string }
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *       - in: query
 *         name: isNew
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of shippers
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Shipper'
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { search, compliance, status, businessType, state, isNew } = req.query;
        let query = supabaseAdmin
            .from("shippers")
            .select("*")
            .is("deleted_at", null)
            .order("created_at", { ascending: false });

        if (compliance) query = query.eq("compliance", compliance as string);
        if (status) query = query.eq("status", status as string);
        if (state) query = query.eq("state", state as string);
        if (businessType) query = query.eq("business_type", businessType as string);
        if (isNew === "true") query = query.eq("is_new", true);
        if (search && String(search).trim()) {
            const term = `%${String(search).trim()}%`;
            query = query.or(
                `name.ilike.${term},contact_email.ilike.${term},phone.ilike.${term}`
            );
        }

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Error fetching shippers");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = (rows || []) as Record<string, unknown>[];
        const shipperIds = list.map((r) => r.id as string);

        const [historyMap, docsMap] = await Promise.all([
            shipperHistoryRepo.findByShipperIds(shipperIds),
            shipperDocumentRepo.findByShipperIds(shipperIds),
        ]);

        const data = list.map((r) => {
            const id = r.id as string;
            const history = historyMap.get(id) || [];
            const documents = docsMap.get(id) || [];
            return mapRowToShipper(r, history, documents);
        });
        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /shippers");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /shippers/stats:
 *   get:
 *     summary: Get shipper statistics
 *     tags: [Shippers]
 *     responses:
 *       200:
 *         description: Shipper stats
 */
router.get("/stats", async (_req: Request, res: Response) => {
    try {
        const { data: rows, error } = await supabaseAdmin
            .from("shippers")
            .select("id, compliance, is_new")
            .is("deleted_at", null);

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({
                    success: true,
                    data: { total: 0, compliant: 0, nonCompliant: 0, new: 0, alerts: 0 },
                });
            }
            logger.error({ err: error }, "Error fetching shipper stats");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = rows || [];
        const total = list.length;
        const compliant = list.filter((r: { compliance?: string }) => r.compliance === "compliant").length;
        const nonCompliant = total - compliant;
        const newCount = list.filter((r: { is_new?: boolean }) => r.is_new === true).length;
        res.json({
            success: true,
            data: {
                total,
                compliant,
                nonCompliant,
                new: newCount,
                alerts: nonCompliant,
            },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /shippers/stats");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /shippers/{id}:
 *   get:
 *     summary: Get a single shipper by ID
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipper details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Shipper'
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: row, error } = await supabaseAdmin
            .from("shippers")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Shipper not found" });
            }
            if (error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Shipper not found" });
            }
            logger.error({ err: error }, "Error fetching shipper");
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, error: "Shipper not found" });
        }

        const id = row.id as string;
        const [history, documents] = await Promise.all([
            shipperHistoryRepo.findByShipperId(id),
            shipperDocumentRepo.findByShipperId(id),
        ]);

        res.json({ success: true, data: mapRowToShipper(row as Record<string, unknown>, history, documents) });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /shippers/:id");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

interface ShipperBody {
    name?: string;
    Name?: string;
    contact_email?: string;
    contact?: string;
    contactEmail?: string;
    phone?: string;
    Phone?: string;
    address?: string;
    Address?: string;
    business_type?: string;
    businessType?: string;
    city?: string;
    City?: string;
    state?: string;
    State?: string;
    tax_exempt?: boolean;
    taxExempt?: boolean;
    ein?: string;
    Ein?: string;
    hours_pickup?: string;
    hoursPickup?: string;
    hours_dropoff?: string;
    hoursDropoff?: string;
    principal_name?: string;
    principalName?: string;
    compliance?: string;
    status?: string;
    is_new?: boolean;
    isNew?: boolean;
}

/**
 * Build DB row from body (accepts camelCase or snake_case).
 */
function bodyToShipperRow(body: Record<string, unknown>, forUpdate = false): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    const set = (key: string, v: unknown) => {
        if (v !== undefined && v !== null) row[key] = v;
    };
    const b = body as ShipperBody;
    set("name", b.name ?? b.Name);
    set("contact_email", b.contact_email ?? b.contactEmail ?? b.contact);
    set("phone", b.phone ?? b.Phone);
    set("address", b.address ?? b.Address);
    set("business_type", b.business_type ?? b.businessType);
    set("city", b.city ?? b.City);
    set("state", b.state ?? b.State);
    set("tax_exempt", b.tax_exempt ?? b.taxExempt);
    set("ein", b.ein ?? b.Ein);
    set("hours_pickup", b.hours_pickup ?? b.hoursPickup);
    set("hours_dropoff", b.hours_dropoff ?? b.hoursDropoff);
    set("principal_name", b.principal_name ?? b.principalName);
    if (!forUpdate) {
        if (b.compliance !== undefined) set("compliance", b.compliance);
        if (b.status !== undefined) set("status", b.status);
        if (b.is_new !== undefined) set("is_new", b.is_new ?? b.isNew);
    }
    return row;
}

/**
 * @swagger
 * /shippers:
 *   post:
 *     summary: Create a new shipper
 *     tags: [Shippers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shipper'
 *     responses:
 *       200:
 *         description: Shipper created
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const row = bodyToShipperRow(body, false);
        if (!row.name) {
            return res.status(400).json({ success: false, error: "name is required" });
        }
        const { data: created, error } = await supabaseAdmin
            .from("shippers")
            .insert(row)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(503).json({ success: false, error: "Service unavailable" });
            }
            logger.error({ err: error }, "Error creating shipper");
            return res.status(500).json({ success: false, error: error.message });
        }
        const shipperId = (created as Record<string, unknown>).id as string;
        await shipperHistoryRepo.addEntry(shipperId, "Shipper created");
        const today = new Date().toISOString().split("T")[0];
        res.status(201).json({ success: true, data: mapRowToShipper(created as Record<string, unknown>, [{ date: today, action: "Shipper created" }], []) });
    } catch (err: unknown) {
        logger.error({ err }, "Error in POST /shippers");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /shippers/{id}:
 *   put:
 *     summary: Update a shipper
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shipper'
 *     responses:
 *       200:
 *         description: Shipper updated
 */
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body || {};
        const row = bodyToShipperRow(body, true);
        if (Object.keys(row).length === 0) {
            const { data: existing, error } = await supabaseAdmin
                .from("shippers")
                .select("*")
                .eq("id", id)
                .is("deleted_at", null)
                .single();
            if (error || !existing) {
                return res.status(404).json({ success: false, error: "Shipper not found" });
            }
            return res.json({ success: true, data: mapRowToShipper(existing as Record<string, unknown>) });
        }
        const { data: updated, error } = await supabaseAdmin
            .from("shippers")
            .update(row)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(503).json({ success: false, error: "Service unavailable" });
            }
            if (error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Shipper not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        await shipperHistoryRepo.addEntry(id, "Shipper updated");
        const [history, documents] = await Promise.all([
            shipperHistoryRepo.findByShipperId(id),
            shipperDocumentRepo.findByShipperId(id),
        ]);
        res.json({ success: true, data: mapRowToShipper(updated as Record<string, unknown>, history, documents) });
    } catch (err: unknown) {
        logger.error({ err }, "Error in PUT /shippers/:id");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /shippers/{id}/status:
 *   patch:
 *     summary: Toggle shipper active/inactive status
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status toggled
 */
const patchStatusSchema = z.object({ status: z.enum(["active", "inactive"]) });

const documentMetaSchema = z.object({
    name: z.string().min(1, "Document name is required"),
    type: z.string().min(1, "Document type is required"),
    date: z.string().optional(),
});

const passwordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const complianceSchema = z.object({
    compliance: z.enum(["compliant", "non-compliant"]),
});

router.patch("/:id/compliance", validateUuidParam("id"), validateBody(complianceSchema), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { compliance } = req.body as z.infer<typeof complianceSchema>;

        const result = await updateShipperCompliance(id, compliance);

        if (!result.success) {
            return res.status(result.error === "Shipper not found" ? 404 : 500).json({
                success: false,
                error: result.error,
            });
        }

        await shipperHistoryRepo.addEntry(id, `Compliance changed to ${compliance}`);
        const [history, documents] = await Promise.all([
            shipperHistoryRepo.findByShipperId(id),
            shipperDocumentRepo.findByShipperId(id),
        ]);
        res.json({
            success: true,
            data: mapRowToShipper(result.data as unknown as Record<string, unknown>, history, documents),
            message: `Compliance updated to ${compliance}`,
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in PATCH /shippers/:id/compliance");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

router.patch("/:id/status", validateUuidParam("id"), validateBody(patchStatusSchema), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { status: newStatus } = req.body as z.infer<typeof patchStatusSchema>;

        const result = await updateShipperStatus(id, newStatus);

        if (!result.success) {
            return res.status(result.error === "Shipper not found" ? 404 : 500).json({
                success: false,
                error: result.error,
            });
        }

        await shipperHistoryRepo.addEntry(id, `Status changed to ${newStatus}`);
        const [history, documents] = await Promise.all([
            shipperHistoryRepo.findByShipperId(id),
            shipperDocumentRepo.findByShipperId(id),
        ]);
        res.json({
            success: true,
            data: mapRowToShipper(result.data as unknown as Record<string, unknown>, history, documents),
            message: `Shipper status updated to ${newStatus}`,
        });
    } catch (err: unknown) {
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /shippers/{id}:
 *   delete:
 *     summary: Delete a shipper
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipper deleted
 */
router.delete("/:id", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const result = await softDeleteShipper(id);

        if (!result.success) {
            return res.status(result.error === "Shipper not found" ? 404 : 500).json({
                success: false,
                error: result.error,
            });
        }

        await shipperHistoryRepo.addEntry(id, "Shipper deleted (soft)");
        res.json({ success: true, message: "Shipper deleted" });
    } catch (err: unknown) {
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /shippers/{id}/history:
 *   get:
 *     summary: Get shipper activity history
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: History entries
 */
router.get("/:id/history", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const history = await shipperHistoryRepo.findByShipperId(id);
        res.json({ success: true, data: history });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /shippers/:id/history");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

router.get("/:id/documents", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const documents = await shipperDocumentRepo.findByShipperId(id);
        res.json({ success: true, data: documents });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /shippers/:id/documents");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /shippers/{id}/documents:
 *   get:
 *     summary: Get shipper documents
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document list
 *   post:
 *     summary: Upload a document for a shipper
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded
 */
router.post("/:id/documents", validateUuidParam("id"), validateBody(documentMetaSchema), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const body = req.body as z.infer<typeof documentMetaSchema>;

        const { data: existing } = await supabaseAdmin
            .from("shippers")
            .select("id")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (!existing) {
            return res.status(404).json({ success: false, error: "Shipper not found" });
        }

        const result = await shipperDocumentRepo.create(id, {
            name: body.name,
            type: body.type,
            date: body.date,
        });

        if (result.error) {
            return res.status(500).json({ success: false, error: result.error });
        }

        await shipperHistoryRepo.addEntry(id, `Document added: ${body.name}`);
        const doc = await shipperDocumentRepo.findById(result.data!.id);
        res.status(201).json({ success: true, data: doc, message: "Document added" });
    } catch (err: unknown) {
        logger.error({ err }, "Error in POST /shippers/:id/documents");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /shippers/{id}/documents/{docId}:
 *   delete:
 *     summary: Delete a shipper document
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document deleted
 */
router.delete("/:id/documents/:docId", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const docId = String(req.params.docId);

        const doc = await shipperDocumentRepo.findById(docId);
        if (!doc || doc.shipper_id !== id) {
            return res.status(404).json({ success: false, error: "Document not found" });
        }

        const result = await shipperDocumentRepo.deleteById(docId);
        if (result.error) {
            return res.status(500).json({ success: false, error: result.error });
        }

        await shipperHistoryRepo.addEntry(id, `Document deleted: ${doc.name}`);
        res.json({ success: true, message: "Document deleted" });
    } catch (err: unknown) {
        logger.error({ err }, "Error in DELETE /shippers/:id/documents/:docId");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /shippers/{id}/password:
 *   post:
 *     summary: Set/reset shipper account password
 *     tags: [Shippers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post("/:id/password", validateUuidParam("id"), validateBody(passwordSchema), async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { password } = req.body as z.infer<typeof passwordSchema>;

        const { data: shipper, error: fetchErr } = await supabaseAdmin
            .from("shippers")
            .select("id, contact_email")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (fetchErr || !shipper) {
            return res.status(404).json({ success: false, error: "Shipper not found" });
        }

        const email = (shipper as { contact_email?: string }).contact_email;
        if (!email) {
            return res.status(400).json({ success: false, error: "Shipper has no email - cannot set auth password" });
        }

        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userList?.users?.find((u) => u.email === email);

        if (existingUser) {
            const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
            if (updateErr) {
                return res.status(500).json({ success: false, error: updateErr.message });
            }
        } else {
            const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                app_metadata: { role: "shipper", shipper_id: id },
            });
            if (createErr) {
                return res.status(500).json({ success: false, error: createErr.message });
            }
        }

        await shipperHistoryRepo.addEntry(id, "Password updated by Admin");
        res.json({ success: true, message: "Password updated" });
    } catch (err: unknown) {
        logger.error({ err }, "Error in POST /shippers/:id/password");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

export default router;
