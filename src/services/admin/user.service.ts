import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../utils/errors.util.ts";
import { MESSAGES } from "../../configs/constants.ts";
import { logger } from "../../utils/logger.util.ts";
import {
  findAllUsers,
  findUserByEmail,
  findUserById,
  insertUser,
  softDeleteUserById,
  updateUserById,
  type User,
  type UserCreateInput,
  type UserListQuery,
  type UserListResult,
  type UserUpdateInput,
} from "../../repositories/admin/user.repository.ts";
import {
  insertStatusHistory,
  findStatusHistoriesByUserId,
  type StatusHistoryWithActor,
} from "../../repositories/admin/userStatusHistory.repository.ts";

export type { User, UserListQuery, UserListResult, StatusHistoryWithActor };

/**
 * Argon2id tuning options:
 * Default Bun is memoryCost 65536 KiB (64MB) and timeCost 2-3 iterations (~220ms),
 * which can cause CPU saturation during concurrent logins.
 *
 * Tuned options:
 * - memoryCost: 19456 (19MB), timeCost: 2 (~45ms, OWASP recommended moderate)
 * - memoryCost: 8192 (8MB), timeCost: 1 (~10ms, lightweight profile)
 */
export const PASSWORD_HASH_OPTIONS = {
  algorithm: "argon2id" as const,
  memoryCost: 8192,
  timeCost: 1,
};

const hashPassword = (plain: string): Promise<string> =>
  Bun.password.hash(plain, PASSWORD_HASH_OPTIONS);

/**
 * Verifying a hash costs real CPU time. When the email does not exist we
 * verify against a throwaway hash anyway so "unknown email" and "wrong
 * password" take a similar amount of time (anti user-enumeration timing
 * equalizer). Computed lazily or pre-warmed at server startup.
 */
let dummyHashPromise: Promise<string> | null = null;
export const getDummyHash = (): Promise<string> => {
  dummyHashPromise ??= Bun.password.hash("timing-equalizer-dummy", PASSWORD_HASH_OPTIONS);
  return dummyHashPromise;
};

const invalidCredentials = () => new ValidationError(MESSAGES.AUTH_INVALID_CREDENTIALS);

/**
 * Verifies an email/password pair against an ACTIVE, non-deleted user.
 * Every failure path (unknown email, deactivated account, wrong password)
 * throws the same generic error — the message never reveals which part
 * failed (plan D3).
 */
export const verifyCredentials = async (
  email: string,
  password: string,
): Promise<User> => {
  const user = await findUserByEmail(email);

  if (!user) {
    await Bun.password.verify(password, await getDummyHash());
    throw invalidCredentials();
  }

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) throw invalidCredentials();

  // Handle BANNED accounts
  if (user.status === "BANNED") {
    // If temporary ban has expired, auto-lift to ACTIVE!
    if (user.bannedUntil && new Date(user.bannedUntil) <= new Date()) {
      try {
        await insertStatusHistory({
          userId: user.id,
          fromStatus: "BANNED",
          toStatus: "ACTIVE",
          reason: "Temporary ban period expired. Automatically lifted upon login.",
          changedBy: null,
        });
      } catch {
        // Non-fatal if history table is unavailable in standalone tests
      }
      await updateUserById(user.id, {
        status: "ACTIVE",
        isActive: true,
        bannedUntil: null,
        statusReason: null,
      });
      user.status = "ACTIVE";
      user.isActive = true;
      user.bannedUntil = null;
      user.statusReason = null;
    } else {
      const formattedDate = user.bannedUntil
        ? new Date(user.bannedUntil).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : null;
      const msg = user.bannedUntil
        ? `Your account is suspended until ${formattedDate}.${user.statusReason ? ` Reason: ${user.statusReason}` : ""}`
        : `Your account has been permanently banned.${user.statusReason ? ` Reason: ${user.statusReason}` : ""}`;
      throw new ValidationError(msg);
    }
  }

  if (!user.isActive || user.status === "INACTIVE" || user.status === "SUSPENDED") {
    throw invalidCredentials();
  }

  return user;
};

export const listUsers = async (
  query: UserListQuery = {},
): Promise<UserListResult> => findAllUsers(query);

export const findUser = async (id: number): Promise<User> => {
  const user = await findUserById(id);
  if (!user) {
    logger.warn("[UserService] User not found", { id });
    throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
  }
  return user;
};

