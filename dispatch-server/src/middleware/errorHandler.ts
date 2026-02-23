import { Request, Response, NextFunction } from "express";

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

    console.error(`[ERROR] ${status} - ${message}`, "details" in err ? err.details : "");

    res.status(status).json({
        success: false,
        error: message,
        ...("details" in err && process.env.NODE_ENV === "development" ? { details: err.details } : {}),
    });
};
