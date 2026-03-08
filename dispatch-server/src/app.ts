import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { config } from "./config";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import routes from "./routes";
import { expireVehicleAccess } from "./services/vehicleAccessExpiry";
import { processNotificationLog } from "./services/notificationService";

const app = express();

// --------------- Security & Parsing ---------------
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------- CORS ---------------
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "https://dispatch-project-livid.vercel.app"
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
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
const server = app.listen(PORT, () => {
    logger.info(`Dispatch Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Supabase: ${config.supabase.url}`);
    logger.info(`API Docs: http://localhost:${PORT}/api-docs`);

    // Vehicle access expiry: run every 10 minutes
    const EXPIRY_INTERVAL_MS = 10 * 60 * 1000;
    setInterval(async () => {
        const result = await expireVehicleAccess();
        if (result.error) {
            logger.error({ err: result.error }, "[vehicleAccessExpiry]");
        } else if (result.expired > 0) {
            logger.info({ expired: result.expired }, "[vehicleAccessExpiry] expired record(s)");
        }
    }, EXPIRY_INTERVAL_MS);

    // Notification worker: run every 2 minutes
    const NOTIFICATION_INTERVAL_MS = 2 * 60 * 1000;
    setInterval(async () => {
        const result = await processNotificationLog();
        if (result.errors.length) {
            logger.error({ errors: result.errors }, "[notificationWorker]");
        } else if (result.sent > 0) {
            logger.info({ sent: result.sent }, "[notificationWorker] sent notification(s)");
        }
    }, NOTIFICATION_INTERVAL_MS);
});

function gracefulShutdown(signal: string) {
    logger.info({ signal }, "Shutdown signal received");
    server.close(() => {
        logger.info("Server closed");
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
