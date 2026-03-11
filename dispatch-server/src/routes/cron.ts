import { Router, Request, Response, NextFunction } from "express";
import { config } from "../config";
import { expireVehicleAccess } from "../services/vehicleAccessExpiry";
import { processNotificationLog } from "../services/notificationService";

/**
 * Middleware: allow request only if CRON_SECRET is not set (cron disabled) or
 * header X-Cron-Secret or Authorization Bearer matches CRON_SECRET.
 */
export function requireCronSecret(req: Request, res: Response, next: NextFunction): void {
    const secret = config.cronSecret;
    if (!secret) {
        return next();
    }
    const headerSecret = req.headers["x-cron-secret"] || (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (headerSecret !== secret) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
    }
    next();
}

const router = Router();

router.use(requireCronSecret);

/** POST /api/cron/expire-vehicle-access — set is_active = false where exp_dt < now() */
router.post("/expire-vehicle-access", async (_req: Request, res: Response) => {
    try {
        const result = await expireVehicleAccess();
        if (result.error) {
            res.status(500).json({ success: false, error: result.error, expired: result.expired });
            return;
        }
        res.json({ success: true, expired: result.expired });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

/** POST /api/cron/process-notifications — process notification_log, send emails, set sent_at */
router.post("/process-notifications", async (_req: Request, res: Response) => {
    try {
        const result = await processNotificationLog();
        res.json({
            success: result.errors.length === 0,
            processed: result.processed,
            sent: result.sent,
            errors: result.errors.length ? result.errors : undefined,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
});

export default router;
