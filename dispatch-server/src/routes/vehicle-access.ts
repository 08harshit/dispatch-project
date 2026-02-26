import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vehicle Access
 *   description: Time-bound vehicle access for shippers (read-only)
 */

/**
 * @swagger
 * /vehicle-access:
 *   get:
 *     summary: List vehicle access records
 *     tags: [Vehicle Access]
 *     parameters:
 *       - in: query
 *         name: shipper_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: vehicle_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: active_only
 *         schema: { type: boolean }
 *         description: If true, only return is_active = true
 *     responses:
 *       200:
 *         description: List of vehicle access records
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const shipperId = req.query.shipper_id as string | undefined;
        const vehicleId = req.query.vehicle_id as string | undefined;
        const activeOnly = req.query.active_only === "true";

        let query = supabaseAdmin
            .from("vehicle_access")
            .select("*")
            .order("created_at", { ascending: false });

        if (shipperId) query = query.eq("shipper_id", shipperId);
        if (vehicleId) query = query.eq("vehicle_id", vehicleId);
        if (activeOnly) query = query.eq("is_active", true);

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            console.error("Error fetching vehicle_access:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: rows || [] });
    } catch (err: unknown) {
        console.error("Error in GET /vehicle-access:", err);
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

export default router;
