import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";
import { resolveCourierId, resolveShipperId } from "../utils/authHelpers";
import * as loadService from "../services/loadService";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard aggregated data
 */

/**
 * @swagger
 * /dashboard/courier-overview:
 *   get:
 *     summary: Get courier-scoped dashboard data (contracts, stats, recent activity)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Courier dashboard data
 */
router.get("/courier-overview", async (req: Request, res: Response) => {
    try {
        const courierId = req.user?.id ? await resolveCourierId(supabaseAdmin, req.user.id) : null;
        if (!courierId) {
            return res.json({
                success: true,
                data: {
                    contracts: [],
                    stats: { assignedCount: 0, revenue: "$0" },
                    recentActivity: [],
                },
            });
        }
        const [contractsRes, recentRes] = await Promise.all([
            supabaseAdmin.from("contracts").select("id, status, amount, created_at, start_location, end_location, lead_id, leads(id, listing_id, pickup_address, delivery_address, vehicle_year, vehicle_make, vehicle_model, vehicle_vin, status)").eq("courier_id", courierId).in("status", ["signed", "active", "completed"]).order("created_at", { ascending: false }).limit(20),
            supabaseAdmin.from("contracts").select("id, status, created_at, couriers(name), shippers(name)").eq("courier_id", courierId).order("created_at", { ascending: false }).limit(10),
        ]);
        const contracts = contractsRes.data || [];
        const contractIds = contracts.map((c: { id: string }) => c.id);
        let totalRevenue = 0;
        if (contractIds.length > 0) {
            const { data: invData } = await supabaseAdmin.from("invoices").select("amount").in("contract_id", contractIds);
            totalRevenue = (invData || []).reduce((s: number, i: { amount: number }) => s + (parseFloat(String(i.amount)) || 0), 0);
        }
        const recentActivity = (recentRes.data || []).map((c: any) => {
            const courierName = Array.isArray(c.couriers) ? c.couriers[0]?.name : c.couriers?.name;
            const shipperName = Array.isArray(c.shippers) ? c.shippers[0]?.name : c.shippers?.name;
            return {
                id: c.id,
                entity: shipperName || courierName || "Unknown",
                entityType: "shipper" as const,
                action: "Contract " + (c.status === "signed" || c.status === "active" ? "signed" : c.status),
                status: c.status === "completed" ? "completed" : c.status === "cancelled" ? "failed" : "pending",
                date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
            };
        });
        res.json({
            success: true,
            data: {
                contracts,
                stats: {
                    assignedCount: contracts.filter((c: { status: string }) => c.status === "signed" || c.status === "active").length,
                    revenue: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                },
                recentActivity,
            },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/courier-overview");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /dashboard/shipper-overview:
 *   get:
 *     summary: Get shipper-scoped dashboard data (loads stats, spends, recent activity)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Shipper dashboard data
 */
router.get("/shipper-overview", async (req: Request, res: Response) => {
    try {
        const shipperId = req.user?.id ? await resolveShipperId(supabaseAdmin, req.user.id) : null;
        if (!shipperId) {
            return res.json({
                success: true,
                data: {
                    activeShipments: 0,
                    totalShipment: 0,
                    spends: "$0",
                    onTimeRate: "0%",
                    recentActivity: [],
                },
            });
        }
        const [loadStatsRes, contractsRes] = await Promise.all([
            loadService.getLoadStats({ shipper_id: shipperId }),
            supabaseAdmin.from("contracts").select("id, status, created_at, leads(listing_id, pickup_address, delivery_address)").eq("shipper_id", shipperId).order("created_at", { ascending: false }).limit(10),
        ]);
        const contracts = contractsRes.data || [];
        const contractIds = contracts.map((c: { id: string }) => c.id);
        let totalSpends = 0;
        if (contractIds.length > 0) {
            const { data: invData } = await supabaseAdmin.from("invoices").select("amount").in("contract_id", contractIds);
            totalSpends = (invData || []).reduce((s: number, i: { amount: number }) => s + (parseFloat(String(i.amount)) || 0), 0);
        }
        const activeShipments = (loadStatsRes.pending ?? 0) + (loadStatsRes.inTransit ?? 0);
        const total = loadStatsRes.total ?? 0;
        const delivered = loadStatsRes.delivered ?? 0;
        const onTimeRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
        const recentActivity = contracts.slice(0, 5).map((c: any) => {
            const lead = Array.isArray(c.leads) ? c.leads[0] : c.leads;
            const route = lead ? `${lead.pickup_address || "?"} to ${lead.delivery_address || "?"}` : "";
            return {
                type: c.status === "completed" ? "delivered" : "transit",
                message: c.status === "completed" ? `Shipment delivered to ${route}` : `Shipment in transit to ${route}`,
                time: c.created_at ? formatRelativeTime(c.created_at) : "",
                icon: "Package",
            };
        });
        res.json({
            success: true,
            data: {
                activeShipments,
                totalShipment: total,
                spends: `$${totalSpends.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                onTimeRate: `${onTimeRate}%`,
                recentActivity,
            },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/shipper-overview");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard stats, recent activity, and alerts in one request
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Combined dashboard data
 */
router.get("/overview", async (_req: Request, res: Response) => {
    const emptyStats = {
        totalCouriers: 0,
        totalShippers: 0,
        totalTransactions: 0,
        activeAlerts: 0,
        couriersCompliant: 0,
        couriersNonCompliant: 0,
        shippersCompliant: 0,
        shippersNonCompliant: 0,
        couriersTrend: null as TrendResult,
        shippersTrend: null as TrendResult,
        transactionsTrend: null as TrendResult,
    };
    try {
        const [statsRes, recentRes, alertsRes] = await Promise.all([
            fetchStats(),
            fetchRecentActivity(),
            fetchAlerts(),
        ]);

        res.json({
            success: true,
            data: {
                stats: statsRes ?? emptyStats,
                recentActivity: recentRes ?? [],
                alerts: alertsRes ?? [],
            },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/overview");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

type TrendResult = { value: number; isPositive: boolean } | null;

function computeTrend(current: number, previous: number): TrendResult {
    if (previous === 0) {
        if (current === 0) return null;
        return { value: 100, isPositive: true };
    }
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return null;
    return { value: Math.abs(pct), isPositive: pct > 0 };
}

async function fetchStats(): Promise<{
    totalCouriers: number;
    totalShippers: number;
    totalTransactions: number;
    activeAlerts: number;
    couriersCompliant: number;
    couriersNonCompliant: number;
    shippersCompliant: number;
    shippersNonCompliant: number;
    couriersTrend: TrendResult;
    shippersTrend: TrendResult;
    transactionsTrend: TrendResult;
} | null> {
    const empty = {
        totalCouriers: 0,
        totalShippers: 0,
        totalTransactions: 0,
        activeAlerts: 0,
        couriersCompliant: 0,
        couriersNonCompliant: 0,
        shippersCompliant: 0,
        shippersNonCompliant: 0,
        couriersTrend: null as TrendResult,
        shippersTrend: null as TrendResult,
        transactionsTrend: null as TrendResult,
    };
    const now = new Date();
    const nowMinus30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const nowMinus60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const currentFrom = nowMinus30.toISOString();
    const previousFrom = nowMinus60.toISOString();
    const previousTo = nowMinus30.toISOString();

    const [
        totalCouriersRes,
        totalShippersRes,
        totalInvoicesRes,
        couriersCompliantRes,
        shippersCompliantRes,
        couriersCurrentRes,
        couriersPreviousRes,
        shippersCurrentRes,
        shippersPreviousRes,
        invoicesCurrentRes,
        invoicesPreviousRes,
    ] = await Promise.all([
        supabaseAdmin.from("couriers").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabaseAdmin.from("shippers").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabaseAdmin.from("invoices").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("couriers").select("id", { count: "exact", head: true }).eq("compliance", "compliant").is("deleted_at", null),
        supabaseAdmin.from("shippers").select("id", { count: "exact", head: true }).eq("compliance", "compliant").is("deleted_at", null),
        supabaseAdmin.from("couriers").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", currentFrom),
        supabaseAdmin.from("couriers").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", previousFrom).lt("created_at", previousTo),
        supabaseAdmin.from("shippers").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", currentFrom),
        supabaseAdmin.from("shippers").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", previousFrom).lt("created_at", previousTo),
        supabaseAdmin.from("invoices").select("id", { count: "exact", head: true }).gte("created_at", currentFrom),
        supabaseAdmin.from("invoices").select("id", { count: "exact", head: true }).gte("created_at", previousFrom).lt("created_at", previousTo),
    ]);
    if (totalCouriersRes.error && isMissingTableError(totalCouriersRes.error)) return empty;
    if (totalCouriersRes.error) throw totalCouriersRes.error;
    const totalCouriers = totalCouriersRes.count ?? 0;
    const totalShippers = totalShippersRes.count ?? 0;
    const totalTransactions = totalInvoicesRes.count ?? 0;
    const couriersCompliant = couriersCompliantRes.count ?? 0;
    const shippersCompliant = shippersCompliantRes.count ?? 0;

    const couriersCurrent = couriersCurrentRes.error ? 0 : (couriersCurrentRes.count ?? 0);
    const couriersPrevious = couriersPreviousRes.error ? 0 : (couriersPreviousRes.count ?? 0);
    const shippersCurrent = shippersCurrentRes.error ? 0 : (shippersCurrentRes.count ?? 0);
    const shippersPrevious = shippersPreviousRes.error ? 0 : (shippersPreviousRes.count ?? 0);
    const invoicesCurrent = invoicesCurrentRes.error ? 0 : (invoicesCurrentRes.count ?? 0);
    const invoicesPrevious = invoicesPreviousRes.error ? 0 : (invoicesPreviousRes.count ?? 0);

    return {
        ...empty,
        totalCouriers,
        totalShippers,
        totalTransactions,
        couriersCompliant,
        couriersNonCompliant: totalCouriers - couriersCompliant,
        shippersCompliant,
        shippersNonCompliant: totalShippers - shippersCompliant,
        couriersTrend: computeTrend(couriersCurrent, couriersPrevious),
        shippersTrend: computeTrend(shippersCurrent, shippersPrevious),
        transactionsTrend: computeTrend(invoicesCurrent, invoicesPrevious),
    };
}

async function fetchRecentActivity(): Promise<Array<{ id: string; entity: string; entityType: string; action: string; status: string; date: string }>> {
    const { data: contracts, error } = await supabaseAdmin
        .from("contracts")
        .select("id, status, created_at, courier_id, shipper_id, couriers(name), shippers(name)")
        .order("created_at", { ascending: false })
        .limit(10);
    if (error && isMissingTableError(error)) return [];
    if (error) throw error;
    const list = (contracts || []) as Array<{
        id: string;
        status: string;
        created_at: string;
        couriers?: { name: string } | { name: string }[] | null;
        shippers?: { name: string } | { name: string }[] | null;
    }>;
    return list.map((c) => {
        const courierName = Array.isArray(c.couriers) ? c.couriers[0]?.name : c.couriers?.name;
        const shipperName = Array.isArray(c.shippers) ? c.shippers[0]?.name : c.shippers?.name;
        const entity = courierName || shipperName || "Unknown";
        const entityType = courierName ? "courier" : "shipper";
        return {
            id: c.id,
            entity,
            entityType,
            action: "Contract " + (c.status === "signed" || c.status === "active" ? "signed" : c.status),
            status: c.status === "completed" ? "completed" : c.status === "cancelled" ? "failed" : "pending",
            date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
        };
    });
}

async function fetchAlerts(): Promise<Array<{ id: string; title: string; description: string; type: "info"; time: string }>> {
    const { data: rows, error } = await supabaseAdmin
        .from("notification_log")
        .select("id, event_type, trip_id, contract_id, created_at")
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
    if (error && isMissingTableError(error)) return [];
    if (error) throw error;
    const list = (rows || []) as { id: string; event_type: string; contract_id: string | null; created_at: string }[];
    if (list.length === 0) return [];
    const contractIds = [...new Set(list.map((r) => r.contract_id).filter(Boolean))] as string[];
    const { data: contracts } = await supabaseAdmin
        .from("contracts")
        .select("id, start_location, end_location, lead_id, courier_id, shipper_id, leads(vehicle_vin), couriers(name), shippers(name)")
        .in("id", contractIds);
    const contractsMap = new Map((contracts || []).map((c: Record<string, unknown>) => [c.id as string, c]));
    return list.map((row) => {
        const contract = row.contract_id ? contractsMap.get(row.contract_id) : null;
        const leads = contract?.leads as { vehicle_vin?: string } | { vehicle_vin?: string }[] | undefined;
        const vin = (Array.isArray(leads) ? leads[0]?.vehicle_vin : leads?.vehicle_vin) || "";
        const couriers = contract?.couriers as { name?: string } | { name?: string }[] | undefined;
        const courierName = (Array.isArray(couriers) ? couriers[0]?.name : couriers?.name) || null;
        const route = contract ? `${contract.start_location || "?"} to ${contract.end_location || "?"}` : "";
        let title = "Notification";
        let description = "";
        if (row.event_type === "courier_assigned") {
            title = "Load Assigned to Courier";
            description = courierName
                ? `Courier ${courierName} assigned load with VIN ${vin || "N/A"} for trip ${route}`
                : `Load assigned for trip ${route}`;
        } else if (row.event_type === "trip_started") {
            title = "Trip Started";
            description = `Pickup scan recorded for trip ${route}`;
        } else if (row.event_type === "trip_completed") {
            title = "Trip Completed";
            description = `Delivery confirmed for trip ${route}`;
        } else if (row.event_type === "trip_cancelled") {
            title = "Trip Cancelled";
            description = `Trip was cancelled for route ${route}`;
        } else {
            description = `Event: ${row.event_type}`;
        }
        return {
            id: row.id,
            title,
            description,
            type: "info" as const,
            time: formatRelativeTime(row.created_at),
        };
    });
}

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard aggregate stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get("/stats", async (_req: Request, res: Response) => {
    const empty = {
        totalCouriers: 0,
        totalShippers: 0,
        totalTransactions: 0,
        activeAlerts: 0,
        couriersCompliant: 0,
        couriersNonCompliant: 0,
        shippersCompliant: 0,
        shippersNonCompliant: 0,
    };
    try {
        const [totalCouriersRes, totalShippersRes, totalInvoicesRes, couriersCompliantRes, shippersCompliantRes] = await Promise.all([
            supabaseAdmin.from("couriers").select("id", { count: "exact", head: true }).is("deleted_at", null),
            supabaseAdmin.from("shippers").select("id", { count: "exact", head: true }).is("deleted_at", null),
            supabaseAdmin.from("invoices").select("id", { count: "exact", head: true }),
            supabaseAdmin.from("couriers").select("id", { count: "exact", head: true }).eq("compliance", "compliant").is("deleted_at", null),
            supabaseAdmin.from("shippers").select("id", { count: "exact", head: true }).eq("compliance", "compliant").is("deleted_at", null),
        ]);

        if (totalCouriersRes.error && isMissingTableError(totalCouriersRes.error)) {
            return res.json({ success: true, data: empty });
        }
        if (totalCouriersRes.error) {
            logger.error({ err: totalCouriersRes.error }, "Dashboard stats");
            return res.status(500).json({ success: false, error: totalCouriersRes.error.message });
        }

        const totalCouriers = totalCouriersRes.count ?? 0;
        const totalShippers = totalShippersRes.count ?? 0;
        const totalTransactions = totalInvoicesRes.count ?? 0;
        const couriersCompliant = couriersCompliantRes.count ?? 0;
        const shippersCompliant = shippersCompliantRes.count ?? 0;
        const couriersNonCompliant = totalCouriers - couriersCompliant;
        const shippersNonCompliant = totalShippers - shippersCompliant;

        res.json({
            success: true,
            data: {
                totalCouriers,
                totalShippers,
                totalTransactions,
                activeAlerts: 0,
                couriersCompliant,
                couriersNonCompliant,
                shippersCompliant,
                shippersNonCompliant,
            },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/stats");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity feed
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent activity entries
 */
router.get("/recent-activity", async (_req: Request, res: Response) => {
    try {
        const { data: contracts, error } = await supabaseAdmin
            .from("contracts")
            .select("id, status, created_at, courier_id, shipper_id, couriers(name), shippers(name)")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Dashboard recent-activity");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = (contracts || []) as unknown as Array<{
            id: string;
            status: string;
            created_at: string;
            courier_id?: string;
            shipper_id?: string;
            couriers?: { name: string } | { name: string }[] | null;
            shippers?: { name: string } | { name: string }[] | null;
        }>;

        const data = list.map((c) => {
            const courierName = Array.isArray(c.couriers) ? c.couriers[0]?.name : c.couriers?.name;
            const shipperName = Array.isArray(c.shippers) ? c.shippers[0]?.name : c.shippers?.name;
            const entity = courierName || shipperName || "Unknown";
            const entityType = courierName ? "courier" : "shipper";
            return {
                id: c.id,
                entity,
                entityType,
                action: "Contract " + (c.status === "signed" || c.status === "active" ? "signed" : c.status),
                status: c.status === "completed" ? "completed" : c.status === "cancelled" ? "failed" : "pending",
                date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
            };
        });
        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/recent-activity");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

function formatRelativeTime(createdAt: string): string {
    const now = new Date();
    const then = new Date(createdAt);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return then.toLocaleDateString();
}

/**
 * @swagger
 * /dashboard/alerts:
 *   get:
 *     summary: Get active alerts/notifications
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Alert list
 */
router.get("/alerts", async (_req: Request, res: Response) => {
    try {
        const { data: rows, error } = await supabaseAdmin
            .from("notification_log")
            .select("id, event_type, trip_id, contract_id, created_at")
            .is("dismissed_at", null)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Dashboard alerts");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = (rows || []) as { id: string; event_type: string; trip_id: string | null; contract_id: string | null; created_at: string }[];
        if (list.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const contractIds = [...new Set(list.map((r) => r.contract_id).filter(Boolean))] as string[];
        const { data: contracts } = await supabaseAdmin
            .from("contracts")
            .select("id, start_location, end_location, lead_id, courier_id, shipper_id, leads(vehicle_vin), couriers(name), shippers(name)")
            .in("id", contractIds);

        const contractsMap = new Map((contracts || []).map((c: Record<string, unknown>) => [c.id as string, c]));

        const data = list.map((row) => {
            const contract = row.contract_id ? (contractsMap.get(row.contract_id) as Record<string, unknown>) : null;
            const leads = contract?.leads as { vehicle_vin?: string } | { vehicle_vin?: string }[] | undefined;
            const vin = (Array.isArray(leads) ? leads[0]?.vehicle_vin : leads?.vehicle_vin) || "";
            const couriers = contract?.couriers as { name?: string } | { name?: string }[] | undefined;
            const courierName = (Array.isArray(couriers) ? couriers[0]?.name : couriers?.name) || null;
            const route = contract ? `${contract.start_location || "?"} to ${contract.end_location || "?"}` : "";

            let title = "Notification";
            let description = "";

            if (row.event_type === "courier_assigned") {
                title = "Load Assigned to Courier";
                description = courierName
                    ? `Courier ${courierName} assigned load with VIN ${vin || "N/A"} for trip ${route}`
                    : `Load assigned for trip ${route}`;
            } else if (row.event_type === "trip_started") {
                title = "Trip Started";
                description = `Pickup scan recorded for trip ${route}`;
            } else if (row.event_type === "trip_completed") {
                title = "Trip Completed";
                description = `Delivery confirmed for trip ${route}`;
            } else if (row.event_type === "trip_cancelled") {
                title = "Trip Cancelled";
                description = `Trip was cancelled for route ${route}`;
            } else {
                description = `Event: ${row.event_type}`;
            }

            return {
                id: row.id,
                title,
                description,
                type: "info" as const,
                time: formatRelativeTime(row.created_at),
            };
        });

        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /dashboard/alerts");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /dashboard/alerts/{id}/read:
 *   patch:
 *     summary: Mark an alert as read
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert marked as read
 */
router.patch("/alerts/:id/read", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from("notification_log")
            .update({ read_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, message: "Alert marked as read" });
            }
            logger.error({ err: error }, "Dashboard alerts read");
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, message: "Alert marked as read" });
    } catch (err: unknown) {
        logger.error({ err }, "Error in PATCH /dashboard/alerts/:id/read");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/**
 * @swagger
 * /dashboard/alerts/{id}:
 *   delete:
 *     summary: Dismiss an alert
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert dismissed
 */
router.delete("/alerts/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from("notification_log")
            .update({ dismissed_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, message: "Alert dismissed" });
            }
            logger.error({ err: error }, "Dashboard alerts dismiss");
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, message: "Alert dismissed" });
    } catch (err: unknown) {
        logger.error({ err }, "Error in DELETE /dashboard/alerts/:id");
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

export default router;
