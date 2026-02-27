/**
 * Loads (leads) API. Leads in this DB are created by Admin or via API (e.g. from Shipper app).
 * If using two Supabase projects (Shipper vs Admin/Courier), sync or duplicate leads as needed.
 */
import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Loads
 *   description: Loads (leads) management
 */

/**
 * @swagger
 * /loads:
 *   get:
 *     summary: List all loads (leads)
 *     tags: [Loads]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by lead status (e.g. open)
 *       - in: query
 *         name: shipper_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of loads
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { status, shipper_id, dateFrom, dateTo } = req.query;
        let query = supabaseAdmin
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false });

        if (status) query = query.eq("status", status as string);
        if (shipper_id) query = query.eq("shipper_id", shipper_id as string);
        if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
        if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

        const { data: leads, error } = await query;

        if (error) {
            logger.error({ err: error }, "Error fetching loads");
            return res.status(500).json({ success: false, error: error.message });
        }

        const rows = leads || [];
        const shipperIds = [...new Set((rows as any[]).map((r: any) => r.shipper_id).filter(Boolean))];
        const shipperNames = new Map<string, string>();
        if (shipperIds.length > 0) {
            const { data: shippers } = await supabaseAdmin
                .from("shippers")
                .select("id, name")
                .in("id", shipperIds);
            for (const s of shippers || []) {
                shipperNames.set(s.id, (s as any).name || "");
            }
        }

        const data = rows.map((l: any) => mapLeadToLoad(l, shipperNames.get(l.shipper_id) || ""));
        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /loads");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/stats:
 *   get:
 *     summary: Get load statistics
 *     tags: [Loads]
 */
