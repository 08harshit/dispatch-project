import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Loads
 *   description: Vehicle load/shipment management
 */

/**
 * @swagger
 * /loads:
 *   get:
 *     summary: List all loads
 *     tags: [Loads]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by ID, VIN, vehicle info, shipper, or courier
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in-transit, delivered, cancelled] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortField
 *         schema: { type: string, enum: [id, vehicleInfo, shipperInfo, pickupDate, dropOffDate, status, courierInfo] }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: List of loads
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Load'
 */
router.get("/", (_req: Request, res: Response) => {
    res.json({ success: true, data: [], message: "List loads" });
});

/**
 * @swagger
 * /loads/stats:
 *   get:
 *     summary: Get load statistics
 *     tags: [Loads]
 *     responses:
 *       200:
 *         description: Load stats
 */
router.get("/stats", (_req: Request, res: Response) => {
    res.json({ success: true, data: { total: 0, inTransit: 0, delivered: 0, pending: 0, cancelled: 0, alerts: 0 } });
});

/**
 * @swagger
 * /loads/{id}:
 *   get:
 *     summary: Get a single load by ID
 *     tags: [Loads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Load details
 */
router.get("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Get load ${req.params.id}` });
});

/**
 * @swagger
 * /loads:
 *   post:
 *     summary: Create a new load (vehicle shipment)
 *     tags: [Loads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleYear, vehicleMake, vehicleModel, vin, shipperInfo, courierInfo, pickupDate, dropOffDate]
 *             properties:
 *               vehicleYear: { type: string, example: "2024" }
 *               vehicleMake: { type: string, example: "Toyota" }
 *               vehicleModel: { type: string, example: "Camry" }
 *               vin: { type: string, example: "1HGBH41JXMN109186" }
 *               stockNumber: { type: string }
 *               shipperInfo: { type: string }
 *               courierInfo: { type: string }
 *               pickupDate: { type: string, format: date }
 *               dropOffDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Load created
 */
router.post("/", (_req: Request, res: Response) => {
    res.json({ success: true, data: null, message: "Load created" });
});

/**
 * @swagger
 * /loads/{id}:
 *   put:
 *     summary: Update a load
 *     tags: [Loads]
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
 *             $ref: '#/components/schemas/Load'
 *     responses:
 *       200:
 *         description: Load updated
 */
router.put("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Load ${req.params.id} updated` });
});

/**
 * @swagger
 * /loads/{id}/status:
 *   patch:
 *     summary: Update load status
 *     tags: [Loads]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-transit, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Load ${req.params.id} status updated` });
});

/**
 * @swagger
 * /loads/{id}:
 *   delete:
 *     summary: Delete a load
 *     tags: [Loads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Load deleted
 */
router.delete("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Load ${req.params.id} deleted` });
});

/**
 * @swagger
 * /loads/{id}/history:
 *   get:
 *     summary: Get load history timeline
 *     tags: [Loads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: History timeline
 */
router.get("/:id/history", (req: Request, res: Response) => {
    res.json({ success: true, data: [], message: `History for load ${req.params.id}` });
});

/**
 * @swagger
 * /loads/{id}/documents:
 *   get:
 *     summary: Get load documents (BOL, inspection reports, etc.)
 *     tags: [Loads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document list
 *   post:
 *     summary: Upload a document for a load
 *     tags: [Loads]
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
    res.json({ success: true, data: null, message: `Document uploaded for load ${req.params.id}` });
});

/**
 * @swagger
 * /loads/{id}/documents/{docId}:
 *   delete:
 *     summary: Delete a load document
 *     tags: [Loads]
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

export default router;
