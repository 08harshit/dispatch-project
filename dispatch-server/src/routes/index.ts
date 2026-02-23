import { Router, Request, Response } from "express";
import courierRoutes from "./couriers";
import shipperRoutes from "./shippers";
import loadRoutes from "./loads";
import ticketRoutes from "./tickets";
import dashboardRoutes from "./dashboard";
import accountingRoutes from "./accounting";
import analyticsRoutes from "./analytics";
import settingsRoutes from "./settings";

const router = Router();

// Health check
router.get("/", (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Dispatch Server API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// Module routes
router.use("/couriers", courierRoutes);
router.use("/shippers", shipperRoutes);
router.use("/loads", loadRoutes);
router.use("/tickets", ticketRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/accounting", accountingRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);

export default router;
