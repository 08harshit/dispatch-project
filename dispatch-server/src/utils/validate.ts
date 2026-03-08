import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuidParam = z.string().regex(UUID_REGEX, "Invalid UUID");

/**
 * Validate request body against a Zod schema. Returns 400 on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const messages = result.error.issues.map(
                (e) => `${e.path.join(".") || "body"}: ${e.message}`
            );
            return res.status(400).json({
                success: false,
                error: messages.join("; "),
            });
        }
        req.body = result.data;
        next();
    };
}

/**
 * Validate path param id is a valid UUID. Returns 400 on failure.
 */
export function validateUuidParam(paramName = "id") {
    return (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[paramName]; console.log("Validating UUID:", { paramName, id });
        if (!id || !uuidParam.safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: `Invalid ${paramName}: must be a valid UUID`,
            });
        }
        next();
    };
}
