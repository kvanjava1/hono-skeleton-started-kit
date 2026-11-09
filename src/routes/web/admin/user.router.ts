import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { csrfGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
import { authGuard } from "../../../middlewares/web/auth.middleware.ts";
import {
  showUsersIndex,
  createUserFromWeb,
  updateUserFromWeb,
  deleteUserFromWeb,
  toggleUserActiveFromWeb,
} from "../../../controllers/web/admin/user.controller.ts";

/**
 * Web routes for admin User Management (plan Step 04 — no API surface).
 * Paths resolve from the ROUTES.WEB.ADMIN registry — never string literals.
 * Every route is authGuard-protected; mutations are also CSRF-guarded.
 */
export const adminUserWebRoutes = new Hono();

adminUserWebRoutes.get(ROUTES.WEB.ADMIN.USERS, authGuard, showUsersIndex);
adminUserWebRoutes.post(ROUTES.WEB.ADMIN.USERS_CREATE, csrfGuard, authGuard, createUserFromWeb);
adminUserWebRoutes.put(ROUTES.WEB.ADMIN.USERS_UPDATE, csrfGuard, authGuard, updateUserFromWeb);
adminUserWebRoutes.delete(ROUTES.WEB.ADMIN.USERS_DELETE, csrfGuard, authGuard, deleteUserFromWeb);
adminUserWebRoutes.post(ROUTES.WEB.ADMIN.USERS_TOGGLE, csrfGuard, authGuard, toggleUserActiveFromWeb);
