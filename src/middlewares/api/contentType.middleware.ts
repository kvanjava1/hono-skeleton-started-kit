import type { Context, Next } from "hono";
import { ValidationError } from "../../utils/errors.util.ts";

/**
 * Middleware to enforce application/json Content-Type for mutation requests.
 */
export const jsonOnlyMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method;
  const mutationMethods = ["POST", "PUT", "PATCH"];

  if (mutationMethods.includes(method)) {
    const contentType = c.req.header("Content-Type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ValidationError("Content-Type must be application/json");
    }
  }

  await next();
};
