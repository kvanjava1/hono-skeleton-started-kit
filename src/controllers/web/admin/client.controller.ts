import type { Context } from "hono";
import * as ClientService from "../../../services/admin/client.service.ts";
import * as UserService from "../../../services/admin/user.service.ts";
import * as RbacService from "../../../services/admin/rbac.service.ts";
import * as ApiKeyService from "../../../services/client/apiKey.service.ts";
import { z } from "zod";
import {
  CreateClientBody,
  UpdateClientBody,
  ChangeClientStatusBody,
  IdParam,
} from "../../../validations/admin/client.ts";
import { NotFoundError, ValidationError } from "../../../utils/errors.util.ts";
import {
  inertiaValidationErrorResponse,
  toInertiaErrorBag,
  type InertiaOriginPage,
} from "../../../utils/inertia.util.ts";
import { flashError, flashSuccess, getAuthUser } from "../../../utils/session.util.ts";
import { ROUTES, route } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import { ACCOUNT_STATUSES } from "../../../database/schema/common/status.schema.ts";

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

const createOriginPage = async (c: Context): Promise<InertiaOriginPage> => {
  const { authUserId, authUser } = await getAuthUserSummary(c);
  return {
    component: "dashboard-admin/Admin/Clients/Create",
    url: ROUTES.WEB.ADMIN.CLIENTS_CREATE_PAGE,
    props: {
      authUserId,
      authUser,
    },
  };
};

/** GET /admin/clients — List clients */
export const showClientsIndex = async (c: Context) => {
  const q = c.req.query("q") ?? "";
  const status = c.req.query("status") ?? "";
  const pageRaw = Number.parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isNaN(pageRaw) ? 1 : pageRaw;

  const result = await ClientService.listClients({
    q: q || undefined,
    status: status || undefined,
    page,
  });

  const { authUserId, authUser } = await getAuthUserSummary(c);

  return c.render("dashboard-admin/Admin/Clients/Index", {
    clients: result.rows,
    total: result.total,
    page: result.page,
    perPage: result.perPage,
    lastPage: result.lastPage,
    q,
    status,
    authUserId,
    authUser,
  });
};

/** GET /admin/clients/create — Show create client page */
export const showClientCreate = async (c: Context) => {
  const { authUserId, authUser } = await getAuthUserSummary(c);
  return c.render("dashboard-admin/Admin/Clients/Create", {
    authUserId,
    authUser,
  });
};

/** POST /admin/clients — Store new client */
export const createClientFromWeb = async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateClientBody.safeParse(body);

  if (!parsed.success) {
    const errors = toInertiaErrorBag(parsed.error);
    if (c.req.header("X-Inertia")) {
      return inertiaValidationErrorResponse(c, await createOriginPage(c), errors);
    }
    return c.json({ errors }, 422);
  }

  try {
    const client = await ClientService.createClient(parsed.data);
    flashSuccess(c, `Client "${client.name}" created successfully.`);
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  } catch (error: any) {
    logger.error("[ClientWeb] Create client failed", { error });
    flashError(c, error?.message || "Failed to create client.");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS_CREATE_PAGE);
  }
};

/** GET /admin/clients/:id — Show client detail */
export const showClientDetail = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  try {
    const client = await ClientService.findClient(idParsed.data.id);
    const { authUserId, authUser } = await getAuthUserSummary(c);

    return c.render("dashboard-admin/Admin/Clients/Show", {
      client,
      authUserId,
      authUser,
    });
  } catch {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }
};

/** GET /admin/clients/:id/status — dedicated client status & moderation page */
export const showClientStatus = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  try {
    const client = await ClientService.findClient(idParsed.data.id);
    const history = await ClientService.getClientStatusHistory(idParsed.data.id);
    const { authUserId, authUser } = await getAuthUserSummary(c);

    return c.render("dashboard-admin/Admin/Clients/Status", {
      client,
      history,
      authUserId,
      authUser,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      flashError(c, "Client not found");
      return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
    }
    throw error;
  }
};

