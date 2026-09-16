import type { Hook } from "@hono/zod-openapi";
import { HTTP_STATUS, MESSAGES } from "../configs/constants.ts";
import { errorResponse } from "./response.util.ts";

/**
 * Normalizes OpenAPI request validation failures to the app response contract
 * ({ status, message, data }) instead of the zValidator default shape.
 */
export const openApiValidationHook: Hook<any, any, any, any> = (result, c) => {
  if (result.success) return;

  return errorResponse(
    c,
    MESSAGES.VALIDATION_ERROR,
    HTTP_STATUS.BAD_REQUEST,
    result.error.issues,
  );
};
