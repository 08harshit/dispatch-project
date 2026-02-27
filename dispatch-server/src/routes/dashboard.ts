import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";

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
router.get("/stats", async (_req: Request, res: Response) => {
    const empty = {
        totalCouriers: 0,
        totalShippers: 0,
        totalTransactions: 0,
        activeAlerts: 0,
        couriersCompliant: 0,
        couriersNonCompliant: 0,
        shippersCompliant: 0,
        shippersNonCompliant: 0,
    };
    try {
        const [couriersRes, shippersRes, invoicesRes] = await Promise.all([
            supabaseAdmin.from("couriers").select("id, compliance"),
            supabaseAdmin.from("shippers").select("id, compliance"),
            supabaseAdmin.from("invoices").select("id"),
        ]);

        if (couriersRes.error && isMissingTableError(couriersRes.error)) {
            return res.json({ success: true, data: empty });
        }
        if (couriersRes.error) {
            logger.error({ err: couriersRes.error }, "Dashboard stats couriers");
            return res.status(500).json({ success: false, error: couriersRes.error.message });
        }
        if (shippersRes.error && isMissingTableError(shippersRes.error)) {
            return res.json({ success: true, data: empty });
        }
        if (shippersRes.error) {
            logger.error({ err: shippersRes.error }, "Dashboard stats shippers");
            return res.status(500).json({ success: false, error: shippersRes.error.message });
        }

        const couriers = couriersRes.data || [];
        const shippers = shippersRes.data || [];
        const totalCouriers = couriers.length;
        const totalShippers = shippers.length;
        const totalTransactions = (invoicesRes.data || []).length;
        const couriersCompliant = couriers.filter((c: { compliance?: string }) => c.compliance === "compliant").length;
        const couriersNonCompliant = totalCouriers - couriersCompliant;
        const shippersCompliant = shippers.filter((s: { compliance?: string }) => s.compliance === "compliant").length;
        const shippersNonCompliant = totalShippers - shippersCompliant;

        res.json({
            success: true,
            data: {
                totalCouriers,
                totalShippers,
                totalTransactions,
                activeAlerts: 0,
                couriersCompliant,
                couriersNonCompliant,
                shippersCompliant,
                shippersNonCompliant,
            },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/stats");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
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
router.get("/recent-activity", async (_req: Request, res: Response) => {
    try {
        const { data: contracts, error } = await supabaseAdmin
            .from("contracts")
            .select("id, status, created_at, courier_id, shipper_id")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Dashboard recent-activity");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = contracts || [];
        const courierIds = [...new Set(list.map((c: { courier_id?: string }) => c.courier_id).filter(Boolean))];
        const shipperIds = [...new Set(list.map((c: { shipper_id?: string }) => c.shipper_id).filter(Boolean))];
        const [couriersRes, shippersRes] = await Promise.all([
            courierIds.length ? supabaseAdmin.from("couriers").select("id, name").in("id", courierIds) : { data: [] },
            shipperIds.length ? supabaseAdmin.from("shippers").select("id, name").in("id", shipperIds) : { data: [] },
        ]);
        const courierNames = new Map((couriersRes.data || []).map((c: { id: string; name: string }) => [c.id, c.name]));
        const shipperNames = new Map((shippersRes.data || []).map((s: { id: string; name: string }) => [s.id, s.name]));

        const data = list.map((c: { id: string; status: string; created_at: string; courier_id?: string; shipper_id?: string }) => ({
            id: c.id,
            entity: courierNames.get(c.courier_id ?? "") || shipperNames.get(c.shipper_id ?? "") || "Unknown",
            entityType: courierNames.has(c.courier_id ?? "") ? "courier" : "shipper",
            action: "Contract " + (c.status === "signed" || c.status === "active" ? "signed" : c.status),
            status: c.status === "completed" ? "completed" : c.status === "cancelled" ? "failed" : "pending",
            date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
        }));
        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/recent-activity");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
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
