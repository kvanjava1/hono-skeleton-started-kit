import { describe, it, expect, beforeAll, beforeEach } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";

setupTestEnvironment();

import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import * as ActivityLogService from "../../src/services/common/activityLog.service.ts";

describe("Activity & Audit Log Service", () => {
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
  });

  beforeEach(async () => {
    const db = await getSqliteDb("sqlite1");
    db.run("DELETE FROM activity_logs;");
    db.run("DELETE FROM clients;");
  });

  it("records an activity event and lists in admin logs", async () => {
    const db = await getSqliteDb("sqlite1");
    db.run("INSERT INTO clients (id, name, slug) VALUES (1, 'Acme Corp', 'acme');");

    await ActivityLogService.recordActivity({
      clientId: 1,
      actorId: 42,
      actorType: "client_user",
      actorName: "Alice Dev",
      actorEmail: "alice@acme.inc",
      action: "apikey.create",
      scope: "organization",
      description: "Generated API Key 'Live Production'",
      ipAddress: "127.0.0.1",
      metadata: { keyPrefix: "hon_live_123" },
    });

    const adminLogs = await ActivityLogService.listAdminLogs({});
    expect(adminLogs.total).toBe(1);
    expect(adminLogs.rows[0]?.action).toBe("apikey.create");
    expect(adminLogs.rows[0]?.clientName).toBe("Acme Corp");
    expect(adminLogs.rows[0]?.actorName).toBe("Alice Dev");
  });

  it("isolates client logs strictly to the requesting client organization", async () => {
    const db = await getSqliteDb("sqlite1");
    db.run("INSERT INTO clients (id, name, slug) VALUES (1, 'Client One', 'c1'), (2, 'Client Two', 'c2');");

    // Client 1 log
    await ActivityLogService.recordActivity({
      clientId: 1,
      actorId: 10,
      actorType: "client_user",
      action: "member.invite",
      scope: "organization",
      description: "Invited Bob to Client One",
    });

    // Client 2 log
    await ActivityLogService.recordActivity({
      clientId: 2,
      actorId: 20,
      actorType: "client_user",
      action: "apikey.create",
      scope: "organization",
      description: "Client Two generated key",
    });

    const c1Logs = await ActivityLogService.listClientLogs(1, {});
    expect(c1Logs.total).toBe(1);
    expect(c1Logs.rows[0]?.description).toBe("Invited Bob to Client One");

    const c2Logs = await ActivityLogService.listClientLogs(2, {});
    expect(c2Logs.total).toBe(1);
    expect(c2Logs.rows[0]?.description).toBe("Client Two generated key");
  });

  it("retrieves personal user security activity strictly for the user", async () => {
    await ActivityLogService.recordActivity({
      actorId: 99,
      actorType: "client_user",
      action: "auth.login",
      scope: "personal",
      description: "User logged in to client portal",
      ipAddress: "203.0.113.1",
    });

    await ActivityLogService.recordActivity({
      actorId: 100,
      actorType: "client_user",
      action: "auth.login",
      scope: "personal",
      description: "Different user logged in",
    });

    const user99Logs = await ActivityLogService.listUserActivity(99, "client_user", {});
    expect(user99Logs.total).toBe(1);
    expect(user99Logs.rows[0]?.actorId).toBe(99);
    expect(user99Logs.rows[0]?.ipAddress).toBe("203.0.113.1");
  });
});
