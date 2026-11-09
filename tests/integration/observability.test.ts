import { beforeAll, describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";
import { logger } from "../../src/utils/logger.util.ts";
import * as UserService from "../../src/services/admin/user.service.ts";

interface LogCall {
  message: string;
  data?: unknown;
}

const captureInfoLogs = () => {
  const calls: LogCall[] = [];
  const original = logger.info;

  logger.info = (message, data) => {
    calls.push({ message, data });
  };

  return {
    calls,
    restore: () => {
      logger.info = original;
    },
  };
};

beforeAll(async () => {
  const db = await getSqliteDb("sqlite1");
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(
    `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE deleted_at IS NULL;`,
  );
});

describe("request log format", () => {
  test("logs structured completion with method/path/status/duration", async () => {
    const { calls, restore } = captureInfoLogs();

    try {
      await app.fetch(
        new Request("http://localhost/api/health", {
          headers: { "x-forwarded-for": "10.7.7.7" },
        }),
      );
    } finally {
      restore();
    }

    const entry = calls.find(
      (call) => call.message === "[Http] Request completed",
    );
    expect(entry).toBeDefined();
    expect(entry!.data).toMatchObject({
      method: "GET",
      path: "/api/health",
      status: 200,
      ip: "10.7.7.7",
    });
    expect(
      typeof (entry!.data as { durationMs: number }).durationMs,
    ).toBe("number");
  });
});

describe("UserService log format", () => {
  test("logs structured business event on create", async () => {
    const { calls, restore } = captureInfoLogs();
    let createdId = 0;

    try {
      const user = await UserService.createUser({
        name: "Observed User",
        email: "observed@example.com",
        password: "secret-observer-1",
      });
      createdId = user.id;
    } finally {
      restore();
    }

    expect(createdId).toBeGreaterThan(0);

    const entry = calls.find(
      (call) => call.message === "[UserService] User created",
    );
    expect(entry).toBeDefined();
    expect(entry!.data).toMatchObject({
      email: "observed@example.com",
    });
    expect(typeof (entry!.data as { id: number }).id).toBe("number");
  });
});
