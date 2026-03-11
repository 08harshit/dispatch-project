import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";
import { resolveShipperId } from "../utils/authHelpers";
import { validateUuidParam } from "../utils/validate";

const router = Router();

async function resolveShipperIdForRequest(req: Request): Promise<string | null> {
    const shipperId = req.query.shipper_id as string | undefined;
    if (shipperId) return shipperId;
    return req.user?.id ? await resolveShipperId(supabaseAdmin, req.user.id) : null;
}

async function verifyLeadShipperAccess(leadId: string, shipperId: string): Promise<boolean> {
    const { data: lead } = await supabaseAdmin.from("leads").select("shipper_id").eq("id", leadId).single();
    return !!(lead && (lead as { shipper_id: string | null }).shipper_id === shipperId);
}

router.get("/negotiations", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) return res.status(401).json({ success: false, error: "Shipper not found" });

        const leadId = req.query.lead_id as string;
        if (!leadId) return res.status(400).json({ success: false, error: "lead_id required" });

        const ok = await verifyLeadShipperAccess(leadId, shipperId);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });

        const { data, error } = await supabaseAdmin
            .from("negotiations")
            .select("*, couriers(*), offers(*)")
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false });

        if (error) {
            if (isMissingTableError(error)) return res.json({ success: true, data: [] });
            throw error;
        }
        res.json({ success: true, data: data || [] });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /matching/negotiations");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/negotiate", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) return res.status(401).json({ success: false, error: "Shipper not found" });

        const { action, negotiation_id, actor, counter_amount } = req.body || {};
        if (!action || !negotiation_id) return res.status(400).json({ success: false, error: "action and negotiation_id required" });

        const { data: neg } = await supabaseAdmin.from("negotiations").select("lead_id").eq("id", negotiation_id).single();
        if (!neg) return res.status(404).json({ success: false, error: "Negotiation not found" });
        const ok = await verifyLeadShipperAccess(neg.lead_id, shipperId);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });

        const { data, error } = await supabaseAdmin.functions.invoke("negotiate", {
            body: { action, negotiation_id, actor: actor || "shipper", counter_amount },
        });

        if (error) throw error;
        if (data?.error) return res.status(400).json({ success: false, error: data.error });
        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /matching/negotiate");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/cancel", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) return res.status(401).json({ success: false, error: "Shipper not found" });

        const { matching_request_id } = req.body || {};
        if (!matching_request_id) return res.status(400).json({ success: false, error: "matching_request_id required" });

        const { data: mr } = await supabaseAdmin.from("matching_requests").select("lead_id").eq("id", matching_request_id).single();
        if (!mr) return res.status(404).json({ success: false, error: "Matching request not found" });
        const ok = await verifyLeadShipperAccess(mr.lead_id, shipperId);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });

        const { data, error } = await supabaseAdmin.functions.invoke("find-closest-driver", {
            body: { action: "cancel", matching_request_id },
        });

        if (error) throw error;
        if (data?.error) return res.status(400).json({ success: false, error: data.error });
        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /matching/cancel");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/start-negotiation", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) return res.status(401).json({ success: false, error: "Shipper not found" });

        const { lead_id, courier_id, initial_offer } = req.body || {};
        if (!lead_id || !courier_id || initial_offer == null) {
            return res.status(400).json({ success: false, error: "lead_id, courier_id, and initial_offer required" });
        }

        const ok = await verifyLeadShipperAccess(lead_id, shipperId);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
        const courierDeadline = new Date(now.getTime() + 10 * 60 * 1000);

        const { data: negotiation, error: negError } = await supabaseAdmin
            .from("negotiations")
            .insert({
                lead_id,
                courier_id,
                status: "negotiating",
                current_offer: initial_offer,
                counter_count: 0,
                negotiation_started_at: now.toISOString(),
                negotiation_expires_at: expiresAt.toISOString(),
                courier_response_deadline: courierDeadline.toISOString(),
            })
            .select()
            .single();

        if (negError) throw negError;

        const { error: offerError } = await supabaseAdmin.from("offers").insert({
            negotiation_id: negotiation.id,
            offered_by: "shipper",
            amount: initial_offer,
            response: "pending",
        });

        if (offerError) throw offerError;

        await supabaseAdmin.from("leads").update({ is_locked: true, locked_by_courier_id: courier_id }).eq("id", lead_id);

        res.json({ success: true, data: negotiation });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /matching/start-negotiation");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/find-driver", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) return res.status(401).json({ success: false, error: "Shipper not found" });

        const body = req.body || {};
        const leadId = body.lead_id;
        if (leadId) {
            const ok = await verifyLeadShipperAccess(leadId, shipperId);
            if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });
        }

        const { data, error } = await supabaseAdmin.functions.invoke("find-closest-driver", { body });

        if (error) throw error;
        if (data?.error) return res.status(400).json({ success: false, error: data.error });

        if (data?.success && data?.notification_id) {
            const { data: notif } = await supabaseAdmin
                .from("driver_notifications")
                .select("matching_request_id")
                .eq("id", data.notification_id)
                .single();
            if (notif) (data as any).matching_request_id = (notif as any).matching_request_id;
        }
        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /matching/find-driver");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/verify-carrier", async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const { data, error } = await supabaseAdmin.functions.invoke("verify-carrier", { body });
        if (error) throw error;
        if (data?.error) return res.status(400).json({ success: false, error: data.error });
        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /matching/verify-carrier");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/history", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) return res.status(401).json({ success: false, error: "Shipper not found" });

        const leadId = req.query.lead_id as string;
        if (!leadId) return res.status(400).json({ success: false, error: "lead_id required" });

        const ok = await verifyLeadShipperAccess(leadId, shipperId);
        if (!ok) return res.status(403).json({ success: false, error: "Not authorized" });

        const [activityRes, matchRes] = await Promise.all([
            supabaseAdmin.from("activity_log").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(50),
            supabaseAdmin.from("matching_requests").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(10),
        ]);

        const activity = activityRes.data || [];
        const matchingRequests = matchRes.data || [];

        const mrIds = matchingRequests.map((m: any) => m.id);
        const notifsByMr = mrIds.length > 0
            ? (await supabaseAdmin.from("driver_notifications").select("*, couriers(name)").in("matching_request_id", mrIds)).data || []
            : [];

        res.json({
            success: true,
            data: {
                activity,
                notifications: notifsByMr,
                matchingRequests,
            },
        });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /matching/history");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/nearby-drivers", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) return res.status(401).json({ success: false, error: "Shipper not found" });

        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radiusMeters = parseInt(req.query.radius as string, 10) || 50000;

        if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ success: false, error: "lat and lng required" });

        const { data: couriers, error } = await supabaseAdmin
            .from("couriers")
            .select("id, name, latitude, longitude, is_available")
            .eq("is_available", true);

        if (error) {
            if (isMissingTableError(error)) return res.json({ success: true, data: [] });
            throw error;
        }

        const R = 6371000;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const withDistance = (couriers || [])
            .filter((c: any) => c.latitude != null && c.longitude != null)
            .map((c: any) => ({
                ...c,
                distance: Math.round(haversine(lat, lng, c.latitude, c.longitude)),
            }))
            .filter((c: any) => c.distance <= radiusMeters)
            .sort((a: any, b: any) => a.distance - b.distance);

        res.json({ success: true, data: withDistance });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /matching/nearby-drivers");
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
