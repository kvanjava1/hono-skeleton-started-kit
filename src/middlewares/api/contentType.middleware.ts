import type { Context, Next } from "hono";
import { HTTP_STATUS, MESSAGES } from "../../configs/constants.ts";
import { AppError } from "../../utils/errors.util.ts";

/**
 * Middleware to enforce application/json Content-Type for mutation requests.
 */
export const jsonOnlyMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method;
  const mutationMethods = ["POST", "PUT", "PATCH"];

  if (mutationMethods.includes(method)) {
    const contentType = c.req.header("Content-Type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      throw new AppError(MESSAGES.JSON_ONLY, HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
    }
  }

  await next();
};
