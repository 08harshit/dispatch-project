import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice read-only (created by trigger on trip completion)
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: List invoices
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: trip_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: contract_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { trip_id, contract_id, dateFrom, dateTo } = req.query;
        let query = supabaseAdmin
            .from("invoices")
            .select("*")
            .order("generated_at", { ascending: false });

        if (trip_id) query = query.eq("trip_id", trip_id as string);
        if (contract_id) query = query.eq("contract_id", contract_id as string);
        if (dateFrom) query = query.gte("generated_at", `${dateFrom}T00:00:00.000Z`);
        if (dateTo) query = query.lte("generated_at", `${dateTo}T23:59:59.999Z`);

        const { data, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            console.error("Error fetching invoices:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        res.json({ success: true, data: data || [] });
    } catch (err: any) {
        console.error("Error in GET /invoices:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get a single invoice by ID
 *     tags: [Invoices]
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: invoice, error } = await supabaseAdmin
            .from("invoices")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(404).json({ success: false, error: "Invoice not found" });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!invoice) {
            return res.status(404).json({ success: false, error: "Invoice not found" });
        }

        res.json({ success: true, data: invoice });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
