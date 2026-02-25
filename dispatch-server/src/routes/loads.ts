/**
 * Loads (leads) API. Leads in this DB are created by Admin or via API (e.g. from Shipper app).
 * If using two Supabase projects (Shipper vs Admin/Courier), sync or duplicate leads as needed.
 */
import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

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
            console.error("Error fetching loads:", error);
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
        console.error("Error in GET /loads:", err);
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
        const { data: rows, error } = await supabaseAdmin
            .from("leads")
            .select("status");

        if (error) {
            console.error("Error fetching load stats:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        const all = rows || [];
        const byStatus = all.reduce((acc: Record<string, number>, r: any) => {
            acc[r.status || "open"] = (acc[r.status || "open"] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                total: all.length,
                inTransit: 0,
                delivered: 0,
                pending: byStatus["open"] || 0,
                cancelled: byStatus["cancelled"] || 0,
                alerts: byStatus["open"] || 0,
            },
        });
    } catch (err: any) {
        console.error("Error in GET /loads/stats:", err);
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
    };
}

// Stub routes for compatibility (optional; Admin may not use them yet)
router.post("/", (_req: Request, res: Response) => {
    res.status(501).json({ success: false, message: "Create load via leads API or Admin UI" });
});
router.put("/:id", (req: Request, res: Response) => {
    res.status(501).json({ success: false, message: `Load ${req.params.id} update not implemented` });
});
router.patch("/:id/status", (req: Request, res: Response) => {
    res.status(501).json({ success: false, message: `Load ${req.params.id} status update not implemented` });
});
router.delete("/:id", (req: Request, res: Response) => {
    res.status(501).json({ success: false, message: `Load ${req.params.id} delete not implemented` });
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
