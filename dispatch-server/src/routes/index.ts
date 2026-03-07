import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { resolveCourierId, resolveShipperId } from "../utils/authHelpers";
import cronRoutes from "./cron";
// import vehicleAccessRoutes from "./vehicle-access"; // MODULE DISABLED
// import vehicleRoutes from "./vehicles"; // MODULE DISABLED
import courierRoutes from "./couriers";
import shipperRoutes from "./shippers";
import loadRoutes from "./loads";
import contractRoutes from "./contracts";
// import tripRoutes from "./trips"; // MODULE DISABLED
import ticketRoutes from "./tickets";
import dashboardRoutes from "./dashboard";
import accountingRoutes from "./accounting";
import analyticsRoutes from "./analytics";
import settingsRoutes from "./settings";
import invoiceRoutes from "./invoices";
import savedLoadsRoutes from "./saved-loads";

const router = Router();

// Health check (no auth)
router.get("/", (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Dispatch Server API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// Readiness/health with DB ping (no auth)
router.get("/health", async (_req: Request, res: Response) => {
    try {
        const { error } = await supabaseAdmin.from("shippers").select("id").limit(1);
        if (error) {
            return res.status(503).json({
                success: false,
                status: "unhealthy",
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
        res.json({
            success: true,
            status: "healthy",
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(503).json({
            success: false,
            status: "unhealthy",
            error: err instanceof Error ? err.message : "Unknown error",
            timestamp: new Date().toISOString(),
        });
    }
});

// Cron endpoints (secret-based, no user auth)
router.use("/cron", cronRoutes);

// Protected API routes
router.use(authenticate);

router.get("/me", async (req: Request, res: Response) => {
    try {
        const authUserId = req.user?.id;
        if (!authUserId) {
            return res.status(401).json({ success: false, error: "Not authenticated" });
        }
        const [courier_id, shipper_id] = await Promise.all([
            resolveCourierId(supabaseAdmin, authUserId),
            resolveShipperId(supabaseAdmin, authUserId),
        ]);
        res.json({
            success: true,
            data: {
                id: authUserId,
                email: req.user?.email,
                role: req.user?.role,
                courier_id: courier_id ?? undefined,
                shipper_id: shipper_id ?? undefined,
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

router.use("/couriers", courierRoutes);
router.use("/shippers", shipperRoutes);
router.use("/loads", loadRoutes);
router.use("/contracts", contractRoutes);
// router.use("/trips", tripRoutes); // MODULE DISABLED
router.use("/tickets", ticketRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/accounting", accountingRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/saved-loads", savedLoadsRoutes);
// router.use("/vehicles", vehicleRoutes); // MODULE DISABLED
// router.use("/vehicle-access", vehicleAccessRoutes); // MODULE DISABLED

export default router;
