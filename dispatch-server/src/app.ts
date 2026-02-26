import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { config } from "./config";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import { expireVehicleAccess } from "./services/vehicleAccessExpiry";
import { processNotificationLog } from "./services/notificationService";

const app = express();

// --------------- Security & Parsing ---------------
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------- CORS ---------------
app.use(
    cors({
        origin: config.cors.origins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Cron-Secret"],
    })
);

// --------------- Rate Limiting ---------------
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: "Too many requests, please try again later" },
    })
);

// --------------- Logging ---------------
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

// --------------- Swagger Docs ---------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Dispatch Server API Docs",
}));
app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// --------------- Routes ---------------
app.use("/api", routes);

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Start ---------------
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`\nDispatch Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Supabase: ${config.supabase.url}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs\n`);

    // Vehicle access expiry: run every 10 minutes
    const EXPIRY_INTERVAL_MS = 10 * 60 * 1000;
    setInterval(async () => {
        const result = await expireVehicleAccess();
        if (result.error) {
            console.error("[vehicleAccessExpiry]", result.error);
        } else if (result.expired > 0) {
            console.log("[vehicleAccessExpiry] expired", result.expired, "record(s)");
        }
    }, EXPIRY_INTERVAL_MS);

    // Notification worker: run every 2 minutes
    const NOTIFICATION_INTERVAL_MS = 2 * 60 * 1000;
    setInterval(async () => {
        const result = await processNotificationLog();
        if (result.errors.length) {
            console.error("[notificationWorker]", result.errors);
        } else if (result.sent > 0) {
            console.log("[notificationWorker] sent", result.sent, "notification(s)");
        }
    }, NOTIFICATION_INTERVAL_MS);
});

export default app;
