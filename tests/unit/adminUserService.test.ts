import { describe, it, expect, beforeAll, beforeEach } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";

setupTestEnvironment();

import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import * as UserService from "../../src/services/admin/user.service.ts";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../src/utils/errors.util.ts";
import { MESSAGES } from "../../src/configs/constants.ts";
import type { User } from "../../src/repositories/admin/user.repository.ts";

const capture = async (fn: () => Promise<unknown>): Promise<unknown> => {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected promise to reject, but it resolved");
};

describe("Admin UserService", () => {
  beforeAll(async () => {
    const db = await getSqliteDb("sqlite1");
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        is_active INTEGER NOT NULL DEFAULT 1,
        banned_until TEXT DEFAULT NULL,
        status_reason TEXT DEFAULT NULL,
        deleted_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS user_status_histories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        reason TEXT,
        banned_until TEXT DEFAULT NULL,
        changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE deleted_at IS NULL;`,
    );
  });

  beforeEach(async () => {
    const db = await getSqliteDb("sqlite1");
    db.run("DELETE FROM users");
  });

  it("createUser stores an Argon2id hash and defaults isActive to true", async () => {
    const user = await UserService.createUser({
      name: "Admin",
      email: "admin@example.com",
      password: "super-secret-1",
    });

    expect(user.id).toBeGreaterThan(0);
    expect(user.isActive).toBe(true);
    expect(user.deletedAt).toBeNull();
    expect(user.passwordHash).not.toBe("super-secret-1");
    expect(
      await Bun.password.verify("super-secret-1", user.passwordHash),
    ).toBe(true);
  });

  it("createUser rejects a duplicate active email with ConflictError", async () => {
    await UserService.createUser({
      name: "First",
      email: "dup@example.com",
      password: "super-secret-1",
    });

    const error = (await capture(() =>
      UserService.createUser({
        name: "Second",
        email: "dup@example.com",
        password: "super-secret-2",
      }),
    )) as ConflictError;

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe(MESSAGES.USER_EMAIL_TAKEN);
  });

  it("createUser accepts isActive=false", async () => {
    const user = await UserService.createUser({
      name: "Inactive",
      email: "inactive@example.com",
      password: "super-secret-1",
      isActive: false,
    });
    expect(user.isActive).toBe(false);
  });

  it("verifyCredentials returns the user for a valid active account", async () => {
    const created = await UserService.createUser({
      name: "Admin",
      email: "login@example.com",
      password: "super-secret-1",
    });

    const user = await UserService.verifyCredentials(
      "login@example.com",
      "super-secret-1",
    );
    expect(user.id).toBe(created.id);
  });

  it("verifyCredentials answers the SAME generic error for wrong password, unknown email, and deactivated account", async () => {
    const created = await UserService.createUser({
      name: "Admin",
      email: "generic@example.com",
      password: "super-secret-1",
    });
    await UserService.setActive(created.id, false);

    const wrongPassword = (await capture(() =>
      UserService.verifyCredentials("generic@example.com", "wrong-pass"),
    )) as ValidationError;
    const unknownEmail = (await capture(() =>
      UserService.verifyCredentials("nobody@example.com", "super-secret-1"),
    )) as ValidationError;
    const deactivated = (await capture(() =>
      UserService.verifyCredentials("generic@example.com", "super-secret-1"),
    )) as ValidationError;

    for (const error of [wrongPassword, unknownEmail, deactivated]) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(MESSAGES.AUTH_INVALID_CREDENTIALS);
    }
  });

  it("updateUser renames, rehashes on password change, and keeps own email conflict-free", async () => {
    const created = await UserService.createUser({
      name: "Before",
      email: "edit@example.com",
      password: "super-secret-1",
    });

    const renamed = await UserService.updateUser(created.id, {
      name: "After",
    });
    expect(renamed.name).toBe("After");
    expect(
      await Bun.password.verify("super-secret-1", renamed.passwordHash),
    ).toBe(true);

    const rehashed = await UserService.updateUser(created.id, {
      password: "super-secret-2",
    });
    expect(
      await Bun.password.verify("super-secret-1", rehashed.passwordHash),
    ).toBe(false);
    expect(
      await Bun.password.verify("super-secret-2", rehashed.passwordHash),
    ).toBe(true);

    const sameEmail = await UserService.updateUser(created.id, {
      email: "edit@example.com",
    });
    expect(sameEmail.email).toBe("edit@example.com");
  });

  it("updateUser refuses an email already used by another active user", async () => {
    const first = await UserService.createUser({
      name: "First",
      email: "taken@example.com",
      password: "super-secret-1",
    });
    const second = await UserService.createUser({
      name: "Second",
      email: "other@example.com",
      password: "super-secret-1",
    });

    const error = (await capture(() =>
      UserService.updateUser(second.id, { email: "taken@example.com" }),
    )) as ConflictError;

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe(MESSAGES.USER_EMAIL_TAKEN);

    const unchanged = await UserService.findUser(second.id);
    expect(unchanged.email).toBe("other@example.com");
    expect(unchanged.id).toBe(first.id + 1);
  });

  it("updateUser throws NotFoundError for a missing id", async () => {
    const error = (await capture(() =>
      UserService.updateUser(9999, { name: "Ghost" }),
    )) as NotFoundError;
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe(MESSAGES.USER_NOT_FOUND);
  });

  it("setActive toggles isActive without touching other fields", async () => {
    const created = await UserService.createUser({
      name: "Toggle",
      email: "toggle@example.com",
      password: "super-secret-1",
    });

    const off = await UserService.setActive(created.id, false);
    expect(off.isActive).toBe(false);
    expect(off.name).toBe("Toggle");

    const on = await UserService.setActive(created.id, true);
    expect(on.isActive).toBe(true);
  });

  it("setActive refuses to deactivate the acting user's own account", async () => {
    const created = await UserService.createUser({
      name: "Self",
      email: "self@example.com",
      password: "super-secret-1",
    });

    const error = (await capture(() =>
      UserService.setActive(created.id, false, { actingUserId: created.id }),
    )) as ValidationError;

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe(MESSAGES.USER_SELF_DISABLE);

    // Rejected — the account stays active.
    const still = await UserService.findUser(created.id);
    expect(still.isActive).toBe(true);
  });

  it("setActive allows activating the acting user's own account", async () => {
    const created = await UserService.createUser({
      name: "Self On",
      email: "self-on@example.com",
      password: "super-secret-1",
    });

    const on = await UserService.setActive(created.id, true, {
      actingUserId: created.id,
    });
    expect(on.isActive).toBe(true);
  });

  it("deleteUser soft-deletes: hidden from lookups, and the email becomes reusable", async () => {
    const created = await UserService.createUser({
      name: "Gone",
      email: "gone@example.com",
      password: "super-secret-1",
    });

    await UserService.deleteUser(created.id);

    await expect(UserService.findUser(created.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const reused = await UserService.createUser({
      name: "Reborn",
      email: "gone@example.com",
      password: "super-secret-2",
    });
    expect(reused.id).not.toBe(created.id);
    expect(reused.email).toBe("gone@example.com");
  });

  it("listUsers paginates, searches, and filters by status", async () => {
    for (let i = 1; i <= 12; i++) {
      await UserService.createUser({
        name: `User ${i}`,
        email: `user-${i}@example.com`,
        password: "super-secret-1",
        isActive: i % 2 === 1,
      });
    }

    const page1 = await UserService.listUsers({ page: 1, perPage: 10 });
    expect(page1.total).toBe(12);
    expect(page1.perPage).toBe(10);
    expect(page1.lastPage).toBe(2);
    expect(page1.rows).toHaveLength(10);
    // newest first
    expect(page1.rows[0]!.name).toBe("User 12");

    const page2 = await UserService.listUsers({ page: 2, perPage: 10 });
    expect(page2.rows).toHaveLength(2);

    const search = await UserService.listUsers({ q: "user-1" });
    expect(search.total).toBe(4); // user-1, user-10, user-11, user-12

    const inactive = await UserService.listUsers({ status: "inactive" });
    expect(inactive.total).toBe(6);
    expect(inactive.rows.every((u: User) => !u.isActive)).toBe(true);

    const active = await UserService.listUsers({ status: "active" });
    expect(active.total).toBe(6);
  });

  it("changeAccountStatus logs history and updates user state", async () => {
    const admin = await UserService.createUser({
      name: "Admin Super",
      email: "admin@example.com",
      password: "password123",
    });
    const target = await UserService.createUser({
      name: "Bad Actor",
      email: "bad@example.com",
      password: "password123",
    });

    const bannedDate = new Date(Date.now() + 7 * 86400000).toISOString();
    const updated = await UserService.changeAccountStatus(target.id, {
      status: "BANNED",
      reason: "Spamming content",
      bannedUntil: bannedDate,
      actingUserId: admin.id,
    });

    expect(updated.status).toBe("BANNED");
    expect(updated.isActive).toBe(false);
    expect(updated.statusReason).toBe("Spamming content");
    expect(updated.bannedUntil).toBe(bannedDate);

    const history = await UserService.getStatusHistory(target.id);
    expect(history.length).toBeGreaterThanOrEqual(1);
    const latest = history[0]!;
    expect(latest.toStatus).toBe("BANNED");
    expect(latest.reason).toBe("Spamming content");
    expect(latest.changedBy).toBe(admin.id);
  });

  it("verifyCredentials rejects banned users with informative message and auto-lifts expired bans", async () => {
    const user = await UserService.createUser({
      name: "Banned User",
      email: "banned@example.com",
      password: "secretpassword123",
    });

    // 1. Permanent ban
    await UserService.changeAccountStatus(user.id, {
      status: "BANNED",
      reason: "Repeated severe violations",
    });
    const permErr = await capture(() =>
      UserService.verifyCredentials("banned@example.com", "secretpassword123"),
    );
    expect(permErr).toBeInstanceOf(ValidationError);
    expect((permErr as ValidationError).message).toContain("permanently banned");
    expect((permErr as ValidationError).message).toContain("Repeated severe violations");

    // 2. Active temporary ban
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString();
    await UserService.changeAccountStatus(user.id, {
      status: "BANNED",
      reason: "Suspended for 2 days",
      bannedUntil: futureDate,
    });
    const tempErr = await capture(() =>
      UserService.verifyCredentials("banned@example.com", "secretpassword123"),
    );
    expect(tempErr).toBeInstanceOf(ValidationError);
    expect((tempErr as ValidationError).message).toContain("suspended until");

    // 3. Expired temporary ban -> auto-lifts upon login!
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    await UserService.changeAccountStatus(user.id, {
      status: "BANNED",
      reason: "Expired suspension",
      bannedUntil: pastDate,
    });
    const verified = await UserService.verifyCredentials("banned@example.com", "secretpassword123");
    expect(verified.status).toBe("ACTIVE");
    expect(verified.isActive).toBe(true);
    expect(verified.bannedUntil).toBeNull();
  });
});