/** POST /admin/clients/:id/status — change client status (Active, Inactive, Suspended, Pending) */
export const changeClientStatusFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(idParsed.error));
  }
  const id = idParsed.data.id;
  const parsed = ChangeClientStatusBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(parsed.error));
  }

  const session = c.get("webSession");
  const actingUserId = getAuthUser(session) ?? undefined;

  try {
    const updated = await ClientService.changeClientStatus(id, {
      status: parsed.data.status,
      reason: parsed.data.reason,
      suspendedUntil: parsed.data.suspendedUntil,
      actingUserId,
    });
    flashSuccess(
      c,
      `Organization status for "${updated.name}" updated to ${updated.status}`,
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      flashError(c, error.message);
    } else if (error instanceof NotFoundError) {
      flashError(c, "Client not found");
    } else {
      throw error;
    }
  }
  return c.redirect(route(ROUTES.WEB.ADMIN.CLIENTS_STATUS_PAGE, { id }));
};

/** GET /admin/clients/:id/status-history — fetch client status history audit log */
export const getClientStatusHistoryFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    return c.json({ error: "Invalid client ID" }, 400);
  }
  try {
    const history = await ClientService.getClientStatusHistory(idParsed.data.id);
    return c.json({ data: history });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: "Client not found" }, 404);
    }
    throw error;
  }
};

/** POST /admin/clients/:id/toggle-status — Toggle Active / Suspended */
export const toggleClientStatusFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  try {
    const client = await ClientService.findClient(idParsed.data.id);
    const newStatus =
      client.status === ACCOUNT_STATUSES.ACTIVE
        ? ACCOUNT_STATUSES.SUSPENDED
        : ACCOUNT_STATUSES.ACTIVE;

    await ClientService.setClientStatus(client.id, newStatus);
    flashSuccess(
      c,
      `Client "${client.name}" is now ${newStatus.toLowerCase()}.`,
    );
  } catch (err: any) {
    logger.warn("[ClientWeb] Toggle client status failed", {
      clientId: idParsed.data.id,
      error: err?.message,
    });
    flashError(c, "Failed to update client status.");
  }

  return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
};

/** DELETE /admin/clients/:id — Delete client */
export const deleteClientFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  try {
    await ClientService.deleteClient(idParsed.data.id);
    flashSuccess(c, "Client deleted successfully.");
  } catch (err: any) {
    logger.warn("[ClientWeb] Delete client failed", {
      clientId: idParsed.data.id,
      error: err?.message,
    });
    flashError(c, "Failed to delete client.");
  }

  return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
};

const CreateMemberSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().email("Valid email required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string().optional(),
    roleId: z.coerce.number().int().positive("Please select a valid role"),
  })
  .refine(
    (data) => !data.passwordConfirmation || data.password === data.passwordConfirmation,
    {
      message: "Password confirmation does not match",
      path: ["passwordConfirmation"],
    },
  );

const CreateKeySchema = z.object({
  name: z.string().trim().min(2, "Key name must be at least 2 characters").max(60),
});

const memberCreateOriginPage = async (
  c: Context,
  clientId: number,
): Promise<InertiaOriginPage> => {
  const { authUserId, authUser } = await getAuthUserSummary(c);
  const client = await ClientService.findClient(clientId);
  const clientRoles = await RbacService.listAllRoles("client");
  return {
    component: "dashboard-admin/Admin/Clients/MemberCreate",
    url: route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_CREATE_PAGE, { id: clientId }),
    props: {
      client,
      clientRoles,
      authUserId,
      authUser,
    },
  };
};

/** GET /admin/clients/:id/members — Dedicated page to manage client members */
export const showClientMembers = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  let client;
  try {
    client = await ClientService.findClient(idParsed.data.id);
  } catch {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  const members = await ClientService.listMembers(client.id);
  const clientRoles = await RbacService.listAllRoles("client");
  const { authUserId, authUser } = await getAuthUserSummary(c);

  return c.render("dashboard-admin/Admin/Clients/Members", {
    client,
    members,
    clientRoles,
    authUserId,
    authUser,
  });
};

/** GET /admin/clients/:id/members/create — Dedicated page to add a new member */
export const showClientMemberCreate = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  let client;
  try {
    client = await ClientService.findClient(idParsed.data.id);
  } catch {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  const clientRoles = await RbacService.listAllRoles("client");
  const { authUserId, authUser } = await getAuthUserSummary(c);

  return c.render("dashboard-admin/Admin/Clients/MemberCreate", {
    client,
    clientRoles,
    authUserId,
    authUser,
  });
};

