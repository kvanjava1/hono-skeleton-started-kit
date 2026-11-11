import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import { MESSAGES } from "../../src/configs/constants.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";
import * as UserService from "../../src/services/admin/user.service.ts";
import {
  findUserByEmail,
  findUserById,
} from "../../src/repositories/admin/user.repository.ts";

const USERS_COMPONENT = "dashboard-admin\\/Admin\\/Users\\/Index";
const CREATE_USER_COMPONENT = "dashboard-admin\\/Admin\\/Users\\/Create";
const EDIT_USER_COMPONENT = "dashboard-admin\\/Admin\\/Users\\/Edit";

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
  await UserService.createUser({
    name: "Admin Owner",
    email: "owner@example.com",
    password: "super-secret-1",
  });
});

const jar = new Map<string, string>();
const storeCookies = (res: Response) => {
  for (const raw of res.headers.getSetCookie()) {
    const pair = raw.split(";")[0]!;
    const eq = pair.indexOf("=");
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
};
const cookieHeader = () =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

/** Logs in `owner@example.com` and keeps the (rotated) session in the jar. */
const loginAsOwner = async () => {
  // Fresh anonymous visit first: seeds session + XSRF cookies for the guard.
  storeCookies(await app.fetch(new Request("http://localhost/admin/login")));
  const res = await app.fetch(
    new Request("http://localhost/admin/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: cookieHeader(),
        "x-xsrf-token": jar.get("XSRF-TOKEN")!,
      },
      body: JSON.stringify({ email: "owner@example.com", password: "super-secret-1" }),
    }),
  );
  expect(res.status).toBe(302);
  storeCookies(res);
};

