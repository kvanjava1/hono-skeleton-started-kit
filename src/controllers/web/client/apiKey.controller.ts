import type { Context } from "hono";
import * as ApiKeyService from "../../../services/client/apiKey.service.ts";
import { flashSuccess, flashError } from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import { recordActivity } from "../../../services/common/activityLog.service.ts";
import { z } from "zod";

const CreateApiKeySchema = z.object({
  name: z.string().trim().min(2, "Key name must be at least 2 characters").max(60, "Key name too long"),
});

export const showClientApiKeysIndex = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const clientUser = c.get("clientUser");
  const currentRole = c.get("currentRole");
  const userWorkspaces = c.get("userWorkspaces") ?? [];

  if (!currentClient) {
    flashError(c, "No active workspace selected.");
    return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD);
  }

  let apiKeys: any[] = [];
  try {
    apiKeys = await ApiKeyService.listClientApiKeys(currentClient.id);
  } catch {
    apiKeys = [];
  }

  return c.render("dashboard-client/Client/ApiKeys/Index", {
    client: currentClient,
    apiKeys,
    authUser: clientUser,
    role: currentRole,
    workspaces: userWorkspaces,
  });
};

export const createClientApiKey = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const clientUser = c.get("clientUser");
  const permissions: string[] = c.get("currentPermissions") ?? [];

  if (!currentClient || !clientUser) {
    flashError(c, "Authentication required.");
    return c.redirect(ROUTES.WEB.CLIENT.LOGIN);
  }

  const hasPerm = permissions.includes("*") || permissions.includes("apikeys.create");
  if (!hasPerm) {
    logger.warn("[ClientApiKeyWeb] Create key rejected: missing permission", {
      clientUserId: clientUser.id,
      clientId: currentClient.id,
    });
    flashError(c, "You do not have permission to generate API keys.");
    return c.redirect(ROUTES.WEB.CLIENT.API_KEYS);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateApiKeySchema.safeParse(body);

  if (!parsed.success) {
    flashError(c, parsed.error.issues[0]?.message || "Invalid input");
    return c.redirect(ROUTES.WEB.CLIENT.API_KEYS);
  }

  try {
    const generated = await ApiKeyService.createApiKey(
      currentClient.id,
      clientUser.id,
      parsed.data.name,
    );

    logger.info("[ClientApiKeyWeb] API key generated", {
      clientId: currentClient.id,
      clientUserId: clientUser.id,
      keyName: generated.name,
      keyPrefix: generated.keyPrefix,
    });

    recordActivity({
      clientId: currentClient.id,
      actorId: clientUser.id,
      actorType: "client_user",
      actorName: clientUser.name,
      action: "apikey.create",
      scope: "organization",
      description: `Generated API Key "${generated.name}" (${generated.keyPrefix})`,
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { keyId: generated.id, keyPrefix: generated.keyPrefix },
    });

    flashSuccess(
      c,
      `API Key "${generated.name}" generated successfully! TOKEN:${generated.rawToken}`,
    );
  } catch (err: any) {
    logger.warn("[ClientApiKeyWeb] API key generation failed", {
      clientId: currentClient.id,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to generate API key.");
  }

  return c.redirect(ROUTES.WEB.CLIENT.API_KEYS);
};

export const revokeClientApiKey = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const permissions: string[] = c.get("currentPermissions") ?? [];
  const idRaw = Number.parseInt(c.req.param("id") ?? "", 10);

  if (!currentClient || Number.isNaN(idRaw)) {
    flashError(c, "Invalid request.");
    return c.redirect(ROUTES.WEB.CLIENT.API_KEYS);
  }

  const hasPerm = permissions.includes("*") || permissions.includes("apikeys.revoke");
  if (!hasPerm) {
    logger.warn("[ClientApiKeyWeb] Revoke key rejected: missing permission", {
      clientId: currentClient.id,
      keyId: idRaw,
    });
    flashError(c, "You do not have permission to revoke API keys.");
    return c.redirect(ROUTES.WEB.CLIENT.API_KEYS);
  }

  try {
    await ApiKeyService.revokeApiKey(idRaw, currentClient.id);
    logger.info("[ClientApiKeyWeb] API key revoked", {
      clientId: currentClient.id,
      keyId: idRaw,
    });

    const clientUser = c.get("clientUser");
    recordActivity({
      clientId: currentClient.id,
      actorId: clientUser?.id,
      actorType: "client_user",
      actorName: clientUser?.name,
      action: "apikey.revoke",
      scope: "organization",
      description: `Revoked API Key #${idRaw}`,
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { keyId: idRaw },
    });

    flashSuccess(c, "API key has been revoked successfully.");
  } catch (err: any) {
    logger.warn("[ClientApiKeyWeb] Revoke key failed", {
      clientId: currentClient.id,
      keyId: idRaw,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to revoke API key.");
  }

  return c.redirect(ROUTES.WEB.CLIENT.API_KEYS);
};
