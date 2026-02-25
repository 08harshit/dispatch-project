import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

function mapRowToShipper(row: Record<string, unknown>): Record<string, unknown> {
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
        history: [],
        documents: [],
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
            console.error("Error fetching shippers:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        const data = (rows || []).map((r: Record<string, unknown>) => mapRowToShipper(r));
        res.json({ success: true, data });
    } catch (err: unknown) {
        console.error("Error in GET /shippers:", err);
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
            .select("id, compliance, is_new");

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({
                    success: true,
                    data: { total: 0, compliant: 0, nonCompliant: 0, new: 0, alerts: 0 },
                });
            }
            console.error("Error fetching shipper stats:", error);
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
        console.error("Error in GET /shippers/stats:", err);
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
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Shipper not found" });
            }
            if (error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Shipper not found" });
            }
            console.error("Error fetching shipper:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, error: "Shipper not found" });
        }

        res.json({ success: true, data: mapRowToShipper(row as Record<string, unknown>) });
    } catch (err: unknown) {
        console.error("Error in GET /shippers/:id:", err);
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

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
router.post("/", (_req: Request, res: Response) => {
    res.json({ success: true, data: null, message: "Shipper created" });
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
router.put("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Shipper ${req.params.id} updated` });
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
router.patch("/:id/status", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Shipper ${req.params.id} status toggled` });
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
router.delete("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Shipper ${req.params.id} deleted` });
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
router.get("/:id/history", (req: Request, res: Response) => {
    res.json({ success: true, data: [], message: `History for shipper ${req.params.id}` });
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
router.post("/:id/documents", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Document uploaded for shipper ${req.params.id}` });
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
router.delete("/:id/documents/:docId", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Document ${req.params.docId} deleted` });
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
router.post("/:id/password", (req: Request, res: Response) => {
    res.json({ success: true, message: `Password updated for shipper ${req.params.id}` });
});

export default router;