describe("Admin User Management (web only — no API)", () => {
  const base = "http://localhost";

  test("authGuard protects the admin list page for anonymous visitors", async () => {
    const res = await app.fetch(new Request(`${base}/admin/users`));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/login");
  });

  test("logged-in admin sees the User Management page", async () => {
    await loginAsOwner();

    const res = await app.fetch(
      new Request(`${base}/admin/users`, { headers: { cookie: cookieHeader() } }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain(`"component":"${USERS_COMPONENT}"`);
    expect(text).toContain("Admin Owner");
  });

  test("logged-in admin sees the Create User page", async () => {
    await loginAsOwner();

    const res = await app.fetch(
      new Request(`${base}/admin/users/create`, { headers: { cookie: cookieHeader() } }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain(`"component":"${CREATE_USER_COMPONENT}"`);
  });

  test("logged-in admin sees the Edit User page", async () => {
    await loginAsOwner();
    const owner = await findUserByEmail("owner@example.com");

    const res = await app.fetch(
      new Request(`${base}/admin/users/${owner!.id}/edit`, { headers: { cookie: cookieHeader() } }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain(`"component":"${EDIT_USER_COMPONENT}"`);
    expect(text).toContain("Admin Owner");
  });

  test("POST /admin/users without CSRF is rejected with 403", async () => {
    const res = await app.fetch(
      new Request(`${base}/admin/users`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: base, cookie: cookieHeader() },
        body: JSON.stringify({ name: "X", email: "x@example.com", password: "super-secret-1" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("POST /admin/users creates a user (soft layer through the web form)", async () => {
    const res = await app.fetch(
      new Request(`${base}/admin/users`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({
          name: "Budi Santoso",
          email: "budi@example.com",
          password: "budi-secret-1",
        }),
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/users");
    storeCookies(res);

    const created = await UserService.verifyCredentials("budi@example.com", "budi-secret-1");
    expect(created.name).toBe("Budi Santoso");
    expect(created.isActive).toBe(true);
  });

  test("POST /admin/users with invalid body answers 422 with field errors", async () => {
    const res = await app.fetch(
      new Request(`${base}/admin/users`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
          "x-inertia": "true",
        },
        body: JSON.stringify({ name: "", email: "not-an-email", password: "short" }),
      }),
    );
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.props.errors.name).toBeDefined();
    expect(body.props.errors.email).toBeDefined();
    expect(body.props.errors.password).toBeDefined();
  });

  test("PUT /admin/users/:id updates fields and keeps the password when omitted", async () => {
    const target = await UserService.verifyCredentials("budi@example.com", "budi-secret-1");

    const res = await app.fetch(
      new Request(`http://localhost${ROUTES_TEST(target.id)}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({ name: "Budi S. revised" }),
      }),
    );
    expect(res.status).toBe(302);
    storeCookies(res);

    const updated = await UserService.findUser(target.id);
    expect(updated.name).toBe("Budi S. revised");
    expect(
      await Bun.password.verify("budi-secret-1", updated.passwordHash),
    ).toBe(true);
  });

  test("PUT /admin/users/:id rehashes when a new password is provided", async () => {
    const target = await findUserByEmail("budi@example.com");
    expect(target).not.toBeNull();

    const res = await app.fetch(
      new Request(`http://localhost${ROUTES_TEST(target!.id)}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({ password: "budi-secret-2" }),
      }),
    );
    expect(res.status).toBe(302);
    storeCookies(res);

    const updated = await UserService.findUser(target!.id);
    expect(
      await Bun.password.verify("budi-secret-2", updated.passwordHash),
    ).toBe(true);
  });

  test("POST /admin/users/:id/toggle flips isActive", async () => {
    const target = await findUserByEmail("budi@example.com");
    expect(target!.isActive).toBe(true);

    const res = await app.fetch(
      new Request(`${base}/admin/users/${target!.id}/toggle`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );
    expect(res.status).toBe(302);
    storeCookies(res);

    const after = await UserService.findUser(target!.id);
    expect(after.isActive).toBe(false);
  });

  test("toggle on the acting user's own account is rejected", async () => {
    const owner = await findUserByEmail("owner@example.com");
    expect(owner!.isActive).toBe(true);

    const res = await app.fetch(
      new Request(`${base}/admin/users/${owner!.id}/toggle`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );
    expect(res.status).toBe(302);
    storeCookies(res);

    const still = await UserService.findUser(owner!.id);
    expect(still.isActive).toBe(true);
  });

  test("DELETE /admin/users/:id soft-deletes another user", async () => {
    const target = await findUserByEmail("budi@example.com");

    const res = await app.fetch(
      new Request(`${base}/admin/users/${target!.id}`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );
    expect(res.status).toBe(302);
    storeCookies(res);

    // Soft delete → hidden from every active-row query (repository returns null).
    expect(await findUserById(target!.id)).toBeNull();
  });

  test("DELETE on the acting user's own account is rejected", async () => {
    const owner = await findUserByEmail("owner@example.com");

    const res = await app.fetch(
      new Request(`${base}/admin/users/${owner!.id}`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );
    expect(res.status).toBe(302);
    storeCookies(res);

    const still = await UserService.findUser(owner!.id);
    expect(still).not.toBeNull();
    expect(still!.email).toBe("owner@example.com");
  });

  test("POST /admin/users/:id/status updates status and logs history", async () => {
    const target = await UserService.createUser({
      name: "Status Target",
      email: "statustarget@example.com",
      password: "secretpassword1",
    });

    const pageRes = await app.fetch(
      new Request(`${base}/admin/users/${target.id}/status`, {
        method: "GET",
        headers: {
          cookie: cookieHeader(),
        },
      }),
    );
    expect(pageRes.status).toBe(200);
    const pageHtml = await pageRes.text();
    expect(pageHtml).toContain("dashboard-admin\\/Admin\\/Users\\/Status");
    expect(pageHtml).toContain("Status Target");

    const banRes = await app.fetch(
      new Request(`${base}/admin/users/${target.id}/status`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({
          status: "BANNED",
          reason: "Violating community standards",
          bannedUntil: new Date(Date.now() + 86400000).toISOString(),
        }),
      }),
    );
    expect(banRes.status).toBe(302);
    storeCookies(banRes);

    const updated = await UserService.findUser(target.id);
    expect(updated.status).toBe("BANNED");
    expect(updated.isActive).toBe(false);
    expect(updated.statusReason).toBe("Violating community standards");

    // Fetch history
    const historyRes = await app.fetch(
      new Request(`${base}/admin/users/${target.id}/status-history`, {
        method: "GET",
        headers: {
          cookie: cookieHeader(),
        },
      }),
    );
    expect(historyRes.status).toBe(200);
    const json = (await historyRes.json()) as { data: Array<{ toStatus: string; reason: string }> };
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data[0]!.toStatus).toBe("BANNED");
    expect(json.data[0]!.reason).toBe("Violating community standards");
  });

  test("POST /admin/users/:id/status self-ban is rejected", async () => {
    const owner = await findUserByEmail("owner@example.com");

    const res = await app.fetch(
      new Request(`${base}/admin/users/${owner!.id}/status`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({
          status: "BANNED",
          reason: "Self ban attempt",
        }),
      }),
    );
    expect(res.status).toBe(302);

    const still = await UserService.findUser(owner!.id);
    expect(still.status).toBe("ACTIVE");
    expect(still.isActive).toBe(true);
  });
});

/** `/admin/users/:id` helper — mirrors ROUTES.WEB.ADMIN.USERS_UPDATE. */
const ROUTES_TEST = (id: number) => `/admin/users/${id}`;
