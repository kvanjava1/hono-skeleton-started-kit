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

export type { User, UserListQuery, UserListResult };

/**
 * Argon2id is Bun's default `Bun.password` algorithm; it is stated explicitly
 * so the hashing choice does not depend on runtime defaults.
 */
const hashPassword = (plain: string): Promise<string> =>
  Bun.password.hash(plain, { algorithm: "argon2id" });

/**
 * Verifying a hash costs real CPU time. When the email does not exist we
 * verify against a throwaway hash anyway so "unknown email" and "wrong
 * password" take a similar amount of time (anti user-enumeration timing
 * equalizer). Computed lazily, once per process.
 */
let dummyHashPromise: Promise<string> | null = null;
const getDummyHash = (): Promise<string> => {
  dummyHashPromise ??= Bun.password.hash("timing-equalizer-dummy", {
    algorithm: "argon2id",
  });
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

  if (!user.isActive) {
    await Bun.password.verify(password, user.passwordHash);
    throw invalidCredentials();
  }

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) throw invalidCredentials();

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
  isActive?: boolean;
}): Promise<User> => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError(MESSAGES.USER_EMAIL_TAKEN);
  }

  const created = await insertUser({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });

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
  if (
    !isActive &&
    options.actingUserId !== undefined &&
    options.actingUserId === id
  ) {
    throw new ValidationError(MESSAGES.USER_SELF_DISABLE);
  }
  return updateUser(id, { isActive });
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
