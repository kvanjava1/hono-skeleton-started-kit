import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { csrfGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
import {
  clientAuthGuard,
  clientGuestGuard,
} from "../../../middlewares/web/clientAuth.middleware.ts";
import {
  showClientLogin,
  loginClient,
  logoutClient,
} from "../../../controllers/web/client/auth.controller.ts";
import { switchWorkspaceAction } from "../../../controllers/web/client/workspace.controller.ts";
import { showClientDashboard } from "../../../controllers/web/client/dashboard.controller.ts";
import {
  showClientApiKeysIndex,
  createClientApiKey,
  revokeClientApiKey,
} from "../../../controllers/web/client/apiKey.controller.ts";
import {
  showClientTeamIndex,
  inviteClientTeamMember,
  removeClientTeamMember,
} from "../../../controllers/web/client/team.controller.ts";
import {
  showClientLogsIndex,
  showClientAccountActivity,
} from "../../../controllers/web/client/logs.controller.ts";

export const clientPortalWebRoutes = new Hono();

// Auth routes (Guard: Guest)
clientPortalWebRoutes.get(ROUTES.WEB.CLIENT.LOGIN, clientGuestGuard, showClientLogin);
clientPortalWebRoutes.post(ROUTES.WEB.CLIENT.LOGIN_SUBMIT, csrfGuard, loginClient);

// Auth routes (Guard: Authenticated Client)
clientPortalWebRoutes.post(ROUTES.WEB.CLIENT.LOGOUT, csrfGuard, clientAuthGuard, logoutClient);

// Dashboard
clientPortalWebRoutes.get(ROUTES.WEB.CLIENT.DASHBOARD, clientAuthGuard, showClientDashboard);

// Workspace Switcher
clientPortalWebRoutes.post(
  ROUTES.WEB.CLIENT.SWITCH_WORKSPACE,
  csrfGuard,
  clientAuthGuard,
  switchWorkspaceAction,
);

// API Keys
clientPortalWebRoutes.get(ROUTES.WEB.CLIENT.API_KEYS, clientAuthGuard, showClientApiKeysIndex);
clientPortalWebRoutes.post(ROUTES.WEB.CLIENT.API_KEYS_CREATE, csrfGuard, clientAuthGuard, createClientApiKey);
clientPortalWebRoutes.post(ROUTES.WEB.CLIENT.API_KEYS_REVOKE, csrfGuard, clientAuthGuard, revokeClientApiKey);

// Team Members
clientPortalWebRoutes.get(ROUTES.WEB.CLIENT.TEAM, clientAuthGuard, showClientTeamIndex);
clientPortalWebRoutes.post(ROUTES.WEB.CLIENT.TEAM_INVITE, csrfGuard, clientAuthGuard, inviteClientTeamMember);
clientPortalWebRoutes.delete(ROUTES.WEB.CLIENT.TEAM_REMOVE, csrfGuard, clientAuthGuard, removeClientTeamMember);
clientPortalWebRoutes.post(ROUTES.WEB.CLIENT.TEAM_REMOVE, csrfGuard, clientAuthGuard, removeClientTeamMember);

// Organization Audit Logs
clientPortalWebRoutes.get(ROUTES.WEB.CLIENT.LOGS, clientAuthGuard, showClientLogsIndex);

// Personal Account Security Activity
clientPortalWebRoutes.get(ROUTES.WEB.CLIENT.ACTIVITY, clientAuthGuard, showClientAccountActivity);

// Legacy /portal routes (backward-compatibility 301 redirects)
clientPortalWebRoutes.get("/portal", (c) => c.redirect(ROUTES.WEB.CLIENT.DASHBOARD, 301));
clientPortalWebRoutes.get("/portal/login", (c) => c.redirect(ROUTES.WEB.CLIENT.LOGIN, 301));
clientPortalWebRoutes.get("/portal/api-keys", (c) => c.redirect(ROUTES.WEB.CLIENT.API_KEYS, 301));
clientPortalWebRoutes.get("/portal/team", (c) => c.redirect(ROUTES.WEB.CLIENT.TEAM, 301));
