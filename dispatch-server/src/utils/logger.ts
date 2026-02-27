import pino from "pino";
import { config } from "../config";

const isProduction = config.nodeEnv === "production";

export const logger = pino({
    level: isProduction ? "info" : "debug",
    ...(isProduction
        ? {}
        : {
              transport: {
                  target: "pino-pretty",
                  options: { colorize: true },
              },
          }),
});
