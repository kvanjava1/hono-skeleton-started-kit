import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

const CLIENT_LOGIN_PAGE = "dashboard-client\\/Client\\/Auth\\/Login";

beforeAll(async () => {
  const db = await getSqliteDb("sqlite1");
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      suspended_until TEXT DEFAULT NULL,
      status_reason TEXT DEFAULT NULL,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'admin',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS client_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      is_active INTEGER NOT NULL DEFAULT 1,
      banned_until TEXT DEFAULT NULL,
      status_reason TEXT DEFAULT NULL,
      last_active_client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS client_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      "group" TEXT DEFAULT 'general',
      name TEXT,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      secret_hash TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_used_at TEXT DEFAULT NULL,
      expires_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Insert seed client & role & client_user
  const client = db.query(`INSERT INTO clients (name, slug, status) VALUES ('Client Auth Corp', 'client-auth-corp-test', 'ACTIVE') RETURNING id;`).get() as { id: number };
  const role = db.query(`INSERT INTO roles (name, type, description) VALUES ('Client Owner Auth', 'client', 'Owner') RETURNING id;`).get() as { id: number };
  
  const hash = await Bun.password.hash("Password123!", { algorithm: "argon2id" });
  const user = db.query(`INSERT INTO client_users (name, email, password_hash, status, is_active, last_active_client_id) VALUES ('Dev User', 'dev@acme.inc', '${hash}', 'ACTIVE', 1, ${client.id}) RETURNING id;`).get() as { id: number };

  db.run(`INSERT INTO client_members (client_id, user_id, role_id, status) VALUES (${client.id}, ${user.id}, ${role.id}, 'ACTIVE');`);
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

describe("Client Auth Web (/client/login, logout, guards, legacy redirects)", () => {
  const base = "http://localhost";

  test("GET /portal/login legacy route redirects 301 to /client/login", async () => {
    const res = await app.fetch(new Request(`${base}/portal/login`), {
      redirect: "manual",
    });
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/client/login");
  });

  test("GET /client/login renders the client login shell", async () => {
    const res = await app.fetch(new Request(`${base}/client/login`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const text = await res.text();
    expect(text).toContain('data-page="app"');
    expect(text).toContain(`"component":"${CLIENT_LOGIN_PAGE}"`);

    storeCookies(res);
  });

  test("GET /client unauthenticated redirects to /client/login", async () => {
    const res = await app.fetch(new Request(`${base}/client`), {
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/client/login");
  });

  test("POST /client/login with invalid password fails with 422", async () => {
    const xsrf = jar.get("XSRF-TOKEN")!;
    const res = await app.fetch(
      new Request(`${base}/client/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": xsrf,
          "x-inertia": "true",
        },
        body: JSON.stringify({
          email: "dev@acme.inc",
          password: "wrong-password",
        }),
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.props.errors.form).toBe("Invalid email or password");
  });

  test("POST /client/login with correct password succeeds and redirects to /client", async () => {
    const xsrf = jar.get("XSRF-TOKEN")!;
    const res = await app.fetch(
      new Request(`${base}/client/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": xsrf,
        },
        body: JSON.stringify({
          email: "dev@acme.inc",
          password: "Password123!",
        }),
      }),
      { redirect: "manual" },
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/client");
    storeCookies(res);
  });

  test("GET /client authenticated accesses dashboard successfully", async () => {
    const res = await app.fetch(
      new Request(`${base}/client`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("dashboard-client\\/Client\\/Dashboard\\/Index");
  });

  test("GET /client/login while authenticated redirects to /client (clientGuestGuard)", async () => {
    const res = await app.fetch(
      new Request(`${base}/client/login`, {
        headers: { cookie: cookieHeader() },
      }),
      { redirect: "manual" },
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/client");
  });

  test("POST /client/logout drops auth and redirects to /client/login", async () => {
    const xsrf = jar.get("XSRF-TOKEN")!;
    const res = await app.fetch(
      new Request(`${base}/client/logout`, {
        method: "POST",
        headers: {
          origin: base,
          cookie: cookieHeader(),
          "x-xsrf-token": xsrf,
        },
      }),
      { redirect: "manual" },
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/client/login");
    storeCookies(res);
  });
});
