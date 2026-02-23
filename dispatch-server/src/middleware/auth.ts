import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";

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

/**
 * Middleware to authenticate requests using Supabase JWT.
 * Expects: Authorization: Bearer <access_token>
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
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
