import type { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "../../utils/errors.util.ts";
import * as ApiKeyService from "../../services/client/apiKey.service.ts";

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
  const authHeader = c.req.header("authorization") || c.req.header("Authorization");
  if (!authHeader) {
    throw new UnauthorizedError("Missing Authorization header.");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") {
    throw new UnauthorizedError(
      "Malformed Authorization header. Format: 'Bearer hon_live_...'",
    );
  }

  const rawToken = parts[1]!;
  const { key, client, permissions } = await ApiKeyService.verifyApiKey(rawToken);

  c.set("apiClient", client);
  c.set("apiKey", key);
  c.set("currentPermissions", permissions);

  await next();
};
