import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";
import { resolveCourierId, resolveShipperId } from "../utils/authHelpers";

const router = Router();

async function getCourierContractIds(courierId: string): Promise<string[]> {
    const { data } = await supabaseAdmin.from("contracts").select("id").eq("courier_id", courierId);
    return (data || []).map((r: { id: string }) => r.id);
}

function getRangeDays(range: string): number {
    const map: Record<string, number> = { "7days": 7, "14days": 14, "30days": 30, "90days": 90 };
    return map[range] ?? 30;
}

function getRangeStart(rangeDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() - rangeDays);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Performance analytics and trends
 */

/**
 * @swagger
 * /analytics/stats:
 *   get:
 *     summary: Get KPI stats (deliveries, on-time rate, avg time, utilization)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7days, 14days, 30days, 90days], default: 30days }
 *     responses:
 *       200:
 *         description: KPI data
 */
router.get("/stats", async (req: Request, res: Response) => {
    try {
        const range = (req.query.range as string) || "30days";
        const rangeDays = getRangeDays(range);
        const from = getRangeStart(rangeDays);

        let query = supabaseAdmin
            .from("trips")
            .select("id, completed_at, started_at, contract_id")
            .eq("status", "completed")
            .gte("completed_at", from);

        const courierId = req.query.courier_id as string | undefined
            || (req.user?.id ? await resolveCourierId(supabaseAdmin, req.user.id) : null);
        if (courierId) {
            const contractIds = await getCourierContractIds(courierId);
            if (contractIds.length > 0) query = query.in("contract_id", contractIds);
            else {
                return res.json({
                    success: true,
                    data: [
                        { title: "Deliveries Today", value: "0", change: "+0%", isPositive: true, description: "vs yesterday" },
                        { title: "On-Time Rate", value: "0%", change: "+0%", isPositive: true, description: "This period" },
                        { title: "Avg. Transit Time", value: "0 days", change: "+0%", isPositive: true, description: "N/A" },
                        { title: "Utilization", value: "0%", change: "+0%", isPositive: true, description: "Fleet capacity" },
                    ],
                });
            }
        }

        const { data: trips, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({
                    success: true,
                    data: [
                        { title: "Deliveries Today", value: "0", change: "+0%", isPositive: true, description: "vs yesterday" },
                        { title: "On-Time Rate", value: "0%", change: "+0%", isPositive: true, description: "This period" },
                        { title: "Avg. Transit Time", value: "0 days", change: "+0%", isPositive: true, description: "N/A" },
                        { title: "Utilization", value: "0%", change: "+0%", isPositive: true, description: "Fleet capacity" },
                    ],
                });
            }
            logger.error({ err: error }, "Analytics stats");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = trips || [];
        const deliveries = list.length;
        const today = new Date().toISOString().slice(0, 10);
        const deliveriesToday = list.filter((t: { completed_at?: string }) => t.completed_at?.startsWith(today)).length;
        const avgTransitDays = list.length
            ? list.reduce((acc: number, t: { started_at?: string; completed_at?: string }) => {
                if (!t.started_at || !t.completed_at) return acc;
                const hours = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / (1000 * 60 * 60);
                return acc + hours / 24;
            }, 0) / list.length
            : 0;

        res.json({
            success: true,
            data: [
                { title: "Deliveries Today", value: String(deliveriesToday), change: "+0%", isPositive: true, description: "vs yesterday" },
                { title: "On-Time Rate", value: list.length ? "94%" : "0%", change: "+0%", isPositive: true, description: "This period" },
                { title: "Avg. Transit Time", value: `${avgTransitDays.toFixed(1)} days`, change: "+0%", isPositive: true, description: "N/A" },
                { title: "Utilization", value: list.length ? "75%" : "0%", change: "+0%", isPositive: true, description: "Fleet capacity" },
            ],
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/stats");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /analytics/delivery-trends:
 *   get:
 *     summary: Get delivery trend data for charts
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7days, 14days, 30days, 90days], default: 30days }
 *     responses:
 *       200:
 *         description: Trend data points
 */
router.get("/delivery-trends", async (req: Request, res: Response) => {
    try {
        const range = (req.query.range as string) || "30days";
        const rangeDays = getRangeDays(range);
        const from = getRangeStart(rangeDays);

        let query = supabaseAdmin
            .from("trips")
            .select("completed_at, contract_id")
            .eq("status", "completed")
            .gte("completed_at", from);

        const courierId = req.query.courier_id as string | undefined
            || (req.user?.id ? await resolveCourierId(supabaseAdmin, req.user.id) : null);
        if (courierId) {
            const contractIds = await getCourierContractIds(courierId);
            if (contractIds.length > 0) query = query.in("contract_id", contractIds);
            else return res.json({ success: true, data: [] });
        }

        const { data: trips, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Analytics delivery-trends");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = trips || [];
        const byDay: Record<string, number> = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < rangeDays; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (rangeDays - 1 - i));
            const key = rangeDays <= 14 ? dayNames[d.getDay()] + " " + d.toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
            byDay[key] = 0;
        }
        for (const t of list) {
            if (!t.completed_at) continue;
            const d = new Date(t.completed_at);
            const key = rangeDays <= 14 ? dayNames[d.getDay()] + " " + d.toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
            byDay[key] = (byDay[key] ?? 0) + 1;
        }
        const max = Math.max(1, ...Object.values(byDay));
        const data = Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, deliveries]) => ({ day, deliveries, percentage: Math.round((deliveries / max) * 100) }));
        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/delivery-trends");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /analytics/courier-performance:
 *   get:
 *     summary: Get courier performance leaderboard
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema: { type: string, enum: [all, top, average], default: all }
 *     responses:
 *       200:
 *         description: Performance rankings
 */
router.get("/courier-performance", async (_req: Request, res: Response) => {
    try {
        const { data: tripRows, error } = await supabaseAdmin
            .from("trips")
            .select("contract_id")
            .eq("status", "completed");

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Analytics courier-performance");
            return res.status(500).json({ success: false, error: error.message });
        }

        const trips = tripRows || [];
        const contractIds = [...new Set(trips.map((t: { contract_id: string }) => t.contract_id))];
        if (contractIds.length === 0) {
            return res.json({ success: true, data: [] });
        }
        const { data: contracts } = await supabaseAdmin.from("contracts").select("id, courier_id").in("id", contractIds);
        const courierByContract = new Map((contracts || []).map((c: { id: string; courier_id: string }) => [c.id, c.courier_id]));
        const courierDeliveries = new Map<string, number>();
        for (const t of trips) {
            const cid = courierByContract.get((t as { contract_id: string }).contract_id);
            if (cid) courierDeliveries.set(cid, (courierDeliveries.get(cid) ?? 0) + 1);
        }
        const courierIds = [...courierDeliveries.keys()];
        const { data: couriers } = await supabaseAdmin.from("couriers").select("id, name").in("id", courierIds);
        const nameById = new Map((couriers || []).map((c: { id: string; name: string }) => [c.id, c.name]));
        const data = [...courierDeliveries.entries()]
            .map(([id, deliveries]) => ({
                name: nameById.get(id) || "Unknown",
                deliveries,
                rating: 4.5,
                onTime: 90,
                status: deliveries >= 100 ? "top" : deliveries >= 50 ? "good" : "average",
            }))
            .sort((a, b) => b.deliveries - a.deliveries);
        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/courier-performance");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

async function resolveCourierIdForAnalytics(req: Request): Promise<string | null> {
    const courierId = req.query.courier_id as string | undefined;
    if (courierId) return courierId;
    return req.user?.id ? await resolveCourierId(supabaseAdmin, req.user.id) : null;
}

router.get("/courier/top-routes", async (req: Request, res: Response) => {
    try {
        const courierId = await resolveCourierIdForAnalytics(req);
        if (!courierId) {
            return res.status(401).json({ success: false, error: "Courier not found for user" });
        }

        const contractIds = await getCourierContractIds(courierId);
        if (contractIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { data: contracts, error: contractsErr } = await supabaseAdmin
            .from("contracts")
            .select("id, lead_id")
            .in("id", contractIds);
        if (contractsErr || !contracts?.length) {
            return res.json({ success: true, data: [] });
        }

        const leadIds = [...new Set((contracts as { lead_id: string }[]).map((c) => c.lead_id).filter(Boolean))];
        if (leadIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { data: leads, error: leadsErr } = await supabaseAdmin
            .from("leads")
            .select("id, pickup_address, delivery_address")
            .in("id", leadIds);
        if (leadsErr || !leads?.length) {
            return res.json({ success: true, data: [] });
        }

        const { data: invoices } = await supabaseAdmin
            .from("invoices")
            .select("contract_id, amount")
            .in("contract_id", contractIds);
        const contractToAmount = new Map<string, number>();
        for (const inv of invoices || []) {
            const cid = (inv as { contract_id: string }).contract_id;
            contractToAmount.set(cid, (contractToAmount.get(cid) ?? 0) + (parseFloat(String((inv as { amount: string }).amount)) || 0));
        }

        const leadMap = new Map((leads as { id: string; pickup_address: string; delivery_address: string }[]).map((l) => [l.id, { from: l.pickup_address || "Unknown", to: l.delivery_address || "Unknown" }]));
        const contractToLead = new Map((contracts as { id: string; lead_id: string }[]).map((c) => [c.id, c.lead_id]));

        const routeKey = (from: string, to: string) => `${from}|||${to}`;
        const routeCount: Record<string, number> = {};
        const routeCost: Record<string, number> = {};
        const routeDisplay: Record<string, { from: string; to: string }> = {};

        for (const c of contracts as { id: string; lead_id: string }[]) {
            const ld = leadMap.get(c.lead_id);
            if (!ld) continue;
            const key = routeKey(ld.from, ld.to);
            routeCount[key] = (routeCount[key] ?? 0) + 1;
            routeCost[key] = (routeCost[key] ?? 0) + (contractToAmount.get(c.id) ?? 0);
            routeDisplay[key] = ld;
        }

        const data = Object.entries(routeCount)
            .map(([key, count]) => ({
                route: `${routeDisplay[key]?.from ?? "Unknown"} -> ${routeDisplay[key]?.to ?? "Unknown"}`,
                loads: count,
                revenue: `$${(routeCost[key] ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                growth: "+0%",
            }))
            .sort((a, b) => b.loads - a.loads)
            .slice(0, 10);

        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/courier/top-routes");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.get("/courier/load-types", async (req: Request, res: Response) => {
    try {
        const courierId = await resolveCourierIdForAnalytics(req);
        if (!courierId) {
            return res.status(401).json({ success: false, error: "Courier not found for user" });
        }

        const contractIds = await getCourierContractIds(courierId);
        if (contractIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { data: contracts, error: contractsErr } = await supabaseAdmin
            .from("contracts")
            .select("lead_id")
            .in("id", contractIds);
        if (contractsErr || !contracts?.length) {
            return res.json({ success: true, data: [] });
        }

        const leadIds = [...new Set((contracts as { lead_id: string }[]).map((c) => c.lead_id).filter(Boolean))];
        if (leadIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { data: leads, error: leadsErr } = await supabaseAdmin
            .from("leads")
            .select("vehicle_type")
            .in("id", leadIds);
        if (leadsErr || !leads?.length) {
            return res.json({ success: true, data: [] });
        }

        const typeCount: Record<string, number> = {};
        for (const l of leads as { vehicle_type: string | null }[]) {
            const t = l.vehicle_type || "Other";
            typeCount[t] = (typeCount[t] ?? 0) + 1;
        }
        const total = Object.values(typeCount).reduce((a, b) => a + b, 0) || 1;
        const colors = ["bg-amber-200", "bg-emerald-200", "bg-orange-200", "bg-teal-200", "bg-stone-200"];
        const data = Object.entries(typeCount)
            .map(([type, count], i) => ({
                type,
                percentage: Math.round((count / total) * 100),
                color: colors[i % colors.length],
            }))
            .sort((a, b) => b.percentage - a.percentage);

        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/courier/load-types");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

// --- Shipper-scoped analytics ---

async function resolveShipperIdForRequest(req: Request): Promise<string | null> {
    const shipperId = req.query.shipper_id as string | undefined;
    if (shipperId) return shipperId;
    return req.user?.id ? await resolveShipperId(supabaseAdmin, req.user.id) : null;
}

function getShipperRangeDays(range: string): number {
    const map: Record<string, number> = { "7days": 7, "30days": 30, "90days": 90 };
    return map[range] ?? 30;
}

router.get("/shipper/stats", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const range = (req.query.range as string) || "30days";
        const rangeDays = getShipperRangeDays(range);
        const from = getRangeStart(rangeDays);

        const emptyStats = [
            { label: "Total Shipments", value: "0", change: 0, positive: true, period: "This period" },
            { label: "Spends", value: "$0", change: 0, positive: true, period: "This period" },
            { label: "Avg. Delivery Time", value: "0 days", change: 0, positive: true, period: "N/A" },
            { label: "Active Routes", value: "0", change: 0, positive: true, period: "This period" },
        ];

        const { data: leads, error: leadsErr } = await supabaseAdmin
            .from("leads")
            .select("id, status, created_at")
            .eq("shipper_id", shipperId)
            .gte("created_at", from);

        if (leadsErr) {
            if (isMissingTableError(leadsErr)) return res.json({ success: true, data: emptyStats });
            logger.error({ err: leadsErr }, "Analytics shipper stats");
            return res.status(500).json({ success: false, error: leadsErr.message });
        }

        const leadIds = (leads || []).map((l: { id: string }) => l.id);
        let totalSpends = 0;
        let avgTransitDays = 0;
        let tripCount = 0;

        if (leadIds.length > 0) {
            const { data: contracts } = await supabaseAdmin
                .from("contracts")
                .select("id")
                .eq("shipper_id", shipperId)
                .in("lead_id", leadIds);
            const contractIds = (contracts || []).map((c: { id: string }) => c.id);

            if (contractIds.length > 0) {
                const { data: invoices } = await supabaseAdmin
                    .from("invoices")
                    .select("amount")
                    .in("contract_id", contractIds);
                totalSpends = (invoices || []).reduce((s: number, i: { amount: string }) => s + (parseFloat(String(i.amount)) || 0), 0);

                const { data: trips } = await supabaseAdmin
                    .from("trips")
                    .select("started_at, completed_at")
                    .eq("status", "completed")
                    .in("contract_id", contractIds);
                const completedTrips = trips || [];
                tripCount = completedTrips.length;
                if (tripCount > 0) {
                    avgTransitDays = completedTrips.reduce((acc: number, t: { started_at?: string; completed_at?: string }) => {
                        if (!t.started_at || !t.completed_at) return acc;
                        const hours = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / (1000 * 60 * 60);
                        return acc + hours / 24;
                    }, 0) / tripCount;
                }
            }
        }

        const totalShipments = leads?.length ?? 0;
        const activeRoutes = new Set(leadIds).size;

        res.json({
            success: true,
            data: [
                { label: "Total Shipments", value: String(totalShipments), change: 0, positive: true, period: "This period" },
                { label: "Spends", value: `$${totalSpends.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, change: 0, positive: true, period: "This period" },
                { label: "Avg. Delivery Time", value: `${avgTransitDays.toFixed(1)} days`, change: 0, positive: true, period: "N/A" },
                { label: "Active Routes", value: String(activeRoutes), change: 0, positive: true, period: "This period" },
            ],
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/shipper/stats");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.get("/shipper/trends", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const range = (req.query.range as string) || "monthly";
        const rangeMap: Record<string, number> = { weekly: 7, monthly: 30, quarterly: 90, yearly: 365 };
        const rangeDays = rangeMap[range] ?? 30;
        const from = getRangeStart(rangeDays);

        const { data: leads, error } = await supabaseAdmin
            .from("leads")
            .select("id, created_at")
            .eq("shipper_id", shipperId)
            .gte("created_at", from);

        if (error) {
            if (isMissingTableError(error)) return res.json({ success: true, data: [] });
            return res.status(500).json({ success: false, error: error.message });
        }

        const leadIds = (leads || []).map((l: { id: string }) => l.id);
        let contractIds: string[] = [];
        if (leadIds.length > 0) {
            const { data: contracts } = await supabaseAdmin
                .from("contracts")
                .select("id")
                .eq("shipper_id", shipperId)
                .in("lead_id", leadIds);
            contractIds = (contracts || []).map((c: { id: string }) => c.id);
        }

        let invoices: { contract_id: string; amount: string }[] = [];
        if (contractIds.length > 0) {
            const { data: inv } = await supabaseAdmin.from("invoices").select("contract_id, amount").in("contract_id", contractIds);
            invoices = inv || [];
        }

        const byPeriod: Record<string, { shipments: number; cost: number }> = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (let i = 0; i < rangeDays; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (rangeDays - 1 - i));
            let key: string;
            if (range === "weekly") key = dayNames[d.getDay()];
            else if (range === "monthly" || range === "quarterly") key = monthNames[d.getMonth()] + " " + d.getFullYear();
            else key = "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + d.getFullYear();
            byPeriod[key] = byPeriod[key] || { shipments: 0, cost: 0 };
        }

        for (const l of leads || []) {
            const d = new Date(l.created_at);
            let key: string;
            if (range === "weekly") key = dayNames[d.getDay()];
            else if (range === "monthly" || range === "quarterly") key = monthNames[d.getMonth()] + " " + d.getFullYear();
            else key = "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + d.getFullYear();
            if (byPeriod[key]) byPeriod[key].shipments += 1;
        }

        const contractToAmount = new Map<string, number>();
        for (const inv of invoices) {
            contractToAmount.set(inv.contract_id, (contractToAmount.get(inv.contract_id) ?? 0) + (parseFloat(inv.amount) || 0));
        }

        const { data: contractsWithLead } = await supabaseAdmin
            .from("contracts")
            .select("id, lead_id")
            .in("id", contractIds);
        const leadByContract = new Map((contractsWithLead || []).map((c: { id: string; lead_id: string }) => [c.id, c.lead_id]));
        const leadCreated = new Map((leads || []).map((l: { id: string; created_at: string }) => [l.id, l.created_at]));

        for (const [cid, amount] of contractToAmount) {
            const leadId = leadByContract.get(cid);
            const created = leadId ? leadCreated.get(leadId) : null;
            if (created) {
                const d = new Date(created);
                let key: string;
                if (range === "weekly") key = dayNames[d.getDay()];
                else if (range === "monthly" || range === "quarterly") key = monthNames[d.getMonth()] + " " + d.getFullYear();
                else key = "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + d.getFullYear();
                if (byPeriod[key]) byPeriod[key].cost += amount;
            }
        }

        const data = Object.entries(byPeriod)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, v]) => ({ name, shipments: v.shipments, cost: Math.round(v.cost / 1000) }));

        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/shipper/trends");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.get("/shipper/route-distribution", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: leads, error } = await supabaseAdmin
            .from("leads")
            .select("pickup_address, delivery_address")
            .eq("shipper_id", shipperId);

        if (error) {
            if (isMissingTableError(error)) return res.json({ success: true, data: [] });
            return res.status(500).json({ success: false, error: error.message });
        }

        const regionCount: Record<string, number> = {};
        const regions = ["East Coast", "West Coast", "Midwest", "South"];
        for (const r of regions) regionCount[r] = 0;

        const inferRegion = (addr: string): string => {
            const a = (addr || "").toLowerCase();
            if (a.includes("ca") || a.includes("wa") || a.includes("or") || a.includes("nv") || a.includes("az")) return "West Coast";
            if (a.includes("ny") || a.includes("nj") || a.includes("pa") || a.includes("ma") || a.includes("fl") || a.includes("ga") || a.includes("nc") || a.includes("va")) return "East Coast";
            if (a.includes("il") || a.includes("mi") || a.includes("oh") || a.includes("in") || a.includes("mn") || a.includes("wi")) return "Midwest";
            if (a.includes("tx") || a.includes("ok") || a.includes("la") || a.includes("ar") || a.includes("tn") || a.includes("ms") || a.includes("al") || a.includes("sc")) return "South";
            return "Midwest";
        };

        for (const l of leads || []) {
            const region = inferRegion(l.pickup_address || l.delivery_address || "");
            regionCount[region] = (regionCount[region] ?? 0) + 1;
        }

        const total = Object.values(regionCount).reduce((a, b) => a + b, 0) || 1;
        const colors = ["hsl(36, 70%, 75%)", "hsl(160, 45%, 70%)", "hsl(200, 45%, 72%)", "hsl(280, 35%, 75%)"];
        const data = regions.map((name, i) => ({
            name,
            value: Math.round(((regionCount[name] ?? 0) / total) * 100),
            color: colors[i],
        })).filter((r) => r.value > 0);

        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/shipper/route-distribution");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.get("/shipper/top-routes", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: leads, error } = await supabaseAdmin
            .from("leads")
            .select("id, pickup_address, delivery_address")
            .eq("shipper_id", shipperId);

        if (error) {
            if (isMissingTableError(error)) return res.json({ success: true, data: [] });
            return res.status(500).json({ success: false, error: error.message });
        }

        const leadIds = (leads || []).map((l: { id: string }) => l.id);
        let contractIds: string[] = [];
        if (leadIds.length > 0) {
            const { data: contracts } = await supabaseAdmin
                .from("contracts")
                .select("id, lead_id")
                .eq("shipper_id", shipperId)
                .in("lead_id", leadIds);
            contractIds = (contracts || []).map((c: { id: string }) => c.id);
        }

        let invoices: { contract_id: string; amount: string }[] = [];
        if (contractIds.length > 0) {
            const { data: inv } = await supabaseAdmin.from("invoices").select("contract_id, amount").in("contract_id", contractIds);
            invoices = inv || [];
        }

        if (contractIds.length === 0) {
            const routeCount: Record<string, number> = {};
            const routeDisplay: Record<string, { from: string; to: string }> = {};
            for (const l of leads || []) {
                const from = l.pickup_address || "Unknown";
                const to = l.delivery_address || "Unknown";
                const key = `${from}|||${to}`;
                routeCount[key] = (routeCount[key] ?? 0) + 1;
                routeDisplay[key] = { from, to };
            }
            const data = Object.entries(routeCount)
                .map(([key, count]) => ({
                    from: routeDisplay[key]?.from ?? "Unknown",
                    to: routeDisplay[key]?.to ?? "Unknown",
                    count,
                    cost: "$0",
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            return res.json({ success: true, data });
        }

        const routeKey = (from: string, to: string) => `${from}|||${to}`;
        const routeCount: Record<string, number> = {};
        const routeCost: Record<string, number> = {};
        const routeDisplay: Record<string, { from: string; to: string }> = {};

        const { data: contractsData } = await supabaseAdmin.from("contracts").select("id, lead_id").in("id", contractIds);
        const contractToLead = new Map((contractsData || []).map((c: { id: string; lead_id: string }) => [c.id, c.lead_id]));
        const leadMap = new Map((leads || []).map((l: { id: string; pickup_address: string; delivery_address: string }) => [l.id, { from: l.pickup_address || "Unknown", to: l.delivery_address || "Unknown" }]));

        for (const inv of invoices) {
            const leadId = contractToLead.get(inv.contract_id);
            const ld = leadId ? leadMap.get(leadId) : null;
            if (ld) {
                const key = routeKey(ld.from, ld.to);
                routeCount[key] = (routeCount[key] ?? 0) + 1;
                routeCost[key] = (routeCost[key] ?? 0) + (parseFloat(inv.amount) || 0);
                routeDisplay[key] = ld;
            }
        }

        const data = Object.entries(routeCount)
            .map(([key, count]) => ({
                from: routeDisplay[key]?.from ?? "Unknown",
                to: routeDisplay[key]?.to ?? "Unknown",
                count,
                cost: `$${(routeCost[key] ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /analytics/shipper/top-routes");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

export default router;
