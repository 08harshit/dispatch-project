import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
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

// Protected API routes
router.use(authenticate);
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

export default router;
