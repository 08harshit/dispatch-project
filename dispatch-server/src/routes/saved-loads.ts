import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { resolveCourierId } from "../utils/authHelpers";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Saved Loads
 *   description: Courier saved loads (bookmarks)
 */

/**
 * @swagger
 * /saved-loads:
 *   get:
 *     summary: List saved loads for a courier
 *     tags: [Saved Loads]
 *     parameters:
 *       - in: query
 *         name: courier_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of saved loads with lead summary
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        let courier_id = req.query.courier_id as string | undefined;
        if (!courier_id && req.user?.id) {
            courier_id = (await resolveCourierId(supabaseAdmin, req.user.id)) || undefined;
        }
        if (!courier_id) {
            return res.status(400).json({ success: false, error: "courier_id is required or send Authorization: Bearer <token>" });
        }

        const { data: saved, error } = await supabaseAdmin
            .from("saved_loads")
            .select("id, lead_id, saved_at")
            .eq("courier_id", courier_id as string)
            .order("saved_at", { ascending: false });

        if (error) {
            logger.error({ err: error }, "Error fetching saved loads");
            return res.status(500).json({ success: false, error: error.message });
        }

        const rows = saved || [];
        if (rows.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const leadIds = (rows as any[]).map((r: any) => r.lead_id);
        const { data: leads, error: leadsError } = await supabaseAdmin
            .from("leads")
            .select("*")
            .in("id", leadIds);

        if (leadsError) {
            logger.error({ err: leadsError }, "Error fetching leads for saved loads");
            return res.status(500).json({ success: false, error: leadsError.message });
        }

        const leadsMap = new Map((leads || []).map((l: any) => [l.id, l]));
        const data = (rows as any[]).map((r: any) => ({
            id: r.id,
            lead_id: r.lead_id,
            saved_at: r.saved_at,
            lead: leadsMap.get(r.lead_id) || null,
        }));

        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /saved-loads");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /saved-loads:
 *   post:
 *     summary: Save a load (add to saved)
 *     tags: [Saved Loads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courier_id, lead_id]
 *             properties:
 *               courier_id: { type: string, format: uuid }
 *               lead_id: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Saved
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        let courier_id = req.body.courier_id as string | undefined;
        if (!courier_id && req.user?.id) {
            courier_id = (await resolveCourierId(supabaseAdmin, req.user.id)) || undefined;
        }
        const lead_id = req.body.lead_id;
        if (!courier_id || !lead_id) {
            return res.status(400).json({ success: false, error: "lead_id is required; courier_id required or send Authorization: Bearer <token>" });
        }

        const { data, error } = await supabaseAdmin
            .from("saved_loads")
            .upsert({ courier_id, lead_id }, { onConflict: "courier_id,lead_id" })
            .select()
            .single();

        if (error) {
            logger.error({ err: error }, "Error saving load");
            return res.status(500).json({ success: false, error: (error as any).message });
        }

        res.status(201).json({ success: true, data, message: "Load saved" });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /saved-loads");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /saved-loads/by-lead:
 *   delete:
 *     summary: Remove saved load by courier_id and lead_id
 *     tags: [Saved Loads]
 *     parameters:
 *       - in: query
 *         name: courier_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: lead_id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router.delete("/by-lead", async (req: Request, res: Response) => {
    try {
        let courier_id = req.query.courier_id as string | undefined;
        if (!courier_id && req.user?.id) {
            courier_id = (await resolveCourierId(supabaseAdmin, req.user.id)) || undefined;
        }
        const lead_id = req.query.lead_id as string;
        if (!courier_id || !lead_id) {
            return res.status(400).json({ success: false, error: "lead_id is required; courier_id required or send Authorization: Bearer <token>" });
        }

        const { data: existing } = await supabaseAdmin
            .from("saved_loads")
            .select("id, lead_id, courier_id, saved_at")
            .eq("courier_id", courier_id)
            .eq("lead_id", lead_id)
            .maybeSingle();

        const { error } = await supabaseAdmin
            .from("saved_loads")
            .delete()
            .eq("courier_id", courier_id)
            .eq("lead_id", lead_id);

        if (error) {
            logger.error({ err: error }, "Error deleting saved load by lead");
            return res.status(500).json({ success: false, error: (error as any).message });
        }

        res.json({ success: true, data: existing || { id: null, lead_id, courier_id }, message: "Saved load removed" });
    } catch (err: any) {
        logger.error({ err }, "Error in DELETE /saved-loads/by-lead");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /saved-loads/{id}:
 *   delete:
 *     summary: Remove a saved load by saved_loads.id
 *     tags: [Saved Loads]
 */
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: existing } = await supabaseAdmin
            .from("saved_loads")
            .select("id, lead_id, courier_id, saved_at")
            .eq("id", id)
            .maybeSingle();

        const { error } = await supabaseAdmin
            .from("saved_loads")
            .delete()
            .eq("id", id);

        if (error) {
            logger.error({ err: error }, "Error deleting saved load");
            return res.status(500).json({ success: false, error: (error as any).message });
        }

        res.json({ success: true, data: existing || { id, lead_id: null, courier_id: null }, message: "Saved load removed" });
    } catch (err: any) {
        logger.error({ err }, "Error in DELETE /saved-loads/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
