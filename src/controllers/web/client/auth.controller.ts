import type { Context } from "hono";
import * as ClientAuthService from "../../../services/client/clientAuth.service.ts";
import { LoginBody } from "../../../validations/admin/auth.ts";
import { ValidationError, UnauthorizedError } from "../../../utils/errors.util.ts";
import {
  inertiaValidationErrorResponse,
  toInertiaErrorBag,
} from "../../../utils/inertia.util.ts";
import {
  clearClientAuthUser,
  flashSuccess,
  getClientAuthUser,
  rotateSessionForClientAuth,
} from "../../../utils/session.util.ts";
import { ROUTES } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import { recordActivity } from "../../../services/common/activityLog.service.ts";

const clientLoginOriginPage = () => ({
  component: "dashboard-client/Client/Auth/Login",
  url: ROUTES.WEB.CLIENT.LOGIN,
  props: {},
});

/** GET /client/login */
export const showClientLogin = async (c: Context) => {
  return c.render("dashboard-client/Client/Auth/Login");
};

/** POST /client/login */
export const loginClient = async (c: Context) => {
  const parsed = LoginBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    const errors = toInertiaErrorBag(parsed.error);
    if (c.req.header("X-Inertia")) {
      return inertiaValidationErrorResponse(c, clientLoginOriginPage(), errors);
    }
    throw new ValidationError("Validation failed", errors);
  }

  try {
    const result = await ClientAuthService.verifyClientCredentials(
      parsed.data.email,
      parsed.data.password,
    );

    const session = c.get("webSession");
    if (!session) {
      throw new ValidationError("Session unavailable", { form: "Session unavailable" });
    }

    rotateSessionForClientAuth(session, result.user.id, result.activeClientId ?? undefined);
    flashSuccess(c, `Welcome back, ${result.user.name}`);
    logger.info("[ClientAuthWeb] Login success", {
      clientUserId: result.user.id,
      activeClientId: result.activeClientId,
    });

    recordActivity({
      clientId: result.activeClientId,
      actorId: result.user.id,
      actorType: "client_user",
      actorName: result.user.name,
      actorEmail: result.user.email,
      action: "auth.login",
      scope: "personal",
      description: "User logged in to client portal",
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
    });

    return c.redirect(ROUTES.WEB.CLIENT.DASHBOARD);
  } catch (error) {
    logger.warn("[ClientAuthWeb] Login failed: invalid credentials or account restricted", {
      email: parsed.data.email,
      ip: c.req.header("x-forwarded-for") || "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message = error instanceof UnauthorizedError ? error.message : "Invalid email or password";
    const errors = { form: message };
    if (c.req.header("X-Inertia")) {
      return inertiaValidationErrorResponse(c, clientLoginOriginPage(), errors);
    }
    throw new ValidationError("Authentication failed", errors);
  }
};

/** POST /client/logout */
export const logoutClient = async (c: Context) => {
  const session = c.get("webSession");
  const clientUserId = session ? getClientAuthUser(session) : undefined;
  if (session) {
    clearClientAuthUser(session);
  }
  flashSuccess(c, "You have been logged out.");
  logger.info("[ClientAuthWeb] Logout", { clientUserId });

  if (clientUserId) {
    recordActivity({
      actorId: clientUserId,
      actorType: "client_user",
      action: "auth.logout",
      scope: "personal",
      description: "User logged out from client portal",
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
    });
  }

  return c.redirect(ROUTES.WEB.CLIENT.LOGIN);
};
