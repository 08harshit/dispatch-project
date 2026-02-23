import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Internal ticket/issue tracking
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: List all tickets
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in-progress, resolved, closed] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: sortField
 *         schema: { type: string, enum: [id, title, priority, status, createdAt] }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: List of tickets
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 */
router.get("/", (_req: Request, res: Response) => {
    res.json({ success: true, data: [], message: "List tickets" });
});

/**
 * @swagger
 * /tickets/stats:
 *   get:
 *     summary: Get ticket statistics
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Ticket stats (open, in-progress, resolved, high-priority counts)
 */
router.get("/stats", (_req: Request, res: Response) => {
    res.json({ success: true, data: { open: 0, inProgress: 0, resolved: 0, closed: 0, highPriority: 0 } });
});

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get a single ticket with comments
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket details with comments
 */
router.get("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Get ticket ${req.params.id}` });
});

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, priority]
 *             properties:
 *               title: { type: string, example: "Update courier payment schedule" }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *     responses:
 *       200:
 *         description: Ticket created
 */
router.post("/", (_req: Request, res: Response) => {
    res.json({ success: true, data: null, message: "Ticket created" });
});

/**
 * @swagger
 * /tickets/{id}:
 *   put:
 *     summary: Update a ticket
 *     tags: [Tickets]
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
 *             $ref: '#/components/schemas/Ticket'
 *     responses:
 *       200:
 *         description: Ticket updated
 */
router.put("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Ticket ${req.params.id} updated` });
});

/**
 * @swagger
 * /tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status
 *     tags: [Tickets]
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
 *                 enum: [open, in-progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Ticket ${req.params.id} status updated` });
});

/**
 * @swagger
 * /tickets/{id}:
 *   delete:
 *     summary: Delete a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket deleted
 */
router.delete("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Ticket ${req.params.id} deleted` });
});

/**
 * @swagger
 * /tickets/{id}/comments:
 *   get:
 *     summary: Get ticket comments
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *   post:
 *     summary: Add a comment to a ticket
 *     tags: [Tickets]
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
 *             required: [text]
 *             properties:
 *               text: { type: string, example: "Checked with the courier, still pending." }
 *     responses:
 *       200:
 *         description: Comment added
 */
router.post("/:id/comments", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Comment added to ticket ${req.params.id}` });
});

export default router;
