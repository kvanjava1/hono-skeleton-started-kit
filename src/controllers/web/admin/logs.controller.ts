import type { Context } from "hono";
import * as ActivityLogService from "../../../services/common/activityLog.service.ts";
import * as ClientService from "../../../services/admin/client.service.ts";
import * as UserService from "../../../services/admin/user.service.ts";
import { getAuthUser } from "../../../utils/session.util.ts";

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

/**
 * GET /admin/logs — Global Platform Audit Logs
 */
export const showAdminLogsIndex = async (c: Context) => {
  const q = c.req.query("q") ?? "";
  const clientIdRaw = c.req.query("clientId");
  const clientId = clientIdRaw ? Number.parseInt(clientIdRaw, 10) : undefined;
  const action = c.req.query("action") ?? "";
  const scope = c.req.query("scope") ?? "";
  const pageRaw = Number.parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isNaN(pageRaw) ? 1 : pageRaw;

  const [result, clientList, userSummary] = await Promise.all([
    ActivityLogService.listAdminLogs({
      q: q || undefined,
      clientId: Number.isNaN(clientId as number) ? undefined : clientId,
      action: action || undefined,
      scope: scope || undefined,
      page,
      perPage: 15,
    }),
    ClientService.listClients({ perPage: 100 }),
    getAuthUserSummary(c),
  ]);

  return c.render("dashboard-admin/Admin/Logs/Index", {
    logs: result.rows,
    total: result.total,
    page: result.page,
    perPage: result.perPage,
    lastPage: result.lastPage,
    clients: clientList.rows.map((cl) => ({ id: cl.id, name: cl.name, slug: cl.slug })),
    q,
    clientId: clientIdRaw ?? "",
    action,
    scope,
    authUserId: userSummary.authUserId,
    authUser: userSummary.authUser,
  });
};
