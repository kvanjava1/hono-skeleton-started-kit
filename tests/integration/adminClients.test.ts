import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import { ROUTES } from "../../src/configs/routes.config.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";
import * as UserService from "../../src/services/admin/user.service.ts";
import * as RbacService from "../../src/services/admin/rbac.service.ts";
import * as ClientService from "../../src/services/admin/client.service.ts";

const jar = new Map<string, string>();
const storeCookies = (res: Response) => {
  for (const raw of res.headers.getSetCookie()) {
    const pair = raw.split(";")[0]!;
    const eq = pair.indexOf("=");
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
};
const cookieHeader = () =>
  Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

const loginAsAdmin = async () => {
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
      body: JSON.stringify({
        email: "clientadmin@example.com",
        password: "clientadmin-secret-123",
      }),
    }),
  );
  expect(res.status).toBe(302);
  storeCookies(res);
};

beforeAll(async () => {
  const db = await getSqliteDb("sqlite1");

  db.run(`
    CREATE TABLE IF NOT EXISTS account_statuses (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      badge_color TEXT NOT NULL DEFAULT 'emerald',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    INSERT OR IGNORE INTO account_statuses (code, label) VALUES
      ('ACTIVE', 'Active'),
      ('INACTIVE', 'Inactive'),
      ('SUSPENDED', 'Suspended'),
      ('PENDING', 'Pending');
  `);

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
  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE deleted_at IS NULL;
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
      "group" TEXT NOT NULL,
      description TEXT,
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
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS client_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

  // Insert standard permissions & roles
  db.run(`
    INSERT OR IGNORE INTO permissions (id, code, "group") VALUES
      (1, 'clients.view', 'clients'),
      (2, 'clients.create', 'clients'),
      (3, 'clients.update', 'clients'),
      (4, 'clients.delete', 'clients');
  `);
  db.run(`
    INSERT OR IGNORE INTO roles (id, name, type) VALUES
      (1, 'Superadmin', 'admin'),
      (2, 'Client Owner', 'client');
  `);
  db.run(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
      (1, 1), (1, 2), (1, 3), (1, 4);
  `);

  // Create superadmin user and assign role
  const adminUser = await UserService.createUser({
    name: "Admin Clients Tester",
    email: "clientadmin@example.com",
    password: "clientadmin-secret-123",
  });
  await RbacService.assignRole(adminUser.id, 1);
});

describe("Admin Client Management", () => {
  const base = "http://localhost";

  test("authGuard protects /admin/clients for anonymous visitors", async () => {
    const res = await app.fetch(new Request(`${base}/admin/clients`));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(ROUTES.WEB.ADMIN.LOGIN);
  });

  test("logged-in admin can list clients", async () => {
    await loginAsAdmin();
    const res = await app.fetch(
      new Request(`${base}/admin/clients`, {
        method: "GET",
        headers: {
          cookie: cookieHeader(),
        },
      }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("dashboard-admin\\/Admin\\/Clients\\/Index");
  });

  test("admin can create a client", async () => {
    const createRes = await app.fetch(
      new Request(`${base}/admin/clients`, {
        method: "POST",
        headers: {
          cookie: cookieHeader(),
          origin: base,
          "content-type": "application/json",
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
          "X-Inertia": "true",
        },
        body: JSON.stringify({
          name: "Acme Corp",
          slug: "acme-corp",
          status: "ACTIVE",
        }),
      }),
    );
    expect(createRes.status).toBe(302);
    expect(createRes.headers.get("location")).toBe(ROUTES.WEB.ADMIN.CLIENTS);

    const clientList = await ClientService.listClients({ q: "Acme" });
    expect(clientList.rows.length).toBeGreaterThan(0);
    const client = clientList.rows[0]!;
    expect(client.name).toBe("Acme Corp");
    expect(client.slug).toBe("acme-corp");
    expect(client.status).toBe("ACTIVE");
  });

  test("admin can toggle client status between ACTIVE and SUSPENDED", async () => {
    const clientList = await ClientService.listClients({ q: "Acme" });
    const client = clientList.rows[0]!;
    expect(client.status).toBe("ACTIVE");

    const toggleRes = await app.fetch(
      new Request(`${base}/admin/clients/${client.id}/toggle-status`, {
        method: "POST",
        headers: {
          cookie: cookieHeader(),
          origin: base,
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );
    expect(toggleRes.status).toBe(302);

    const updated = await ClientService.findClient(client.id);
    expect(updated.status).toBe("SUSPENDED");
  });

  test("admin can view client details", async () => {
    const clientList = await ClientService.listClients({ q: "Acme" });
    const client = clientList.rows[0]!;

    const res = await app.fetch(
      new Request(`${base}/admin/clients/${client.id}`, {
        method: "GET",
        headers: {
          cookie: cookieHeader(),
        },
      }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("dashboard-admin\\/Admin\\/Clients\\/Show");
    expect(text).toContain("Acme Corp");
  });
});
