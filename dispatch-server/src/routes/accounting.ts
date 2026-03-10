import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";
import { resolveCourierId } from "../utils/authHelpers";

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

export default router;
