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
            .select("*")
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

        const contracts = rows || [];
        const leadIds = [...new Set((contracts as any[]).map((c: any) => c.lead_id).filter(Boolean))];
        const courierIds = [...new Set((contracts as any[]).map((c: any) => c.courier_id).filter(Boolean))];
        const shipperIds = [...new Set((contracts as any[]).map((c: any) => c.shipper_id).filter(Boolean))];

        const [leadsRes, couriersRes, shippersRes] = await Promise.all([
            leadIds.length ? supabaseAdmin.from("leads").select("id, listing_id, pickup_address, delivery_address, vehicle_year, vehicle_make, vehicle_model, vehicle_vin, status").in("id", leadIds) : { data: [] },
            courierIds.length ? supabaseAdmin.from("couriers").select("id, name").in("id", courierIds) : { data: [] },
            shipperIds.length ? supabaseAdmin.from("shippers").select("id, name").in("id", shipperIds) : { data: [] },
        ]);

        const leadsMap = new Map((leadsRes.data || []).map((l: any) => [l.id, l]));
        const couriersMap = new Map((couriersRes.data || []).map((c: any) => [c.id, c.name]));
        const shippersMap = new Map((shippersRes.data || []).map((s: any) => [s.id, s.name]));

        const data = (contracts as any[]).map((c: any) => ({
            ...c,
            lead: leadsMap.get(c.lead_id) || null,
            courierName: couriersMap.get(c.courier_id),
            shipperName: shippersMap.get(c.shipper_id),
        }));
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
        const { data: contract, error } = await supabaseAdmin
            .from("contracts")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Contract not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!contract) {
            return res.status(404).json({ success: false, error: "Contract not found" });
        }

        const [leadRes, courierRes, shipperRes] = await Promise.all([
            supabaseAdmin.from("leads").select("*").eq("id", (contract as any).lead_id).single(),
            supabaseAdmin.from("couriers").select("id, name").eq("id", (contract as any).courier_id).single(),
            supabaseAdmin.from("shippers").select("id, name").eq("id", (contract as any).shipper_id).single(),
        ]);

        const out = {
            ...contract,
            lead: leadRes.data,
            courierName: (courierRes.data as any)?.name,
            shipperName: (shipperRes.data as any)?.name,
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
