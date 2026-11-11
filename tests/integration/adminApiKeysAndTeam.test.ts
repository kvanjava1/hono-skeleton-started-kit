import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import { ROUTES } from "../../src/configs/routes.config.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";
import * as UserService from "../../src/services/admin/user.service.ts";
import * as RbacService from "../../src/services/admin/rbac.service.ts";
import * as ClientService from "../../src/services/admin/client.service.ts";
import * as ClientRepository from "../../src/repositories/admin/client.repository.ts";
import * as ApiKeyService from "../../src/services/client/apiKey.service.ts";
import { ACCOUNT_STATUSES } from "../../src/database/schema/common/status.schema.ts";

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

const loginAsSuperAdmin = async () => {
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
        email: "superkey@example.com",
        password: "superkey-secret-123",
      }),
    }),
  );
  expect(res.status).toBe(302);
  storeCookies(res);
};

let testClientId: number;

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
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  db.run(`
    CREATE TABLE IF NOT EXISTS api_key_permissions (
      api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (api_key_id, permission_id)
    );
  `);

  // Seed roles & permissions
  db.run(`
    INSERT OR IGNORE INTO roles (id, name, type, description) VALUES
      (1, 'Superadmin', 'admin', 'Full platform access'),
      (2, 'Client Owner', 'client', 'Client account owner'),
      (3, 'Client Developer', 'client', 'Client developer access');
  `);

  db.run(`
    INSERT OR IGNORE INTO permissions (id, code, "group") VALUES
      (1, '*', 'all'),
      (2, 'api_keys.view', 'api_keys'),
      (3, 'api_keys.create', 'api_keys'),
      (4, 'api_keys.revoke', 'api_keys'),
      (5, 'team.view', 'team'),
      (6, 'team.invite', 'team'),
      (7, 'team.remove', 'team');
  `);

  db.run(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
      (1, 1),
      (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7);
  `);

  // Seed user
  const adminUser = await UserService.createUser({
    name: "Super Key Admin",
    email: "superkey@example.com",
    password: "superkey-secret-123",
  });
  await RbacService.assignRole(adminUser.id, 1);

  // Seed client
  const client = await ClientService.createClient({
    name: "Acme Key Corp",
    slug: "acme-key-corp",
  });
  testClientId = client.id;

  // Seed initial member
  const picUser = await UserService.createUser({
    name: "Acme Pic",
    email: "pic@acme-key.com",
    password: "pic-password-123",
  });
  db.run("INSERT INTO client_members (client_id, user_id, role_id) VALUES (?, ?, 2)", [
    client.id,
    picUser.id,
  ]);
});

describe("Admin API Keys & Team Controllers Integration", () => {
  test("GET /admin/clients/:id/api-keys renders successfully for authorized user", async () => {
    await loginAsSuperAdmin();

    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/api-keys`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("dashboard-admin\\/Admin\\/Clients\\/ApiKeys");
    expect(html).toContain("Acme Key Corp");
  });

  test("POST /admin/clients/:id/api-keys creates a new API key and flashes token", async () => {
    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/api-keys`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({ name: "Production Gateway" }),
      }),
    );

    expect(res.status).toBe(302);
    storeCookies(res);

    // Verify key in database
    const keys = await ApiKeyService.listClientApiKeys(testClientId);
    expect(keys.length).toBeGreaterThanOrEqual(1);
    expect(keys.some((k) => k.name === "Production Gateway")).toBe(true);
  });

  test("POST /admin/clients/:id/api-keys/:keyId/revoke revokes the key", async () => {
    const keys = await ApiKeyService.listClientApiKeys(testClientId);
    const keyToRevoke = keys.find((k) => k.name === "Production Gateway")!;

    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/api-keys/${keyToRevoke.id}/revoke`, {
        method: "POST",
        headers: {
          origin: "http://localhost",
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );

    expect(res.status).toBe(302);
    storeCookies(res);

    const updatedKeys = await ApiKeyService.listClientApiKeys(testClientId);
    const revoked = updatedKeys.find((k) => k.id === keyToRevoke.id)!;
    expect(revoked.status).toBe(ACCOUNT_STATUSES.INACTIVE);
  });

  test("GET /admin/clients/:id/members renders successfully for authorized user", async () => {
    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("dashboard-admin\\/Admin\\/Clients\\/Members");
    expect(html).toContain("pic@acme-key.com");
  });

  test("GET /admin/clients/:id/members/create renders member create page", async () => {
    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members/create`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("dashboard-admin\\/Admin\\/Clients\\/MemberCreate");
  });

  test("POST /admin/clients/:id/members invites and links a new member with password", async () => {
    const allRoles = await RbacService.listAllRoles();
    const clientDevRole = allRoles.find((r) => r.name === "Client Developer")!;

    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({
          name: "Alice Developer",
          email: "alice@acme-key.com",
          password: "password123",
          passwordConfirmation: "password123",
          roleId: clientDevRole.id,
        }),
      }),
    );

    expect(res.status).toBe(302);
    storeCookies(res);

    // Verify member exists
    const clientMembers = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    const html = await clientMembers.text();
    expect(html).toContain("alice@acme-key.com");
  });

  test("GET /admin/clients/:id/members/:memberId/edit renders edit page", async () => {
    const db = await getSqliteDb("sqlite1");
    const memberRow = db.query("SELECT id FROM client_members WHERE client_id = ? ORDER BY id DESC LIMIT 1").get(testClientId) as { id: number };

    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members/${memberRow.id}/edit`, {
        headers: { cookie: cookieHeader() },
      }),
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("dashboard-admin\\/Admin\\/Clients\\/MemberEdit");
    expect(html).toContain("alice@acme-key.com");
  });

  test("POST /admin/clients/:id/members/:memberId updates member details and role", async () => {
    const db = await getSqliteDb("sqlite1");
    const memberRow = db.query("SELECT id FROM client_members WHERE client_id = ? ORDER BY id DESC LIMIT 1").get(testClientId) as { id: number };

    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members/${memberRow.id}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
        body: JSON.stringify({
          name: "Alice Senior Developer",
          email: "alice-senior@acme-key.com",
          roleId: 2, // Client Owner
          status: "ACTIVE",
        }),
      }),
    );

    expect(res.status).toBe(302);
    storeCookies(res);

    // Verify member updated
    const updatedMember = await ClientRepository.findClientMemberById(memberRow.id);
    expect(updatedMember?.name).toBe("Alice Senior Developer");
    expect(updatedMember?.roleName).toBe("Client Owner");
  });

  test("POST /admin/clients/:id/members/:memberId/toggle-status toggles ACTIVE to SUSPENDED and back", async () => {
    const db = await getSqliteDb("sqlite1");
    const memberRow = db.query("SELECT id FROM client_members WHERE client_id = ? ORDER BY id DESC LIMIT 1").get(testClientId) as { id: number } | null;
    expect(memberRow).not.toBeNull();

    // Toggle to SUSPENDED
    const res1 = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members/${memberRow!.id}/toggle-status`, {
        method: "POST",
        headers: {
          origin: "http://localhost",
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );
    expect(res1.status).toBe(302);
    const suspended = await ClientRepository.findClientMemberById(memberRow!.id);
    expect(suspended?.status).toBe("SUSPENDED");

    // Toggle back to ACTIVE
    const res2 = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members/${memberRow!.id}/toggle-status`, {
        method: "POST",
        headers: {
          origin: "http://localhost",
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );
    expect(res2.status).toBe(302);
    const activeAgain = await ClientRepository.findClientMemberById(memberRow!.id);
    expect(activeAgain?.status).toBe("ACTIVE");
  });

  test("DELETE /admin/clients/:id/members/:memberId removes a member", async () => {
    const db = await getSqliteDb("sqlite1");
    const memberRow = db.query("SELECT id FROM client_members WHERE client_id = ? ORDER BY id DESC LIMIT 1").get(testClientId) as { id: number } | null;
    expect(memberRow).not.toBeNull();

    const res = await app.fetch(
      new Request(`http://localhost/admin/clients/${testClientId}/members/${memberRow!.id}`, {
        method: "DELETE",
        headers: {
          origin: "http://localhost",
          cookie: cookieHeader(),
          "x-xsrf-token": jar.get("XSRF-TOKEN")!,
        },
      }),
    );

    expect(res.status).toBe(302);
    storeCookies(res);

    const check = db.query("SELECT id FROM client_members WHERE id = ?").get(memberRow!.id);
    expect(check).toBeNull();
  });
});
