import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { config } from "../config";

// Extend Express Request to include authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role?: string;
            };
        }
    }
}

interface JwtPayload {
    sub: string;
    email?: string;
    user_metadata?: { role?: string };
}

/**
 * Verify JWT locally when SUPABASE_JWT_SECRET is set (avoids Auth API round-trip).
 */
function verifyTokenLocally(token: string): JwtPayload | null {
    const secret = config.supabase.jwtSecret;
    if (!secret) return null;
    try {
        const jwt = require("jsonwebtoken") as { verify: (t: string, s: string, o: { algorithms: string[] }) => JwtPayload };
        const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Middleware to authenticate requests using Supabase JWT.
 * Expects: Authorization: Bearer <access_token>
 * When SUPABASE_JWT_SECRET is set, verifies JWT locally to avoid Auth API latency.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const localPayload = verifyTokenLocally(token);
        if (localPayload) {
            req.user = {
                id: localPayload.sub,
                email: localPayload.email || "",
                role: localPayload.user_metadata?.role,
            };
            return next();
        }

        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ success: false, error: "Invalid or expired token" });
        }

        req.user = {
            id: data.user.id,
            email: data.user.email || "",
            role: data.user.user_metadata?.role,
        };

        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: "Authentication failed" });
    }
};

/**
 * Optional auth: when Authorization: Bearer <token> is present and valid, sets req.user.
 * Does not fail when missing or invalid; routes can use req.user?.id for courier_id/shipper_id.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }
    const token = authHeader.split(" ")[1];
    try {
        const localPayload = verifyTokenLocally(token);
        if (localPayload) {
            req.user = {
                id: localPayload.sub,
                email: localPayload.email || "",
                role: localPayload.user_metadata?.role,
            };
            return next();
        }
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user) {
            req.user = {
                id: data.user.id,
                email: data.user.email || "",
                role: data.user.user_metadata?.role,
            };
        }
    } catch {
        // ignore
    }
    next();
};

/**
 * Require one of the given roles. Use after authenticate.
 * Returns 403 if user role is not in the allowed list.
 */
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: "Insufficient permissions",
            });
        }
        next();
    };
};
