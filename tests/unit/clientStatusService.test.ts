import { describe, expect, it, beforeEach } from "bun:test";
import { getDrizzleDb } from "../../src/database/drizzle.ts";
import * as ClientService from "../../src/services/admin/client.service.ts";
import * as UserService from "../../src/services/admin/user.service.ts";

describe("Client Status & History Service", () => {
  beforeEach(async () => {
    const db = await getDrizzleDb("sqlite1");

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
      CREATE TABLE IF NOT EXISTS client_status_histories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        reason TEXT,
        suspended_until TEXT DEFAULT NULL,
        changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  });

  it("changeClientStatus updates status, stores reason and suspendedUntil, and records audit history", async () => {
    const admin = await UserService.createUser({
      name: "Status Admin",
      email: "status-admin@example.com",
      password: "password123",
    });

    const client = await ClientService.createClient({
      name: "Stripe Integrator",
      slug: "stripe-integrator-test",
    });

    const suspendDate = new Date(Date.now() + 7 * 86400000).toISOString();
    const updated = await ClientService.changeClientStatus(client.id, {
      status: "SUSPENDED",
      reason: "Suspicious API rate spike",
      suspendedUntil: suspendDate,
      actingUserId: admin.id,
    });

    expect(updated.status).toBe("SUSPENDED");
    expect(updated.statusReason).toBe("Suspicious API rate spike");
    expect(updated.suspendedUntil).toBe(suspendDate);

    const history = await ClientService.getClientStatusHistory(client.id);
    expect(history.length).toBe(1);
    const latest = history[0]!;
    expect(latest.fromStatus).toBe("ACTIVE");
    expect(latest.toStatus).toBe("SUSPENDED");
    expect(latest.reason).toBe("Suspicious API rate spike");
    expect(latest.suspendedUntil).toBe(suspendDate);
    expect(latest.changedBy).toBe(admin.id);
    expect(latest.changedByName).toBe(admin.name);
    expect(latest.changedByEmail).toBe(admin.email);
  });

  it("changeClientStatus can reactivate client and clear suspension fields", async () => {
    const client = await ClientService.createClient({
      name: "Reactivate Me",
      slug: "reactivate-me-test",
    });

    await ClientService.changeClientStatus(client.id, {
      status: "SUSPENDED",
      reason: "Temporary audit",
    });

    const restored = await ClientService.changeClientStatus(client.id, {
      status: "ACTIVE",
    });

    expect(restored.status).toBe("ACTIVE");
    expect(restored.statusReason).toBeNull();
    expect(restored.suspendedUntil).toBeNull();

    const history = await ClientService.getClientStatusHistory(client.id);
    expect(history.length).toBe(2);
    expect(history[0]!.fromStatus).toBe("SUSPENDED");
    expect(history[0]!.toStatus).toBe("ACTIVE");
  });
});
