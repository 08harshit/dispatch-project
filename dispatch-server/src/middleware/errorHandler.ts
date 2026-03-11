import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface ApiError {
    status: number;
    message: string;
    details?: unknown;
}

export const errorHandler = (
    err: ApiError | Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    const status = "status" in err ? err.status : 500;
    const message = err.message || "Internal Server Error";
    const isProduction = process.env.NODE_ENV === "production";

    logger.error({ status, message, details: "details" in err ? err.details : undefined }, "[ERROR]");

    res.status(status).json({
        success: false,
        error: isProduction && status >= 500 ? "Internal Server Error" : message,
        ...("details" in err && !isProduction ? { details: err.details } : {}),
    });
};
