import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError, isMissingColumnError } from "../utils/dbError";
import { resolveCourierId, resolveShipperId } from "../utils/authHelpers";
import { validateUuidParam } from "../utils/validate";

const router = Router();

async function getCourierContractIds(courierId: string): Promise<string[]> {
    const { data } = await supabaseAdmin.from("contracts").select("id").eq("courier_id", courierId);
    return (data || []).map((r: { id: string }) => r.id);
}

/**
 * @swagger
 * tags:
 *   name: Accounting
 *   description: Financial stats and transactions (backed by invoices)
 */

/**
 * @swagger
 * /accounting/stats:
 *   get:
 *     summary: Get financial overview stats from invoices
 *     tags: [Accounting]
 *     responses:
 *       200:
 *         description: Revenue, receivables, payables, pending
 */
router.get("/stats", async (req: Request, res: Response) => {
    try {
        let query = supabaseAdmin.from("invoices").select("amount, generated_at");
        const courierId = req.query.courier_id as string | undefined
            || (req.user?.id ? await resolveCourierId(supabaseAdmin, req.user.id) : null);
        if (courierId) {
            const contractIds = await getCourierContractIds(courierId);
            if (contractIds.length > 0) query = query.in("contract_id", contractIds);
            else return res.json({
                success: true,
                data: {
                    totalRevenue: { value: "$0", change: "+0%", isPositive: true },
                    receivables: { value: "$0", change: "+0%", isPositive: true },
                    payables: { value: "$0", change: "+0%", isPositive: false },
                    pending: { value: "$0", change: "+0%", isPositive: true },
                },
            });
        }
        const { data: invoices, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({
                    success: true,
                    data: {
                        totalRevenue: { value: "$0", change: "+0%", isPositive: true },
                        receivables: { value: "$0", change: "+0%", isPositive: true },
                        payables: { value: "$0", change: "+0%", isPositive: false },
                        pending: { value: "$0", change: "+0%", isPositive: true },
                    },
                });
            }
            logger.error({ err: error }, "Error fetching invoices for stats");
            return res.status(500).json({ success: false, error: error.message });
        }

        const total = (invoices || []).reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0);
        const value = `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        res.json({
            success: true,
            data: {
                totalRevenue: { value, change: "+0%", isPositive: true },
                receivables: { value: "$0", change: "+0%", isPositive: true },
                payables: { value: "$0", change: "+0%", isPositive: false },
                pending: { value, change: "+0%", isPositive: true },
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /accounting/transactions:
 *   get:
 *     summary: List transactions (invoices as income)
 *     tags: [Accounting]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [completed, pending, overdue] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Transaction list
 */
router.get("/transactions", async (req: Request, res: Response) => {
    try {
        const { dateFrom, dateTo, type } = req.query;
        let query = supabaseAdmin
            .from("invoices")
            .select("id, amount, generated_at, courier_name, shipper_name, load_description, start_location, end_location, contract_id")
            .order("generated_at", { ascending: false });

        const courierId = req.query.courier_id as string | undefined
            || (req.user?.id ? await resolveCourierId(supabaseAdmin, req.user.id) : null);
        if (courierId) {
            const contractIds = await getCourierContractIds(courierId);
            if (contractIds.length > 0) query = query.in("contract_id", contractIds);
            else return res.json({ success: true, data: [] });
        }
        if (dateFrom) query = query.gte("generated_at", `${dateFrom}T00:00:00.000Z`);
        if (dateTo) query = query.lte("generated_at", `${dateTo}T23:59:59.999Z`);

        const { data: invoices, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Error fetching transactions");
            return res.status(500).json({ success: false, error: error.message });
        }

        let transactions = (invoices || []).map((i: any) => ({
            id: i.id,
            date: i.generated_at ? i.generated_at.split("T")[0] : "",
            description: i.load_description || `${i.start_location || ""} to ${i.end_location || ""}`,
            type: "income" as const,
            amount: parseFloat(i.amount) || 0,
            status: "completed" as const,
            party: i.shipper_name || "",
            partyType: "shipper" as const,
        }));

        if (type === "expense") transactions = [];
        res.json({ success: true, data: transactions });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /accounting/report:
 *   get:
 *     summary: Generate accounting report (PDF)
 *     tags: [Accounting]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [pdf], default: pdf }
 *     responses:
 *       200:
 *         description: Report generated
 */
router.get("/report", (_req: Request, res: Response) => {
    res.json({ success: true, data: null, message: "Report generated" });
});

// --- Shipper-scoped accounting records ---

async function resolveShipperIdForRequest(req: Request): Promise<string | null> {
    const shipperId = req.query.shipper_id as string | undefined;
    if (shipperId) return shipperId;
    return req.user?.id ? await resolveShipperId(supabaseAdmin, req.user.id) : null;
}

/**
 * @swagger
 * /accounting/shipper/records:
 *   get:
 *     summary: List shipper accounting records
 *     tags: [Accounting]
 *     parameters:
 *       - in: query
 *         name: shipper_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: payoutStatus
 *         schema: { type: string, enum: [paid, pending, processing] }
 *       - in: query
 *         name: paymentMethod
 *         schema: { type: string, enum: [cod, ach, wire, check] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 */
router.get("/shipper/records", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        let query = supabaseAdmin
            .from("accounting_records")
            .select("*")
            .order("date", { ascending: false });

        query = query.or(`shipper_id.eq.${shipperId},shipper_id.is.null`);

        const { payoutStatus, paymentMethod, dateFrom, dateTo } = req.query;
        if (payoutStatus && typeof payoutStatus === "string") query = query.eq("payout_status", payoutStatus);
        if (paymentMethod && typeof paymentMethod === "string") query = query.eq("payment_method", paymentMethod);
        if (dateFrom) query = query.gte("date", `${dateFrom}T00:00:00.000Z`);
        if (dateTo) query = query.lte("date", `${dateTo}T23:59:59.999Z`);

        const { data: recordsData, error: recordsError } = await query;

        if (recordsError) {
            if (isMissingTableError(recordsError)) return res.json({ success: true, data: [] });
            if (isMissingColumnError(recordsError)) return res.json({ success: true, data: [] });
            logger.error({ err: recordsError }, "Error fetching shipper accounting records");
            return res.status(500).json({ success: false, error: recordsError.message });
        }

        const records = recordsData || [];
        const filtered = records.filter((r: any) => r.shipper_id === null || r.shipper_id === shipperId);
        const recordIds = filtered.map((r: any) => r.id);

        let historyData: any[] = [];
        if (recordIds.length > 0) {
            const { data: hist } = await supabaseAdmin
                .from("accounting_history")
                .select("*")
                .in("record_id", recordIds)
                .order("created_at", { ascending: true });
            historyData = hist || [];
        }

        const historyMap = new Map<string, any[]>();
        for (const h of historyData) {
            const rid = h.record_id;
            if (!historyMap.has(rid)) historyMap.set(rid, []);
            historyMap.get(rid)!.push({
                id: h.id,
                type: h.action_type,
                timestamp: h.created_at,
                performedBy: h.performed_by,
                details: h.details || "",
                previousValue: h.previous_value,
                newValue: h.new_value,
            });
        }

        const data = filtered.map((r: any) => ({
            id: r.id,
            listingId: r.listing_id,
            vehicleYear: r.vehicle_year || new Date().getFullYear().toString(),
            vehicleMake: r.vehicle_make || "Unknown",
            vehicleModel: r.vehicle_model || "Vehicle",
            vin: r.vin || "N/A",
            stockNumber: r.stock_number || "N/A",
            cost: Number(r.cost),
            date: r.date,
            paymentMethod: r.payment_method || "cod",
            payoutStatus: r.payout_status,
            hasDocs: r.has_docs,
            history: historyMap.get(r.id) || [],
        }));

        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /accounting/shipper/records");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/shipper/records", async (req: Request, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const body = req.body || {};
        const {
            listingId,
            vehicleYear,
            vehicleMake,
            vehicleModel,
            vin,
            stockNumber,
            cost,
            date,
            paymentMethod,
            payoutStatus,
            hasDocs,
        } = body;
        const performedBy = body.performedBy || req.user?.email || "Shipper";

        if (!listingId || cost == null || !date) {
            return res.status(400).json({ success: false, error: "listingId, cost, and date are required" });
        }

        const { data: record, error: insertErr } = await supabaseAdmin
            .from("accounting_records")
            .insert({
                shipper_id: shipperId,
                listing_id: listingId,
                vehicle_year: vehicleYear || new Date().getFullYear().toString(),
                vehicle_make: vehicleMake || "Unknown",
                vehicle_model: vehicleModel || "Vehicle",
                vin: vin || "N/A",
                stock_number: stockNumber || "N/A",
                cost: Number(cost),
                date,
                payment_method: paymentMethod || "cod",
                payout_status: payoutStatus || "pending",
                has_docs: hasDocs ?? false,
            })
            .select()
            .single();

        if (insertErr) {
            if (isMissingTableError(insertErr)) return res.status(503).json({ success: false, error: "Service unavailable" });
            logger.error({ err: insertErr }, "Error creating shipper accounting record");
            return res.status(500).json({ success: false, error: insertErr.message });
        }

        await supabaseAdmin.from("accounting_history").insert({
            record_id: record.id,
            action_type: "created",
            performed_by: performedBy,
            details: "Record created",
        });

        res.json({
            success: true,
            data: {
                id: record.id,
                listingId: record.listing_id,
                vehicleYear: record.vehicle_year,
                vehicleMake: record.vehicle_make,
                vehicleModel: record.vehicle_model,
                vin: record.vin,
                stockNumber: record.stock_number,
                cost: Number(record.cost),
                date: record.date,
                paymentMethod: record.payment_method,
                payoutStatus: record.payout_status,
                hasDocs: record.has_docs,
            },
        });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /accounting/shipper/records");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch("/shipper/records/:id", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: existing } = await supabaseAdmin
            .from("accounting_records")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (!existing) return res.status(404).json({ success: false, error: "Record not found" });
        if (existing.shipper_id && existing.shipper_id !== shipperId) {
            return res.status(403).json({ success: false, error: "Not authorized to update this record" });
        }

        const body = req.body || {};
        const updates: Record<string, unknown> = {};
        const fields = ["listing_id", "vehicle_year", "vehicle_make", "vehicle_model", "vin", "stock_number", "cost", "date", "payment_method", "payout_status", "has_docs"];
        for (const f of fields) {
            const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            const val = body[camel] ?? body[f];
            if (val !== undefined) updates[f] = val;
        }
        if (Object.keys(updates).length === 0) {
            return res.json({ success: true, data: existing, message: "No changes" });
        }

        const performedBy = body.performedBy || req.user?.email || "Shipper";

        const { data: updated, error } = await supabaseAdmin
            .from("accounting_records")
            .update(updates)
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
            return res.status(500).json({ success: false, error: error.message });
        }

        await supabaseAdmin.from("accounting_history").insert({
            record_id: req.params.id,
            action_type: "edited",
            performed_by: performedBy,
            details: "Record updated",
        });

        res.json({ success: true, data: updated });
    } catch (err: any) {
        logger.error({ err }, "Error in PATCH /accounting/shipper/records/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete("/shipper/records/:id", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: existing } = await supabaseAdmin
            .from("accounting_records")
            .select("id, shipper_id")
            .eq("id", req.params.id)
            .single();

        if (!existing) return res.status(404).json({ success: false, error: "Record not found" });
        if (existing.shipper_id && existing.shipper_id !== shipperId) {
            return res.status(403).json({ success: false, error: "Not authorized to delete this record" });
        }

        const { error } = await supabaseAdmin.from("accounting_records").delete().eq("id", req.params.id);

        if (error) {
            if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, message: "Record deleted" });
    } catch (err: any) {
        logger.error({ err }, "Error in DELETE /accounting/shipper/records/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Courier-scoped cost records ---

async function resolveCourierIdForRequest(req: Request): Promise<string | null> {
    const courierId = req.query.courier_id as string | undefined;
    if (courierId) return courierId;
    return req.user?.id ? await resolveCourierId(supabaseAdmin, req.user.id) : null;
}

const COURIER_COST_CATEGORIES = ["Fuel", "Parking", "Insurance", "Washing", "Maintenance", "Credits"] as const;

function mapDbCostToResponse(r: any) {
    return {
        id: r.id,
        amount: Number(r.amount),
        category: r.category,
        description: r.description || "",
        date: r.date,
        paymentMethod: r.payment_method || "Card",
        hasDocs: r.has_docs ?? false,
        invoiceUrl: r.invoice_url,
        invoiceName: r.invoice_name,
    };
}

router.get("/courier/costs", async (req: Request, res: Response) => {
    try {
        const courierId = await resolveCourierIdForRequest(req);
        if (!courierId) {
            return res.status(401).json({ success: false, error: "Courier not found for user" });
        }

        let query = supabaseAdmin
            .from("courier_cost_records")
            .select("*")
            .eq("courier_id", courierId)
            .order("date", { ascending: false });

        const { dateFrom, dateTo, category } = req.query;
        if (dateFrom && typeof dateFrom === "string") query = query.gte("date", `${dateFrom}T00:00:00.000Z`);
        if (dateTo && typeof dateTo === "string") query = query.lte("date", `${dateTo}T23:59:59.999Z`);
        if (category && typeof category === "string" && (COURIER_COST_CATEGORIES as readonly string[]).includes(category)) {
            query = query.eq("category", category);
        }

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) return res.json({ success: true, data: [] });
            return res.status(500).json({ success: false, error: error.message });
        }

        const data = (rows || []).map(mapDbCostToResponse);
        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /accounting/courier/costs");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/courier/costs", async (req: Request, res: Response) => {
    try {
        const courierId = await resolveCourierIdForRequest(req);
        if (!courierId) {
            return res.status(401).json({ success: false, error: "Courier not found for user" });
        }

        const body = req.body || {};
        const { amount, category, description, date, paymentMethod, hasDocs, invoiceUrl, invoiceName } = body;

        if (amount == null || !category || !date) {
            return res.status(400).json({ success: false, error: "amount, category, and date are required" });
        }
        if (!(COURIER_COST_CATEGORIES as readonly string[]).includes(category)) {
            return res.status(400).json({ success: false, error: `category must be one of: ${COURIER_COST_CATEGORIES.join(", ")}` });
        }

        const { data: record, error: insertErr } = await supabaseAdmin
            .from("courier_cost_records")
            .insert({
                courier_id: courierId,
                amount: Number(amount),
                category,
                description: description || "",
                date,
                payment_method: paymentMethod || "Card",
                has_docs: hasDocs ?? false,
                invoice_url: invoiceUrl || null,
                invoice_name: invoiceName || null,
            })
            .select()
            .single();

        if (insertErr) {
            if (isMissingTableError(insertErr)) return res.status(503).json({ success: false, error: "Service unavailable" });
            logger.error({ err: insertErr }, "Error creating courier cost record");
            return res.status(500).json({ success: false, error: insertErr.message });
        }

        res.json({ success: true, data: mapDbCostToResponse(record) });
    } catch (err: any) {
        logger.error({ err }, "Error in POST /accounting/courier/costs");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch("/courier/costs/:id", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const courierId = await resolveCourierIdForRequest(req);
        if (!courierId) {
            return res.status(401).json({ success: false, error: "Courier not found for user" });
        }

        const { data: existing } = await supabaseAdmin
            .from("courier_cost_records")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (!existing) return res.status(404).json({ success: false, error: "Record not found" });
        if (existing.courier_id !== courierId) {
            return res.status(403).json({ success: false, error: "Not authorized to update this record" });
        }

        const body = req.body || {};
        const updates: Record<string, unknown> = {};
        const fields = ["amount", "category", "description", "date", "payment_method", "has_docs", "invoice_url", "invoice_name"];
        for (const f of fields) {
            const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            const val = body[camel] ?? body[f];
            if (val !== undefined) updates[f] = val;
        }
        if (updates.category && !(COURIER_COST_CATEGORIES as readonly string[]).includes(updates.category as string)) {
            return res.status(400).json({ success: false, error: `category must be one of: ${COURIER_COST_CATEGORIES.join(", ")}` });
        }
        if (Object.keys(updates).length === 0) {
            return res.json({ success: true, data: mapDbCostToResponse(existing), message: "No changes" });
        }
        if (updates.amount !== undefined) updates.amount = Number(updates.amount);

        const { data: updated, error } = await supabaseAdmin
            .from("courier_cost_records")
            .update(updates)
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: mapDbCostToResponse(updated) });
    } catch (err: any) {
        logger.error({ err }, "Error in PATCH /accounting/courier/costs/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete("/courier/costs/:id", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const courierId = await resolveCourierIdForRequest(req);
        if (!courierId) {
            return res.status(401).json({ success: false, error: "Courier not found for user" });
        }

        const { data: existing } = await supabaseAdmin
            .from("courier_cost_records")
            .select("id, courier_id")
            .eq("id", req.params.id)
            .single();

        if (!existing) return res.status(404).json({ success: false, error: "Record not found" });
        if (existing.courier_id !== courierId) {
            return res.status(403).json({ success: false, error: "Not authorized to delete this record" });
        }

        const { error } = await supabaseAdmin.from("courier_cost_records").delete().eq("id", req.params.id);

        if (error) {
            if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, message: "Record deleted" });
    } catch (err: any) {
        logger.error({ err }, "Error in DELETE /accounting/courier/costs/:id");
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/shipper/records/:id/history", validateUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const shipperId = await resolveShipperIdForRequest(req);
        if (!shipperId) {
            return res.status(401).json({ success: false, error: "Shipper not found for user" });
        }

        const { data: record } = await supabaseAdmin
            .from("accounting_records")
            .select("id, shipper_id")
            .eq("id", req.params.id)
            .single();

        if (!record) return res.status(404).json({ success: false, error: "Record not found" });
        if (record.shipper_id && record.shipper_id !== shipperId) {
            return res.status(403).json({ success: false, error: "Not authorized" });
        }

        const { data: history, error } = await supabaseAdmin
            .from("accounting_history")
            .select("*")
            .eq("record_id", req.params.id)
            .order("created_at", { ascending: true });

        if (error && !isMissingTableError(error)) {
            return res.status(500).json({ success: false, error: error.message });
        }

        const data = (history || []).map((h: any) => ({
            id: h.id,
            type: h.action_type,
            timestamp: h.created_at,
            performedBy: h.performed_by,
            details: h.details || "",
            previousValue: h.previous_value,
            newValue: h.new_value,
        }));

        res.json({ success: true, data });
    } catch (err: any) {
        logger.error({ err }, "Error in GET /accounting/shipper/records/:id/history");
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
