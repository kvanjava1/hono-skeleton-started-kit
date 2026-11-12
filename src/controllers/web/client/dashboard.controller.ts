import type { Context } from "hono";
import * as ClientService from "../../../services/admin/client.service.ts";

/**
 * GET /client
 * Client Portal Dashboard overview.
 */
export const showClientDashboard = async (c: Context) => {
  const currentClient = c.get("currentClient") as {
    id: number;
    name: string;
    slug: string;
    status: string;
  } | null;
  const clientUser = c.get("clientUser");
  const currentRole = c.get("currentRole");
  const userWorkspaces = c.get("userWorkspaces") ?? [];

  const stats = currentClient
    ? await ClientService.getClientStats(currentClient.id)
    : { totalApiKeys: 0, totalMembers: 0 };

  return c.render("dashboard-client/Client/Dashboard/Index", {
    client: currentClient,
    authUser: clientUser,
    role: currentRole,
    workspaces: userWorkspaces,
    stats,
  });
};
