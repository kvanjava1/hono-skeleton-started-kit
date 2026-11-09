import { describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { configRateLimiter } from "../../src/configs/index.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

describe("Web root (example demo removed)", () => {
  test("GET / answers 404 — no root page by design", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(404);
  });

  test("GET /admin/login still serves the Inertia HTML shell", async () => {
    const res = await app.fetch(new Request("http://localhost/admin/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const text = await res.text();
    expect(text).toContain('data-page="app"');
    expect(text).toContain('"component":"dashboard-admin\\/Admin\\/Login"');
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