router.get("/stats", async (_req: Request, res: Response) => {
    try {
        const [leadsRes, tripsRes] = await Promise.all([
            supabaseAdmin.from("leads").select("status"),
            supabaseAdmin.from("trips").select("status"),
        ]);

        if (leadsRes.error && !isMissingTableError(leadsRes.error)) {
            logger.error({ err: leadsRes.error }, "Error fetching load stats");
            return res.status(500).json({ success: false, error: leadsRes.error.message });
        }

        const leads = leadsRes.data || [];
        const trips = (tripsRes.error && isMissingTableError(tripsRes.error)) ? [] : (tripsRes.data || []);
        const byLeadStatus = leads.reduce((acc: Record<string, number>, r: any) => {
            acc[r.status || "open"] = (acc[r.status || "open"] || 0) + 1;
            return acc;
        }, {});
        const inTransit = trips.filter((t: any) => t.status === "in_progress").length;
        const delivered = trips.filter((t: any) => t.status === "completed").length;

        res.json({
            success: true,
            data: {
                total: leads.length,
                inTransit,
                delivered,
                pending: byLeadStatus["open"] || 0,
                cancelled: byLeadStatus["cancelled"] || 0,
                alerts: byLeadStatus["open"] || 0,
            },
        });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /loads/stats");
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /loads/{id}:
 *   get:
 *     summary: Get a single load (lead) by ID
 *     tags: [Loads]
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: lead, error } = await supabaseAdmin
            .from("leads")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !lead) {
            return res.status(404).json({ success: false, error: "Load not found" });
        }

        let shipperName = "";
        if ((lead as any).shipper_id) {
            const { data: sh } = await supabaseAdmin
                .from("shippers")
                .select("name")
                .eq("id", (lead as any).shipper_id)
                .single();
            shipperName = (sh as any)?.name || "";
        }
        res.json({ success: true, data: mapLeadToLoad(lead, shipperName) });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Map DB lead to frontend Load shape (id, vehicle*, shipperInfo, dates, status, courierInfo, docs, history).
 */
function mapLeadToLoad(lead: any, shipperName: string): any {
    const created = lead.created_at ? lead.created_at.split("T")[0] : "";
    let status: "pending" | "in-transit" | "delivered" | "cancelled" = "pending";
    if (lead.status === "cancelled") status = "cancelled";
    else if (lead.status === "completed") status = "delivered";
    else if (lead.is_locked) status = "in-transit";

    return {
        id: lead.id,
        vehicleYear: lead.vehicle_year || "",
        vehicleMake: lead.vehicle_make || "",
        vehicleModel: lead.vehicle_model || "",
        vin: lead.vehicle_vin || "",
        stockNumber: lead.listing_id || "",
        shipperInfo: shipperName || lead.pickup_address || "",
        pickupDate: created,
        dropOffDate: created,
        status,
        courierInfo: "",
        docs: [],
        history: [{ date: created, action: "Load created" }],
        pickup_address: lead.pickup_address,
        delivery_address: lead.delivery_address,
        notes: lead.notes,
        vehicle_type: lead.vehicle_type,
        vehicle_color: lead.vehicle_color,
        initial_price: lead.initial_price,
        payment_type: lead.payment_type,
    };
}

/**
 * POST /loads - Create a lead (load). Requires listing_id, shipper_id, pickup_address, delivery_address.
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const {
            listing_id,
            shipper_id,
            pickup_address,
            delivery_address,
            pickup_location_type,
            pickup_contact_name,
            pickup_contact_phone,
            pickup_contact_email,
            delivery_location_type,
            delivery_contact_name,
            delivery_contact_phone,
            delivery_contact_email,
            vehicle_year,
            vehicle_make,
            vehicle_model,
            vehicle_vin,
            vehicle_type,
            vehicle_color,
            vehicle_runs,
            vehicle_rolls,
            initial_price,
            payment_type,
            notes,
        } = body;

        if (!listing_id || !shipper_id || !pickup_address || !delivery_address) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: listing_id, shipper_id, pickup_address, delivery_address",
            });
        }

        const insert: Record<string, unknown> = {
            listing_id: String(listing_id).trim(),
            shipper_id: shipper_id || null,
            pickup_address: String(pickup_address).trim(),
            delivery_address: String(delivery_address).trim(),
            status: "open",
        };
        if (pickup_location_type != null) insert.pickup_location_type = pickup_location_type;
        if (pickup_contact_name != null) insert.pickup_contact_name = pickup_contact_name;
        if (pickup_contact_phone != null) insert.pickup_contact_phone = pickup_contact_phone;
        if (pickup_contact_email != null) insert.pickup_contact_email = pickup_contact_email;
        if (delivery_location_type != null) insert.delivery_location_type = delivery_location_type;
        if (delivery_contact_name != null) insert.delivery_contact_name = delivery_contact_name;
        if (delivery_contact_phone != null) insert.delivery_contact_phone = delivery_contact_phone;
        if (delivery_contact_email != null) insert.delivery_contact_email = delivery_contact_email;
        if (vehicle_year != null) insert.vehicle_year = vehicle_year;
        if (vehicle_make != null) insert.vehicle_make = vehicle_make;
        if (vehicle_model != null) insert.vehicle_model = vehicle_model;
        if (vehicle_vin != null) insert.vehicle_vin = vehicle_vin;
        if (vehicle_type != null) insert.vehicle_type = vehicle_type;
        if (vehicle_color != null) insert.vehicle_color = vehicle_color;
        if (vehicle_runs != null) insert.vehicle_runs = Boolean(vehicle_runs);
        if (vehicle_rolls != null) insert.vehicle_rolls = Boolean(vehicle_rolls);
        if (initial_price != null) insert.initial_price = Number(initial_price);
        if (payment_type != null) insert.payment_type = payment_type;
        if (notes != null) insert.notes = notes;

        const { data: lead, error } = await supabaseAdmin
            .from("leads")
            .insert(insert)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(503).json({ success: false, error: "Service unavailable" });
            }
            logger.error({ err: error }, "Error creating load");
            return res.status(500).json({ success: false, error: error.message });
        }

        res.status(201).json({ success: true, data: lead });
    } catch (err: unknown) {
        logger.error({ err }, "Error in POST /loads");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body || {};
        const updates: Record<string, unknown> = {};
        const allowed = ["pickup_address", "delivery_address", "vehicle_year", "vehicle_make", "vehicle_model", "vehicle_vin", "vehicle_type", "vehicle_color", "initial_price", "payment_type", "notes", "status"];
        for (const k of allowed) {
            if (body[k] !== undefined) updates[k] = body[k];
        }
        if (Object.keys(updates).length === 0) {
            const { data: row } = await supabaseAdmin.from("leads").select("*").eq("id", id).single();
            return res.json({ success: true, data: row ? mapLeadToLoad(row, "") : null });
        }
        const { data: row, error } = await supabaseAdmin.from("leads").update(updates).eq("id", id).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        if (!row) return res.status(404).json({ success: false, error: "Load not found" });
        let shipperName = "";
        if ((row as any).shipper_id) {
            const { data: sh } = await supabaseAdmin.from("shippers").select("name").eq("id", (row as any).shipper_id).single();
            shipperName = (sh as any)?.name || "";
        }
        res.json({ success: true, data: mapLeadToLoad(row, shipperName) });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err?.message || "Update failed" });
    }
});
router.patch("/:id/status", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        if (!status) return res.status(400).json({ success: false, error: "status required" });
        const { data: row, error } = await supabaseAdmin.from("leads").update({ status }).eq("id", id).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        if (!row) return res.status(404).json({ success: false, error: "Load not found" });
        res.json({ success: true, data: row });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err?.message || "Status update failed" });
    }
});
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: row, error } = await supabaseAdmin.from("leads").update({ status: "cancelled" }).eq("id", id).select().single();
        if (error) return res.status(500).json({ success: false, error: error.message });
        if (!row) return res.status(404).json({ success: false, error: "Load not found" });
        res.json({ success: true, message: "Load cancelled" });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err?.message || "Delete failed" });
    }
});
router.get("/:id/history", (req: Request, res: Response) => {
    res.json({ success: true, data: [], message: `History for load ${req.params.id}` });
});
router.post("/:id/documents", (req: Request, res: Response) => {
    res.status(501).json({ success: false, message: "Document upload not implemented" });
});
router.delete("/:id/documents/:docId", (req: Request, res: Response) => {
    res.status(501).json({ success: false, message: "Document delete not implemented" });
});

export default router;
