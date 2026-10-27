import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { HTTP_STATUS, MESSAGES } from "../../configs/constants.ts";
import { errorResponse } from "../../utils/response.util.ts";
import { logger } from "../../utils/logger.util.ts";
import { configApp } from "../../configs/index.ts";
import { AppError } from "../../utils/errors.util.ts";
import { transformError } from "../../utils/errorTransformer.util.ts";

export { transformError } from "../../utils/errorTransformer.util.ts";

/**
 * Extracts structured HTTP request context for logging.
 */
const getLogContext = (c: Context) => ({
  requestId: c.get("requestId"),
  method: c.req.method,
  path: c.req.path,
  query: c.req.query(),
  ip:
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
  userAgent: c.req.header("user-agent") || "unknown",
  contentType: c.req.header("content-type") || "unknown",
});

/**
 * Records operational warnings vs unexpected system errors.
 */
const logHandledError = (error: Error, c: Context): void => {
  const isOperational = error instanceof AppError ? error.isOperational : false;
  const logMessage = `[${c.req.method}] ${c.req.path} - ${error.message}`;
  const logContext = getLogContext(c);

  if (isOperational) {
    logger.warn(logMessage, { name: error.name, ...logContext });
  } else {
    logger.error(logMessage, {
      name: error.name,
      stack: error.stack,
      ...logContext,
    });
  }
};

/**
 * Formats standard error HTTP response (masks internal details in production).
 */
const sendHandledResponse = (error: Error, c: Context): Response => {
  if (error instanceof HTTPException) {
    return errorResponse(
      c,
      error.message,
      error.status,
      error instanceof AppError ? error.data : null,
    );
  }

  const isProduction = configApp.isProduction();
  const message = isProduction ? MESSAGES.INTERNAL_ERROR : error.message;
  const data = isProduction ? null : { stack: error.stack };

  return errorResponse(c, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, data);
};

/**
 * Main Global Error Handler for app.onError()
 */
export const errorHandler = async (
  err: Error,
  c: Context,
): Promise<Response> => {
  const normalizedError = transformError(err);
  logHandledError(normalizedError, c);
  return sendHandledResponse(normalizedError, c);
};
