import { describe, expect, it, beforeEach } from "bun:test";
import { getDrizzleDb } from "../../src/database/drizzle.ts";
import * as TeamService from "../../src/services/client/team.service.ts";
import { ValidationError, ConflictError } from "../../src/utils/errors.util.ts";

describe("TeamService (Client Portal Domain)", () => {
  beforeEach(async () => {
    const db = await getDrizzleDb("sqlite1");

    db.run(`
      CREATE TABLE IF NOT EXISTS account_statuses (
        code TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        description TEXT
      );
    `);
    db.run(`INSERT OR IGNORE INTO account_statuses (code, label) VALUES ('ACTIVE', 'Active'), ('INACTIVE', 'Inactive'), ('SUSPENDED', 'Suspended');`);

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
        last_active_client_id INTEGER,
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
        role_id INTEGER NOT NULL REFERENCES roles(id),
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(client_id, user_id)
      );
    `);

    db.run(`DELETE FROM client_members;`);
    db.run(`DELETE FROM client_users;`);
    db.run(`DELETE FROM clients;`);
    db.run(`DELETE FROM roles;`);

    db.run(`INSERT INTO roles (id, name, type) VALUES (1, 'Superadmin', 'admin'), (2, 'Client Owner', 'client'), (3, 'Client Member', 'client');`);
    db.run(`INSERT INTO clients (id, name, slug) VALUES (1, 'Test Corp', 'test-corp');`);
  });

  it("lists client roles correctly", async () => {
    const roles = await TeamService.listClientRoles();
    expect(roles.length).toBe(2);
    expect(roles.every((r) => r.type === "client")).toBe(true);
  });

  it("invites new member and attaches to workspace", async () => {
    const result = await TeamService.inviteMemberToWorkspace({
      clientId: 1,
      name: "Dave Developer",
      email: "dave@example.com",
      roleId: 2,
    });

    expect(result.user.name).toBe("Dave Developer");
    expect(result.user.email).toBe("dave@example.com");
    expect(result.membership.clientId).toBe(1);

    const members = await TeamService.listWorkspaceMembers(1);
    expect(members.length).toBe(1);
    expect(members[0]!.email).toBe("dave@example.com");
    expect(members[0]!.roleName).toBe("Client Owner");
  });

  it("rejects invalid role during member invite", async () => {
    await expect(
      TeamService.inviteMemberToWorkspace({
        clientId: 1,
        name: "Hacker",
        email: "hacker@example.com",
        roleId: 1, // Superadmin (admin type, not client)
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects duplicate membership in same client", async () => {
    await TeamService.inviteMemberToWorkspace({
      clientId: 1,
      name: "Dave",
      email: "dave@example.com",
      roleId: 3,
    });

    await expect(
      TeamService.inviteMemberToWorkspace({
        clientId: 1,
        name: "Dave Again",
        email: "dave@example.com",
        roleId: 2,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("prevents self-removal from workspace", async () => {
    await expect(
      TeamService.removeMemberFromWorkspace(1, 42, 42),
    ).rejects.toThrow("You cannot remove yourself from the organization.");
  });
});
