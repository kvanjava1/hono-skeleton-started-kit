import { describe, expect, it, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import * as RbacService from "../../src/services/admin/rbac.service.ts";
import { can } from "../../src/middlewares/common/can.middleware.ts";
import { ForbiddenError } from "../../src/utils/errors.util.ts";

setupTestEnvironment();

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
    INSERT OR IGNORE INTO account_statuses (code, label) VALUES ('ACTIVE', 'Active');
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

  // Insert standard permissions
  db.run(`
    INSERT OR IGNORE INTO permissions (code, "group") VALUES
      ('clients.view', 'clients'),
      ('clients.create', 'clients'),
      ('apikeys.view', 'apikeys');
  `);

  // Insert roles
  db.run(`
    INSERT OR IGNORE INTO roles (id, name, type) VALUES
      (1, 'Superadmin', 'admin'),
      (2, 'Client Viewer', 'client');
  `);

  // Assign 'clients.view' to 'Client Viewer'
  db.run(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
    SELECT 2, id FROM permissions WHERE code = 'clients.view';
  `);
});

describe("RBAC Service & Authorization Middleware", () => {
  it("returns wildcard '*' and all permissions for Superadmin role", async () => {
    const db = await getSqliteDb("sqlite1");
    db.run("INSERT INTO users (id, name, email, password_hash) VALUES (101, 'Super', 'super@test.com', 'hash')");
    db.run("INSERT INTO user_roles (user_id, role_id) VALUES (101, 1)");

    const perms = await RbacService.getUserPermissions(101);
    expect(perms).toContain("*");
    expect(perms).toContain("clients.view");
    expect(perms).toContain("clients.create");

    const canDoAnything = await RbacService.hasPermission(101, "anything.arbitrary");
    expect(canDoAnything).toBe(true);
  });

  it("returns only assigned permissions for restricted roles", async () => {
    const db = await getSqliteDb("sqlite1");
    db.run("INSERT INTO users (id, name, email, password_hash) VALUES (102, 'Viewer', 'viewer@test.com', 'hash')");
    db.run("INSERT INTO user_roles (user_id, role_id) VALUES (102, 2)");

    const perms = await RbacService.getUserPermissions(102);
    expect(perms).not.toContain("*");
    expect(perms).toContain("clients.view");
    expect(perms).not.toContain("clients.create");

    expect(await RbacService.hasPermission(102, "clients.view")).toBe(true);
    expect(await RbacService.hasPermission(102, "clients.create")).toBe(false);
  });

  it("can() middleware allows request when permission is present on context", async () => {
    const middleware = can("clients.view");
    let called = false;
    const mockContext = {
      get: (key: string) => {
        if (key === "currentPermissions") return ["clients.view"];
        return null;
      },
    } as any;

    await middleware(mockContext, async () => {
      called = true;
    });

    expect(called).toBe(true);
  });

  it("can() middleware throws ForbiddenError when permission is missing", async () => {
    const middleware = can("clients.create");
    const mockContext = {
      get: (key: string) => {
        if (key === "currentPermissions") return ["clients.view"];
        return null;
      },
    } as any;

    expect(
      middleware(mockContext, async () => {}),
    ).rejects.toThrow(ForbiddenError);
  });
});
