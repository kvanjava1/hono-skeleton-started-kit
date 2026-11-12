import { describe, expect, it, beforeEach } from "bun:test";
import { getDrizzleDb } from "../../src/database/drizzle.ts";
import { clientUsers } from "../../src/database/schema/client/clientUser.schema.ts";
import { clients, clientMembers } from "../../src/database/schema/client/client.schema.ts";
import { roles, permissions, rolePermissions } from "../../src/database/schema/admin/rbac.schema.ts";
import { accountStatuses } from "../../src/database/schema/common/status.schema.ts";
import * as ClientAuthService from "../../src/services/client/clientAuth.service.ts";
import { UnauthorizedError } from "../../src/utils/errors.util.ts";

describe("ClientAuthService & Workspace Resolution", () => {
  beforeEach(async () => {
    const db = await getDrizzleDb("sqlite1");

    // Ensure SQLite in-memory tables exist
    db.run(`
      CREATE TABLE IF NOT EXISTS account_statuses (
        code TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        description TEXT
      );
    `);
    db.run(`INSERT OR IGNORE INTO account_statuses (code, label) VALUES ('ACTIVE', 'Active'), ('BANNED', 'Banned'), ('INACTIVE', 'Inactive');`);

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

    // Clean tables
    db.run(`DELETE FROM client_members;`);
    db.run(`DELETE FROM client_users;`);
    db.run(`DELETE FROM clients;`);
    db.run(`DELETE FROM roles;`);
  });

  it("verifyClientCredentials verifies password and auto-selects primary workspace", async () => {
    const db = await getDrizzleDb("sqlite1");
    const passwordHash = await Bun.password.hash("Secret123!", { algorithm: "argon2id" });

    // 1. Insert Client User
    const [user] = await db
      .insert(clientUsers)
      .values({
        name: "Budi Santoso",
        email: "budi@example.com",
        passwordHash,
        status: "ACTIVE",
        isActive: true,
      })
      .returning();

    // 2. Insert 2 Clients
    const [c1] = await db
      .insert(clients)
      .values({ name: "PT Alpha", slug: "pt-alpha", status: "ACTIVE" })
      .returning();
    const [c2] = await db
      .insert(clients)
      .values({ name: "PT Beta", slug: "pt-beta", status: "ACTIVE" })
      .returning();

    // 3. Insert Roles
    const [roleOwner] = await db
      .insert(roles)
      .values({ name: "Client Owner", type: "client" })
      .returning();
    const [roleDev] = await db
      .insert(roles)
      .values({ name: "Client Developer", type: "client" })
      .returning();

    // 4. Attach memberships
    await db.insert(clientMembers).values([
      { clientId: c1!.id, userId: user!.id, roleId: roleOwner!.id, status: "ACTIVE" },
      { clientId: c2!.id, userId: user!.id, roleId: roleDev!.id, status: "ACTIVE" },
    ]);

    // 5. Test login
    const result = await ClientAuthService.verifyClientCredentials("budi@example.com", "Secret123!");
    expect(result.user.id).toBe(user!.id);
    expect(result.workspaces.length).toBe(2);
    expect(result.activeClientId).toBe(c1!.id);
  });

  it("switchWorkspace changes the active organization", async () => {
    const db = await getDrizzleDb("sqlite1");
    const passwordHash = await Bun.password.hash("Secret123!", { algorithm: "argon2id" });

    const [user] = await db
      .insert(clientUsers)
      .values({
        name: "Siti Developer",
        email: "siti@example.com",
        passwordHash,
        status: "ACTIVE",
        isActive: true,
      })
      .returning();

    const [c1] = await db
      .insert(clients)
      .values({ name: "Company One", slug: "company-one", status: "ACTIVE" })
      .returning();
    const [c2] = await db
      .insert(clients)
      .values({ name: "Company Two", slug: "company-two", status: "ACTIVE" })
      .returning();

    const [role] = await db
      .insert(roles)
      .values({ name: "Client Developer", type: "client" })
      .returning();

    await db.insert(clientMembers).values([
      { clientId: c1!.id, userId: user!.id, roleId: role!.id, status: "ACTIVE" },
      { clientId: c2!.id, userId: user!.id, roleId: role!.id, status: "ACTIVE" },
    ]);

    // Switch to Company Two
    const switched = await ClientAuthService.switchWorkspace(user!.id, c2!.id);
    expect(switched.clientId).toBe(c2!.id);
    expect(switched.clientName).toBe("Company Two");

    // Switching to unauthorized client throws
    expect(ClientAuthService.switchWorkspace(user!.id, 9999)).rejects.toThrow(UnauthorizedError);
  });

  it("verifyClientCredentials rejects permanently banned client users", async () => {
    const db = await getDrizzleDb("sqlite1");
    const passwordHash = await Bun.password.hash("Secret123!", { algorithm: "argon2id" });

    await db.insert(clientUsers).values({
      name: "Banned User",
      email: "banned@example.com",
      passwordHash,
      status: "BANNED",
      statusReason: "Spamming API keys",
      isActive: false,
    });

    expect(
      ClientAuthService.verifyClientCredentials("banned@example.com", "Secret123!"),
    ).rejects.toThrow(/permanently suspended.*Spamming API keys/);
  });
});
