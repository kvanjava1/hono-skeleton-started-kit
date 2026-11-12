import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

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
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      actor_id INTEGER,
      actor_type TEXT NOT NULL DEFAULT 'client_user',
      actor_name TEXT,
      actor_email TEXT,
      action TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'organization',
      description TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed sample admin & client
  const adminHash = await Bun.password.hash("Secret123!", { algorithm: "argon2id" });
  db.run("DELETE FROM users WHERE email = 'audit_admin@example.com';");
  db.run(`INSERT INTO users (name, email, password_hash, status, is_active) VALUES ('Audit Admin', 'audit_admin@example.com', '${adminHash}', 'ACTIVE', 1);`);

  const client = db.query(`INSERT INTO clients (name, slug, status) VALUES ('Acme Audit Corp', 'acme-audit-corp-${Date.now()}', 'ACTIVE') RETURNING id;`).get() as { id: number };
  const role = db.query(`INSERT INTO roles (name, type) VALUES ('Client Audit Owner', 'client') RETURNING id;`).get() as { id: number };

  const clientHash = await Bun.password.hash("ClientPass123!", { algorithm: "argon2id" });
  const clientUser = db.query(`INSERT INTO client_users (name, email, password_hash, status, is_active, last_active_client_id) VALUES ('Audit Leader', 'audit_leader@acme.inc', '${clientHash}', 'ACTIVE', 1, ${client.id}) RETURNING id;`).get() as { id: number };

  db.run(`INSERT INTO client_members (client_id, user_id, role_id, status) VALUES (${client.id}, ${clientUser.id}, ${role.id}, 'ACTIVE');`);
});

const storeCookies = (res: Response, jar: Map<string, string>) => {
  for (const raw of res.headers.getSetCookie()) {
    const pair = raw.split(";")[0]!;
    const eq = pair.indexOf("=");
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
};

const cookieHeader = (jar: Map<string, string>) =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

describe("Audit Logs System (/admin/logs, /client/logs, /client/account/activity)", () => {
  const base = "http://localhost";

  test("GET /admin/logs redirects unauthenticated visitors to login", async () => {
    const res = await app.fetch(new Request(`${base}/admin/logs`));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/login");
  });

  test("GET /admin/logs renders audit log page for logged-in admin", async () => {
    const adminJar = new Map<string, string>();
    const loginPageRes = await app.fetch(new Request(`${base}/admin/login`));
    storeCookies(loginPageRes, adminJar);

    const loginRes = await app.fetch(
      new Request(`${base}/admin/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          cookie: cookieHeader(adminJar),
          "x-xsrf-token": adminJar.get("XSRF-TOKEN") ?? "",
        },
        body: JSON.stringify({
          email: "audit_admin@example.com",
          password: "Secret123!",
        }),
      }),
    );
    storeCookies(loginRes, adminJar);
    expect(loginRes.status).toBe(302);

    const logsRes = await app.fetch(
      new Request(`${base}/admin/logs`, {
        method: "GET",
        headers: {
          cookie: cookieHeader(adminJar),
        },
      }),
    );
    expect(logsRes.status).toBe(200);
    const html = await logsRes.text();
    expect(html).toContain("dashboard-admin\\/Admin\\/Logs\\/Index");
  });

  test("GET /client/logs redirects unauthenticated visitors to /client/login", async () => {
    const res = await app.fetch(new Request(`${base}/client/logs`));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/client/login");
  });

  test("GET /client/logs renders organization audit trail for logged-in client user", async () => {
    const clientJar = new Map<string, string>();
    const loginPageRes = await app.fetch(new Request(`${base}/client/login`));
    storeCookies(loginPageRes, clientJar);

    const loginRes = await app.fetch(
      new Request(`${base}/client/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          cookie: cookieHeader(clientJar),
          "x-xsrf-token": clientJar.get("XSRF-TOKEN") ?? "",
        },
        body: JSON.stringify({
          email: "audit_leader@acme.inc",
          password: "ClientPass123!",
        }),
      }),
    );
    storeCookies(loginRes, clientJar);
    expect(loginRes.status).toBe(302);

    const logsRes = await app.fetch(
      new Request(`${base}/client/logs`, {
        method: "GET",
        headers: {
          cookie: cookieHeader(clientJar),
        },
      }),
    );
    expect(logsRes.status).toBe(200);
    const html = await logsRes.text();
    expect(html).toContain("dashboard-client\\/Client\\/Logs\\/Index");
  });

  test("GET /client/account/activity renders personal security activity", async () => {
    const clientJar = new Map<string, string>();
    const loginPageRes = await app.fetch(new Request(`${base}/client/login`));
    storeCookies(loginPageRes, clientJar);

    const loginRes = await app.fetch(
      new Request(`${base}/client/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          cookie: cookieHeader(clientJar),
          "x-xsrf-token": clientJar.get("XSRF-TOKEN") ?? "",
        },
        body: JSON.stringify({
          email: "audit_leader@acme.inc",
          password: "ClientPass123!",
        }),
      }),
    );
    storeCookies(loginRes, clientJar);

    const activityRes = await app.fetch(
      new Request(`${base}/client/account/activity`, {
        method: "GET",
        headers: {
          cookie: cookieHeader(clientJar),
        },
      }),
    );
    expect(activityRes.status).toBe(200);
    const html = await activityRes.text();
    expect(html).toContain("dashboard-client\\/Client\\/Account\\/Activity");
    expect(html).toContain("audit_leader@acme.inc");
  });
});
