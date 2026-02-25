import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
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
            .select("*")
            .order("created_at", { ascending: false });

        if (contract_id) query = query.eq("contract_id", contract_id as string);
        if (status) query = query.eq("status", status as string);

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            console.error("Error fetching trips:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        let trips = rows || [];
        if (courier_id) {
            const contractIds = (trips as any[]).map((t: any) => t.contract_id);
            if (contractIds.length > 0) {
                const { data: contracts } = await supabaseAdmin
                    .from("contracts")
                    .select("id")
                    .eq("courier_id", courier_id as string)
                    .in("id", contractIds);
                const ids = new Set((contracts || []).map((c: any) => c.id));
                trips = (trips as any[]).filter((t: any) => ids.has(t.contract_id));
            } else {
                trips = [];
            }
        }

        const contractIds = [...new Set((trips as any[]).map((t: any) => t.contract_id))];
        const { data: contractsList } = contractIds.length
            ? await supabaseAdmin.from("contracts").select("id, lead_id, courier_id, shipper_id, amount, pickup_time, start_location, end_location, status").in("id", contractIds)
            : { data: [] };
        const contractsMap = new Map((contractsList || []).map((c: any) => [c.id, c]));
        const leadIds = [...new Set((contractsList || []).map((c: any) => c.lead_id).filter(Boolean))];
        let leadsMap: Record<string, any> = {};
        if (leadIds.length > 0) {
            const { data: leads } = await supabaseAdmin.from("leads").select("*").in("id", leadIds);
            for (const l of leads || []) {
                leadsMap[(l as any).id] = l;
            }
        }

        const out = (trips as any[]).map((t: any) => {
            const contract = contractsMap.get(t.contract_id) || null;
            return {
                ...t,
                contract,
                lead: contract?.lead_id ? leadsMap[contract.lead_id] : null,
            };
        });
        res.json({ success: true, data: out });
    } catch (err: any) {
        console.error("Error in GET /trips:", err);
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
        const { data: trip, error } = await supabaseAdmin
            .from("trips")
            .select("*")
            .eq("id", id)
            .single();

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
        const [contractRes, eventsRes, leadRes] = await Promise.all([
            supabaseAdmin.from("contracts").select("*").eq("id", c.contract_id).single(),
            supabaseAdmin.from("trip_events").select("*").eq("trip_id", id).order("occurred_at", { ascending: true }),
            supabaseAdmin.from("contracts").select("lead_id").eq("id", c.contract_id).single(),
        ]);

        const contract = contractRes.data as any;
        const leadId = (leadRes.data as any)?.lead_id;
        let lead = null;
        if (leadId) {
            const lr = await supabaseAdmin.from("leads").select("*").eq("id", leadId).single();
            lead = lr.data;
        }

        res.json({
            success: true,
            data: {
                ...trip,
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
            console.error("Error inserting trip event:", error);
            return res.status(500).json({ success: false, error: (error as any).message });
        }

        res.status(201).json({ success: true, data: event, message: "Event recorded" });
    } catch (err: any) {
        console.error("Error in POST /trips/:id/events:", err);
        res.status(500).json({ success: false, error: (err as any).message });
    }
});

export default router;
