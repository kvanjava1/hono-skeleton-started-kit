import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import { MESSAGES } from "../../src/configs/constants.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";
import * as UserService from "../../src/services/admin/user.service.ts";

const LOGIN_PAGE_COMPONENT = "dashboard-admin\\/Admin\\/Login";

beforeAll(async () => {
  const db = await getSqliteDb("sqlite1");
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(
    `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE deleted_at IS NULL;`,
  );
  await UserService.createUser({
    name: "Admin Test",
    email: "auth-test@example.com",
    password: "super-secret-1",
  });
});

/** Tiny cookie jar: stores name=value pairs from Set-Cookie headers. */
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

describe("Admin auth web (login/logout/guards)", () => {
  const base = "http://localhost";

  test("GET /admin/login anonymous renders the login page and sets session cookies", async () => {
    const res = await app.fetch(new Request(`${base}/admin/login`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const text = await res.text();
    expect(text).toContain('data-page="app"');
    expect(text).toContain(`"component":"${LOGIN_PAGE_COMPONENT}"`);

    const cookies = res.headers.getSetCookie().map((c) => c.split("=")[0]);
    expect(cookies).toContain("session");
    expect(cookies).toContain("XSRF-TOKEN");
    storeCookies(res);
  });

  test("POST /admin/login without CSRF token is rejected with 403", async () => {
    const res = await app.fetch(
      new Request(`${base}/admin/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
        },
        body: JSON.stringify({
          email: "auth-test@example.com",
          password: "super-secret-1",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("POST /admin/login with wrong password answers 422 with the generic error bag", async () => {
    const xsrf = jar.get("XSRF-TOKEN")!;
    const res = await app.fetch(
      new Request(`${base}/admin/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": xsrf,
          "x-inertia": "true",
        },
        body: JSON.stringify({
          email: "auth-test@example.com",
          password: "totally-wrong",
        }),
      }),
    );
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.props.errors.form).toBe(MESSAGES.AUTH_INVALID_CREDENTIALS);
  });

  test("POST /admin/login with valid credentials rotates the session and redirects", async () => {
    const xsrf = jar.get("XSRF-TOKEN")!;
    const res = await app.fetch(
      new Request(`${base}/admin/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": xsrf,
        },
        body: JSON.stringify({
          email: "auth-test@example.com",
          password: "super-secret-1",
        }),
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/users");
    storeCookies(res);
  });

  test("guestGuard: logged-in visitor on /admin/login is redirected to /admin/users", async () => {
    const res = await app.fetch(
      new Request(`${base}/admin/login`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/users");
  });

  test("POST /admin/logout drops the claim; the session becomes anonymous again", async () => {
    const xsrf = jar.get("XSRF-TOKEN")!;
    const res = await app.fetch(
      new Request(`${base}/admin/logout`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": xsrf,
        },
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/login");
    storeCookies(res);

    // Claim gone → guestGuard lets the anonymous session back onto login.
    const after = await app.fetch(
      new Request(`${base}/admin/login`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    expect(after.status).toBe(200);
  });
});
