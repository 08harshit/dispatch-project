/**
 * Courier Routes — Thin Controller
 *
 * Each handler:
 *   1. Parses request (params, query, body)
 *   2. Calls the service layer
 *   3. Sends the response
 *
 * No direct DB access (`supabaseAdmin` is NOT imported here).
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { logger } from "../utils/logger";
import { validateBody, validateUuidParam } from "../utils/validate";
import * as courierService from "../services/courierService";

const router = Router();

/** Typed params for routes with `:id`. */
type IdParams = { id: string };
/** Typed params for routes with `:id` and `:docId`. */
type DocParams = { id: string; docId: string };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract filter params from query string. */
function parseFilters(query: Request["query"]) {
    return {
        search: query.search as string | undefined,
        compliance: query.compliance === "all" ? undefined : query.compliance as string | undefined,
        status: query.status === "all" ? undefined : query.status as string | undefined,
        equipmentType: query.equipmentType === "all" ? undefined : query.equipmentType as string | undefined,
        isNew: query.isNew as string | undefined,
    };
}

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

/**
 * @swagger
 * tags:
 *   name: Couriers
 *   description: Courier management
 */

/**
 * @swagger
 * /couriers:
 *   get:
 *     summary: List all couriers
 *     tags: [Couriers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, email, phone, USDOT, or MC
 *       - in: query
 *         name: compliance
 *         schema: { type: string, enum: [compliant, non-compliant] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: equipmentType
 *         schema: { type: string }
 *       - in: query
 *         name: isNew
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of couriers
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Courier'
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const filters = parseFilters(req.query);
        const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const result = await courierService.listCouriers(filters, page, limit);
        res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /couriers");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/stats:
 *   get:
 *     summary: Get courier statistics
 *     tags: [Couriers]
 *     responses:
 *       200:
 *         description: Courier stats
 */
