import type { Context } from "hono";
import { ZodError } from "zod";
import { HTTPException } from "hono/http-exception";
import { HTTP_STATUS, MESSAGES } from "../../configs/constants.ts";
import { errorResponse } from "../../utils/response.util.ts";
import { logger } from "../../utils/logger.util.ts";
import { configApp } from "../../configs/index.ts";
import {
  AppError,
  ConflictError,
  ValidationError,
} from "../../utils/errors.util.ts";

const DUPLICATE_ENTRY_MESSAGE = "The data you provided already exists.";

const isMySqlDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;

  const error = err as {
    code?: string;
    errno?: number;
    sqlState?: string;
    message?: string;
  };

  return (
    error.code === "ER_DUP_ENTRY" ||
    error.errno === 1062 ||
    error.sqlState === "23000" ||
    (typeof error.message === "string" &&
      error.message.includes("Duplicate entry"))
  );
};

const isPostgresDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  return (err as { code?: string }).code === "23505";
};

const isMongoDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  return (err as { code?: number }).code === 11000;
};

const isSqliteDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;

  const error = err as { code?: string; message?: string };
  return (
    error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
    error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
    (typeof error.message === "string" &&
      error.message.includes("UNIQUE constraint failed"))
  );
};

const getRequestLogContext = (c: Context) => {
  return {
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    ip:
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    userAgent: c.req.header("user-agent") || "unknown",
    contentType: c.req.header("content-type") || "unknown",
  };
};

/**
 * Transforms external/driver errors into Unified AppErrors
 */
const transformError = (err: any): Error => {
  // 1. Duplicate entry / unique constraint violations
  if (
    isMySqlDuplicateError(err) ||
    isPostgresDuplicateError(err) ||
    isMongoDuplicateError(err) ||
    isSqliteDuplicateError(err)
  ) {
    return new ConflictError(DUPLICATE_ENTRY_MESSAGE);
  }

  // 2. Zod Validation Errors (manual validation in services)
  if (err instanceof ZodError) {
    return new ValidationError("Validation Failed", err.issues);
  }

  return err;
};

/**
 * Main Error Handler for app.onError()
 */
export const errorHandler = async (
  err: Error,
  c: Context,
): Promise<Response> => {
  // 1. Transform the error if needed (to our Unified AppErrors if it's external)
  const error = transformError(err);
  const logContext = getRequestLogContext(c);

  // 2. Differentiate logging based on isOperational flag
  const isOperational = (error as any).isOperational ?? false;
  const logMessage = `[${c.req.method}] ${c.req.path} - ${error.message}`;

  if (isOperational) {
    // User/Expected errors -> Warning
    logger.warn(logMessage, {
      name: error.name,
      ...logContext,
    });
  } else {
    // System/Unexpected bugs -> Error with Stack Trace
    logger.error(logMessage, {
      name: error.name,
      stack: error.stack,
      ...logContext,
    });
  }

  // 3. Handle HTTPException (including our AppError subclasses)
  if (error instanceof HTTPException) {
    return errorResponse(
      c,
      error.message,
      error.status,
      error instanceof AppError ? error.data : null,
    );
  }

  // 4. Handle System/Unknown Errors (The Mask)
  const isProduction = configApp.isProduction;
  const message = isProduction ? MESSAGES.INTERNAL_ERROR : error.message;
  const data = isProduction ? null : { stack: error.stack };

  return errorResponse(c, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, data);
};