/** POST /admin/clients/:id/members — Add/invite member to client */
export const inviteClientMember = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  let client;
  try {
    client = await ClientService.findClient(idParsed.data.id);
  } catch {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  const membersPageUrl = route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id });
  const createPageUrl = route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_CREATE_PAGE, { id: client.id });
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateMemberSchema.safeParse(body);

  if (!parsed.success) {
    const errors = toInertiaErrorBag(parsed.error);
    if (c.req.header("X-Inertia")) {
      return inertiaValidationErrorResponse(
        c,
        await memberCreateOriginPage(c, client.id),
        errors,
      );
    }
    return c.json({ errors }, 422);
  }

  try {
    const { user } = await ClientService.inviteMember({
      clientId: client.id,
      name: parsed.data.name,
      email: parsed.data.email,
      roleId: parsed.data.roleId,
      password: parsed.data.password,
    });
    flashSuccess(c, `Team member "${user.name}" added to ${client.name}.`);
    return c.redirect(membersPageUrl);
  } catch (err: any) {
    logger.warn("[ClientWeb] Invite member failed", {
      clientId: client.id,
      email: parsed.data.email,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to add member to client.");
    return c.redirect(createPageUrl);
  }
};

const UpdateMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  roleId: z.coerce.number().int().positive("Please select a valid role"),
  status: z.enum([
    ACCOUNT_STATUSES.ACTIVE,
    ACCOUNT_STATUSES.INACTIVE,
    ACCOUNT_STATUSES.SUSPENDED,
    ACCOUNT_STATUSES.PENDING,
  ]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

/** GET /admin/clients/:id/members/:memberId/edit — Page to edit client member */
export const showClientMemberEdit = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  const memberIdRaw = Number.parseInt(c.req.param("memberId") ?? "", 10);
  if (!idParsed.success || Number.isNaN(memberIdRaw)) {
    flashError(c, "Invalid request");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  let client;
  let member;
  try {
    client = await ClientService.findClient(idParsed.data.id);
    member = await ClientService.findMember(memberIdRaw);
    if (member.clientId !== client.id) {
      flashError(c, "Member not found");
      return c.redirect(route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id }));
    }
  } catch {
    flashError(c, "Client or member not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  const clientRoles = await RbacService.listAllRoles("client");
  const { authUserId, authUser } = await getAuthUserSummary(c);

  return c.render("dashboard-admin/Admin/Clients/MemberEdit", {
    client,
    member,
    clientRoles,
    authUserId,
    authUser,
  });
};

/** POST /admin/clients/:id/members/:memberId — Update client member */
export const updateClientMember = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  const memberIdRaw = Number.parseInt(c.req.param("memberId") ?? "", 10);
  if (!idParsed.success || Number.isNaN(memberIdRaw)) {
    flashError(c, "Invalid request");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  let client;
  let member;
  try {
    client = await ClientService.findClient(idParsed.data.id);
    member = await ClientService.findMember(memberIdRaw);
    if (member.clientId !== client.id) {
      flashError(c, "Member not found");
      return c.redirect(route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id }));
    }
  } catch {
    flashError(c, "Client or member not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  const membersPageUrl = route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id });
  const editPageUrl = route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_EDIT_PAGE, {
    id: client.id,
    memberId: member.id,
  });

  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateMemberSchema.safeParse(body);

  if (!parsed.success) {
    flashError(c, parsed.error.issues[0]?.message || "Invalid input");
    return c.redirect(editPageUrl);
  }

  try {
    await ClientService.updateMember(member.id, {
      name: parsed.data.name,
      email: parsed.data.email,
      roleId: parsed.data.roleId,
      status: parsed.data.status,
      password: parsed.data.password || undefined,
    });
    flashSuccess(c, `Team member "${parsed.data.name}" updated successfully.`);
  } catch (err: any) {
    logger.warn("[ClientWeb] Update member failed", {
      clientId: client.id,
      memberId: member.id,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to update member.");
    return c.redirect(editPageUrl);
  }

  return c.redirect(membersPageUrl);
};

/** POST /admin/clients/:id/members/:memberId/toggle-status — Toggle client member status */
export const toggleClientMemberStatusFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  const memberIdRaw = Number.parseInt(c.req.param("memberId") ?? "", 10);
  if (!idParsed.success || Number.isNaN(memberIdRaw)) {
    flashError(c, "Invalid request");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  try {
    await ClientService.findClient(idParsed.data.id);
    const toggled = await ClientService.toggleMemberStatus(memberIdRaw);
    flashSuccess(
      c,
      `Team member "${toggled.name}" status changed to ${toggled.status}.`,
    );
  } catch (err: any) {
    logger.warn("[ClientWeb] Toggle member status failed", {
      clientId: idParsed.data.id,
      memberId: memberIdRaw,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to update member status.");
  }

  return c.redirect(route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: idParsed.data.id }));
};

/** DELETE /admin/clients/:id/members/:memberId — Remove member from client */
export const removeClientMember = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  const memberIdRaw = Number.parseInt(c.req.param("memberId") ?? "", 10);

  if (!idParsed.success || Number.isNaN(memberIdRaw)) {
    flashError(c, "Invalid request.");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  try {
    await ClientService.removeMember(memberIdRaw);
    flashSuccess(c, "Member removed from client team.");
  } catch (err: any) {
    logger.warn("[ClientWeb] Remove member failed", {
      clientId: idParsed.data.id,
      memberId: memberIdRaw,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to remove member.");
  }

  return c.redirect(route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: idParsed.data.id }));
};

/** GET /admin/clients/:id/api-keys — Dedicated page to manage client API keys */
export const showClientApiKeys = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  let client;
  try {
    client = await ClientService.findClient(idParsed.data.id);
  } catch {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  const apiKeys = await ApiKeyService.listClientApiKeys(client.id);
  const { authUserId, authUser } = await getAuthUserSummary(c);

  return c.render("dashboard-admin/Admin/Clients/ApiKeys", {
    client,
    apiKeys,
    authUserId,
    authUser,
  });
};

/** POST /admin/clients/:id/api-keys — Generate API key for client */
export const createClientApiKey = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  let client;
  try {
    client = await ClientService.findClient(idParsed.data.id);
  } catch {
    flashError(c, "Client not found");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  const redirectUrl = route(ROUTES.WEB.ADMIN.CLIENTS_API_KEYS_PAGE, { id: client.id });
  const { authUserId } = await getAuthUserSummary(c);
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateKeySchema.safeParse(body);

  if (!parsed.success) {
    flashError(c, parsed.error.issues[0]?.message || "Invalid input");
    return c.redirect(redirectUrl);
  }

  try {
    const generated = await ApiKeyService.createApiKey(
      client.id,
      authUserId,
      parsed.data.name,
    );
    flashSuccess(
      c,
      `API Key "${generated.name}" created! TOKEN:${generated.rawToken}`,
    );
  } catch (err: any) {
    logger.warn("[ClientWeb] Create API key failed", {
      clientId: client.id,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to create API key");
  }

  return c.redirect(redirectUrl);
};

/** POST /admin/clients/:id/api-keys/:keyId/revoke — Revoke API key */
export const revokeClientApiKey = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  const keyIdRaw = Number.parseInt(c.req.param("keyId") ?? "", 10);

  if (!idParsed.success || Number.isNaN(keyIdRaw)) {
    flashError(c, "Invalid request.");
    return c.redirect(ROUTES.WEB.ADMIN.CLIENTS);
  }

  try {
    await ApiKeyService.revokeApiKey(keyIdRaw, idParsed.data.id);
    flashSuccess(c, "API key has been revoked.");
  } catch (err: any) {
    logger.warn("[ClientWeb] Revoke API key failed", {
      clientId: idParsed.data.id,
      keyId: keyIdRaw,
      error: err?.message,
    });
    flashError(c, err?.message || "Failed to revoke key.");
  }

  return c.redirect(route(ROUTES.WEB.ADMIN.CLIENTS_API_KEYS_PAGE, { id: idParsed.data.id }));
};
