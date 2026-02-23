import { Router, Request, Response } from "express";

const router = Router();

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
router.get("/", (_req: Request, res: Response) => {
    res.json({ success: true, data: [], message: "List shippers" });
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
router.get("/stats", (_req: Request, res: Response) => {
    res.json({ success: true, data: { total: 0, compliant: 0, nonCompliant: 0, new: 0, alerts: 0 } });
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
router.get("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Get shipper ${req.params.id}` });
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
