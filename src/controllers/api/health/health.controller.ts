import type { Context } from "hono";
import { HTTP_STATUS, MESSAGES } from "../../../configs/constants.ts";
import { errorResponse, successResponse } from "../../../utils/response.util.ts";

export const getHealth = (c: Context) => {
  return successResponse(c, MESSAGES.HEALTH_OK, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

export const getReadiness = async (c: Context) => {
  const { checkDatabaseReadiness } = await import("../../../database/index.ts");
  const checks = await checkDatabaseReadiness();
  const isReady = checks.every((check) => check.status === "up");

  if (isReady) {
    return successResponse(c, MESSAGES.HEALTH_READY, { checks });
  }

  return errorResponse(
    c,
    MESSAGES.HEALTH_NOT_READY,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    { checks },
  );
};
