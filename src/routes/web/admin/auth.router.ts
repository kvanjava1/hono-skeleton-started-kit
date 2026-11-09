import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { csrfGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
import { authGuard, guestGuard } from "../../../middlewares/web/auth.middleware.ts";
import {
  showAdminLogin,
  loginAdmin,
  logoutAdmin,
} from "../../../controllers/web/admin/auth.controller.ts";

/**
 * Web routes for the admin dashboard auth (plan D3 — no API surface).
 * Paths resolve from the ROUTES.WEB.ADMIN registry — never string literals.
 * GET login is guest-only; both POSTs are CSRF-guarded; logout is
 * auth-only. Rate limiting comes from the global rateLimiterMiddleware.
 */
export const adminAuthWebRoutes = new Hono();

adminAuthWebRoutes.get(ROUTES.WEB.ADMIN.LOGIN, guestGuard, showAdminLogin);
adminAuthWebRoutes.post(ROUTES.WEB.ADMIN.LOGIN_SUBMIT, csrfGuard, loginAdmin);
adminAuthWebRoutes.post(ROUTES.WEB.ADMIN.LOGOUT, csrfGuard, authGuard, logoutAdmin);
