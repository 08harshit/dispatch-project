import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard aggregated data
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard aggregate stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get("/stats", (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            totalCouriers: 0, totalShippers: 0, totalTransactions: 0, activeAlerts: 0,
            couriersCompliant: 0, couriersNonCompliant: 0, shippersCompliant: 0, shippersNonCompliant: 0,
        },
    });
});

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity feed
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent activity entries
 */
router.get("/recent-activity", (_req: Request, res: Response) => {
    res.json({ success: true, data: [] });
});

/**
 * @swagger
 * /dashboard/alerts:
 *   get:
 *     summary: Get active alerts/notifications
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Alert list
 */
router.get("/alerts", (_req: Request, res: Response) => {
    res.json({ success: true, data: [] });
});

/**
 * @swagger
 * /dashboard/alerts/{id}/read:
 *   patch:
 *     summary: Mark an alert as read
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert marked as read
 */
router.patch("/alerts/:id/read", (req: Request, res: Response) => {
    res.json({ success: true, message: `Alert ${req.params.id} marked as read` });
});

/**
 * @swagger
 * /dashboard/alerts/{id}:
 *   delete:
 *     summary: Dismiss an alert
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert dismissed
 */
router.delete("/alerts/:id", (req: Request, res: Response) => {
    res.json({ success: true, message: `Alert ${req.params.id} dismissed` });
});

export default router;
