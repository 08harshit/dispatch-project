import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import cronRoutes from "./cron";
import vehicleAccessRoutes from "./vehicle-access";
import vehicleRoutes from "./vehicles";
import courierRoutes from "./couriers";
import shipperRoutes from "./shippers";
import loadRoutes from "./loads";
import contractRoutes from "./contracts";
import tripRoutes from "./trips";
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
// Optional: enable requireRole(["admin"]) for admin-only access when all clients are admin
// router.use(requireRole(["admin"]));
router.use("/couriers", courierRoutes);
router.use("/shippers", shipperRoutes);
router.use("/loads", loadRoutes);
router.use("/contracts", contractRoutes);
router.use("/trips", tripRoutes);
router.use("/tickets", ticketRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/accounting", accountingRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/saved-loads", savedLoadsRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/vehicle-access", vehicleAccessRoutes);

export default router;
