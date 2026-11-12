import type { Context } from "hono";
import * as UserService from "../../../services/admin/user.service.ts";
import { LoginBody } from "../../../validations/admin/auth.ts";
import { ValidationError } from "../../../utils/errors.util.ts";
import {
  inertiaValidationErrorResponse,
  toInertiaErrorBag,
} from "../../../utils/inertia.util.ts";
import {
  clearAuthUser,
  flashSuccess,
  getAuthUser,
  rotateSessionForAuth,
} from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import { recordActivity } from "../../../services/common/activityLog.service.ts";

/** Shared origin-page description for 422 error-bag responses on login. */
const loginOriginPage = () => ({
  component: "dashboard-admin/Admin/Login",
  url: ROUTES.WEB.ADMIN.LOGIN,
  props: {},
});

/** GET /admin/login — login page (guestGuard applied at the router). */
export const showAdminLogin = async (c: Context) =>
  c.render("dashboard-admin/Admin/Login");

/**
 * POST /admin/login — verifies credentials (UserService; generic error),
 * rotates the session (fresh CSRF + userId claim, session-fixation
 * protection), then redirects to the admin home.
 *
 * Failures answer 422 with an Inertia error bag: Zod field errors under
 * `email`/`password`, credential failures under the form-level `form` key
 * so the page can show one generic alert (anti user-enumeration).
 */
export const loginAdmin = async (c: Context) => {
  const parsed = LoginBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    const errors = toInertiaErrorBag(parsed.error);
    if (c.req.header("X-Inertia")) {
      return inertiaValidationErrorResponse(c, loginOriginPage(), errors);
    }
    throw new ValidationError("Validation failed", errors);
  }

  try {
    const user = await UserService.verifyCredentials(
      parsed.data.email,
      parsed.data.password,
    );

    const session = c.get("webSession");
    if (!session) {
      throw new ValidationError("Session unavailable", { form: "Session unavailable" });
    }
    rotateSessionForAuth(session, user.id);
    flashSuccess(c, `Welcome back, ${user.name}`);
    logger.info("[AuthWeb] Login success", { userId: user.id });

    recordActivity({
      actorId: user.id,
      actorType: "admin",
      actorName: user.name,
      actorEmail: user.email,
      action: "auth.login",
      scope: "personal",
      description: "Admin logged in successfully",
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
    });

    return c.redirect(ROUTES.WEB.ADMIN.DASHBOARD);
  } catch (error) {
    if (error instanceof ValidationError) {
      // Generic credential failure — same message for wrong password,
      // unknown email, and deactivated accounts (plan D3).
      logger.warn("[AuthWeb] Login failed: invalid credentials or account restricted", {
        email: parsed.data.email,
        ip: c.req.header("x-forwarded-for") || "unknown",
      });
      const errors = { form: error.message };
      if (c.req.header("X-Inertia")) {
        return inertiaValidationErrorResponse(c, loginOriginPage(), errors);
      }
      throw new ValidationError("Validation failed", errors);
    }
    throw error;
  }
};

/** POST /admin/logout — drops the userId claim, keeps CSRF + flash, redirects. */
export const logoutAdmin = async (c: Context) => {
  const session = c.get("webSession");
  const authUserId = session ? getAuthUser(session) : undefined;
  if (session) clearAuthUser(session);
  flashSuccess(c, "You have been logged out");
  logger.info("[AuthWeb] Logout", { userId: authUserId });

  if (authUserId) {
    recordActivity({
      actorId: authUserId,
      actorType: "admin",
      action: "auth.logout",
      scope: "personal",
      description: "Admin logged out",
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
    });
  }

  return c.redirect(ROUTES.WEB.ADMIN.LOGIN);
};
