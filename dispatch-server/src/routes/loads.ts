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
import * as shipmentDocumentRepo from "../repos/shipmentDocumentRepo";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

async function verifyLeadShipperAccess(leadId: string, req: Request): Promise<boolean> {
    const shipperId = req.query.shipper_id as string | undefined
        || (req.user?.id ? await resolveShipperId(supabaseAdmin, req.user.id) : null);
    if (!shipperId) return false;
    const { data: lead } = await supabaseAdmin.from("leads").select("shipper_id").eq("id", leadId).single();
    return !!(lead && (lead as { shipper_id: string | null }).shipper_id === shipperId);
}
type IdParams = { id: string };
type DocParams = { id: string; docId: string };

function parseFilters(query: Request["query"]) {
    return {
        status: query.status === "all" ? undefined : query.status as string | undefined,
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
router.get("/stats", async (req: Request, res: Response) => {
    try {
        const shipper_id = req.query.shipper_id as string | undefined;
        const filters = shipper_id ? { shipper_id } : {};
        const stats = await loadService.getLoadStats(filters);
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
        const load = await loadService.deleteLoad(req.params.id);
        res.json({ success: true, data: load, message: "Load cancelled" });
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

// --- Shipment documents (shipment_documents table, shipper-scoped) ---

router.get("/:id/shipment-documents", validateUuidParam("id"), async (req: Request<IdParams>, res: Response) => {
    try {
        const ok = await verifyLeadShipperAccess(req.params.id, req);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized to access this load" });

        const docs = await shipmentDocumentRepo.findByLeadId(req.params.id);
        const data = docs.map((d: any) => ({
            id: d.id,
            leadId: d.lead_id,
            courierId: d.courier_id,
            documentType: d.document_type,
            fileName: d.file_name,
            fileUrl: d.file_url,
            fileSize: d.file_size,
            mimeType: d.mime_type,
            notes: d.notes,
            uploadedBy: d.uploaded_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            courierName: d.courier_name,
        }));
        res.json({ success: true, data });
    } catch (err: any) {
        if (isMissingTableError(err)) return res.json({ success: true, data: [] });
        logger.error({ err }, "Error in GET /loads/:id/shipment-documents");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/:id/shipment-documents", validateUuidParam("id"), async (req: Request<IdParams>, res: Response) => {
    try {
        const ok = await verifyLeadShipperAccess(req.params.id, req);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized to access this load" });

        const body = req.body || {};
        const { documentType, fileName, fileUrl, fileSize, mimeType, notes, uploadedBy, data: base64Data } = body;
        if (!documentType || !fileName) {
            return res.status(400).json({ success: false, error: "documentType and fileName are required" });
        }

        let finalUrl = fileUrl;
        if (!finalUrl && base64Data) {
            const buf = Buffer.from(base64Data, "base64");
            const storagePath = `${req.params.id}/${documentType}-${Date.now()}-${fileName}`;
            const { error: uploadErr } = await supabaseAdmin.storage
                .from("shipment-documents")
                .upload(storagePath, buf, { contentType: mimeType || "application/octet-stream", upsert: true });
            if (uploadErr) {
                logger.error({ err: uploadErr }, "Error uploading shipment document");
                return res.status(500).json({ success: false, error: uploadErr.message });
            }
            const { data: urlData } = supabaseAdmin.storage.from("shipment-documents").getPublicUrl(storagePath);
            finalUrl = urlData.publicUrl;
        }
        if (!finalUrl) return res.status(400).json({ success: false, error: "fileUrl or data (base64) required" });

        const doc = await shipmentDocumentRepo.create({
            lead_id: req.params.id,
            document_type: documentType,
            file_name: fileName,
            file_url: finalUrl,
            file_size: fileSize ?? null,
            mime_type: mimeType ?? null,
            notes: notes ?? null,
            uploaded_by: uploadedBy ?? "shipper",
        });

        res.status(201).json({
            success: true,
            data: {
                id: doc.id,
                leadId: doc.lead_id,
                courierId: doc.courier_id,
                documentType: doc.document_type,
                fileName: doc.file_name,
                fileUrl: doc.file_url,
                fileSize: doc.file_size,
                mimeType: doc.mime_type,
                notes: doc.notes,
                uploadedBy: doc.uploaded_by,
                createdAt: doc.created_at,
                updatedAt: doc.updated_at,
            },
        });
    } catch (err: any) {
        if (isMissingTableError(err)) return res.status(503).json({ success: false, error: "Service unavailable" });
        logger.error({ err }, "Error in POST /loads/:id/shipment-documents");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete("/:id/shipment-documents/:docId", validateUuidParam("id"), validateUuidParam("docId"), async (req: Request<DocParams>, res: Response) => {
    try {
        const ok = await verifyLeadShipperAccess(req.params.id, req);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized to access this load" });

        const doc = await shipmentDocumentRepo.findById(req.params.docId);
        if (!doc || doc.lead_id !== req.params.id) return res.status(404).json({ success: false, error: "Document not found" });

        const urlParts = doc.file_url?.split("/shipment-documents/");
        const filePath = urlParts && urlParts.length > 1 ? urlParts[1].split("?")[0] : null;
        if (filePath) {
            await supabaseAdmin.storage.from("shipment-documents").remove([filePath]).catch(() => {});
        }

        await shipmentDocumentRepo.deleteById(req.params.docId);
        res.json({ success: true, message: "Document deleted" });
    } catch (err: any) {
        if (isMissingTableError(err)) return res.status(503).json({ success: false, error: "Service unavailable" });
        logger.error({ err }, "Error in DELETE /loads/:id/shipment-documents/:docId");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/:id/shipment-documents/:docId/download", validateUuidParam("id"), validateUuidParam("docId"), async (req: Request<DocParams>, res: Response) => {
    try {
        const ok = await verifyLeadShipperAccess(req.params.id, req);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized to access this load" });

        const doc = await shipmentDocumentRepo.findById(req.params.docId);
        if (!doc || doc.lead_id !== req.params.id) return res.status(404).json({ success: false, error: "Document not found" });

        res.json({ success: true, data: { url: doc.file_url } });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /loads/:id/shipment-documents/:docId/download");
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
