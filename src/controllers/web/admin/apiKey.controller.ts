import type { Context } from "hono";
import * as ApiKeyService from "../../../services/client/apiKey.service.ts";
import * as ClientRepository from "../../../repositories/admin/client.repository.ts";
import * as UserService from "../../../services/admin/user.service.ts";
import { getAuthUser, flashSuccess, flashError } from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { z } from "zod";

const CreateKeySchema = z.object({
  name: z.string().trim().min(2, "Key name must be at least 2 characters").max(60),
});

const resolveClientForUser = async (userId: number) => {
  const client = await ClientRepository.findClientByUserId(userId);
  if (client) return client;

  // Fallback for superadmin: fetch first client
  const all = await ClientRepository.findAllClients({ perPage: 1 });
  return all.rows[0] ?? null;
};

const getAuthUserSummary = async (c: Context) => {
  const session = c.get("webSession");
  const authUserId = getAuthUser(session);

  let authUser: { name: string; email: string } | null = null;
  if (authUserId !== null) {
    try {
      const user = await UserService.findUser(authUserId);
      authUser = { name: user.name, email: user.email };
    } catch {
      authUser = null;
    }
  }
  return { authUserId: authUserId ?? 0, authUser };
};

export const showApiKeysIndex = async (c: Context) => {
  const { authUserId, authUser } = await getAuthUserSummary(c);
  const client = await resolveClientForUser(authUserId);

  let apiKeys: any[] = [];
  if (client) {
    apiKeys = await ApiKeyService.listClientApiKeys(client.id);
  }

  return c.render("dashboard-admin/Admin/ApiKeys/Index", {
    client,
    apiKeys,
    authUserId,
    authUser,
  });
};

export const createApiKeyFromWeb = async (c: Context) => {
  const { authUserId } = await getAuthUserSummary(c);
  const client = await resolveClientForUser(authUserId);

  if (!client) {
    flashError(c, "No client organization associated with your account.");
    return c.redirect(ROUTES.WEB.ADMIN.API_KEYS);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateKeySchema.safeParse(body);

  if (!parsed.success) {
    flashError(c, parsed.error.issues[0]?.message || "Invalid input");
    return c.redirect(ROUTES.WEB.ADMIN.API_KEYS);
  }

  try {
    const generated = await ApiKeyService.createApiKey(
      client.id,
      authUserId,
      parsed.data.name,
    );

    // Flash the raw token into session so the user can copy it
    flashSuccess(
      c,
      `API Key "${generated.name}" created! TOKEN:${generated.rawToken}`,
    );
  } catch (err: any) {
    flashError(c, err?.message || "Failed to create API key");
  }

  return c.redirect(ROUTES.WEB.ADMIN.API_KEYS);
};

export const revokeApiKeyFromWeb = async (c: Context) => {
  const { authUserId } = await getAuthUserSummary(c);
  const client = await resolveClientForUser(authUserId);
  const idRaw = Number.parseInt(c.req.param("id") ?? "", 10);

  if (!client || Number.isNaN(idRaw)) {
    flashError(c, "API key not found.");
    return c.redirect(ROUTES.WEB.ADMIN.API_KEYS);
  }

  try {
    await ApiKeyService.revokeApiKey(idRaw, client.id);
    flashSuccess(c, "API key has been revoked.");
  } catch (err: any) {
    flashError(c, err?.message || "Failed to revoke key.");
  }

  return c.redirect(ROUTES.WEB.ADMIN.API_KEYS);
};
