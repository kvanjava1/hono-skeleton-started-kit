import type { Context } from "hono";
import * as ActivityLogService from "../../../services/common/activityLog.service.ts";
import { flashError } from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";

/**
 * GET /client/logs — Organization Audit Trail (Active Workspace)
 */
export const showClientLogsIndex = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const clientUser = c.get("clientUser");
  const currentRole = c.get("currentRole");
  const userWorkspaces = c.get("userWorkspaces") ?? [];
  const permissions: string[] = c.get("currentPermissions") ?? [];

  if (!currentClient || !clientUser) {
    flashError(c, "Please select an active workspace.");
    return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD);
  }

  // RBAC Permission Check: Owner or logs permission
  const canViewLogs =
    permissions.includes("*") ||
    permissions.includes("client.logs.view") ||
    currentRole?.toLowerCase().includes("owner") ||
    currentRole?.toLowerCase().includes("admin");

  if (!canViewLogs) {
    flashError(c, "You do not have permission to view organization audit logs.");
    return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD);
  }

  const q = c.req.query("q") ?? "";
  const action = c.req.query("action") ?? "";
  const pageRaw = Number.parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isNaN(pageRaw) ? 1 : pageRaw;

  const result = await ActivityLogService.listClientLogs(currentClient.id, {
    q: q || undefined,
    action: action || undefined,
    page,
    perPage: 15,
  });

  return c.render("dashboard-client/Client/Logs/Index", {
    client: currentClient,
    logs: result.rows,
    total: result.total,
    page: result.page,
    perPage: result.perPage,
    lastPage: result.lastPage,
    q,
    action,
    authUser: clientUser,
    role: currentRole,
    workspaces: userWorkspaces,
  });
};

/**
 * GET /client/account/activity — User Personal Security Activity
 */
export const showClientAccountActivity = async (c: Context) => {
  const currentClient = c.get("currentClient");
  const clientUser = c.get("clientUser");
  const currentRole = c.get("currentRole");
  const userWorkspaces = c.get("userWorkspaces") ?? [];

  if (!clientUser) {
    return c.redirect(ROUTES.WEB.CLIENT.LOGIN);
  }

  const q = c.req.query("q") ?? "";
  const pageRaw = Number.parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isNaN(pageRaw) ? 1 : pageRaw;

  const result = await ActivityLogService.listUserActivity(
    clientUser.id,
    "client_user",
    {
      q: q || undefined,
      page,
      perPage: 15,
    },
  );

  return c.render("dashboard-client/Client/Account/Activity", {
    client: currentClient,
    logs: result.rows,
    total: result.total,
    page: result.page,
    perPage: result.perPage,
    lastPage: result.lastPage,
    q,
    authUser: clientUser,
    role: currentRole,
    workspaces: userWorkspaces,
  });
};