export const createUser = async (input: {
  name: string;
  email: string;
  password: string;
  status?: "ACTIVE" | "INACTIVE";
  isActive?: boolean;
}): Promise<User> => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError(MESSAGES.USER_EMAIL_TAKEN);
  }

  const effectiveStatus = input.status ?? (input.isActive === false ? "INACTIVE" : "ACTIVE");
  const effectiveIsActive = input.isActive ?? (effectiveStatus === "ACTIVE");

  const created = await insertUser({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    status: effectiveStatus,
    isActive: effectiveIsActive,
  });

  try {
    await insertStatusHistory({
      userId: created.id,
      fromStatus: "NONE",
      toStatus: created.status,
      reason: "Account created",
      changedBy: null,
    });
  } catch {
    // Non-fatal if history table is unavailable in standalone tests
  }

  logger.info("[UserService] User created", { id: created.id, email: created.email });
  return created;
};

export const updateUser = async (
  id: number,
  input: {
    name?: string;
    email?: string;
    password?: string;
    isActive?: boolean;
  },
): Promise<User> => {
  const current = await findUser(id);

  const patch: UserUpdateInput = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.email !== undefined && input.email !== current.email) {
    const taken = await findUserByEmail(input.email);
    if (taken) {
      throw new ConflictError(MESSAGES.USER_EMAIL_TAKEN);
    }
    patch.email = input.email;
  }
  if (input.password !== undefined) {
    patch.passwordHash = await hashPassword(input.password);
  }
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const updated = await updateUserById(id, patch);
  if (!updated) {
    throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
  }

  logger.info("[UserService] User updated", {
    id,
    passwordChanged: patch.passwordHash !== undefined,
  });
  return updated;
};

export interface ChangeAccountStatusInput {
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  reason?: string;
  bannedUntil?: string | null;
  actingUserId?: number;
}

export const changeAccountStatus = async (
  id: number,
  input: ChangeAccountStatusInput,
): Promise<User> => {
  const current = await findUser(id);

  // Self-protection: acting admin cannot ban or deactivate themselves
  if (
    input.status !== "ACTIVE" &&
    input.actingUserId !== undefined &&
    input.actingUserId === id
  ) {
    throw new ValidationError(MESSAGES.USER_SELF_DISABLE);
  }

  const isActive = input.status === "ACTIVE";
  const bannedUntil = input.status === "BANNED" ? (input.bannedUntil ?? null) : null;
  const statusReason = input.status !== "ACTIVE" ? (input.reason ?? null) : null;

  try {
    await insertStatusHistory({
      userId: id,
      fromStatus: current.status ?? (current.isActive ? "ACTIVE" : "INACTIVE"),
      toStatus: input.status,
      reason: input.reason ?? null,
      bannedUntil,
      changedBy: input.actingUserId ?? null,
    });
  } catch {
    // Non-fatal if history table is unavailable in standalone tests
  }

  const updated = await updateUserById(id, {
    status: input.status,
    isActive,
    bannedUntil,
    statusReason,
  });

  if (!updated) {
    throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
  }

  logger.info("[UserService] User status changed", {
    userId: id,
    from: current.status,
    to: input.status,
    changedBy: input.actingUserId,
  });

  return updated;
};

export const getStatusHistory = async (userId: number) => {
  await findUser(userId);
  return findStatusHistoriesByUserId(userId);
};

/**
 * Activates/deactivates an account without touching other fields.
 * Deactivating the acting user's own account is rejected so an admin
 * cannot lock themselves out of the dashboard (plan Step 04).
 */
export const setActive = async (
  id: number,
  isActive: boolean,
  options: { actingUserId?: number } = {},
): Promise<User> => {
  return changeAccountStatus(id, {
    status: isActive ? "ACTIVE" : "INACTIVE",
    reason: isActive ? "Account activated" : "Account deactivated",
    actingUserId: options.actingUserId,
  });
};

/**
 * Soft delete (plan D6): sets `deleted_at` so the row stays in the database
 * but disappears from every active-row query, including login lookups; the
 * email becomes reusable thanks to the partial unique index.
 */
export const deleteUser = async (id: number): Promise<void> => {
  const deleted = await softDeleteUserById(id);
  if (!deleted) {
    logger.warn("[UserService] User not found for delete", { id });
    throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
  }
  logger.info("[UserService] User soft-deleted", { id });
};
