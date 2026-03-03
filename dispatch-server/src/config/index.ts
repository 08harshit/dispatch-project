import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || "4000", 10),
    nodeEnv: process.env.NODE_ENV || "development",

    supabase: {
        url: process.env.SUPABASE_URL!,
        anonKey: process.env.SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        /** Optional. When set, JWT is verified locally instead of calling Auth API (reduces latency). */
        jwtSecret: process.env.SUPABASE_JWT_SECRET || undefined,
    },

    cors: {
        origins:
            (process.env.NODE_ENV || "development") === "development"
                ? true                       // allow ANY origin in dev
                : (process.env.CORS_ORIGINS || "http://localhost:5173")
                    .split(",")
                    .map((o) => o.trim()),
    },

    /** Optional. When set, cron endpoints require X-Cron-Secret or Authorization: Bearer <value>. */
    cronSecret: process.env.CRON_SECRET || undefined,

    /** Resend: API key and from address for notification emails. If not set, notification worker skips sending. */
    resend: {
        apiKey: process.env.RESEND_API_KEY || undefined,
        fromEmail: process.env.NOTIFICATION_FROM_EMAIL || process.env.FROM_EMAIL || "notifications@dispatch.local",
    },
};
