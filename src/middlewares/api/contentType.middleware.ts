import type { Context, Next } from "hono";
import { HTTP_STATUS, MESSAGES } from "../../configs/constants.ts";
import { AppError } from "../../utils/errors.util.ts";

/**
 * Middleware to enforce accepted Content-Types (application/json, multipart/form-data)
 * for mutation requests (POST, PUT, PATCH).
 */
export const jsonOnlyMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method;
  const mutationMethods = ["POST", "PUT", "PATCH"];

  if (mutationMethods.includes(method)) {
    const rawContentType = c.req.header("Content-Type");
    const contentLength = c.req.header("Content-Length");

    // Allow empty mutation requests (e.g. POST trigger with empty body)
    if (!rawContentType && (!contentLength || contentLength === "0")) {
      await next();
      return;
    }

    const contentType = (rawContentType || "").toLowerCase();
    const isJson = contentType.includes("application/json");
    const isMultipart = contentType.includes("multipart/form-data");

    if (!isJson && !isMultipart) {
      throw new AppError(MESSAGES.JSON_ONLY, HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
    }
  }

  await next();
};
