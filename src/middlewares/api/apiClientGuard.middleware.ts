import type { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "../../utils/errors.util.ts";
import * as ApiKeyService from "../../services/client/apiKey.service.ts";
import { logger } from "../../utils/logger.util.ts";

/**
 * Machine-to-Machine API Authentication Guard:
 * Protects API routes by verifying the Bearer API key in the Authorization header.
 *
 * Sets context:
 * - `apiClient`: The authenticated Client organization
 * - `apiKey`: The matching ApiKey record
 * - `currentPermissions`: Token scopes / granted permissions for subsequent `can()` checks
 */
export const apiClientGuard: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req?.header ? (c.req.header("authorization") || c.req.header("Authorization")) : undefined;
  if (!authHeader) {
    logger.warn("[ApiClientGuard] Unauthorized API request: missing Authorization header", {
      ip: c.req?.header ? (c.req.header("x-forwarded-for") || "unknown") : "unknown",
      path: c.req?.path ?? "unknown",
    });
    throw new UnauthorizedError("Missing Authorization header.");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") {
    logger.warn("[ApiClientGuard] Unauthorized API request: malformed Authorization header", {
      ip: c.req?.header ? (c.req.header("x-forwarded-for") || "unknown") : "unknown",
      path: c.req?.path ?? "unknown",
    });
    throw new UnauthorizedError(
      "Malformed Authorization header. Format: 'Bearer hon_live_...'",
    );
  }

  const rawToken = parts[1]!;
  const { key, client, permissions } = await ApiKeyService.verifyApiKey(rawToken);

  logger.info("[ApiClientGuard] API key authorized", {
    clientId: client.id,
    keyId: key.id,
    keyPrefix: key.keyPrefix,
    path: c.req?.path ?? "unknown",
  });

  c.set("apiClient", client);
  c.set("apiKey", key);
  c.set("currentPermissions", permissions);

  await next();
};
