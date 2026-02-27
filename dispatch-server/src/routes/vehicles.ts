import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Courier vehicles
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: List vehicles (by courier_id or filters)
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: courier_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: is_available
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const courierId = (req.query.courier_id as string) || req.user?.id;
        const isAvailable = req.query.is_available as string | undefined;

        let query = supabaseAdmin
            .from("vehicles")
            .select("*")
            .order("created_at", { ascending: false });

        if (courierId) query = query.eq("courier_id", courierId);
        if (isAvailable !== undefined) query = query.eq("is_available", isAvailable === "true");

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Error fetching vehicles");
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: rows || [] });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /vehicles");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get vehicle by id
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicle
 *       404:
 *         description: Not found
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: row, error } = await supabaseAdmin
            .from("vehicles")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Not found" });
            }
            if (error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Vehicle not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: row });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /vehicles/:id");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Create vehicle
 *     tags: [Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courier_id, reg_no]
 *             properties:
 *               courier_id: { type: string, format: uuid }
 *               reg_no: { type: string }
 *               vehicle_type: { type: string }
 *               vin: { type: string }
 *               is_available: { type: boolean }
 *     responses:
 *       201:
 *         description: Created vehicle
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const courierId = req.body.courier_id || req.user?.id;
        const { reg_no, vehicle_type, vin, is_available } = req.body;

        if (!courierId || !reg_no) {
            return res.status(400).json({
                success: false,
                error: "courier_id and reg_no are required (or send Authorization for courier)",
            });
        }

        const { data: row, error } = await supabaseAdmin
            .from("vehicles")
            .insert({
                courier_id: courierId,
                reg_no: String(reg_no).trim(),
                vehicle_type: vehicle_type ?? null,
                vin: vin ?? null,
                is_available: is_available !== false,
            })
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(503).json({ success: false, error: "Service unavailable" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }

        res.status(201).json({ success: true, data: row });
    } catch (err: unknown) {
        logger.error({ err }, "Error in POST /vehicles");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reg_no: { type: string }
 *               vehicle_type: { type: string }
 *               vin: { type: string }
 *               is_available: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated vehicle
 *       404:
 *         description: Not found
 */
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reg_no, vehicle_type, vin, is_available } = req.body;

        const updates: Record<string, unknown> = {};
        if (reg_no !== undefined) updates.reg_no = String(reg_no).trim();
        if (vehicle_type !== undefined) updates.vehicle_type = vehicle_type ?? null;
        if (vin !== undefined) updates.vin = vin ?? null;
        if (is_available !== undefined) updates.is_available = Boolean(is_available);

        if (Object.keys(updates).length === 0) {
            const { data: row, error } = await supabaseAdmin.from("vehicles").select("*").eq("id", id).single();
            if (error || !row) {
                return res.status(404).json({ success: false, error: "Vehicle not found" });
            }
            return res.json({ success: true, data: row });
        }

        const { data: row, error } = await supabaseAdmin
            .from("vehicles")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Not found" });
            }
            if (error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Vehicle not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: row });
    } catch (err: unknown) {
        logger.error({ err }, "Error in PUT /vehicles/:id");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /vehicles/{id}:
 *   patch:
 *     summary: Partial update (e.g. is_available)
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_available: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated vehicle
 */
router.patch("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reg_no, vehicle_type, vin, is_available } = req.body;

        const updates: Record<string, unknown> = {};
        if (reg_no !== undefined) updates.reg_no = String(reg_no).trim();
        if (vehicle_type !== undefined) updates.vehicle_type = vehicle_type ?? null;
        if (vin !== undefined) updates.vin = vin ?? null;
        if (is_available !== undefined) updates.is_available = Boolean(is_available);

        if (Object.keys(updates).length === 0) {
            const { data: row, error } = await supabaseAdmin.from("vehicles").select("*").eq("id", id).single();
            if (error || !row) {
                return res.status(404).json({ success: false, error: "Vehicle not found" });
            }
            return res.json({ success: true, data: row });
        }

        const { data: row, error } = await supabaseAdmin
            .from("vehicles")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Not found" });
            }
            if (error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Vehicle not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: row });
    } catch (err: unknown) {
        logger.error({ err }, "Error in PATCH /vehicles/:id");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

export default router;
