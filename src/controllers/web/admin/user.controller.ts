import type { Context } from "hono";
import * as UserService from "../../../services/admin/user.service.ts";
import { CreateBody, UpdateBody, IdParam, ChangeStatusBody } from "../../../validations/admin/user.ts";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../utils/errors.util.ts";
import { MESSAGES } from "../../../configs/constants.ts";
import {
  inertiaValidationErrorResponse,
  toInertiaErrorBag,
} from "../../../utils/inertia.util.ts";
import { flashError, flashSuccess, getAuthUser } from "../../../utils/session.util.ts";
import { ROUTES, route } from "../../../configs/routes.config.ts";
import { logger } from "../../../utils/logger.util.ts";
import type { User } from "../../../repositories/admin/user.repository.ts";

/**
 * Web controller for admin User Management (plan Step 04 — Inertia only,
 * no API surface). Service rows NEVER leave this layer with `passwordHash`:
 * `toUserView` is the single DTO mapping.
 */

export interface UserView {
  id: number;
  name: string;
  email: string;
  status: string;
  isActive: boolean;
  bannedUntil?: string | null;
  statusReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

const toUserView = (user: User): UserView => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status ?? (user.isActive ? "ACTIVE" : "INACTIVE"),
  isActive: user.isActive,
  bannedUntil: user.bannedUntil ?? null,
  statusReason: user.statusReason ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const parseStatus = (raw: string | undefined): "active" | "inactive" | undefined =>
  raw === "active" || raw === "inactive" ? raw : undefined;

const getListProps = async (c: Context) => {
  const q = c.req.query("q") ?? "";
  const status = parseStatus(c.req.query("status"));
  const pageRaw = Number.parseInt(c.req.query("page") ?? "1", 10);
  const result = await UserService.listUsers({
    q: q || undefined,
    status,
    page: Number.isNaN(pageRaw) ? 1 : pageRaw,
  });
  return {
    users: result.rows.map(toUserView),
    q,
    status: status ?? "",
    page: result.page,
    perPage: result.perPage,
    total: result.total,
    lastPage: result.lastPage,
  };
};

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

/** Origin page description for 422 error-bag re-renders of the list page. */
const indexOriginPage = async (c: Context) => {
  const url = new URL(c.req.url);
  return {
    component: "dashboard-admin/Admin/Users/Index",
    url: url.pathname + url.search,
    props: await getListProps(c),
  };
};

/** Origin page description for 422 error-bag re-renders of the create page. */
const createOriginPage = async (c: Context) => {
  const { authUserId, authUser } = await getAuthUserSummary(c);
  return {
    component: "dashboard-admin/Admin/Users/Create",
    url: ROUTES.WEB.ADMIN.USERS_CREATE_PAGE,
    props: {
      authUserId,
      authUser,
    },
  };
};

/** Origin page description for 422 error-bag re-renders of the edit page. */
const editOriginPage = async (c: Context, user: UserView) => {
  const { authUserId, authUser } = await getAuthUserSummary(c);
  return {
    component: "dashboard-admin/Admin/Users/Edit",
    url: route(ROUTES.WEB.ADMIN.USERS_EDIT_PAGE, { id: user.id }),
    props: {
      user,
      authUserId,
      authUser,
    },
  };
};

/** GET /admin/users — guarded list page (authGuard at the router). */
export const showUsersIndex = async (c: Context) => {
  const { authUserId, authUser } = await getAuthUserSummary(c);

  return c.render("dashboard-admin/Admin/Users/Index", {
    ...(await getListProps(c)),
    authUserId,
    authUser,
  });
};

/** GET /admin/users/create — guarded create page (authGuard at the router). */
export const showUserCreate = async (c: Context) => {
  const { authUserId, authUser } = await getAuthUserSummary(c);

  return c.render("dashboard-admin/Admin/Users/Create", {
    authUserId,
    authUser,
  });
};

/** GET /admin/users/:id/edit — guarded edit page (authGuard at the router). */
export const showUserEdit = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, MESSAGES.USER_NOT_FOUND);
    return c.redirect(ROUTES.WEB.ADMIN.USERS);
  }

  try {
    const user = await UserService.findUser(idParsed.data.id);
    const { authUserId, authUser } = await getAuthUserSummary(c);

    return c.render("dashboard-admin/Admin/Users/Edit", {
      user: toUserView(user),
      authUserId,
      authUser,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      flashError(c, MESSAGES.USER_NOT_FOUND);
      return c.redirect(ROUTES.WEB.ADMIN.USERS);
    }
    throw error;
  }
};

/** GET /admin/users/:id/status — dedicated account status & moderation page */
export const showUserStatus = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    flashError(c, MESSAGES.USER_NOT_FOUND);
    return c.redirect(ROUTES.WEB.ADMIN.USERS);
  }

  try {
    const user = await UserService.findUser(idParsed.data.id);
    const history = await UserService.getStatusHistory(idParsed.data.id);
    const { authUserId, authUser } = await getAuthUserSummary(c);

    return c.render("dashboard-admin/Admin/Users/Status", {
      user: toUserView(user),
      history,
      authUserId,
      authUser,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      flashError(c, MESSAGES.USER_NOT_FOUND);
      return c.redirect(ROUTES.WEB.ADMIN.USERS);
    }
    throw error;
  }
};

