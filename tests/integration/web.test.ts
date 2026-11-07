import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { configRateLimiter } from "../../src/configs/index.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

beforeAll(async () => {
  // Same in-memory schema setup as tests/integration/crud.test.ts —
  // GET / now serves the Inertia CRUD index which reads the cruds table.
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

describe("Web Root (Inertia CRUD demo)", () => {
  test("GET / returns the Inertia HTML shell for the CRUD index page", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const text = await res.text();
    expect(text).toContain('data-page="app"');
    // serializePage escapes '/' as '\/' inside the embedded page object.
    expect(text).toContain('"component":"example1\\/Cruds\\/Index"');
    expect(text).toContain('rel="stylesheet"');
  });

});

describe("Security & Common Middlewares", () => {
  test("response includes security headers", async () => {
    const res = await app.fetch(new Request("http://localhost/api/health"));
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("response includes rate limit headers", async () => {
    const res = await app.fetch(new Request("http://localhost/api/health"));
    expect(res.headers.get("x-ratelimit-limit")).toBe(String(configRateLimiter.max));
    expect(res.headers.get("x-ratelimit-remaining")).toBeDefined();
  });
});
