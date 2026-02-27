import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { isMissingTableError } from "../utils/dbError";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: User profile and preferences
 */

/**
 * @swagger
 * /settings/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: User profile data
 *   put:
 *     summary: Update user profile
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.get("/profile", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { data: row, error } = await supabaseAdmin
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", userId)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: { displayName: null, avatarUrl: null, email: req.user?.email ?? "" } });
            }
            if (error.code === "PGRST116") {
                return res.json({ success: true, data: { displayName: null, avatarUrl: null, email: req.user?.email ?? "" } });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        const r = row as any;
        res.json({
            success: true,
            data: {
                displayName: r?.display_name ?? null,
                avatarUrl: r?.avatar_url ?? null,
                email: req.user?.email ?? "",
            },
        });
    } catch (err: unknown) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.put("/profile", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const body = req.body || {};
        const displayName = body.displayName ?? body.display_name;
        const avatarUrl = body.avatarUrl ?? body.avatar_url;
        const updates: Record<string, unknown> = {};
        if (displayName !== undefined) updates.display_name = displayName;
        if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
        if (Object.keys(updates).length === 0) {
            const { data: row } = await supabaseAdmin.from("profiles").select("display_name, avatar_url").eq("user_id", userId).single();
            return res.json({ success: true, data: row, message: "Profile unchanged" });
        }
        const { data: row, error } = await supabaseAdmin
            .from("profiles")
            .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" })
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, data: row, message: "Profile updated" });
    } catch (err: unknown) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /settings/password:
 *   put:
 *     summary: Change user password
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put("/password", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { newPassword } = req.body || {};
        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
            return res.status(400).json({ success: false, error: "newPassword is required and must be at least 6 characters" });
        }
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.json({ success: true, message: "Password changed" });
    } catch (err: unknown) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/**
 * @swagger
 * /settings/notifications:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Notification preferences
 *   put:
 *     summary: Update notification preferences
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: boolean }
 *               push: { type: boolean }
 *               urgentOnly: { type: boolean }
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.get("/notifications", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { data: row, error } = await supabaseAdmin
            .from("profiles")
            .select("notification_preferences")
            .eq("user_id", userId)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: { email: true, push: true, urgentOnly: false } });
            }
            if (error.code === "PGRST116") {
                return res.json({ success: true, data: { email: true, push: true, urgentOnly: false } });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        const prefs = (row as any)?.notification_preferences ?? { email: true, push: true, urgentOnly: false };
        res.json({ success: true, data: prefs });
    } catch (err: unknown) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

router.put("/notifications", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const body = req.body || {};
        const email = body.email;
        const push = body.push;
        const urgentOnly = body.urgentOnly;
        const prefs: Record<string, boolean> = {};
        if (typeof email === "boolean") prefs.email = email;
        if (typeof push === "boolean") prefs.push = push;
        if (typeof urgentOnly === "boolean") prefs.urgentOnly = urgentOnly;
        if (Object.keys(prefs).length === 0) {
            return res.json({ success: true, message: "No changes" });
        }
        const { data: row } = await supabaseAdmin.from("profiles").select("notification_preferences").eq("user_id", userId).single();
        const current = (row as any)?.notification_preferences ?? {};
        const next = { ...current, ...prefs };
        const { error } = await supabaseAdmin
            .from("profiles")
            .upsert({ user_id: userId, notification_preferences: next }, { onConflict: "user_id" });

        if (error) {
            if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, data: next, message: "Notification preferences updated" });
    } catch (err: unknown) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

export default router;
