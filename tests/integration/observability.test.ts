import { beforeAll, describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";
import { logger } from "../../src/utils/logger.util.ts";

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
    CREATE TABLE IF NOT EXISTS cruds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT DEFAULT NULL
    );
  `);
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

describe("CrudService log format", () => {
  test("logs structured business event on create", async () => {
    const { calls, restore } = captureInfoLogs();
    let status = 0;

    try {
      const res = await app.fetch(
        new Request("http://localhost/api/example/cruds", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "Observed", content: "x" }),
        }),
      );
      status = res.status;
    } finally {
      restore();
    }

    expect(status).toBe(201);

    const entry = calls.find(
      (call) => call.message === "[CrudService] Crud created",
    );
    expect(entry).toBeDefined();
    expect(entry!.data).toMatchObject({ title: "Observed" });
    expect(typeof (entry!.data as { id: number }).id).toBe("number");
  });
});
