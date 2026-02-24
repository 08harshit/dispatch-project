import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || "4000", 10),
    nodeEnv: process.env.NODE_ENV || "development",

    supabase: {
        url: process.env.SUPABASE_URL!,
        anonKey: process.env.SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },

    cors: {
        origins:
            (process.env.NODE_ENV || "development") === "development"
                ? true                       // allow ANY origin in dev
                : (process.env.CORS_ORIGINS || "http://localhost:5173")
                    .split(",")
                    .map((o) => o.trim()),
    },
};
