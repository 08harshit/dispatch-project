import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

function mapTicket(row: Record<string, unknown>, comments: Record<string, unknown>[] = []): Record<string, unknown> {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        priority: row.priority ?? "medium",
        status: row.status ?? "open",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        comments: comments.map((c) => ({
            id: c.id,
            author: c.author ?? "",
            text: c.text ?? "",
            date: c.created_at ? new Date(String(c.created_at)).toISOString().slice(0, 10) : "",
        })),
    };
}

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Internal ticket/issue tracking
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: List all tickets
 *     tags: [Tickets]
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { search, status, priority, sortField, sortDir } = req.query;
        let query = supabaseAdmin.from("tickets").select("*");
        if (status) query = query.eq("status", status as string);
        if (priority) query = query.eq("priority", priority as string);
        if (search && String(search).trim()) {
            const term = `%${String(search).trim()}%`;
            query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }
        const orderBy = (sortField as string) === "createdAt" ? "created_at" : (sortField as string) || "created_at";
        query = query.order(orderBy, { ascending: (sortDir as string) !== "desc" });

        const { data: rows, error } = await query;

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: [] });
            }
            logger.error({ err: error }, "Error fetching tickets");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = rows || [];
        const ids = list.map((r: { id: string }) => r.id);
        const { data: commentRows } = ids.length
            ? await supabaseAdmin.from("ticket_comments").select("*").in("ticket_id", ids).order("created_at", { ascending: true })
            : { data: [] };
        const commentsByTicket = new Map<string, Record<string, unknown>[]>();
        for (const c of commentRows || []) {
            const tid = (c as { ticket_id: string }).ticket_id;
            if (!commentsByTicket.has(tid)) commentsByTicket.set(tid, []);
            commentsByTicket.get(tid)!.push(c);
        }
        const data = list.map((r: Record<string, unknown>) => mapTicket(r, commentsByTicket.get(String(r.id)) || []));
        res.json({ success: true, data });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /tickets");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /tickets/stats:
 *   get:
 *     summary: Get ticket statistics
 *     tags: [Tickets]
 */
