import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contracts
 *   description: Contract management
 */

/**
 * @swagger
 * /contracts:
 *   get:
 *     summary: List contracts with optional filters
 *     tags: [Contracts]
 *     parameters:
 *       - in: query
 *         name: courier_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: shipper_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of contracts
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { courier_id, shipper_id, status } = req.query;
        let query = supabaseAdmin
            .from("contracts")
            .select("*, leads(id, listing_id, pickup_address, delivery_address, vehicle_year, vehicle_make, vehicle_model, vehicle_vin, status), couriers(id, name), shippers(id, name)")
            .order("created_at", { ascending: false });

        if (courier_id) query = query.eq("courier_id", courier_id as string);
        if (shipper_id) query = query.eq("shipper_id", shipper_id as string);
        if (status) query = query.eq("status", status as string);

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Error fetching contracts");
            return res.status(500).json({ success: false, error: error.message });
        }

        const data = (rows || []).map((c: any) => {
            const { leads, couriers, shippers, ...rest } = c;
            return {
                ...rest,
                lead: leads ?? null,
                courierName: couriers?.name ?? null,
                shipperName: shippers?.name ?? null,
            };
        });
        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /contracts");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /contracts/{id}:
 *   get:
 *     summary: Get a single contract by ID
 *     tags: [Contracts]
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: row, error } = await supabaseAdmin
            .from("contracts")
            .select("*, leads(*), couriers(id, name), shippers(id, name)")
            .eq("id", id)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Contract not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, error: "Contract not found" });
        }

        const { leads, couriers, shippers, ...contract } = row as any;
        const out = {
            ...contract,
            lead: leads ?? null,
            courierName: couriers?.name ?? null,
            shipperName: shippers?.name ?? null,
        };
        res.json({ success: true, data: out });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /contracts:
 *   post:
 *     summary: Create contract (and trip; optionally vehicle_access)
 *     tags: [Contracts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lead_id, courier_id, shipper_id, amount, pickup_time, expected_reach_time, start_location, end_location]
 *             properties:
 *               lead_id: { type: string, format: uuid }
 *               courier_id: { type: string, format: uuid }
 *               shipper_id: { type: string, format: uuid }
 *               amount: { type: number }
 *               pickup_time: { type: string, format: date-time }
 *               expected_reach_time: { type: string, format: date-time }
 *               start_location: { type: string }
 *               end_location: { type: string }
 *               status: { type: string, enum: [draft, signed, active, completed, cancelled] }
 *               vehicle_id: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Contract and trip created
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const {
            lead_id,
            courier_id,
            shipper_id,
            amount,
            pickup_time,
            expected_reach_time,
            start_location,
            end_location,
            status = "draft",
            vehicle_id,
        } = body;

        if (!lead_id || !courier_id || !shipper_id || amount == null || !pickup_time || !expected_reach_time || !start_location || !end_location) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: lead_id, courier_id, shipper_id, amount, pickup_time, expected_reach_time, start_location, end_location",
            });
        }

        const { data: contract, error: contractError } = await supabaseAdmin
            .from("contracts")
            .insert({
                lead_id,
                courier_id,
                shipper_id,
                amount: parseFloat(amount),
                pickup_time,
                expected_reach_time,
                start_location,
                end_location,
                status,
            })
            .select()
            .single();

        if (contractError || !contract) {
            logger.error({ err: contractError }, "Error creating contract");
            return res.status(500).json({ success: false, error: (contractError as any)?.message || "Failed to create contract" });
        }

        const { data: trip, error: tripError } = await supabaseAdmin
            .from("trips")
            .insert({
                contract_id: (contract as any).id,
                status: "scheduled",
                vehicle_state: "contract_made_will_pickup",
            })
            .select()
            .single();

        if (tripError || !trip) {
            logger.error({ err: tripError }, "Error creating trip");
            return res.status(500).json({ success: false, error: (tripError as any)?.message || "Failed to create trip" });
        }

        if (vehicle_id) {
            const wef = new Date().toISOString();
            const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            await supabaseAdmin.from("vehicle_access").insert({
                vehicle_id,
                shipper_id,
                trip_id: (trip as any).id,
                wef_dt: wef,
                exp_dt: exp,
                is_active: true,
            });
        }

        const { error: notifError } = await supabaseAdmin.from("notification_log").insert({
            event_type: "courier_assigned",
            trip_id: (trip as any).id,
            contract_id: (contract as any).id,
        });
        if (notifError) {
            logger.warn({ err: notifError }, "Failed to insert courier_assigned alert; contract created");
        }

        res.status(201).json({
            success: true,
            data: { contract, trip },
            message: "Contract and trip created",
        });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /contracts");
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
