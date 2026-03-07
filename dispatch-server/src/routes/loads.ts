/**
 * Loads (leads) API. Leads in this DB are created by Admin or via API (e.g. from Shipper app).
 * If using two Supabase projects (Shipper vs Admin/Courier), sync or duplicate leads as needed.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { logger } from "../utils/logger";
import { validateBody, validateUuidParam } from "../utils/validate";
import * as loadService from "../services/loadService";
import { resolveShipperId } from "../utils/authHelpers";
import { supabaseAdmin } from "../config/supabase";

const router = Router();
type IdParams = { id: string };
type DocParams = { id: string; docId: string };

function parseFilters(query: Request["query"]) {
    return {
        status: query.status as string | undefined,
        shipper_id: query.shipper_id as string | undefined,
        dateFrom: query.dateFrom as string | undefined,
        dateTo: query.dateTo as string | undefined,
    };
}

/**
 * @swagger
 * tags:
 *   name: Loads
 *   description: Loads (leads) management
 */

/**
 * @swagger
 * /loads:
 *   get:
 *     summary: List all loads (leads)
 *     tags: [Loads]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by lead status (e.g. open)
 *       - in: query
 *         name: shipper_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of loads
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const filters = parseFilters(req.query);
        const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const result = await loadService.listLoads(filters, page, limit);
        res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /loads");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/stats:
 *   get:
 *     summary: Get load statistics
 *     tags: [Loads]
 */
router.get("/stats", async (_req: Request, res: Response) => {
    try {
        const stats = await loadService.getLoadStats();
        res.json({ success: true, data: stats });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /loads/stats");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}:
 *   get:
 *     summary: Get a single load (lead) by ID
 *     tags: [Loads]
 */
router.get("/:id", validateUuidParam("id"), async (req: Request<IdParams>, res: Response) => {
    try {
        const load = await loadService.getLoadById(req.params.id);
        if (!load) {
            return res.status(404).json({ success: false, error: "Load not found" });
        }
        res.json({ success: true, data: load });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads:
 *   post:
 *      summary: Create a load
 *      tags: [Loads]
 */
const createLoadSchema = z.object({
    listing_id: z.string().min(1),
    shipper_id: z.string().uuid().nullable().optional(),
    pickup_address: z.string().min(1),
    delivery_address: z.string().min(1),
    pickup_location_type: z.string().optional(),
    pickup_contact_name: z.string().optional(),
    pickup_contact_phone: z.string().optional(),
    pickup_contact_email: z.string().optional(),
    delivery_location_type: z.string().optional(),
    delivery_contact_name: z.string().optional(),
    delivery_contact_phone: z.string().optional(),
    delivery_contact_email: z.string().optional(),
    vehicle_year: z.string().optional(),
    vehicle_make: z.string().optional(),
    vehicle_model: z.string().optional(),
    vehicle_vin: z.string().optional(),
    vehicle_type: z.string().optional(),
    vehicle_color: z.string().optional(),
    vehicle_runs: z.boolean().optional(),
    vehicle_rolls: z.boolean().optional(),
    initial_price: z.number().optional(),
    payment_type: z.string().optional(),
    notes: z.string().optional(),
});
router.post("/", validateBody(createLoadSchema), async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        let shipper_id = payload.shipper_id;
        if (!shipper_id && req.user?.id) {
            shipper_id = (await resolveShipperId(supabaseAdmin, req.user.id)) || undefined;
        }
        const load = await loadService.createLoad({ ...payload, shipper_id: shipper_id ?? null, status: "open" });
        res.status(201).json({ success: true, data: load });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /loads");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}:
 *   put:
 *      summary: Update a load
 *      tags: [Loads]
 */
const updateLoadSchema = z.object({
    pickup_address: z.string().optional(),
    delivery_address: z.string().optional(),
    vehicle_year: z.string().optional(),
    vehicle_make: z.string().optional(),
    vehicle_model: z.string().optional(),
    vehicle_vin: z.string().optional(),
    vehicle_type: z.string().optional(),
    vehicle_color: z.string().optional(),
    initial_price: z.number().optional(),
    payment_type: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
});
router.put("/:id", validateUuidParam("id"), validateBody(updateLoadSchema), async (req: Request<IdParams>, res: Response) => {
    try {
        const updates = req.body;
        if (Object.keys(updates).length === 0) {
            const row = await loadService.getLoadById(req.params.id);
            return res.json({ success: true, data: row });
        }
        const load = await loadService.updateLoad(req.params.id, updates);
        res.json({ success: true, data: load });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}/status:
 *   patch:
 *      summary: Update a load status
 *      tags: [Loads]
 */
const updateStatusSchema = z.object({
    status: z.string().min(1)
});
router.patch("/:id/status", validateUuidParam("id"), validateBody(updateStatusSchema), async (req: Request<IdParams>, res: Response) => {
    try {
        const load = await loadService.updateLoadStatus(req.params.id, req.body.status);
        res.json({ success: true, data: load });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}:
 *   delete:
 *      summary: Soft deletes a load (changes status to cancelled)
 *      tags: [Loads]
 */
router.delete("/:id", validateUuidParam("id"), async (req: Request<IdParams>, res: Response) => {
    try {
        await loadService.deleteLoad(req.params.id);
        res.json({ success: true, message: "Load cancelled" });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}/history:
 *   get:
 *     summary: Get history events for a load
 *     tags: [Loads, History]
 */
router.get("/:id/history", validateUuidParam("id"), async (req: Request<IdParams>, res: Response) => {
    try {
        const history = await loadService.getLoadHistory(req.params.id);
        res.json({ success: true, data: history });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}/documents:
 *   get:
 *     summary: Get load documents
 *     tags: [Loads, Documents]
 */
router.get("/:id/documents", validateUuidParam("id"), async (req: Request<IdParams>, res: Response) => {
    try {
        const documents = await loadService.getLoadDocuments(req.params.id);
        res.json({ success: true, data: documents });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}/documents:
 *   post:
 *     summary: Upload (stub) a load document
 *     tags: [Loads, Documents]
 */
const uploadDocSchema = z.object({
    name: z.string().min(1),
    type: z.string().min(1),
});
router.post("/:id/documents", validateUuidParam("id"), validateBody(uploadDocSchema), async (req: Request<IdParams>, res: Response) => {
    try {
        // Just meta stub like Courier
        const doc = await loadService.addLoadDocumentMeta(req.params.id, req.body.name, req.body.type);
        res.json({
            success: true,
            data: doc,
            message: "Document metadata processed. File upload to S3 pending Phase 6"
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}/documents/{docId}:
 *   delete:
 *     summary: Delete a load document
 *     tags: [Loads, Documents]
 */
router.delete("/:id/documents/:docId", validateUuidParam("id"), validateUuidParam("docId"), async (req: Request<DocParams>, res: Response) => {
    try {
        await loadService.removeLoadDocument(req.params.id, req.params.docId);
        res.json({ success: true, message: "Document deleted" });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