router.get("/stats", async (_req: Request, res: Response) => {
    try {
        const { data: rows, error } = await supabaseAdmin.from("tickets").select("status, priority");

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({
                    success: true,
                    data: { open: 0, inProgress: 0, resolved: 0, closed: 0, highPriority: 0 },
                });
            }
            logger.error({ err: error }, "Error fetching ticket stats");
            return res.status(500).json({ success: false, error: error.message });
        }

        const list = rows || [];
        const open = list.filter((r: { status?: string }) => r.status === "open").length;
        const inProgress = list.filter((r: { status?: string }) => r.status === "in-progress").length;
        const resolved = list.filter((r: { status?: string }) => r.status === "resolved").length;
        const closed = list.filter((r: { status?: string }) => r.status === "closed").length;
        const highPriority = list.filter((r: { priority?: string }) => r.priority === "urgent" || r.priority === "high").length;
        res.json({
            success: true,
            data: { open, inProgress, resolved, closed, highPriority, urgent: highPriority },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /tickets/stats");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get a single ticket with comments
 *     tags: [Tickets]
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: row, error } = await supabaseAdmin.from("tickets").select("*").eq("id", id).single();

        if (error) {
            if (isMissingTableError(error) || error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Ticket not found" });
            }
            logger.error({ err: error }, "Error fetching ticket");
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, error: "Ticket not found" });
        }

        const { data: commentRows } = await supabaseAdmin
            .from("ticket_comments")
            .select("*")
            .eq("ticket_id", id)
            .order("created_at", { ascending: true });
        res.json({ success: true, data: mapTicket(row as Record<string, unknown>, commentRows || []) });
    } catch (err: unknown) {
        logger.error({ err }, "Error in GET /tickets/:id");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const { title, description, priority } = req.body || {};
        if (!title || typeof title !== "string") {
            return res.status(400).json({ success: false, error: "title is required" });
        }
        const { data: row, error } = await supabaseAdmin
            .from("tickets")
            .insert({
                title: String(title).trim(),
                description: description != null ? String(description) : null,
                priority: ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium",
            })
            .select("*")
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(503).json({ success: false, error: "Tickets table not available" });
            }
            logger.error({ err: error }, "Error creating ticket");
            return res.status(500).json({ success: false, error: error.message });
        }
        res.status(201).json({ success: true, data: mapTicket(row as Record<string, unknown>, []) });
    } catch (err: unknown) {
        logger.error({ err }, "Error in POST /tickets");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status } = req.body || {};
        const updates: Record<string, unknown> = {};
        if (typeof title === "string") updates.title = title.trim();
        if (description !== undefined) updates.description = description;
        if (["low", "medium", "high", "urgent"].includes(priority)) updates.priority = priority;
        if (["open", "in-progress", "resolved", "closed"].includes(status)) updates.status = status;
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: "No valid fields to update" });
        }
        const { data: row, error } = await supabaseAdmin.from("tickets").update(updates).eq("id", id).select("*").single();

        if (error) {
            if (isMissingTableError(error) || error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Ticket not found" });
            }
            logger.error({ err: error }, "Error updating ticket");
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!row) return res.status(404).json({ success: false, error: "Ticket not found" });
        const { data: commentRows } = await supabaseAdmin.from("ticket_comments").select("*").eq("ticket_id", id).order("created_at", { ascending: true });
        res.json({ success: true, data: mapTicket(row as Record<string, unknown>, commentRows || []) });
    } catch (err: unknown) {
        logger.error({ err }, "Error in PUT /tickets/:id");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.patch("/:id/status", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        if (!["open", "in-progress", "resolved", "closed"].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status" });
        }
        const { data: row, error } = await supabaseAdmin.from("tickets").update({ status }).eq("id", id).select("*").single();

        if (error) {
            if (isMissingTableError(error) || error.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Ticket not found" });
            }
            logger.error({ err: error }, "Error updating ticket status");
            return res.status(500).json({ success: false, error: error.message });
        }
        if (!row) return res.status(404).json({ success: false, error: "Ticket not found" });
        const { data: commentRows } = await supabaseAdmin.from("ticket_comments").select("*").eq("ticket_id", id).order("created_at", { ascending: true });
        res.json({ success: true, data: mapTicket(row as Record<string, unknown>, commentRows || []) });
    } catch (err: unknown) {
        logger.error({ err }, "Error in PATCH /tickets/:id/status");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: existing } = await supabaseAdmin.from("tickets").select("*").eq("id", id).single();
        let ticket: Record<string, unknown> | null = null;
        if (existing) {
            const { data: commentRows } = await supabaseAdmin
                .from("ticket_comments")
                .select("*")
                .eq("ticket_id", id)
                .order("created_at", { ascending: true });
            ticket = mapTicket(existing as Record<string, unknown>, commentRows || []);
        }

        const { error } = await supabaseAdmin.from("tickets").delete().eq("id", id);

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: ticket, message: "Ticket deleted" });
            }
            logger.error({ err: error }, "Error deleting ticket");
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, data: ticket, message: "Ticket deleted" });
    } catch (err: unknown) {
        logger.error({ err }, "Error in DELETE /tickets/:id");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.post("/:id/comments", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { text, author } = req.body || {};
        if (!text || typeof text !== "string" || !text.trim()) {
            return res.status(400).json({ success: false, error: "text is required" });
        }
        const { data: comment, error } = await supabaseAdmin
            .from("ticket_comments")
            .insert({ ticket_id: id, author: author ? String(author) : "Admin", text: text.trim() })
            .select("*")
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.status(503).json({ success: false, error: "Tickets table not available" });
            }
            logger.error({ err: error }, "Error adding comment");
            return res.status(500).json({ success: false, error: error.message });
        }
        res.status(201).json({
            success: true,
            data: {
                id: comment?.id,
                author: comment?.author ?? "Admin",
                text: comment?.text ?? "",
                date: comment?.created_at ? new Date(String(comment.created_at)).toISOString().slice(0, 10) : "",
            },
        });
    } catch (err: unknown) {
        logger.error({ err }, "Error in POST /tickets/:id/comments");
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

export default router;
