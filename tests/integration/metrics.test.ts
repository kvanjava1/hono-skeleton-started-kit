import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment({ METRICS_ENABLED: "true", LOG_LEVEL: "error" });

import { app } from "../../src/app.ts";
import { resetConfigApp } from "../../src/configs/index.ts";
import { resetMetrics } from "../../src/utils/metrics.util.ts";

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

beforeEach(() => {
  resetMetrics();
  process.env.METRICS_ENABLED = "true";
  process.env.METRICS_TOKEN = "";
  resetConfigApp();
});

describe("GET /metrics", () => {
  test("returns 200 with Prometheus text when enabled", async () => {
    const res = await app.fetch(new Request("http://localhost/metrics"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");

    const text = await res.text();
    expect(text).toContain("# HELP http_requests_total");
  });

  test("records request metrics with normalized route labels", async () => {
    await app.fetch(new Request("http://localhost/api/example/cruds/123"));

    const text = await (
      await app.fetch(new Request("http://localhost/metrics"))
    ).text();

    expect(text).toMatch(
      /http_requests_total\{[^}]*path="\/api\/example\/cruds\/\{id\}"[^}]*\}/,
    );
  });

  test("classifies requests as api or web via the kind label", async () => {
    await app.fetch(new Request("http://localhost/"));
    await app.fetch(new Request("http://localhost/api/health"));

    const text = await (
      await app.fetch(new Request("http://localhost/metrics"))
    ).text();

    expect(text).toMatch(/http_requests_total\{[^}]*kind="web"[^}]*\}/);
    expect(text).toMatch(/http_requests_total\{[^}]*kind="api"[^}]*\}/);
  });

  test("does not record requests to /metrics itself", async () => {
    await app.fetch(new Request("http://localhost/metrics"));
    await app.fetch(new Request("http://localhost/metrics"));

    const text = await (
      await app.fetch(new Request("http://localhost/metrics"))
    ).text();

    expect(text).not.toContain('path="/metrics"');
  });

  test("returns 404 when metrics are disabled", async () => {
    process.env.METRICS_ENABLED = "false";
    resetConfigApp();

    const res = await app.fetch(new Request("http://localhost/metrics"));
    expect(res.status).toBe(404);
  });

  test("enforces the shared-secret token when configured", async () => {
    process.env.METRICS_TOKEN = "secret-token";
    resetConfigApp();

    const unauthorized = await app.fetch(
      new Request("http://localhost/metrics"),
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await app.fetch(
      new Request("http://localhost/metrics", {
        headers: { "x-metrics-token": "secret-token" },
      }),
    );
    expect(authorized.status).toBe(200);
  });
});
