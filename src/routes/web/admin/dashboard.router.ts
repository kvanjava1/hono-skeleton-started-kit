import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { authGuard } from "../../../middlewares/web/auth.middleware.ts";
import { showAdminDashboard } from "../../../controllers/web/admin/dashboard.controller.ts";

/**
 * Web routes for the admin dashboard overview.
 * Gated by authGuard — only logged in administrators can access.
 */
export const adminDashboardWebRoutes = new Hono();

adminDashboardWebRoutes.get(ROUTES.WEB.ADMIN.DASHBOARD, authGuard, showAdminDashboard);
