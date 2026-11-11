import { describe, expect, it, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";
import * as ApiKeyService from "../../src/services/client/apiKey.service.ts";
import { generateApiKey, hashApiKey } from "../../src/utils/apiKey.util.ts";
import { apiClientGuard } from "../../src/middlewares/api/apiClientGuard.middleware.ts";
import { ForbiddenError, UnauthorizedError } from "../../src/utils/errors.util.ts";

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
    INSERT OR IGNORE INTO account_statuses (code, label) VALUES
      ('ACTIVE', 'Active'),
      ('INACTIVE', 'Inactive'),
      ('SUSPENDED', 'Suspended');
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
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      "group" TEXT NOT NULL,
      description TEXT,
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

  db.run(`INSERT OR IGNORE INTO permissions (code, "group") VALUES ('reports.read', 'reports');`);
  db.run(`INSERT OR IGNORE INTO users (name, email, password_hash) VALUES ('Dev User', 'dev@keytest.com', 'hash');`);
  db.run(`INSERT OR IGNORE INTO clients (name, slug, status) VALUES ('Test Corp', 'test-corp', 'ACTIVE');`);
  db.run(`INSERT OR IGNORE INTO clients (name, slug, status) VALUES ('Suspended Corp', 'suspended-corp', 'SUSPENDED');`);
});

let testClientId: number;
let suspendedClientId: number;
let testUserId: number;

describe("API Key Engine & Client Guard", () => {
  beforeAll(async () => {
    const db = await getSqliteDb("sqlite1");
    const testClient = db.query("SELECT id FROM clients WHERE slug = 'test-corp'").get() as { id: number };
    const suspendedClient = db.query("SELECT id FROM clients WHERE slug = 'suspended-corp'").get() as { id: number };
    const testUser = db.query("SELECT id FROM users WHERE email = 'dev@keytest.com'").get() as { id: number };

    testClientId = testClient.id;
    suspendedClientId = suspendedClient.id;
    testUserId = testUser.id;
  });

  it("generateApiKey generates a valid prefixed token and matching hash", () => {
    const { rawToken, keyPrefix, secretHash } = generateApiKey();
    expect(rawToken.startsWith("hon_live_")).toBe(true);
    expect(keyPrefix.length).toBe(17);
    expect(hashApiKey(rawToken)).toBe(secretHash);
  });

  it("createApiKey stores hash and verifyApiKey validates token", async () => {
    const created = await ApiKeyService.createApiKey(
      testClientId,
      testUserId,
      "POS Server Token",
      ["reports.read"],
    );

    expect(created.name).toBe("POS Server Token");
    expect(created.rawToken.startsWith("hon_live_")).toBe(true);

    const verified = await ApiKeyService.verifyApiKey(created.rawToken);
    expect(verified.client.id).toBe(testClientId);
    expect(verified.client.name).toBe("Test Corp");
    expect(verified.permissions).toContain("reports.read");
  });

  it("verifyApiKey rejects tampered or invalid tokens", async () => {
    expect(
      ApiKeyService.verifyApiKey("hon_live_invalidtoken1234567890"),
    ).rejects.toThrow(UnauthorizedError);

    expect(
      ApiKeyService.verifyApiKey("random_garbage_without_prefix"),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("verifyApiKey rejects when client organization is SUSPENDED", async () => {
    const key = await ApiKeyService.createApiKey(suspendedClientId, testUserId, "Suspended Key");
    expect(ApiKeyService.verifyApiKey(key.rawToken)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("revokeApiKey marks key as INACTIVE and blocks future access", async () => {
    const key = await ApiKeyService.createApiKey(testClientId, testUserId, "To Revoke");
    const okBefore = await ApiKeyService.verifyApiKey(key.rawToken);
    expect(okBefore.key.status).toBe("ACTIVE");

    await ApiKeyService.revokeApiKey(key.id, testClientId);

    expect(ApiKeyService.verifyApiKey(key.rawToken)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("apiClientGuard middleware accepts valid token and populates context", async () => {
    const key = await ApiKeyService.createApiKey(testClientId, testUserId, "Guard Key");
    let called = false;
    const contextStore: Record<string, unknown> = {};

    const mockContext = {
      req: {
        header: (name: string) => {
          if (name.toLowerCase() === "authorization") {
            return `Bearer ${key.rawToken}`;
          }
          return null;
        },
      },
      set: (k: string, v: unknown) => {
        contextStore[k] = v;
      },
    } as any;

    await apiClientGuard(mockContext, async () => {
      called = true;
    });

    expect(called).toBe(true);
    expect(contextStore.apiClient).toBeDefined();
    expect((contextStore.apiClient as any).id).toBe(testClientId);
    expect(contextStore.currentPermissions).toBeDefined();
  });

  it("apiClientGuard throws UnauthorizedError on missing Authorization header", async () => {
    const mockContext = {
      req: {
        header: () => null,
      },
    } as any;

    expect(apiClientGuard(mockContext, async () => {})).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