router.get("/stats", async (_req: Request, res: Response) => {
    try {
        const stats = await courierService.getStats();
        res.json({ success: true, data: stats });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /couriers/stats");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}:
 *   get:
 *     summary: Get a single courier by ID
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Courier details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Courier'
 */
router.get("/:id", validateUuidParam(), async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const courier = await courierService.getCourier(id);
        res.json({ success: true, data: courier });
    } catch (err: any) {
        const status = err.message === "Not found" ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers:
 *   post:
 *     summary: Create a new courier
 *     tags: [Couriers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Courier'
 *     responses:
 *       200:
 *         description: Courier created
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const courier = await courierService.createCourier(req.body);
        res.status(201).json({ success: true, data: courier, message: "Courier created" });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /couriers");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}:
 *   put:
 *     summary: Update a courier
 *     tags: [Couriers]
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
 *             $ref: '#/components/schemas/Courier'
 *     responses:
 *       200:
 *         description: Courier updated
 */
router.put("/:id", validateUuidParam(), async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const courier = await courierService.updateCourier(id, req.body);
        res.json({ success: true, data: courier, message: `Courier ${id} updated` });
    } catch (err: any) {
        logger.error({ err, courierId: req.params.id }, "Error updating courier");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}/status:
 *   patch:
 *     summary: Toggle courier active/inactive status
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/:id/status", validateUuidParam(), async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const courier = await courierService.toggleStatus(id);
        res.json({
            success: true,
            data: courier,
            message: `Courier ${id} status toggled`,
        });
    } catch (err: any) {
        logger.error({ err, courierId: req.params.id }, "Error toggling status for courier");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}:
 *   delete:
 *     summary: Delete a courier
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Courier deleted
 */
router.delete("/:id", validateUuidParam(), async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const courier = await courierService.deleteCourier(id);
        res.json({ success: true, data: courier, message: `Courier ${id} deleted` });
    } catch (err: any) {
        logger.error({ err, courierId: req.params.id }, "Error deleting courier");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}/history:
 *   get:
 *     summary: Get courier activity history
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: History entries
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HistoryEntry'
 */
router.get("/:id/history", validateUuidParam(), async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const history = await courierService.getCourierHistory(id);
        res.json({ success: true, data: history });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /couriers/:id/history");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}/documents:
 *   get:
 *     summary: Get courier documents
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document list
 */
router.get("/:id/documents", validateUuidParam(), async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const docs = await courierService.getDocuments(id);
        res.json({ success: true, data: docs });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /couriers/:id/documents");
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ------------------------------------------------------------------ */
/*  Zod Schemas                                                        */
/* ------------------------------------------------------------------ */

const documentMetaSchema = z.object({
    name: z.string().min(1, "Document name is required"),
    type: z.string().min(1, "Document type is required"),
    mime_type: z.string().optional(),
    file_size_bytes: z.number().optional(),
});

const complianceSchema = z.object({
    compliance: z.enum(["compliant", "non-compliant"]),
});

const passwordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * @swagger
 * /couriers/{id}/documents:
 *   post:
 *     summary: Save document metadata for a courier
 *     tags: [Couriers]
 */
router.post(
    "/:id/documents",
    validateUuidParam(),
    validateBody(documentMetaSchema),
    async (req: Request<IdParams>, res: Response) => {
        try {
            const { id } = req.params;
            const result = await courierService.addDocumentMeta(id, req.body);
            res.status(201).json({ success: true, data: result, message: "Document metadata saved" });
        } catch (err: any) {
            logger.error({ err }, "Error in POST /couriers/:id/documents");
            res.status(500).json({ success: false, error: err.message });
        }
    },
);

/**
 * @swagger
 * /couriers/{id}/documents/{docId}:
 *   delete:
 *     summary: Delete a courier document
 *     tags: [Couriers]
 */
router.delete("/:id/documents/:docId", validateUuidParam(), async (req: Request<DocParams>, res: Response) => {
    try {
        const { id, docId } = req.params;
        await courierService.deleteDocumentMeta(id, docId);
        res.json({ success: true, message: `Document ${docId} deleted` });
    } catch (err: any) {
        logger.error({ err }, "Error in DELETE /couriers/:id/documents/:docId");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}/compliance:
 *   patch:
 *     summary: Update courier compliance status
 *     tags: [Couriers]
 */
router.patch(
    "/:id/compliance",
    validateUuidParam(),
    validateBody(complianceSchema),
    async (req: Request<IdParams>, res: Response) => {
        try {
            const { id } = req.params;
            const courier = await courierService.setCompliance(id, req.body.compliance);
            res.json({ success: true, data: courier, message: `Compliance updated to ${req.body.compliance}` });
        } catch (err: any) {
            logger.error({ err, courierId: req.params.id }, "Error updating compliance");
            res.status(500).json({ success: false, error: err.message });
        }
    },
);

/**
 * @swagger
 * /couriers/{id}/password:
 *   post:
 *     summary: Set/reset courier account password
 *     tags: [Couriers]
 */
router.post(
    "/:id/password",
    validateUuidParam(),
    validateBody(passwordSchema),
    async (req: Request<IdParams>, res: Response) => {
        try {
            const { id } = req.params;
            await courierService.setCourierPassword(id, req.body.password);
            res.json({ success: true, message: `Password updated for courier ${id}` });
        } catch (err: any) {
            logger.error({ err, courierId: req.params.id }, "Error updating password for courier");
            res.status(500).json({ success: false, error: err.message });
        }
    },
);

/* ------------------------------------------------------------------ */
/*  Phase 6 — File Upload / Download (stubbed S3)                      */
/* ------------------------------------------------------------------ */

/**
 * @swagger
 * /couriers/{id}/documents/{docId}/upload:
 *   post:
 *     summary: Upload a document file (stub — returns hardcoded success)
 *     tags: [Couriers]
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
 *         description: File uploaded (stubbed)
 */
router.post("/:id/documents/:docId/upload", validateUuidParam(), async (req: Request<DocParams>, res: Response) => {
    // Phase 6 stub: Real implementation will use multer + AWS S3 SDK
    const { id, docId } = req.params;
    logger.info({ courierId: id, docId }, "Stub: S3 upload called");
    res.json({
        success: true,
        message: "File uploaded successfully (stubbed)",
        data: {
            docId,
            s3_key: `couriers/${id}/docs/${docId}`,
            url: `https://s3.stub.example.com/couriers/${id}/docs/${docId}`,
        },
    });
});

/**
 * @swagger
 * /couriers/{id}/documents/{docId}/download:
 *   get:
 *     summary: Download a document file (stub — returns hardcoded URL)
 *     tags: [Couriers]
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
 *         description: Download URL (stubbed)
 */
router.get("/:id/documents/:docId/download", validateUuidParam(), async (req: Request<DocParams>, res: Response) => {
    // Phase 6 stub: Real implementation will generate a presigned S3 URL
    const { id, docId } = req.params;
    logger.info({ courierId: id, docId }, "Stub: S3 download called");
    res.json({
        success: true,
        data: {
            url: `https://s3.stub.example.com/couriers/${id}/docs/${docId}?presigned=stub`,
            expiresIn: 3600,
        },
    });
});

export default router;