/** POST /admin/users — create from the Inertia page form. */
export const createUserFromWeb = async (c: Context) => {
  const parsed = CreateBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    const errors = toInertiaErrorBag(parsed.error);
    if (c.req.header("X-Inertia")) {
      return inertiaValidationErrorResponse(c, await createOriginPage(c), errors);
    }
    throw new ValidationError("Validation failed", errors);
  }

  try {
    const user = await UserService.createUser(parsed.data);
    logger.info("[UserWeb] User created via Inertia form", { id: user.id });
    flashSuccess(c, `User "${user.name}" created`);
    return c.redirect(ROUTES.WEB.ADMIN.USERS);
  } catch (error) {
    if (error instanceof ConflictError) {
      const errors = { email: error.message };
      if (c.req.header("X-Inertia")) {
        return inertiaValidationErrorResponse(c, await createOriginPage(c), errors);
      }
      throw new ValidationError("Validation failed", errors);
    }
    throw error;
  }
};

/** PUT /admin/users/:id — update from the Inertia edit page form. */
export const updateUserFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(idParsed.error));
  }

  const parsed = UpdateBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    const errors = toInertiaErrorBag(parsed.error);
    if (c.req.header("X-Inertia")) {
      try {
        const user = await UserService.findUser(idParsed.data.id);
        return inertiaValidationErrorResponse(c, await editOriginPage(c, toUserView(user)), errors);
      } catch {
        return inertiaValidationErrorResponse(c, await indexOriginPage(c), errors);
      }
    }
    throw new ValidationError("Validation failed", errors);
  }

  try {
    const user = await UserService.updateUser(idParsed.data.id, parsed.data);
    logger.info("[UserWeb] User updated via Inertia form", { id: user.id });
    flashSuccess(c, `User "${user.name}" updated`);
    return c.redirect(ROUTES.WEB.ADMIN.USERS);
  } catch (error) {
    if (error instanceof ConflictError) {
      const errors = { email: error.message };
      if (c.req.header("X-Inertia")) {
        try {
          const user = await UserService.findUser(idParsed.data.id);
          return inertiaValidationErrorResponse(c, await editOriginPage(c, toUserView(user)), errors);
        } catch {
          return inertiaValidationErrorResponse(c, await indexOriginPage(c), errors);
        }
      }
      throw new ValidationError("Validation failed", errors);
    }
    if (error instanceof NotFoundError) {
      flashError(c, MESSAGES.USER_NOT_FOUND);
      return c.redirect(ROUTES.WEB.ADMIN.USERS);
    }
    throw error;
  }
};

/** DELETE /admin/users/:id — soft delete from the row dropdown. */
export const deleteUserFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(idParsed.error));
  }
  const id = idParsed.data.id;

  // Self-protection: an admin cannot delete their own account (plan Step 04).
  const session = c.get("webSession");
  const actingUserId = getAuthUser(session);
  if (actingUserId !== null && actingUserId === id) {
    flashError(c, MESSAGES.USER_SELF_DELETE);
    return c.redirect(ROUTES.WEB.ADMIN.USERS);
  }

  try {
    const user = await UserService.findUser(id);
    await UserService.deleteUser(id);
    logger.info("[UserWeb] User deleted via Inertia", { id });
    flashSuccess(c, `User "${user.name}" deleted`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      flashError(c, MESSAGES.USER_NOT_FOUND);
    } else {
      throw error;
    }
  }
  return c.redirect(ROUTES.WEB.ADMIN.USERS);
};

/** POST /admin/users/:id/toggle — activate/deactivate from the row dropdown. */
export const toggleUserActiveFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(idParsed.error));
  }

  const session = c.get("webSession");
  try {
    const current = await UserService.findUser(idParsed.data.id);
    const user = await UserService.setActive(idParsed.data.id, !current.isActive, {
      actingUserId: getAuthUser(session) ?? undefined,
    });
    flashSuccess(
      c,
      user.isActive
        ? `User "${user.name}" activated`
        : `User "${user.name}" deactivated`,
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      // Self-deactivation guard — surfaced as a flash banner, not an error bag.
      flashError(c, error.message);
    } else if (error instanceof NotFoundError) {
      flashError(c, MESSAGES.USER_NOT_FOUND);
    } else {
      throw error;
    }
  }
  return c.redirect(ROUTES.WEB.ADMIN.USERS);
};

/** POST /admin/users/:id/status — change account status (Active, Inactive, Suspended, Banned). */
export const changeUserStatusFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(idParsed.error));
  }
  const id = idParsed.data.id;
  const parsed = ChangeStatusBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    throw new ValidationError("Validation failed", toInertiaErrorBag(parsed.error));
  }

  const session = c.get("webSession");
  const actingUserId = getAuthUser(session) ?? undefined;

  try {
    const updated = await UserService.changeAccountStatus(id, {
      status: parsed.data.status,
      reason: parsed.data.reason,
      bannedUntil: parsed.data.bannedUntil,
      actingUserId,
    });
    flashSuccess(
      c,
      `Account status for "${updated.name}" updated to ${updated.status}`,
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      flashError(c, error.message);
    } else if (error instanceof NotFoundError) {
      flashError(c, MESSAGES.USER_NOT_FOUND);
    } else {
      throw error;
    }
  }
  return c.redirect(route(ROUTES.WEB.ADMIN.USERS_STATUS_PAGE, { id }));
};

/** GET /admin/users/:id/status-history — fetch status history audit log. */
export const getUserStatusHistoryFromWeb = async (c: Context) => {
  const idParsed = IdParam.safeParse({ id: c.req.param("id") });
  if (!idParsed.success) {
    return c.json({ error: "Invalid user ID" }, 400);
  }
  try {
    const history = await UserService.getStatusHistory(idParsed.data.id);
    return c.json({ data: history });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: "User not found" }, 404);
    }
    throw error;
  }
};
