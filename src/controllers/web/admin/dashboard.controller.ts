import type { Context } from "hono";
import * as UserService from "../../../services/admin/user.service.ts";
import * as ClientService from "../../../services/admin/client.service.ts";
import { getAuthUser } from "../../../utils/session.util.ts";

/**
 * Web controller for Admin Dashboard (Inertia web — no API surface).
 * Renders the overview dashboard with welcome greeting and key metrics.
 */
export const showAdminDashboard = async (c: Context) => {
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

  // Get total registered users and clients for stats overview
  const userStats = await UserService.listUsers({ page: 1 });
  const clientStats = await ClientService.listClients({ page: 1 });

  return c.render("dashboard-admin/Admin/Dashboard/Index", {
    authUser,
    totalUsers: userStats.total,
    totalClients: clientStats.total,
  });
};
