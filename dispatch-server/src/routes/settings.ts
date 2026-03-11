import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { isMissingTableError } from "../utils/dbError";
import { resolveShipperId } from "../utils/authHelpers";

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
        const shipperId = await resolveShipperId(supabaseAdmin, userId);

        if (shipperId) {
            const { data: shipper, error: shipperErr } = await supabaseAdmin
                .from("shippers")
                .select("name, contact_email, phone, address")
                .eq("id", shipperId)
                .single();

            if (!shipperErr && shipper) {
                const s = shipper as { name?: string; contact_email?: string; phone?: string; address?: string };
                return res.json({
                    success: true,
                    data: {
                        displayName: s.name ?? null,
                        avatarUrl: null,
                        email: req.user?.email ?? s.contact_email ?? "",
                        companyName: s.name ?? "",
                        contactName: s.name ?? "",
                        phone: s.phone ?? "",
                        address: s.address ?? "",
                    },
                });
            }
        }

        const { data: row, error } = await supabaseAdmin
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", userId)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return res.json({ success: true, data: { displayName: null, avatarUrl: null, email: req.user?.email ?? "", companyName: "", contactName: "", phone: "", address: "" } });
            }
            if (error.code === "PGRST116") {
                return res.json({ success: true, data: { displayName: null, avatarUrl: null, email: req.user?.email ?? "", companyName: "", contactName: "", phone: "", address: "" } });
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
                companyName: r?.company_name ?? "",
                contactName: r?.display_name ?? "",
                phone: r?.phone ?? "",
                address: r?.address ?? "",
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
        const shipperId = await resolveShipperId(supabaseAdmin, userId);

        if (shipperId) {
            const companyName = body.companyName ?? body.company_name;
            const contactName = body.contactName ?? body.contact_name;
            const phone = body.phone;
            const address = body.address;
            const shipperUpdates: Record<string, unknown> = {};
            if (companyName !== undefined) shipperUpdates.name = companyName;
            else if (contactName !== undefined) shipperUpdates.name = contactName;
            if (phone !== undefined) shipperUpdates.phone = phone;
            if (address !== undefined) shipperUpdates.address = address;
            if (Object.keys(shipperUpdates).length > 0) {
                const { error: shipperErr } = await supabaseAdmin
                    .from("shippers")
                    .update(shipperUpdates)
                    .eq("id", shipperId);
                if (shipperErr) return res.status(500).json({ success: false, error: shipperErr.message });
            }
        }

        const displayName = body.displayName ?? body.display_name;
        const avatarUrl = body.avatarUrl ?? body.avatar_url;
        const updates: Record<string, unknown> = {};
        if (displayName !== undefined) updates.display_name = displayName;
        if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
        if (Object.keys(updates).length === 0 && !shipperId) {
            const { data: row } = await supabaseAdmin.from("profiles").select("display_name, avatar_url").eq("user_id", userId).single();
            return res.json({ success: true, data: row, message: "Profile unchanged" });
        }
        if (Object.keys(updates).length > 0) {
            const { data: row, error } = await supabaseAdmin
                .from("profiles")
                .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" })
                .select()
                .single();

            if (error) {
                if (isMissingTableError(error)) return res.status(503).json({ success: false, error: "Service unavailable" });
                return res.status(500).json({ success: false, error: error.message });
            }
            return res.json({ success: true, data: row, message: "Profile updated" });
        }
        res.json({ success: true, message: "Profile updated" });
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
            if (error.code === "42703") {
                return res.json({ success: true, data: { email: true, push: true, urgentOnly: false } });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
        const prefs = (row as any)?.notification_preferences ?? {};
        const hasShipperFormat = "emailNotifications" in prefs || "shipmentUpdates" in prefs;
        const data = hasShipperFormat
            ? {
                emailNotifications: prefs.emailNotifications ?? true,
                shipmentUpdates: prefs.shipmentUpdates ?? true,
                driverAlerts: prefs.driverAlerts ?? true,
                paymentAlerts: prefs.paymentAlerts ?? false,
                weeklyReports: prefs.weeklyReports ?? true,
              }
            : {
                emailNotifications: prefs.email !== false,
                shipmentUpdates: prefs.push !== false,
                driverAlerts: prefs.push !== false,
                paymentAlerts: prefs.urgentOnly === true,
                weeklyReports: true,
              };
        res.json({ success: true, data });
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
        const emailNotifications = body.emailNotifications;
        const shipmentUpdates = body.shipmentUpdates;
        const driverAlerts = body.driverAlerts;
        const paymentAlerts = body.paymentAlerts;
        const weeklyReports = body.weeklyReports;
        const prefs: Record<string, boolean> = {};
        if (typeof email === "boolean") prefs.email = email;
        if (typeof push === "boolean") prefs.push = push;
        if (typeof urgentOnly === "boolean") prefs.urgentOnly = urgentOnly;
        if (typeof emailNotifications === "boolean") prefs.emailNotifications = emailNotifications;
        if (typeof shipmentUpdates === "boolean") prefs.shipmentUpdates = shipmentUpdates;
        if (typeof driverAlerts === "boolean") prefs.driverAlerts = driverAlerts;
        if (typeof paymentAlerts === "boolean") prefs.paymentAlerts = paymentAlerts;
        if (typeof weeklyReports === "boolean") prefs.weeklyReports = weeklyReports;
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
            if (error.code === "42703") return res.status(503).json({ success: false, error: "notification_preferences column not found - run migration 20260227100000_profiles_notification_preferences.sql" });
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, data: next, message: "Notification preferences updated" });
    } catch (err: unknown) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

export default router;
