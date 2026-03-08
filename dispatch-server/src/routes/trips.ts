import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Trip management
 */

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: List trips with optional filters
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: contract_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: courier_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of trips
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { contract_id, courier_id, status } = req.query;
        let query = supabaseAdmin
            .from("trips")
            .select("*, contracts(*, leads(*), couriers(name), shippers(name))")
            .order("created_at", { ascending: false });

        if (contract_id) query = query.eq("contract_id", contract_id as string);
        if (status) query = query.eq("status", status as string);
        if (courier_id) query = query.eq("contracts.courier_id", courier_id as string);

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Error fetching trips");
            return res.status(500).json({ success: false, error: error.message });
        }

        const out = (rows || []).map((t: any) => {
            const contractRow = t.contracts ?? null;
            const lead = contractRow?.leads ?? null;
            const { contracts, ...trip } = t;
            const contract = contractRow
                ? (({ leads: _l, couriers: _c, shippers: _s, ...c }) => c)(contractRow)
                : null;
            return {
                ...trip,
                contract,
                lead,
            };
        });
        res.json({ success: true, data: out });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /trips");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Get a single trip by ID with contract and lead
 *     tags: [Trips]
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [tripRes, eventsRes] = await Promise.all([
            supabaseAdmin
                .from("trips")
                .select("*, contracts(*, leads(*), couriers(name), shippers(name))")
                .eq("id", id)
                .single(),
            supabaseAdmin.from("trip_events").select("*").eq("trip_id", id).order("occurred_at", { ascending: true }),
        ]);

        const { data: trip, error } = tripRes;
        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Trip not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!trip) {
            return res.status(404).json({ success: false, error: "Trip not found" });
        }

        const c = trip as any;
        const contractRow = c.contracts ?? null;
        const lead = contractRow?.leads ?? null;
        const contract = contractRow
            ? (({ leads: _l, couriers: _c, shippers: _s, ...ct }) => ct)(contractRow)
            : null;

        const { contracts: _c, ...tripData } = c;
        res.json({
            success: true,
            data: {
                ...tripData,
                contract,
                lead,
                events: eventsRes.data || [],
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /trips/{id}:
 *   patch:
 *     summary: Update trip status (e.g. cancel)
 *     tags: [Trips]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [cancelled] }
 *     responses:
 *       200:
 *         description: Trip updated
 */
router.patch("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== "cancelled") {
            return res.status(400).json({ success: false, error: "Only status 'cancelled' is supported" });
        }

        const { data: existing, error: fetchError } = await supabaseAdmin
            .from("trips")
            .select("id, status, contract_id")
            .eq("id", id)
            .single();

        if (fetchError || !existing) {
            if (isMissingTableError(fetchError as any)) {
                return res.status(404).json({ success: false, error: "Trip not found" });
            }
            return res.status(500).json({ success: false, error: (fetchError as any)?.message || "Trip not found" });
        }

        if ((existing as any).status === "completed") {
            return res.status(400).json({ success: false, error: "Cannot cancel a completed trip" });
        }

        if ((existing as any).status === "cancelled") {
            return res.status(400).json({ success: false, error: "Trip is already cancelled" });
        }

        const { data: updated, error: updateError } = await supabaseAdmin
            .from("trips")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (updateError) {
            logger.error({ err: updateError }, "Error cancelling trip");
            return res.status(500).json({ success: false, error: (updateError as any).message });
        }

        const { error: notifError } = await supabaseAdmin.from("notification_log").insert({
            event_type: "trip_cancelled",
            trip_id: id,
            contract_id: (existing as any).contract_id,
        });
        if (notifError) {
            logger.warn({ err: notifError }, "Failed to insert trip_cancelled notification; trip cancelled");
        }

        res.json({ success: true, data: updated, message: "Trip cancelled" });
    } catch (err: any) {
        logger.error({ err }, "Error in PATCH /trips/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /trips/{id}/events:
 *   post:
 *     summary: Record a trip event (pickup_scan or delivery_scan)
 *     tags: [Trips]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event_type, scanned_value]
 *             properties:
 *               event_type: { type: string, enum: [pickup_scan, delivery_scan] }
 *               scanned_value: { type: string }
 *               occurred_at: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Event recorded
 */
router.post("/:id/events", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { event_type, scanned_value, occurred_at } = req.body;

        if (!event_type || !scanned_value) {
            return res.status(400).json({ success: false, error: "event_type and scanned_value are required" });
        }
        if (event_type !== "pickup_scan" && event_type !== "delivery_scan") {
            return res.status(400).json({ success: false, error: "event_type must be pickup_scan or delivery_scan" });
        }

        const { data: event, error } = await supabaseAdmin
            .from("trip_events")
            .insert({
                trip_id: id,
                event_type,
                scanned_value: String(scanned_value),
                occurred_at: occurred_at || new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            logger.error({ err: error }, "Error inserting trip event");
            return res.status(500).json({ success: false, error: (error as any).message });
        }

        res.status(201).json({ success: true, data: event, message: "Event recorded" });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /trips/:id/events");
        res.status(500).json({ success: false, error: (err as any).message });
    }
});

export default router;
